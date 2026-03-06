const { Wishlist, Product, ProductVariant, ProductMedia } = require('../models');

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const mapProductSummary = (product) => {
  const variants = product.variants || [];
  const media = product.media || [];

  const topVariant = variants.length ? variants[0] : null;

  const thumbnail = media
    .filter((m) => m.type === 'image')
    .sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url || media.sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url || null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    isActive: product.isActive,
    thumbnail,
    topVariant: topVariant
        ? {
          id: topVariant.id,
          price: Number(product.price || 0) > 0 ? Number(product.price) : Number(topVariant.price || 0),
          size: topVariant.size,
          color: topVariant.color,
          density: topVariant.density,
          stockQuantity: topVariant.stockQuantity,
          sku: topVariant.sku,
        }
      : null,
  };
};

const addWishlistItem = async (userId, productId) => {
  if (!productId) {
    throw createError('productId is required', 400);
  }

  const product = await Product.findByPk(productId);
  if (!product) {
    throw createError('Product not found', 404);
  }

  const existing = await Wishlist.findOne({ where: { userId, productId } });
  if (existing) {
    throw createError('Product already in wishlist', 409);
  }

  return Wishlist.create({ userId, productId });
};

const getWishlist = async (userId) => {
  const items = await Wishlist.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'category', 'isActive', 'price'],
        include: [
          {
            model: ProductVariant,
            as: 'variants',
            attributes: ['id', 'price', 'size', 'color', 'density', 'stockQuantity', 'sku'],
            required: false,
          },
          {
            model: ProductMedia,
            as: 'media',
            attributes: ['id', 'type', 'url', 'sortOrder'],
            required: false,
          },
        ],
      },
    ],
  });

  return items.filter((item) => item.product).map((item) => mapProductSummary(item.product));
};

const removeWishlistItem = async (userId, productId) => {
  const deleted = await Wishlist.destroy({ where: { userId, productId } });
  if (!deleted) {
    throw createError('Wishlist item not found', 404);
  }
};

module.exports = {
  addWishlistItem,
  getWishlist,
  removeWishlistItem,
};
