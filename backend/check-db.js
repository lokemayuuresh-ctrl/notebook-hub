require('dotenv').config();
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    image: String
}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Notebook-hub-main');
        console.log('Connected to DB');

        const products = await Product.find({ image: /:5001/ });
        console.log(`Found ${products.length} products with port 5001 in image URL`);

        products.forEach(p => {
            console.log(`ID: ${p._id}, Image: ${p.image}`);
        });

        if (products.length > 0) {
            console.log('--- SUGGESTION: Run a fix script to replace :5001 with :5000 or relative paths ---');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
