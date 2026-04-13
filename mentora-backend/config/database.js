const mongoose = require('mongoose');

const { env } = require('./env');
const { createFileDatabase } = require('../lib/fileDatabase');

const initializeDatabase = async () => {
  if (env.mongoUri) {
    try {
      await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 2000,
      });

      const { createMongoDatabase } = require('../lib/mongoDatabase');
      return createMongoDatabase();
    } catch (error) {
      console.warn(`MongoDB unavailable, falling back to local file storage: ${error.message}`);
    }
  }

  return createFileDatabase();
};

module.exports = {
  initializeDatabase,
};
