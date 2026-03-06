const crypto = require('crypto');
const Razorpay = require('razorpay');
const sequelize = require('../config/db');
const { Address, Cart, CartItem, Coupon, Order, OrderItem, Payment, Product, ProductVariant } = require('../models');

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

const isMagicCodEnabled = () => String(process.env.RAZORPAY_ENABLE_COD || '').toLowerCase() === 'true';

const normalizeMagicLineItems = (lineItems) => {
  if (!Array.isArray(lineItems) || !lineItems.length) {
    throw createError('lineItems are required when RAZORPAY_ENABLE_COD=true', 400);
  }

  return lineItems.map((item, index) => {
    const sku = String(item?.sku || '').trim();
    const variantId = String(item?.variant_id || '').trim();
    const name = String(item?.name || '').trim();
    const description = String(item?.description || '').trim();
    const imageUrl = String(item?.image_url || '').trim();
    const quantity = toInt(item?.quantity, 0);
    const price = toInt(item?.price, -1);
    const offerPrice = toInt(item?.offer_price, -1);
    const taxAmount = Math.max(0, toInt(item?.tax_amount, 0));

    if (!sku || !variantId || !name || !description || !imageUrl || quantity < 1 || price < 0 || offerPrice < 0) {
      throw createError(`Invalid line item at index ${index}`, 400);
    }

    const normalized = {
      sku,
      variant_id: variantId,
      price,
      offer_price: offerPrice,
      tax_amount: taxAmount,
      quantity,
      name,
      description,
      image_url: imageUrl,
    };

    const productUrl = String(item?.product_url || '').trim();
    if (productUrl) {
      normalized.product_url = productUrl;
    }

    return normalized;
  });
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

const createPaymentOrder = async ({ amountInRupees, userId, lineItems }) => {
  const parsedAmount = Number(amountInRupees);

  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    throw createError('amountInRupees must be a number greater than 0', 400);
  }

  const codEnabledByEnv = isMagicCodEnabled();
  const amountInPaise = Math.round(parsedAmount * 100);
  const { client, keyId } = getRazorpayClient();
  let codEnabled = false;
  const requestPayload = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `quick_${Date.now()}`,
    notes: {
      userId: userId || 'guest',
    },
  };

  if (codEnabledByEnv && Array.isArray(lineItems) && lineItems.length) {
    const normalizedLineItems = normalizeMagicLineItems(lineItems);
    const lineItemsTotal = normalizedLineItems.reduce((sum, item) => sum + item.offer_price * item.quantity, 0);
    requestPayload.amount = lineItemsTotal;
    requestPayload.line_items_total = lineItemsTotal;
    requestPayload.line_items = normalizedLineItems;
    codEnabled = true;
  }

  const razorpayOrder = await client.orders.create(requestPayload);

  return {
    razorpayOrderId: razorpayOrder.id,
    razorpayKeyId: keyId,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    codEnabled,
  };
};

const getMagicCheckoutShippingInfo = ({ addresses }) => {
  const codEnabled = isMagicCodEnabled();
  const incomingAddresses = Array.isArray(addresses) ? addresses : [];

  return {
    addresses: incomingAddresses.map((address, index) => {
      const zipcode = String(address?.zipcode || '');
      const isIndianZip = /^\d{6}$/.test(zipcode);
      const country = String(address?.country || 'IN').slice(0, 2).toUpperCase();
      const id = String(address?.id ?? index);

      return {
        id,
        zipcode,
        country,
        shipping_methods: [
          {
            id: 'standard',
            description: 'Standard delivery in 3-5 business days',
            name: 'Standard Delivery',
            serviceable: isIndianZip,
            shipping_fee: 0,
            cod: codEnabled && isIndianZip,
            cod_fee: 0,
          },
        ],
      };
    }),
  };
};

