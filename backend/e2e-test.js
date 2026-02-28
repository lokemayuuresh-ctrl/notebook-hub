require('dotenv').config();
const mongoose = require('mongoose');

// Helper to keep cookies
const cookies = new Map();
function getCookieHeader() {
    return Array.from(cookies.values()).join('; ');
}
function setCookies(setCookieHeader) {
    if (!setCookieHeader) return;
    const parts = setCookieHeader.split(',');
    parts.forEach(p => {
        const cookie = p.split(';')[0];
        const [name, value] = cookie.split('=');
        if (name) cookies.set(name.trim(), cookie.trim());
    });
}

// Wrapper for API calls
async function api(path, method = 'GET', body = null) {
    const url = `http://localhost:5000${path}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Cookie': getCookieHeader()
        }
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) setCookies(setCookie);

    let data;
    try { data = await res.json(); } catch (e) { data = await res.text(); }

    if (!res.ok) {
        throw new Error(`${method} ${path} failed with ${res.status}: ${JSON.stringify(data)}`);
    }
    return data;
}

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Notebook-hub-main');
        console.log('Connected to DB');

        // Clear old test data
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const OTP = mongoose.model('OTP', new mongoose.Schema({ userId: String, code: String }, { strict: false }));
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
        const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));

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

        // Clear cookies for buyer login
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

        // Login Buyer
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
            sellerId: sellerId // Pass sellerId to order
        });
        const orderId = orderRes.order._id || orderRes.order.id;
        console.log(`Order created: ${orderId}`);

        // Clear cookies for seller login
        cookies.clear();
        await api('/api/auth/login', 'POST', { email: 'seller-e2e@test.com', password: 'password123' });

        // 7. Update Order Status to delivered
        console.log('--- Updating Order Status to delivered ---');
        await api(`/api/orders/${orderId}/status`, 'PUT', { status: 'delivered', note: 'E2E Test delivery' });

        // Clear cookies for buyer login
        cookies.clear();
        await api('/api/auth/login', 'POST', { email: 'buyer-e2e@test.com', password: 'password123' });

        // 8. Download Invoice
        console.log('--- Downloading Invoice ---');
        const invoice = await api(`/api/invoices/${orderId}`, 'GET');
        console.log('Invoice retrieved successfully!');

        console.log('\n✅ ALL E2E TESTS PASSED SUCCESSFULLY! ✅');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ E2E TEST FAILED:', err.message);
        if (err.stack) console.error(err.stack);
        process.exit(1);
    }
}

runTest();
