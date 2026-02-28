
require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');
const { setIo } = require('./lib/realtime');

const app = express();

// CORS configuration for cookie support
const allowedOrigins = [
  'https://notebook-hub-1.onrender.com',
  'https://notebook-hub.onrender.com',
  process.env.FRONTEND_URL,
  'http://localhost:8080',
  'http://127.0.0.1:8080'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin) ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn('CORS request from unlisted origin:', origin);
      callback(null, true); // Permissive in production to avoid blockers, still logs warning
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json());
app.use(cookieParser()); // Parse cookies

// serve uploaded files
const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
const usersRouter = require('./routes/users');
const ordersRouter = require('./routes/orders');
const notificationsRouter = require('./routes/notifications');
const orderTrackingsRouter = require('./routes/orderTrackings');
const invoicesRouter = require('./routes/invoices');
app.use('/api/users', usersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/ordertrackings', orderTrackingsRouter);
app.use('/api/invoices', invoicesRouter);
const paymentsRouter = require('./routes/payments');
app.use('/api/payments', paymentsRouter);
const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter);

const PORT = process.env.PORT || 5000;

// Export the app for tests and tools
module.exports.app = app;

async function start() {
  const isProduction = process.env.NODE_ENV === 'production';
  let uri = process.env.MONGODB_URI;
  let mongod = null;

  // In development, if no URI is provided, use an in-memory database
  if (!isProduction && !uri) {
    console.log('No MONGODB_URI found, starting in-memory MongoDB for development...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();

      process.on('SIGINT', async () => {
        if (mongod) await mongod.stop();
      });
    } catch (err) {
      console.error('Failed to start in-memory MongoDB. Please install mongodb-memory-server or provide a MONGODB_URI.');
      process.exit(1);
    }
  }

  // Fallback to local default if still no URI
  if (!uri) {
    uri = 'mongodb://127.0.0.1:27017/notebook-hub';
  }

  console.log('Initializing database connection...');

  try {
    // Use the new connection helper with retries and options
    const { connectWithRetry } = require('./lib/db');
    await connectWithRetry(uri);

    // Automatic product seeding disabled for clean catalog
    /*
    const Product = require('./models/Product');
    const productsData = require('./seed/products');
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(productsData);
      console.log('Inserted seed products into DB (count:', productsData.length, ')');
    }
    */

  } catch (err) {
    console.error('MongoDB connection error', err && err.message ? err.message : String(err));
  }

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:8080',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('Socket connected', socket.id);

    socket.on('identify', (userId) => {
      if (userId) {
        socket.join(String(userId));
        console.log(`Socket ${socket.id} joined room ${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected', socket.id);
    });
  });

  // Make io available to other modules
  setIo(io);

  // Only expose dev-only routes when not in production
  if (process.env.NODE_ENV !== 'production') {
    const devRouter = require('./routes/dev');
    app.use('/api/dev', devRouter);
  }

  // In production (Render), we MUST listen on exactly process.env.PORT
  if (isProduction) {
    server.listen(PORT, () => {
      console.log(`Production server listening on port ${PORT}`);
    });
  } else {
    // Try to listen on PORT, if in use try subsequent ports up to a limit
    const maxAttempts = 5;
    let attemptPort = Number(PORT) || 5000;

    const listenWithFallback = async (attemptsLeft) => {
      try {
        await new Promise((resolve, reject) => {
          const onError = (err) => reject(err);
          server.once('error', onError);
          server.listen(attemptPort, () => {
            server.removeListener('error', onError);
            console.log(`Dev server listening on port ${attemptPort}`);
            resolve();
          });
        });
      } catch (err) {
        if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
          console.warn(`Port ${attemptPort} in use, trying port ${attemptPort + 1}`);
          attemptPort += 1;
          return listenWithFallback(attemptsLeft - 1);
        }
        console.error('Failed to start server:', err);
        process.exit(1);
      }
    };
    listenWithFallback(maxAttempts);
  }
}

module.exports.start = start;

if (require.main === module) {
  start();
}
