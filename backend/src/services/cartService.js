const { Op } = require('sequelize');
const { Cart, CartItem, ProductVariant, Product, ProductMedia } = require('../models');

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toInt = (value, fallback = 1) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

const resolveOwner = ({ userId, sessionId }) => {
  if (userId) return { userId, sessionId: null };
  if (sessionId) return { userId: null, sessionId };
  throw createError('sessionId is required for guest cart', 400);
};

const getOrCreateCart = async ({ userId, sessionId }) => {
  const owner = resolveOwner({ userId, sessionId });
  let cart = await Cart.findOne({ where: owner });
  if (!cart) {
    cart = await Cart.create(owner);
  }
  return cart;
};

const checkStock = (variant, quantity) => {
  if (quantity < 1) {
    throw createError('quantity must be at least 1', 400);
  }

  if (quantity > variant.stockQuantity) {
    throw createError(`Insufficient stock. Available stock: ${variant.stockQuantity}`, 400);
  }
};

const mapCartDetails = (cart) => {
  const items = (cart.items || []).map((item) => {
    const variant = item.productVariant;
    const product = variant?.product;

    const thumbnail = (product?.media || [])
      .filter((m) => m.type === 'image')
      .sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url ||
      (product?.media || []).sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url ||
      null;

    const lineTotal = (variant?.price || 0) * item.quantity;

    return {
      id: item.id,
      quantity: item.quantity,
      lineTotal,
      variant: variant
        ? {
            id: variant.id,
            size: variant.size,
            color: variant.color,
            density: variant.density,
            price: variant.price,
            stockQuantity: variant.stockQuantity,
            sku: variant.sku,
          }
        : null,
      product: product
        ? {
            id: product.id,
            name: product.name,
            slug: product.slug,
            category: product.category,
            thumbnail,
          }
        : null,
    };
  });

  const subtotal = items.reduce((acc, item) => acc + item.lineTotal, 0);

  return {
    id: cart.id,
    userId: cart.userId,
    sessionId: cart.sessionId,
    items,
    subtotal,
    totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
  };
};

const loadCartWithItems = async (cartId) => {
  return Cart.findByPk(cartId, {
    include: [
      {
        model: CartItem,
        as: 'items',
        required: false,
        include: [
          {
            model: ProductVariant,
            as: 'productVariant',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'slug', 'category'],
                include: [
                  {
                    model: ProductMedia,
                    as: 'media',
                    attributes: ['id', 'type', 'url', 'sortOrder'],
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    order: [[{ model: CartItem, as: 'items' }, 'createdAt', 'ASC']],
  });
};

const addToCart = async ({ userId, sessionId, productVariantId, quantity }) => {
  if (!productVariantId) {
    throw createError('productVariantId is required', 400);
  }

  const qty = toInt(quantity, 1);
  const variant = await ProductVariant.findByPk(productVariantId);

  if (!variant) {
    throw createError('Product variant not found', 404);
  }

  const cart = await getOrCreateCart({ userId, sessionId });

  let item = await CartItem.findOne({ where: { cartId: cart.id, productVariantId } });

  if (item) {
    const nextQuantity = item.quantity + qty;
    checkStock(variant, nextQuantity);
    await item.update({ quantity: nextQuantity });
  } else {
    checkStock(variant, qty);
    item = await CartItem.create({ cartId: cart.id, productVariantId, quantity: qty });
  }

  const hydrated = await loadCartWithItems(cart.id);
  return mapCartDetails(hydrated);
};

const getCart = async ({ userId, sessionId }) => {
  const owner = resolveOwner({ userId, sessionId });
  const cart = await Cart.findOne({ where: owner });

  if (!cart) {
    return {
      id: null,
      userId: userId || null,
      sessionId: sessionId || null,
      items: [],
      subtotal: 0,
      totalItems: 0,
    };
  }

  const hydrated = await loadCartWithItems(cart.id);
  return mapCartDetails(hydrated);
};

const updateCartItem = async ({ userId, sessionId, itemId, quantity }) => {
  const qty = toInt(quantity, 1);

  const item = await CartItem.findByPk(itemId, {
    include: [{ model: Cart, as: 'cart' }],
  });

  if (!item) {
    throw createError('Cart item not found', 404);
  }

  const belongsToUser = userId && item.cart.userId === userId;
  const belongsToSession = !userId && sessionId && item.cart.sessionId === sessionId;

  if (!belongsToUser && !belongsToSession) {
    throw createError('Cart item not found for this user/session', 404);
  }

  const variant = await ProductVariant.findByPk(item.productVariantId);
  if (!variant) {
    throw createError('Product variant not found', 404);
  }

  checkStock(variant, qty);
  await item.update({ quantity: qty });

  const hydrated = await loadCartWithItems(item.cartId);
  return mapCartDetails(hydrated);
};

const removeCartItem = async ({ userId, sessionId, itemId }) => {
  const item = await CartItem.findByPk(itemId, {
    include: [{ model: Cart, as: 'cart' }],
  });

  if (!item) {
    throw createError('Cart item not found', 404);
  }

  const belongsToUser = userId && item.cart.userId === userId;
  const belongsToSession = !userId && sessionId && item.cart.sessionId === sessionId;

  if (!belongsToUser && !belongsToSession) {
    throw createError('Cart item not found for this user/session', 404);
  }

  const cartId = item.cartId;
  await item.destroy();

  const hydrated = await loadCartWithItems(cartId);
  return mapCartDetails(hydrated);
};

const mergeCart = async ({ userId, sessionId }) => {
  if (!userId) {
    throw createError('Unauthorized', 401);
  }

  if (!sessionId) {
    throw createError('sessionId is required', 400);
  }

  const guestCart = await Cart.findOne({ where: { userId: null, sessionId } });
  const userCart = await getOrCreateCart({ userId, sessionId: null });

  if (!guestCart) {
    const hydrated = await loadCartWithItems(userCart.id);
    return mapCartDetails(hydrated);
  }

  const guestItems = await CartItem.findAll({ where: { cartId: guestCart.id } });

  for (const guestItem of guestItems) {
    const variant = await ProductVariant.findByPk(guestItem.productVariantId);
    if (!variant) continue;

    const existing = await CartItem.findOne({
      where: {
        cartId: userCart.id,
        productVariantId: guestItem.productVariantId,
      },
    });

    if (existing) {
      const mergedQty = existing.quantity + guestItem.quantity;
      checkStock(variant, mergedQty);
      await existing.update({ quantity: mergedQty });
    } else {
      checkStock(variant, guestItem.quantity);
      await CartItem.create({
        cartId: userCart.id,
        productVariantId: guestItem.productVariantId,
        quantity: guestItem.quantity,
      });
    }
  }

  await CartItem.destroy({ where: { cartId: guestCart.id } });
  await guestCart.destroy();

  const hydrated = await loadCartWithItems(userCart.id);
  return mapCartDetails(hydrated);
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  mergeCart,
};
