const { env } = require('../config/env');
const { createUser, authenticateUser, sanitizeUser } = require('../services/userService');
const { createTokenBundle, createAccessToken } = require('../services/tokenService');

const register = async (req, res, next) => {
  try {
    const user = await createUser(req.database, req.body);
    const tokens = await createTokenBundle(req.database, user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user,
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const user = await authenticateUser(req.database, req.body.email, req.body.password);
    const tokens = await createTokenBundle(req.database, user);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const error = new Error('Refresh token is required.');
      error.statusCode = 400;
      throw error;
    }

    const storedToken = await req.database.findRefreshToken(refreshToken);

    if (!storedToken) {
      const error = new Error('Refresh token is invalid.');
      error.statusCode = 401;
      throw error;
    }

    if (new Date(storedToken.expiresAt).getTime() < Date.now()) {
      await req.database.revokeRefreshToken(refreshToken);
      const error = new Error('Refresh token has expired.');
      error.statusCode = 401;
      throw error;
    }

    const user = await req.database.findUserById(storedToken.userId);

    if (!user) {
      await req.database.revokeRefreshToken(refreshToken);
      const error = new Error('User not found for this refresh token.');
      error.statusCode = 401;
      throw error;
    }

    const safeUser = sanitizeUser(user);
    const accessToken = createAccessToken(safeUser);

    res.json({
      success: true,
      message: 'Access token refreshed successfully.',
      data: {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: env.accessTokenExpiresIn,
        user: safeUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAuthenticatedUser = async (req, res, next) => {
  try {
    const user = await req.database.findUserById(req.userId);
    res.json({
      success: true,
      message: 'Authenticated user fetched successfully.',
      data: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.body.refreshToken) {
      await req.database.revokeRefreshToken(req.body.refreshToken);
    }

    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getAuthenticatedUser,
};
