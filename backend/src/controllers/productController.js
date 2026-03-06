const productService = require('../services/productService');
const { uploadMedia } = require('../services/uploadService');

const getProducts = async (req, res, next) => {
  try {
    const data = await productService.getProducts({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      category: req.query.category,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const data = await productService.getProductBySlug(req.params.slug);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, shortDescription, longDescription, description, price, category, isActive } = req.body;
    const data = await productService.createProduct({ name, shortDescription, longDescription, description, price, category, isActive });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const data = await productService.updateProduct(req.params.id, req.body);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const data = await productService.softDeleteProduct(req.params.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const createVariant = async (req, res, next) => {
  try {
    const data = await productService.createVariant(req.params.id, req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const updateVariant = async (req, res, next) => {
  try {
    const data = await productService.updateVariant(req.params.id, req.params.variantId, req.body);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const addProductMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'file is required' });
    }

    const uploadedUrl = await uploadMedia(req.file);
    const type =
      req.body.type || (req.file.mimetype.startsWith('video/') ? 'video' : req.file.mimetype.startsWith('image/') ? 'image' : null);

    if (!type || !['image', 'video'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be image or video' });
    }

    const sortOrder = Number(req.body.sortOrder || 0);

    const data = await productService.createProductMedia({
      productId: req.params.id,
      type,
      url: uploadedUrl,
      sortOrder,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  addProductMedia,
};
