require('dotenv').config();
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function listAll() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Notebook-hub-main');
        console.log('Connected to DB');

        const products = await Product.find({});
        console.log(`Total products: ${products.length}`);

        products.forEach(p => {
            console.log(`- ${p.name} | ID: ${p._id} | Seller: ${p.sellerId || 'NONE'}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listAll();
