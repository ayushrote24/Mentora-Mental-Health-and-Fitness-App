const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const AppState = require('../models/AppState');
const { MemoryCache } = require('./cache');

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const plainUser = typeof user.toObject === 'function' ? user.toObject() : user;
  const { password, ...safeUser } = plainUser;
  safeUser.id = String(safeUser._id || safeUser.id);
  delete safeUser._id;
  delete safeUser.__v;
  return safeUser;
};

const createMongoDatabase = () => {
  const cache = new MemoryCache();

  return {
    mode: 'mongo',
    async getHealth() {
      const users = await User.countDocuments();
      return {
        status: 'ok',
        database: 'mongodb',
        users,
      };
    },
    async getCached(key) {
      return cache.get(key);
    },
    async setCached(key, value, ttlSeconds) {
      cache.set(key, value, ttlSeconds);
    },
    async invalidateCached(key) {
      cache.delete(key);
    },
    async createUser(payload) {
      const user = await User.create(payload);
      return sanitizeUser(user);
    },
    async findUserByEmail(email) {
      return User.findOne({ email: String(email).toLowerCase() });
    },
    async findUserById(id) {
      return User.findById(id);
    },
    async updateUser(id, updates) {
      const user = await User.findByIdAndUpdate(id, updates, { new: true });
      return sanitizeUser(user);
    },
    async listUsers() {
      const users = await User.find().sort({ createdAt: -1 });
      return users.map(sanitizeUser);
    },
    async storeRefreshToken(userId, token, expiresAt) {
      await RefreshToken.findOneAndUpdate(
        { token },
        { token, userId, expiresAt },
        { upsert: true, new: true }
      );
    },
    async findRefreshToken(token) {
      const record = await RefreshToken.findOne({ token });
      if (!record) {
        return null;
      }

      return {
        token: record.token,
        userId: String(record.userId),
        expiresAt: record.expiresAt,
      };
    },
    async revokeRefreshToken(token) {
      await RefreshToken.deleteOne({ token });
    },
    async saveAppState(userId, statePatch) {
      const nextState = await AppState.findOneAndUpdate(
        { userId },
        { $set: statePatch },
        { upsert: true, new: true }
      );

      return nextState.toObject();
    },
    async getAppState(userId) {
      const state = await AppState.findOne({ userId });
      return state ? state.toObject() : null;
    },
  };
};

module.exports = {
  createMongoDatabase,
};
