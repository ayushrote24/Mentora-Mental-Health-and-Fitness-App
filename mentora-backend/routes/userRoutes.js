const router = require('express').Router();

const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const {
  getProfile,
  updateProfile,
  updateSettings,
  getAppState,
  saveAppState,
} = require('../controllers/userController');

router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.patch('/settings', updateSettings);
router.get('/state', getAppState);
router.put('/state', saveAppState);
router.get('/admin/users', authorize('admin'), async (req, res, next) => {
  try {
    const users = await req.database.listUsers();
    res.json({
      success: true,
      message: 'Users fetched successfully.',
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
