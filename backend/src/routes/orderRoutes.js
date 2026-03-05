const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { createOrder, createPaymentOrder, verifyPaymentSignature, razorpayWebhook, getOrders } = require('../controllers/orderController');

const router = express.Router();

router.post('/orders/create', authMiddleware, createOrder);
router.get('/orders', authMiddleware, getOrders);
router.post('/payments/create-order', authMiddleware, createPaymentOrder);
router.post('/orders/verify-signature', verifyPaymentSignature);
router.post('/webhooks/razorpay', razorpayWebhook);

module.exports = router;
