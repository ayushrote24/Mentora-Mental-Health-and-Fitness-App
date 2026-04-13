const attachDatabase = (database) => (req, res, next) => {
  req.database = database;
  next();
};

module.exports = { attachDatabase };
