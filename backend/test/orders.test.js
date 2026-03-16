const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { connectWithRetry } = require('../src/lib/db');

let mongod;
let app;

beforeAll(async () => {
  // disable transactions for in-memory tests (single-node MongoDB doesn't support transactions)
  process.env.DISABLE_TX = '1';
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
  await connectWithRetry(uri);
  // require server app after DB is connected
  app = require('../src/server').app;
});

afterAll(async () => {
  try { await mongoose.disconnect(); } catch (e) { }
  try { await mongod.stop(); } catch (e) { }
});

beforeEach(async () => {
  // clear DB
  const models = ['User', 'Product', 'Order', 'Notification', 'OrderTracking'];
  for (const m of models) {
    try { await mongoose.model(m).deleteMany({}); } catch (e) { }
  }
});

test('order creation creates order, tracking, and notifications', async () => {
  const User = mongoose.model('User');
  const Product = mongoose.model('Product');
  const Order = mongoose.model('Order');
  const Notification = mongoose.model('Notification');
  const OrderTracking = mongoose.model('OrderTracking');

  // create seller and product
  const seller = await User.create({ name: 'Seller', email: 's@x.com', passwordHash: await bcrypt.hash('sellerpass', 10), role: 'seller', phoneVerified: true });
  const product = await Product.create({ name: 'Test Product', price: 5.0, stock: 10, sellerId: seller._id, sellerName: seller.name });

  // create buyer and token
  const buyer = await User.create({ name: 'Buyer', email: 'b@x.com', passwordHash: await bcrypt.hash('buyer123', 10), role: 'buyer', phoneVerified: true });
  const token = jwt.sign({ id: buyer._id, email: buyer.email, role: buyer.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const orderPayload = {
    items: [{ product: product._id, quantity: 2, price: product.price }],
    subtotal: 2 * product.price,
    total: 2 * product.price,
    shippingAddress: '123 Test Street, Test City'
  };

  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send(orderPayload);

  // Log response for debugging
  if (res.status !== 201) {
    console.error('Order create failed:', res.status, res.text || res.body);
  }
  expect(res.status).toBe(201);
  expect(res.body._id).toBeDefined();

  // check order in DB
  const savedOrder = await Order.findById(res.body._id);
  expect(savedOrder).not.toBeNull();
  expect(savedOrder.items.length).toBe(1);

  // tracking
  const tracking = await OrderTracking.findOne({ order: savedOrder._id });
  expect(tracking).not.toBeNull();
  expect(tracking.history.length).toBeGreaterThanOrEqual(1);

  // notifications (buyer + seller)
  const buyerNotifs = await Notification.find({ user: buyer._id });
  const sellerNotifs = await Notification.find({ user: seller._id });
  expect(buyerNotifs.length).toBeGreaterThanOrEqual(1);
  expect(sellerNotifs.length).toBeGreaterThanOrEqual(1);
});

test.skip('order creation falls back when initial save throws a transaction-related error', async () => {
  const User = mongoose.model('User');
  const Product = mongoose.model('Product');
  const Order = mongoose.model('Order');
  const Notification = mongoose.model('Notification');
  const OrderTracking = mongoose.model('OrderTracking');

  // create seller and product
  const seller = await User.create({ name: 'Seller2', email: 's2@x.com', passwordHash: await bcrypt.hash('sellerpass', 10), role: 'seller', phoneVerified: true });
  const product = await Product.create({ name: 'Test Product 2', price: 8.0, stock: 10, sellerId: seller._id, sellerName: seller.name });

  // create buyer and token
  const buyer = await User.create({ name: 'Buyer2', email: 'b2@x.com', passwordHash: await bcrypt.hash('buyer123', 10), role: 'buyer', phoneVerified: true });
  const token = jwt.sign({ id: buyer._id, email: buyer.email, role: buyer.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const orderPayload = {
    items: [{ product: product._id, quantity: 1, price: product.price }],
    subtotal: product.price,
    total: product.price,
    shippingAddress: '456 Test Avenue, Test City'
  };

  // Mock Order.prototype.save to throw once with a transaction error, then succeed
  const originalSave = Order.prototype.save;
  let calls = 0;
  Order.prototype.save = async function saveMock(opts) {
    calls++;
    if (calls === 1) {
      const err = new Error('Transaction numbers are only allowed on a replica set member or mongos');
      throw err;
    }
    // second call should succeed — use original implementation
    return originalSave.apply(this, arguments);
  };

  try {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(orderPayload);

    if (res.status !== 201) {
      console.error('Order create (fallback) failed:', res.status, res.text || res.body);
    }
    expect(res.status).toBe(201);

    // check DB entries
    const savedOrder = await Order.findById(res.body._id);
    expect(savedOrder).not.toBeNull();

    const tracking = await OrderTracking.findOne({ order: savedOrder._id });
    expect(tracking).not.toBeNull();

    const buyerNotifs = await Notification.find({ user: buyer._id });
    const sellerNotifs = await Notification.find({ user: seller._id });
    expect(buyerNotifs.length).toBeGreaterThanOrEqual(1);
    expect(sellerNotifs.length).toBeGreaterThanOrEqual(1);
  } finally {
    // restore
    Order.prototype.save = originalSave;
  }
});

test('order status update creates tracking and buyer notification (handles non-transactional DBs)', async () => {
  const User = mongoose.model('User');
  const Product = mongoose.model('Product');
  const Order = mongoose.model('Order');
  const Notification = mongoose.model('Notification');
  const OrderTracking = mongoose.model('OrderTracking');

  // create seller, product, buyer
  const seller = await User.create({ name: 'Seller3', email: 's3@x.com', passwordHash: await bcrypt.hash('sellerpass', 10), role: 'seller', phoneVerified: true });
  const product = await Product.create({ name: 'Test Product 3', price: 15.0, stock: 10, sellerId: seller._id, sellerName: seller.name });
  const buyer = await User.create({ name: 'Buyer3', email: 'b3@x.com', passwordHash: await bcrypt.hash('buyer123', 10), role: 'buyer', phoneVerified: true });

  // create an order (bypassing endpoint for speed)
  const order = await Order.create({
    user: buyer._id,
    items: [{ product: product._id, quantity: 1, price: product.price }],
    subtotal: product.price,
    total: product.price,
    shippingAddress: '789 Test Road, Test City'
  });

  const sellerToken = jwt.sign({ id: seller._id, email: seller.email, role: seller.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const res = await request(app)
    .put(`/api/orders/${order._id}`)
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ status: 'shipped', note: 'Shipped by seller' });

  if (res.status !== 200) {
    console.error('Order status update failed:', res.status, res.text || res.body);
  }
  expect(res.status).toBe(200);

  const tracking = await OrderTracking.findOne({ order: order._id });
  expect(tracking).not.toBeNull();
  expect(tracking.history.some(h => h.status === 'shipped')).toBeTruthy();

  const buyerNotifs = await Notification.find({ user: buyer._id });
  expect(buyerNotifs.length).toBeGreaterThanOrEqual(1);
});