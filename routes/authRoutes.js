const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// Public auth endpoints
router.post('/register', register);
router.post('/login', login);

module.exports = router;
