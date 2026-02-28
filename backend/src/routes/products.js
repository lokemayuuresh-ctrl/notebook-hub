const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// configure multer storage to backend/uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    const name = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, sellerId, active } = req.query;
    const query = {};

    // Only show active products by default (unless seller/admin viewing their own)
    if (active === undefined || active === 'true') {
      query.active = { $ne: false };
    }

    if (category) {
      query.category = category;
    }

    if (sellerId) {
      query.sellerId = sellerId;
    }

    const products = await Product.find(query)
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error('CRITICAL: GET /api/products failure:', {
      message: err.message,
      stack: err.stack,
      dbStatus: mongoose.connection.readyState
    });
    res.status(500).json({ message: 'Database error occurred. Please check server logs.' });
  }
});

// GET /api/products/seller/:sellerId - products by seller
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { active } = req.query;
    const query = { sellerId: req.params.sellerId };

    // If not explicitly requesting inactive, show only active
    if (active !== 'false') {
      query.active = { $ne: false };
    }

    const products = await Product.find(query)
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error('Get seller products error', err);
    res.status(500).json({ message: err.message });
  }
});
// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products (seller only)
// Accepts either `image` (string URL) in JSON body or multipart form with `imageFile`
router.post('/', auth(true), upload.single('imageFile'), async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only sellers or admins can create products' });
    }

    // if multipart, fields are in req.body and file in req.file
    const { name, price, category, stock, description, image: imageUrl } = req.body;
    // determine image: file upload takes precedence, then imageUrl, then default
    // save relative paths for uploaded files so the frontend can compute base URL
    // let image = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop';
    let image = '';
    if (req.file) {
      image = `/uploads/${req.file.filename}`; // relative path
    } else if (imageUrl && imageUrl.trim()) {
      image = imageUrl.trim();
    }

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Product name is required' });
    }
    if (!price || price <= 0) {
      return res.status(400).json({ message: 'Valid price is required' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ message: 'Category is required' });
    }
    if (stock === undefined || stock < 0) {
      return res.status(400).json({ message: 'Valid stock quantity is required' });
    }

    const User = require('../models/User');
    const seller = await User.findById(req.user.id);

    const productData = {
      name: name.trim(),
      description: description || '',
      price: parseFloat(price),
      image,
      category: category.trim(),
      stock: parseInt(stock) || 0,
      sellerId: req.user.id,
      sellerName: seller?.name || seller?.email || 'Unknown Seller',
      active: true
    };

    const p = new Product(productData);
    const saved = await p.save();

    const populated = await Product.findById(saved._id).populate('sellerId', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    console.error('Create product error', err);
    res.status(400).json({ message: err.message || 'Failed to create product' });
  }
});

// PUT /api/products/:id
// Accepts either `image` (string URL) in JSON body or multipart form with `imageFile`
router.put('/:id', auth(true), upload.single('imageFile'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Only seller who owns the product or admin can update
    if (req.user.role !== 'admin' && product.sellerId && product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed to edit this product' });
    }

    // Validate updates
    const updates = { ...req.body };
    // If an image file was uploaded, set updates.image accordingly
    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image && req.body.image.trim()) {
      updates.image = req.body.image.trim();
    }
    if (updates.price !== undefined && updates.price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }
    if (updates.stock !== undefined && updates.stock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('sellerId', 'name email');

    res.json(updated);
  } catch (err) {
    console.error('Update product error', err);
    res.status(400).json({ message: err.message || 'Failed to update product' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', auth(true), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.user.role !== 'admin' && product.sellerId && product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed to delete this product' });
    }

    // Soft delete: mark as inactive instead of hard delete (to preserve order history)
    product.active = false;
    await product.save();

    res.json({ message: 'Product deleted (deactivated)', product });
  } catch (err) {
    console.error('Delete product error', err);
    res.status(400).json({ message: err.message || 'Failed to delete product' });
  }
});

module.exports = router;
