require('dotenv').config();
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    image: String
}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function fix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Notebook-hub-main');
        console.log('Connected to DB');

        // Find products with absolute localhost:5001 URLs
        const products = await Product.find({ image: /localhost:5001\/uploads/ });
        console.log(`Found ${products.length} products to fix`);

        for (const p of products) {
            const oldImage = p.image;
            // Convert to relative path
            const relativePath = oldImage.replace(/https?:\/\/localhost:5001/, '');
            console.log(`Fixing ${p._id}: ${oldImage} -> ${relativePath}`);
            p.image = relativePath;
            await p.save();
        }

        console.log('Fix complete');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fix();
