const express = require('express');
const { verifyFirebase, completeProfile, getProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/verify-firebase', verifyFirebase);
router.put('/complete-profile', authMiddleware, completeProfile);
router.get('/me', authMiddleware, getProfile);

module.exports = router;
