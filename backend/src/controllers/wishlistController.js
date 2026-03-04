const wishlistService = require('../services/wishlistService');

const addWishlistItem = async (req, res, next) => {
  try {
    const data = await wishlistService.addWishlistItem(req.user.id, req.body.productId);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const getWishlist = async (req, res, next) => {
  try {
    const data = await wishlistService.getWishlist(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const removeWishlistItem = async (req, res, next) => {
  try {
    await wishlistService.removeWishlistItem(req.user.id, req.params.productId);
    return res.status(200).json({ success: true, data: { removed: true } });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  addWishlistItem,
  getWishlist,
  removeWishlistItem,
};
