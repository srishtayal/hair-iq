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

const getOrders = async (req, res, next) => {
  try {
    const data = await orderService.getOrdersByUser(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const createPaymentOrder = async (req, res, next) => {
  try {
    const data = await orderService.createPaymentOrder({
      amountInRupees: req.body.amountInRupees,
      userId: req.user?.id || null,
      lineItems: req.body.lineItems,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const createCodOrder = async (req, res, next) => {
  try {
    const data = await orderService.createCodOrder({
      userId: req.user.id,
      items: req.body.items,
      customerDetails: req.body.customerDetails,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const verifyPaymentSignature = async (req, res, next) => {
  try {
    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    orderService.verifyRazorpayPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    try {
      await orderService.processPaymentCaptured({
        payload: {
          payment: {
            entity: {
              id: razorpayPaymentId,
              order_id: razorpayOrderId,
            },
          },
        },
      });
    } catch (captureError) {
      if (captureError?.statusCode !== 404) {
        throw captureError;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        verified: true,
      },
    });
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

const magicCheckoutShippingInfo = async (req, res, next) => {
  try {
    const data = orderService.getMagicCheckoutShippingInfo({
      addresses: req.body?.addresses,
    });

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
};

const magicCheckoutGetPromotions = async (req, res, next) => {
  try {
    const data = orderService.getMagicCheckoutPromotions();
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
};

const magicCheckoutApplyPromotions = async (req, res, next) => {
  try {
    const data = orderService.applyMagicCheckoutPromotion({
      code: req.body?.code,
    });
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
};

const markCodOrderDeliveredAndPaid = async (req, res, next) => {
  try {
    const data = await orderService.markCodOrderDeliveredAndPaid({
      orderId: req.params.id,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  magicCheckoutApplyPromotions,
  magicCheckoutGetPromotions,
  magicCheckoutShippingInfo,
  markCodOrderDeliveredAndPaid,
  createCodOrder,
  createPaymentOrder,
  createOrder,
  getOrders,
  verifyPaymentSignature,
  razorpayWebhook,
};
