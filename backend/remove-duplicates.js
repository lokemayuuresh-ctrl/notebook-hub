require('dotenv').config();
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function findDuplicates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Notebook-hub-main');
        console.log('Connected to DB');

        const products = await Product.find({});
        console.log(`Total products: ${products.length}`);

        const idMap = new Map();
        const duplicates = [];

        products.forEach(p => {
            const id = p._id.toString();
            if (idMap.has(id)) {
                duplicates.push(p._id);
            } else {
                idMap.set(id, p);
            }
        });

        console.log(`Duplicate IDs found: ${duplicates.length}`);

        // Also check for same name/price/description which might indicate duplicate seeding
        const contentMap = new Map();
        const contentDuplicates = [];

        products.forEach(p => {
            const key = `${p.name}-${p.price}-${p.description}`;
            if (contentMap.has(key)) {
                contentDuplicates.push(p._id);
            } else {
                contentMap.set(key, p);
            }
        });

        console.log(`Content duplicates found (same name/price/desc): ${contentDuplicates.length}`);

        if (contentDuplicates.length > 0) {
            console.log('Removing content duplicates...');
            const result = await Product.deleteMany({ _id: { $in: contentDuplicates } });
            console.log(`Removed ${result.deletedCount} duplicate products.`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findDuplicates();
