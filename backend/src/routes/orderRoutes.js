const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  createOrder,
  createPaymentOrder,
  verifyPaymentSignature,
  razorpayWebhook,
  getOrders,
  magicCheckoutShippingInfo,
  magicCheckoutGetPromotions,
  magicCheckoutApplyPromotions,
} = require('../controllers/orderController');

const router = express.Router();

router.post('/orders/create', authMiddleware, createOrder);
router.get('/orders', authMiddleware, getOrders);
router.post('/payments/create-order', authMiddleware, createPaymentOrder);
router.post('/orders/verify-signature', verifyPaymentSignature);
router.post('/webhooks/razorpay', razorpayWebhook);
router.post('/magic-checkout/shipping-info', magicCheckoutShippingInfo);
router.post('/magic-checkout/get-promotions', magicCheckoutGetPromotions);
router.post('/magic-checkout/apply-promotions', magicCheckoutApplyPromotions);

module.exports = router;
