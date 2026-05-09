const mongoose = require('mongoose');
const { createLogger } = require('./logger');
const logger = createLogger('db');

let mongoServer;

async function connectDB() {
  try {
    let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/algeriaschool';

    if (process.env.USE_MEMORY_DB === 'true') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create({
        binary: { version: process.env.MONGOMS_VERSION || '7.0.14' },
      });
      uri = mongoServer.getUri();
      logger.info('Using in-memory MongoDB');
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

module.exports = { connectDB, disconnectDB };
