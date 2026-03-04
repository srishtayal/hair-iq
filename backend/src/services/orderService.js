const crypto = require('crypto');
const Razorpay = require('razorpay');
const sequelize = require('../config/db');
const { Address, Cart, CartItem, Coupon, Order, OrderItem, Payment, ProductVariant } = require('../models');

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toInt = (value, fallback = 0) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw createError('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required', 500);
  }

  return {
    keyId,
    client: new Razorpay({ key_id: keyId, key_secret: keySecret }),
  };
};

const verifyRazorpayPaymentSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw createError('RAZORPAY_KEY_SECRET is not configured', 500);
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw createError('razorpayOrderId, razorpayPaymentId, and razorpaySignature are required', 400);
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const signatureBuffer = Buffer.from(razorpaySignature, 'utf8');

  if (expectedBuffer.length !== signatureBuffer.length) {
    throw createError('Invalid payment signature', 400);
  }

  if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    throw createError('Invalid payment signature', 400);
  }
};

const createPaymentOrder = async ({ amountInRupees, userId }) => {
  const parsedAmount = Number(amountInRupees);

  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    throw createError('amountInRupees must be a number greater than 0', 400);
  }

  const amountInPaise = Math.round(parsedAmount * 100);
  const { client, keyId } = getRazorpayClient();

  const razorpayOrder = await client.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `quick_${Date.now()}`,
    notes: {
      userId: userId || 'guest',
    },
  });

  return {
    razorpayOrderId: razorpayOrder.id,
    razorpayKeyId: keyId,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  };
};

const normalizeItems = async ({ userId, cartId, items, transaction }) => {
  if (cartId) {
    const cart = await Cart.findOne({ where: { id: cartId, userId }, transaction });
    if (!cart) {
      throw createError('Cart not found for user', 404);
    }

    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [{ model: ProductVariant, as: 'productVariant' }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!cartItems.length) {
      throw createError('Cart is empty', 400);
    }

    return cartItems.map((item) => ({
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      variant: item.productVariant,
    }));
  }

  if (!Array.isArray(items) || !items.length) {
    throw createError('Provide cartId or non-empty items[]', 400);
  }

  const prepared = [];

  for (const raw of items) {
    const productVariantId = raw.productVariantId;
    const quantity = toInt(raw.quantity, 1);

    if (!productVariantId || quantity < 1) {
      throw createError('Each item requires productVariantId and quantity >= 1', 400);
    }

    const variant = await ProductVariant.findByPk(productVariantId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!variant) {
      throw createError(`Variant not found: ${productVariantId}`, 404);
    }

    prepared.push({ productVariantId, quantity, variant });
  }

  return prepared;
};

const computeDiscount = (coupon, itemsSubtotal) => {
  if (!coupon) return 0;

  if (coupon.minOrderValue && itemsSubtotal < coupon.minOrderValue) {
    throw createError(`Minimum order value for coupon is ${coupon.minOrderValue}`, 400);
  }

  let discount = 0;

  if (coupon.discountType === 'percentage') {
    discount = Math.floor((itemsSubtotal * coupon.value) / 100);
  } else {
    discount = coupon.value;
  }

  if (coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  return Math.max(0, discount);
};

const createOrder = async ({ userId, cartId, items, addressId, couponCode }) => {
  if (!addressId) {
    throw createError('addressId is required', 400);
  }

  const address = await Address.findOne({ where: { id: addressId, userId } });
  if (!address) {
    throw createError('Address not found for user', 404);
  }

  const shippingAmount = toInt(process.env.DEFAULT_SHIPPING_AMOUNT, 0);

  const result = await sequelize.transaction(async (transaction) => {
    const normalizedItems = await normalizeItems({ userId, cartId, items, transaction });

    for (const item of normalizedItems) {
      if (!item.variant) {
        throw createError('Invalid variant in cart/items', 400);
      }

      if (item.quantity > item.variant.stockQuantity) {
        throw createError(`Insufficient stock for SKU ${item.variant.sku}`, 400);
      }
    }

    const itemsSubtotal = normalizedItems.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ where: { code: couponCode }, transaction });
      if (!coupon) {
        throw createError('Invalid coupon code', 400);
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        throw createError('Coupon has expired', 400);
      }
    }

    const discountAmount = computeDiscount(coupon, itemsSubtotal);
    const totalAmount = Math.max(0, itemsSubtotal + shippingAmount - discountAmount);

    const order = await Order.create(
      {
        userId,
        addressId,
        totalAmount,
        shippingAmount,
        discountAmount,
        paymentStatus: 'pending',
        orderStatus: 'pending',
      },
      { transaction }
    );

    await OrderItem.bulkCreate(
      normalizedItems.map((item) => ({
        orderId: order.id,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        priceAtPurchase: item.variant.price,
      })),
      { transaction }
    );

    const { client, keyId } = getRazorpayClient();
    const razorpayOrder = await client.orders.create({
      amount: totalAmount,
      currency: 'INR',
      receipt: order.id,
      notes: {
        appOrderId: order.id,
        userId,
      },
    });

    await Payment.create(
      {
        orderId: order.id,
        gateway: 'razorpay',
        razorpayOrderId: razorpayOrder.id,
        status: 'pending',
        amount: totalAmount,
        rawResponse: razorpayOrder,
      },
      { transaction }
    );

    return {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: keyId,
      amount: totalAmount,
    };
  });

  return result;
};

const verifyRazorpayWebhookSignature = ({ rawBody, signature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw createError('RAZORPAY_KEY_SECRET is not configured', 500);
  }

  if (!signature) {
    throw createError('Missing x-razorpay-signature', 400);
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== signatureBuffer.length) {
    throw createError('Invalid webhook signature', 400);
  }

  if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    throw createError('Invalid webhook signature', 400);
  }
};

const processPaymentCaptured = async (payload) => {
  const paymentEntity = payload?.payload?.payment?.entity;

  if (!paymentEntity) {
    throw createError('Invalid webhook payload: payment entity missing', 400);
  }

  const razorpayOrderId = paymentEntity.order_id;
  const razorpayPaymentId = paymentEntity.id;

  if (!razorpayOrderId || !razorpayPaymentId) {
    throw createError('Invalid webhook payload: order_id/id missing', 400);
  }

  return sequelize.transaction(async (transaction) => {
    const payment = await Payment.findOne({
      where: { razorpayOrderId },
      include: [{ model: Order, as: 'order', include: [{ model: OrderItem, as: 'items' }] }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!payment) {
      throw createError('Payment record not found for razorpay_order_id', 404);
    }

    if (payment.status === 'paid') {
      return { alreadyProcessed: true };
    }

    const order = payment.order;

    for (const item of order.items) {
      const variant = await ProductVariant.findByPk(item.productVariantId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!variant) {
        throw createError(`Variant not found while reducing stock: ${item.productVariantId}`, 404);
      }

      if (variant.stockQuantity < item.quantity) {
        throw createError(`Insufficient stock during capture for SKU ${variant.sku}`, 400);
      }

      await variant.update({ stockQuantity: variant.stockQuantity - item.quantity }, { transaction });
    }

    await payment.update(
      {
        status: 'paid',
        paymentId: razorpayPaymentId,
        rawResponse: payload,
      },
      { transaction }
    );

    await order.update(
      {
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
      },
      { transaction }
    );

    return { alreadyProcessed: false };
  });
};

module.exports = {
  createPaymentOrder,
  createOrder,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  processPaymentCaptured,
};
