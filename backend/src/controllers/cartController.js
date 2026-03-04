const jwt = require('jsonwebtoken');
const cartService = require('../services/cartService');

const optionalAuth = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) return null;

  try {
    const payload = jwt.verify(token, jwtSecret);
    return payload.userId || null;
  } catch {
    return null;
  }
};

const addToCart = async (req, res, next) => {
  try {
    const userId = req.user?.id || optionalAuth(req);
    const { productVariantId, quantity, sessionId } = req.body;

    const data = await cartService.addToCart({ userId, sessionId, productVariantId, quantity });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const getCart = async (req, res, next) => {
  try {
    const userId = req.user?.id || optionalAuth(req);
    const sessionId = req.query.sessionId;

    const data = await cartService.getCart({ userId, sessionId });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user?.id || optionalAuth(req);
    const sessionId = req.body.sessionId || req.query.sessionId;

    const data = await cartService.updateCartItem({
      userId,
      sessionId,
      itemId: req.params.id,
      quantity: req.body.quantity,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user?.id || optionalAuth(req);
    const sessionId = req.body.sessionId || req.query.sessionId;

    const data = await cartService.removeCartItem({
      userId,
      sessionId,
      itemId: req.params.id,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const mergeCart = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const data = await cartService.mergeCart({
      userId: req.user.id,
      sessionId: req.body.sessionId,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  mergeCart,
};
