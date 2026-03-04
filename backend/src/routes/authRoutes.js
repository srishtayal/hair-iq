const express = require('express');
const { verifyFirebase, completeProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/verify-firebase', verifyFirebase);
router.put('/complete-profile', authMiddleware, completeProfile);

module.exports = router;
