const mongoose = require('mongoose');

let connected = false;

async function connectWithRetry(uri, options = {}) {
  const maxRetries = parseInt(process.env.MONGODB_CONNECT_RETRIES || '5', 10);
  const retryDelayMs = parseInt(process.env.MONGODB_CONNECT_RETRY_DELAY_MS || '2000', 10);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(uri, {
        // sensible defaults; mongoose 7 doesn't require many of these but keep explicit
        maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10', 10),
        w: 'majority',
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000', 10),
        socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000', 10),
        ...options
      });
      connected = true;
      console.log('Connected to MongoDB');
      return mongoose.connection;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, err.message);
      if (attempt < maxRetries) {
        console.log(`Retrying in ${retryDelayMs}ms...`);
        await new Promise(r => setTimeout(r, retryDelayMs));
      } else {
        console.error('Exceeded maximum MongoDB connection retries');
        throw err;
      }
    }
  }
}

process.on('SIGINT', async () => {
  try {
    if (connected) await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    process.exit(1);
  }
});

module.exports = { connectWithRetry, mongoose };
