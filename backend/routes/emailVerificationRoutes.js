const express = require('express');
const router = express.Router();
const { verifyCode } = require('../controllers/emailVerificationController');

router.post('/verify-code', verifyCode);

module.exports = router;