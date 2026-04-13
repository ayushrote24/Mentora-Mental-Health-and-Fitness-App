const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { env } = require('../config/env');

const createAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id || String(user._id),
      email: user.email,
      role: user.role || 'user',
    },
    env.jwtSecret,
    { expiresIn: env.accessTokenExpiresIn }
  );

const createRefreshToken = () => crypto.randomBytes(48).toString('hex');

const createTokenBundle = async (database, user) => {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await database.storeRefreshToken(user.id || String(user._id), refreshToken, expiresAt);

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: env.accessTokenExpiresIn,
  };
};

module.exports = {
  createAccessToken,
  createRefreshToken,
  createTokenBundle,
};
