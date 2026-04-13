const jwt = require('jsonwebtoken');

const { env } = require('../config/env');

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is required.',
    });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await req.database.findUserById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    req.auth = decoded;
    req.user = user.password ? { ...user, password: undefined } : user;
    req.userId = decoded.sub;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

module.exports = authMiddleware;
