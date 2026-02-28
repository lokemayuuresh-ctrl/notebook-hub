require('dotenv').config();
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    sellerId: mongoose.Schema.Types.ObjectId,
    sellerName: String
}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function cleanup() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Notebook-hub-main';
        await mongoose.connect(mongoUri);
        console.log('Connected to DB for cleanup');

        // Seed products typically don't have a sellerId or have a null one in this project's initial state
        // Or we can identify them by checking if sellerId exists
        const result = await Product.deleteMany({
            $or: [
                { sellerId: { $exists: false } },
                { sellerId: null }
            ]
        });

        console.log(`Cleanup complete. Removed ${result.deletedCount} seed products.`);
        process.exit(0);
    } catch (err) {
        console.error('Cleanup failed:', err);
        process.exit(1);
    }
}

cleanup();
