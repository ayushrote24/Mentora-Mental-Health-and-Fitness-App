const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { env } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const { requestLogger } = require('./middleware/requestLogger');
const { attachDatabase } = require('./middleware/attachDatabase');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandlers');

const resolveCorsOrigin = (origin, callback) => {
  if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error('CORS origin not allowed.'));
};

const createApp = ({ database }) => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: resolveCorsOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(requestLogger);
  app.use(attachDatabase(database));

  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests. Please try again later.',
      },
    })
  );

  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 25,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many authentication attempts. Please wait and try again.',
      },
    })
  );

  app.get('/health', async (req, res, next) => {
    try {
      const health = await req.database.getHealth();
      res.json({
        success: true,
        message: 'Mentora backend is healthy.',
        data: {
          ...health,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api', async (req, res, next) => {
    try {
      const cachedPayload = await req.database.getCached('api_bootstrap');
      if (cachedPayload) {
        return res.json({
          success: true,
          message: 'Mentora API bootstrap loaded from cache.',
          data: cachedPayload,
        });
      }

      const payload = {
        name: 'Mentora API',
        version: '1.0.0',
        mode: req.database.mode,
        endpoints: {
          health: '/health',
          register: '/api/auth/register',
          login: '/api/auth/login',
          refresh: '/api/auth/refresh',
          me: '/api/auth/me',
          profile: '/api/user/profile',
          settings: '/api/user/settings',
          state: '/api/user/state',
          doctorsNearby: '/api/integrations/doctors/nearby',
          assistantChat: '/api/integrations/assistant/chat',
        },
      };

      await req.database.setCached('api_bootstrap', payload, 60);

      res.json({
        success: true,
        message: 'Mentora API bootstrap loaded.',
        data: payload,
      });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/integrations', integrationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = { createApp };
