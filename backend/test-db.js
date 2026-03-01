require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

console.log('Testing MongoDB connection to:', uri ? uri.split('@')[1] : 'undefined');

mongoose.connect(uri)
    .then(() => {
        console.log('MongoDB connection successful');
        process.exit(0);
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
