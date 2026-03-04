const { Op } = require('sequelize');
const { Product, ProductVariant, ProductMedia } = require('../models');

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const getUniqueSlug = async (name, excludeId) => {
  const baseSlug = slugify(name);
  if (!baseSlug) {
    throw createError('Invalid name for slug generation', 400);
  }

  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const where = excludeId ? { slug: candidate, id: { [Op.ne]: excludeId } } : { slug: candidate };
    const existing = await Product.findOne({ where, attributes: ['id'] });

    if (!existing) return candidate;

    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }
};

const normalizePaging = (page, limit) => {
  const safePage = Number.isNaN(Number(page)) ? 1 : Math.max(1, Number(page));
  const safeLimit = Number.isNaN(Number(limit)) ? 12 : Math.max(1, Math.min(100, Number(limit)));
  return { safePage, safeLimit, offset: (safePage - 1) * safeLimit };
};

const pickTopVariant = (variants) => {
  if (!variants || !variants.length) return null;
  const sorted = [...variants].sort((a, b) => a.price - b.price);
  return sorted[0];
};

const pickThumbnail = (media) => {
  if (!media || !media.length) return null;
  const images = media.filter((item) => item.type === 'image').sort((a, b) => a.sortOrder - b.sortOrder);
  if (images.length) return images[0].url;
  return [...media].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url || null;
};

const serializeVariant = (variant) => ({
  id: variant.id,
  size: variant.size,
  color: variant.color,
  density: variant.density,
  price: variant.price,
  stockQuantity: variant.stockQuantity,
  sku: variant.sku,
});

const serializeMedia = (media) => ({
  id: media.id,
  type: media.type,
  url: media.url,
  sortOrder: media.sortOrder,
});

const mapProductWithDetails = (product) => {
  const variants = [...(product.variants || [])].sort((a, b) => a.price - b.price);
  const media = [...(product.media || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const topVariant = pickTopVariant(variants);
  const thumbnail = pickThumbnail(media);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category,
    isActive: product.isActive,
    quantity: product.quantity,
    thumbnail,
    topVariant: topVariant ? serializeVariant(topVariant) : null,
    variants: variants.map(serializeVariant),
    media: media.map(serializeMedia),
  };
};

const getProducts = async ({ page = 1, limit = 12, search = '', category = '' }) => {
  const { safePage, safeLimit, offset } = normalizePaging(page, limit);

  const where = { isActive: true };

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (category) {
    where.category = { [Op.iLike]: category };
  }

  const result = await Product.findAndCountAll({
    where,
    limit: safeLimit,
    offset,
    distinct: true,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: ProductVariant,
        as: 'variants',
        attributes: ['id', 'size', 'color', 'density', 'price', 'stockQuantity', 'sku'],
        required: false,
      },
      {
        model: ProductMedia,
        as: 'media',
        attributes: ['id', 'type', 'url', 'sortOrder'],
        required: false,
      },
    ],
  });

  const items = result.rows.map((product) => mapProductWithDetails(product));

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: result.count,
      totalPages: Math.ceil(result.count / safeLimit),
    },
  };
};

const getProductBySlug = async (slug) => {
  const product = await Product.findOne({
    where: { slug, isActive: true },
    include: [
      {
        model: ProductVariant,
        as: 'variants',
        attributes: ['id', 'size', 'color', 'density', 'price', 'stockQuantity', 'sku'],
        required: false,
      },
      {
        model: ProductMedia,
        as: 'media',
        attributes: ['id', 'type', 'url', 'sortOrder'],
        required: false,
      },
    ],
    order: [
      [{ model: ProductVariant, as: 'variants' }, 'price', 'ASC'],
      [{ model: ProductMedia, as: 'media' }, 'sortOrder', 'ASC'],
    ],
  });

  if (!product) {
    throw createError('Product not found', 404);
  }

  return mapProductWithDetails(product);
};

const createProduct = async ({ name, description, category, isActive = true }) => {
  if (!name || !category) {
    throw createError('name and category are required', 400);
  }

  const slug = await getUniqueSlug(name);

  return Product.create({
    name,
    slug,
    description: description || null,
    category,
    isActive: typeof isActive === 'boolean' ? isActive : true,
  });
};

const updateProduct = async (id, payload) => {
  const product = await Product.findByPk(id);
  if (!product) {
    throw createError('Product not found', 404);
  }

  const updates = {};
  if (payload.name !== undefined) {
    updates.name = payload.name;
    updates.slug = await getUniqueSlug(payload.name, id);
  }
  if (payload.description !== undefined) updates.description = payload.description;
  if (payload.category !== undefined) updates.category = payload.category;
  if (payload.isActive !== undefined) updates.isActive = payload.isActive;
  if (payload.quantity !== undefined) updates.quantity = payload.quantity;

  await product.update(updates);
  return product;
};

const softDeleteProduct = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) {
    throw createError('Product not found', 404);
  }

  await product.update({ isActive: false });
  return product;
};

const createVariant = async (productId, payload) => {
  const product = await Product.findByPk(productId);
  if (!product) {
    throw createError('Product not found', 404);
  }

  const { size, color, density, price, stockQuantity, sku } = payload;

  if (price === undefined || stockQuantity === undefined || !sku) {
    throw createError('price, stockQuantity and sku are required', 400);
  }

  const variant = await ProductVariant.create({
    productId,
    size: size || null,
    color: color || null,
    density: density || null,
    price,
    stockQuantity,
    sku,
  });

  return variant;
};

const updateVariant = async (productId, variantId, payload) => {
  const variant = await ProductVariant.findOne({ where: { id: variantId, productId } });
  if (!variant) {
    throw createError('Variant not found', 404);
  }

  await variant.update(payload);
  return variant;
};

const createProductMedia = async ({ productId, type, url, sortOrder = 0 }) => {
  const product = await Product.findByPk(productId);
  if (!product) {
    throw createError('Product not found', 404);
  }

  if (!type || !url) {
    throw createError('type and url are required', 400);
  }

  return ProductMedia.create({
    productId,
    type,
    url,
    sortOrder,
  });
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  softDeleteProduct,
  createVariant,
  updateVariant,
  createProductMedia,
};
