const dotenv = require('dotenv');

dotenv.config();

const splitList = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'mentora-dev-access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'mentora-dev-refresh-secret',
  accessTokenExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  corsOrigins: splitList(process.env.CORS_ORIGINS, ['*']),
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};

module.exports = { env };
