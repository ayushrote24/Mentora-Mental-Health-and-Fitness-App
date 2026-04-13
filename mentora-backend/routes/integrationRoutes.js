const router = require('express').Router();

const authMiddleware = require('../middleware/authMiddleware');
const {
  getNearbyDoctors,
  chatWithAssistant,
} = require('../controllers/integrationController');

router.get('/doctors/nearby', authMiddleware, getNearbyDoctors);
router.post('/assistant/chat', chatWithAssistant); // no auth

router.get('/doctors/nearby', getNearbyDoctors);
router.post('/assistant/chat', chatWithAssistant);

module.exports = router;
