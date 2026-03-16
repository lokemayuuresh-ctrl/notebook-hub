/*
  Usage:
    - For a real MongoDB instance: set MONGODB_URI in env and run `npm run seed` in server/
    - For a temporary in-memory DB (local, no config): `npm run seed:memory`
*/

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');
const productsData = require('./seed/products');
const crypto = require('crypto');

async function seedWithUri(uri) {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB for seeding');
    try {
      // When connected, mongoose knows the database name
      console.log('Seeding database:', mongoose.connection?.name || '(unknown)');
    } catch (e) {
      // ignore
    }
    await Product.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    // Remove notifications and order tracking if present
    const Notification = require('./models/Notification');
    const OrderTracking = require('./models/OrderTracking');
    await Notification.deleteMany({});
    await OrderTracking.deleteMany({});

    const insertedProducts = await Product.insertMany(productsData);
    console.log('Seeded products collection with', insertedProducts.length, 'items');

    // hash passwords using bcrypt for realistic auth
    const bcrypt = require('bcrypt');
    const makeHash = (p) => bcrypt.hashSync(p, 10);

    const usersData = [
      { name: 'Admin User', email: 'admin@example.com', passwordHash: makeHash('adminpass'), role: 'admin' },
      { name: 'Jane Buyer', email: 'jane@example.com', passwordHash: makeHash('password123'), role: 'buyer', phone: '+15550000001', phoneVerified: true },
      { name: 'Store Seller', email: 'seller@example.com', passwordHash: makeHash('sellerpass'), role: 'seller', phone: '+15550000002', phoneVerified: true }
    ];

    const insertedUsers = await User.insertMany(usersData);
    console.log('Seeded users collection with', insertedUsers.length, 'items');

    // Assign first products to the seller we just created for demonstration
    const seller = insertedUsers.find(u => u.role === 'seller');
    if (seller) {
      const updateCount = Math.min(5, insertedProducts.length);
      for (let i = 0; i < updateCount; i++) {
        const p = insertedProducts[i];
        p.sellerId = seller._id;
        p.sellerName = seller.name;
        await p.save();
      }
      console.log('Assigned', updateCount, 'products to seller', seller.email);
    }

    // create a sample order for the customer using inserted product ids
    const customer = insertedUsers.find(u => u.role === 'buyer') || insertedUsers[0];
    const orderItems = [
      { product: insertedProducts[0]._id, quantity: 2, price: insertedProducts[0].price },
      { product: insertedProducts[1]._id, quantity: 1, price: insertedProducts[1].price }
    ];
    const ordersData = [
      { user: customer._id, items: orderItems, total: orderItems.reduce((s,i)=>s + (i.price * i.quantity), 0), status: 'processing' }
    ];

    const insertedOrders = await Order.insertMany(ordersData);
    console.log('Seeded orders collection with', insertedOrders.length, 'items');

    // Seed notifications and tracking for the sample order
    const sampleOrder = insertedOrders[0];
    const notifications = [
      { user: customer._id, message: `Your order ${sampleOrder._id} is being processed.`, type: 'order_update', order: sampleOrder._id },
      { user: insertedUsers.find(u => u.role === 'admin')._id, message: `New order ${sampleOrder._id} from ${customer.name}`, type: 'new_order', order: sampleOrder._id }
    ];
    const insertedNotifs = await Notification.insertMany(notifications);
    console.log('Seeded notifications collection with', insertedNotifs.length, 'items');

    const tracking = new OrderTracking({ order: sampleOrder._id, history: [{ status: 'processing', note: 'Order received' }] });
    await tracking.save();
    console.log('Seeded order tracking for order', sampleOrder._id);

    process.exit(0);
  } catch (err) {
    console.error('Seeding error', err.message);
    process.exit(1);
  }
}

async function seedInMemory() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log('Starting in-memory MongoDB at', uri);
  try {
    await seedWithUri(uri);
  } finally {
    await mongoose.disconnect();
    await mongod.stop();
  }
}

if (process.argv.includes('--memory')) {
  seedInMemory();
} else if (process.env.MONGODB_URI) {
  seedWithUri(process.env.MONGODB_URI);
} else {
  console.error('No MONGODB_URI provided and --memory flag not used. See README.');
  process.exit(1);
}
