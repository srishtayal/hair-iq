const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { createOrder, razorpayWebhook } = require('../controllers/orderController');

const router = express.Router();

router.post('/orders/create', authMiddleware, createOrder);
router.post('/webhooks/razorpay', razorpayWebhook);

module.exports = router;
