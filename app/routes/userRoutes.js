const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/usuarios', userController.createUser);
router.get('/me', auth, userController.getMe);

module.exports = router;