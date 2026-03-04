const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured' });
    }

    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findByPk(payload.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: admin access required' });
  }
  return next();
};

module.exports = {
  authMiddleware,
  requireAdmin,
};
