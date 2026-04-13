const router = require('express').Router();

const { handleChat } = require('../controllers/integrationController');

router.post('/chat', handleChat);
router.post('/assistant/chat', chatWithAssistant);
module.exports = router;