const getMagicCheckoutPromotions = () => {
  const promoCode = String(process.env.MAGIC_CHECKOUT_PROMO_CODE || '').trim();
  const promoDiscount = Math.max(0, toInt(process.env.MAGIC_CHECKOUT_PROMO_DISCOUNT_PAISE, 0));

  if (!promoCode || promoDiscount <= 0) {
    return { promotions: [] };
  }

  return {
    promotions: [
      {
        code: promoCode,
        summary: `Save ₹${Math.floor(promoDiscount / 100)} on checkout`,
        description: `Flat discount of ₹${Math.floor(promoDiscount / 100)} on your order`,
      },
    ],
  };
};

const applyMagicCheckoutPromotion = ({ code }) => {
  const promoCode = String(process.env.MAGIC_CHECKOUT_PROMO_CODE || '').trim();
  const promoDiscount = Math.max(0, toInt(process.env.MAGIC_CHECKOUT_PROMO_DISCOUNT_PAISE, 0));
  const requestedCode = String(code || '').trim();

  if (!promoCode || promoDiscount <= 0) {
    throw createError('No active promotions', 400);
  }

  if (!requestedCode || requestedCode.toLowerCase() !== promoCode.toLowerCase()) {
    throw createError('Invalid promotion code', 400);
  }

  return {
    promotion: {
      reference_id: `promo_${promoCode}`,
      code: promoCode,
      type: 'coupon',
      value: promoDiscount,
      value_type: 'fixed_amount',
      description: `Flat discount of ₹${Math.floor(promoDiscount / 100)}`,
    },
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
      include: [{ model: ProductVariant, as: 'productVariant', include: [{ model: Product, as: 'product', attributes: ['id', 'price'] }] }],
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
      include: [{ model: Product, as: 'product', attributes: ['id', 'price'] }],
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

const resolveUnitPrice = (variant) => {
  const productPrice = Number(variant?.product?.price || 0);
  if (productPrice > 0) return productPrice;
  return Number(variant?.price || 0);
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

    const itemsSubtotal = normalizedItems.reduce((sum, item) => sum + resolveUnitPrice(item.variant) * item.quantity, 0);

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
        priceAtPurchase: resolveUnitPrice(item.variant),
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

const getOrdersByUser = async (userId) => {
  const orders = await Order.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Address,
        as: 'address',
        attributes: ['id', 'fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode', 'isDefault'],
      },
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: ProductVariant,
            as: 'productVariant',
            attributes: ['id', 'size', 'color', 'density', 'price', 'sku'],
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'slug', 'category', 'price'],
              },
            ],
          },
        ],
      },
    ],
  });

  return orders.map((order) => ({
    id: order.id,
    createdAt: order.createdAt,
    totalAmount: order.totalAmount,
    shippingAmount: order.shippingAmount,
    discountAmount: order.discountAmount,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    trackingId: order.trackingId,
    totalItems: (order.items || []).reduce((sum, item) => sum + item.quantity, 0),
    address: order.address
      ? {
          id: order.address.id,
          fullName: order.address.fullName,
          phone: order.address.phone,
          addressLine1: order.address.addressLine1,
          addressLine2: order.address.addressLine2,
          city: order.address.city,
          state: order.address.state,
          pincode: order.address.pincode,
          isDefault: order.address.isDefault,
        }
      : null,
    items: (order.items || []).map((item) => ({
      id: item.id,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
      variant: item.productVariant
        ? {
            id: item.productVariant.id,
            size: item.productVariant.size,
            color: item.productVariant.color,
            density: item.productVariant.density,
            price: item.priceAtPurchase,
            sku: item.productVariant.sku,
          }
        : null,
      product: item.productVariant?.product
        ? {
            id: item.productVariant.product.id,
            name: item.productVariant.product.name,
            slug: item.productVariant.product.slug,
            category: item.productVariant.product.category,
          }
        : null,
    })),
  }));
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
  applyMagicCheckoutPromotion,
  createPaymentOrder,
  createOrder,
  getMagicCheckoutPromotions,
  getMagicCheckoutShippingInfo,
  getOrdersByUser,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  processPaymentCaptured,
};
