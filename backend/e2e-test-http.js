require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');

// Helper to keep cookies
const cookies = new Map();
function getCookieHeader() {
    return Array.from(cookies.values()).join('; ');
}
function setCookies(setCookieHeader) {
    if (!setCookieHeader) return;
    const arr = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    arr.forEach(p => {
        const cookie = p.split(';')[0];
        const [name, value] = cookie.split('=');
        if (name) cookies.set(name.trim(), cookie.trim());
    });
}

// Wrapper for API calls
function api(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': getCookieHeader()
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const setCookieList = res.headers['set-cookie'];
                if (setCookieList) setCookies(setCookieList);

                let parsed;
                try { parsed = JSON.parse(data); } catch (e) { parsed = data; }

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(parsed);
                } else {
                    reject(new Error(`${method} ${path} failed with ${res.statusCode}: ${JSON.stringify(parsed)}`));
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Notebook-hub-main');
        console.log('Connected to DB');
        const User = require('./src/models/User');
        const OTP = require('./src/models/OTP');

        await User.deleteMany({ email: { $in: ['seller-e2e@test.com', 'buyer-e2e@test.com'] } });
        console.log('Cleared old test users');

        // 1. Register Seller
        console.log('--- Registering Seller ---');
        const sellerRes = await api('/api/auth/register', 'POST', {
            name: 'Seller E2E',
            email: 'seller-e2e@test.com',
            password: 'password123',
            role: 'seller',
            phone: '1234567890',
            address: '123 Seller St'
        });
        const sellerId = sellerRes.user._id || sellerRes.user.id;

        // 2. Send and Verify OTP for Seller
        console.log('--- Sending/Verifying Seller OTP ---');
        await api('/api/auth/send-otp', 'POST', { userId: sellerId, email: 'seller-e2e@test.com' });
        const sellerOtp = await OTP.findOne({ userId: sellerId });
        if (!sellerOtp) throw new Error('Seller OTP not found in DB');
        await api('/api/auth/verify-otp', 'POST', { userId: sellerId, code: sellerOtp.code });

        // Login Seller
        await api('/api/auth/login', 'POST', { email: 'seller-e2e@test.com', password: 'password123' });

        // 3. Create Product as Seller
        console.log('--- Creating Product ---');
        const product = await api('/api/products', 'POST', {
            name: 'E2E Test Notebook',
            description: 'A notebook created during E2E testing.',
            price: 15.99,
            category: 'Ruled',
            stock: 50
        });
        const productId = product._id || product.id;
        console.log(`Product created: ${productId}`);

        cookies.clear();

        // 4. Register Buyer
        console.log('--- Registering Buyer ---');
        const buyerRes = await api('/api/auth/register', 'POST', {
            name: 'Buyer E2E',
            email: 'buyer-e2e@test.com',
            password: 'password123',
            role: 'buyer',
            phone: '0987654321',
            address: '456 Buyer Ave',
            pinCode: '123456'
        });
        const buyerId = buyerRes.user._id || buyerRes.user.id;

        // 5. Send and Verify OTP for Buyer
        console.log('--- Sending/Verifying Buyer OTP ---');
        await api('/api/auth/send-otp', 'POST', { userId: buyerId, email: 'buyer-e2e@test.com' });
        const buyerOtp = await OTP.findOne({ userId: buyerId });
        if (!buyerOtp) throw new Error('Buyer OTP not found in DB');
        await api('/api/auth/verify-otp', 'POST', { userId: buyerId, code: buyerOtp.code });

        await api('/api/auth/login', 'POST', { email: 'buyer-e2e@test.com', password: 'password123' });

        // 6. Create Order as Buyer
        console.log('--- Creating Order ---');
        const orderRes = await api('/api/orders', 'POST', {
            items: [{
                product: productId,
                quantity: 2,
                price: 15.99
            }],
            shippingAddress: '456 Buyer Ave',
            pinCode: '123456',
            paymentMethod: 'cod',
            sellerId: sellerId
        });
        let orderId = orderRes.order && (orderRes.order._id || orderRes.order.id);
        if (!orderId) orderId = orderRes._id || orderRes.id;
        console.log(`Order created: ${orderId}`);

        cookies.clear();
        await api('/api/auth/login', 'POST', { email: 'seller-e2e@test.com', password: 'password123' });

        // 7. Update Order Status to accepted then shipped
        console.log('--- Order Status -> Accepted ---');
        await api(`/api/orders/${orderId}`, 'PUT', { status: 'accepted', shippingDate: new Date(), estimatedDelivery: new Date(Date.now() + 86400000).toISOString() });

        console.log('--- Order Status -> Shipped ---');
        await api(`/api/orders/${orderId}`, 'PUT', { status: 'shipped', trackingInfo: 'TRACK123' });

        // Retrieve the Delivery OTP from DB
        const OrderModel = require('./src/models/Order');
        const orderInDb = await OrderModel.findById(orderId);
        const deliveryOTP = orderInDb.deliveryOTP;
        if (!deliveryOTP) throw new Error('Delivery OTP not generated!');

        console.log('--- Order Status -> Delivered ---');
        await api(`/api/orders/${orderId}`, 'PUT', { status: 'delivered', otp: deliveryOTP, note: 'E2E Test delivery' });

        cookies.clear();
        await api('/api/auth/login', 'POST', { email: 'buyer-e2e@test.com', password: 'password123' });

        // 8. Download Invoice
        console.log('--- Downloading Invoice ---');
        await api(`/api/invoices/${orderId}`, 'GET');
        console.log('Invoice retrieved successfully!');

        console.log('\n✅ ALL E2E TESTS PASSED SUCCESSFULLY! ✅');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ E2E TEST FAILED:', err.message);
        process.exit(1);
    }
}

runTest();
