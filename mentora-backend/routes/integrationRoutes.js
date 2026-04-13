const router = require('express').Router();

const authMiddleware = require('../middleware/authMiddleware');
const {
  getNearbyDoctors,
  chatWithAssistant,
} = require('../controllers/integrationController');

router.use(authMiddleware);

router.get('/doctors/nearby', getNearbyDoctors);
router.post('/assistant/chat', chatWithAssistant);

module.exports = router;
