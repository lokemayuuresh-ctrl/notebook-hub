require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');
const path = require('path');
const fs = require('fs');

const { setIo } = require('./lib/realtime');

const app = express();

// CORS configuration - inclusive of both Render slots
const allowedOrigins = [
  'https://notebook-hub.onrender.com',
  'https://notebook-hub-1.onrender.com',
  'https://notebook-hub-frontend.onrender.com',
  'https://notebook-hub-api.onrender.com',
  process.env.FRONTEND_URL,
  'http://localhost:8080',
  'http://127.0.0.1:8080'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With']
}));

app.use(express.json());
app.use(cookieParser());

// Serve uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ordertrackings', require('./routes/orderTrackings'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));

// Frontend Serving Logic (The "Pahle Jaisa" working way)
const frontendDist = path.join(__dirname, '..', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
       return res.status(404).json({ message: 'API not found' });
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.send('Backend Running. Frontend missing in /dist'));
}

const PORT = process.env.PORT || 5000;

async function start() {
  const isProduction = process.env.NODE_ENV === 'production';
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notebook-hub';

  try {
    const { connectWithRetry } = require('./lib/db');
    await connectWithRetry(uri);
  } catch (err) {
    console.error('MongoDB connection error', err);
  }

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*", credentials: true }
  });
  setIo(io);

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
