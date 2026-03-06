const express = require('express');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');
const {
  createOrder,
  createCodOrder,
  createPaymentOrder,
  verifyPaymentSignature,
  razorpayWebhook,
  getOrders,
  getAdminCodOrders,
  updateCodOrderStatus,
  magicCheckoutShippingInfo,
  magicCheckoutGetPromotions,
  magicCheckoutApplyPromotions,
  markCodOrderDeliveredAndPaid,
} = require('../controllers/orderController');

const router = express.Router();

router.post('/orders/create', authMiddleware, createOrder);
router.post('/orders/cod', authMiddleware, createCodOrder);
router.get('/orders', authMiddleware, getOrders);
router.get('/orders/admin/cod', authMiddleware, requireAdmin, getAdminCodOrders);
router.patch('/orders/:id/cod-status', authMiddleware, requireAdmin, updateCodOrderStatus);
router.patch('/orders/:id/cod-delivered', authMiddleware, requireAdmin, markCodOrderDeliveredAndPaid);
router.post('/payments/create-order', authMiddleware, createPaymentOrder);
router.post('/orders/verify-signature', verifyPaymentSignature);
router.post('/webhooks/razorpay', razorpayWebhook);
router.post('/magic-checkout/shipping-info', magicCheckoutShippingInfo);
router.post('/magic-checkout/get-promotions', magicCheckoutGetPromotions);
router.post('/magic-checkout/apply-promotions', magicCheckoutApplyPromotions);

module.exports = router;
