const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldExposeMessage = Boolean(error.expose);
  const message =
    statusCode >= 500 && isProduction && !shouldExposeMessage
      ? 'Something went wrong on the server.'
      : (error.message || 'Something went wrong on the server.');

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(!isProduction && error.details ? { details: error.details } : {}),
    ...(!isProduction && error.stack ? { stack: error.stack } : {}),
  });
};

module.exports = { notFoundHandler, errorHandler };
