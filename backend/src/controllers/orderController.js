const orderService = require('../services/orderService');

const createOrder = async (req, res, next) => {
  try {
    const data = await orderService.createOrder({
      userId: req.user.id,
      cartId: req.body.cartId,
      items: req.body.items,
      addressId: req.body.addressId,
      couponCode: req.body.couponCode,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const razorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body || {});

    orderService.verifyRazorpayWebhookSignature({ rawBody, signature });

    const event = req.body?.event;

    if (event === 'payment.captured') {
      await orderService.processPaymentCaptured(req.body);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrder,
  razorpayWebhook,
};
