const authorize = (...roles) => (req, res, next) => {
  if (!roles.length) {
    return next();
  }

  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to perform this action.',
    });
  }

  return next();
};

module.exports = { authorize };
