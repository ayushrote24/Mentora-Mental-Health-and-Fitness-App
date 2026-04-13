const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const { MemoryCache } = require('./cache');

const storePath = path.join(__dirname, '..', 'data', 'store.json');

const defaultState = {
  users: [],
  refreshTokens: [],
  appStates: {},
};

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const { password, refreshTokens, ...safeUser } = user;
  return safeUser;
};

const ensureStore = async () => {
  await fs.mkdir(path.dirname(storePath), { recursive: true });

  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify(defaultState, null, 2));
  }
};

const readStore = async () => {
  await ensureStore();
  const raw = await fs.readFile(storePath, 'utf8');
  return JSON.parse(raw || JSON.stringify(defaultState));
};

const writeStore = async (state) => {
  await ensureStore();
  await fs.writeFile(storePath, JSON.stringify(state, null, 2));
};

const createFileDatabase = () => {
  const cache = new MemoryCache();

  return {
    mode: 'file',
    async getHealth() {
      const state = await readStore();
      return {
        status: 'ok',
        database: 'local-file-storage',
        users: state.users.length,
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
      const state = await readStore();
      const now = new Date().toISOString();

      const nextUser = {
        id: crypto.randomUUID(),
        role: 'user',
        settings: {
          notifications: true,
          soundEnabled: true,
          vibrationEnabled: true,
          dataSync: true,
          privacyMode: true,
        },
        ...payload,
        createdAt: now,
        updatedAt: now,
      };

      state.users.push(nextUser);
      await writeStore(state);
      return sanitizeUser(nextUser);
    },
    async findUserByEmail(email) {
      const state = await readStore();
      return state.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
    },
    async findUserById(id) {
      const state = await readStore();
      return state.users.find((user) => user.id === id) || null;
    },
    async updateUser(id, updates) {
      const state = await readStore();
      const index = state.users.findIndex((user) => user.id === id);

      if (index === -1) {
        return null;
      }

      state.users[index] = {
        ...state.users[index],
        ...updates,
        settings: {
          ...state.users[index].settings,
          ...(updates.settings || {}),
        },
        updatedAt: new Date().toISOString(),
      };

      await writeStore(state);
      return sanitizeUser(state.users[index]);
    },
    async listUsers() {
      const state = await readStore();
      return state.users.map(sanitizeUser);
    },
    async storeRefreshToken(userId, token, expiresAt) {
      const state = await readStore();
      state.refreshTokens = state.refreshTokens.filter((item) => item.token !== token);
      state.refreshTokens.push({
        token,
        userId,
        expiresAt,
      });
      await writeStore(state);
    },
    async findRefreshToken(token) {
      const state = await readStore();
      return state.refreshTokens.find((item) => item.token === token) || null;
    },
    async revokeRefreshToken(token) {
      const state = await readStore();
      state.refreshTokens = state.refreshTokens.filter((item) => item.token !== token);
      await writeStore(state);
    },
    async saveAppState(userId, statePatch) {
      const state = await readStore();
      state.appStates[userId] = {
        ...(state.appStates[userId] || {}),
        ...statePatch,
        updatedAt: new Date().toISOString(),
      };
      await writeStore(state);
      return state.appStates[userId];
    },
    async getAppState(userId) {
      const state = await readStore();
      return state.appStates[userId] || null;
    },
  };
};

module.exports = {
  createFileDatabase,
};
