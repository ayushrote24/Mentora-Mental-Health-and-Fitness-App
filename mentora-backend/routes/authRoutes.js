const router = require('express').Router();

const {
  register,
  login,
  refresh,
  logout,
  getAuthenticatedUser,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authMiddleware, getAuthenticatedUser);

module.exports = router;
