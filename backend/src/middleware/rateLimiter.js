const rateLimit = require('express-rate-limit');

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const isAdminPath = (path) => path.startsWith('/admin') || path.startsWith('/admin-api');

const rateLimiter = rateLimit({
  windowMs: toPositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: toPositiveInt(process.env.RATE_LIMIT_MAX, 1000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const path = req.originalUrl || req.url || '';

    if (path.startsWith('/health') || path.startsWith('/__build')) {
      return true;
    }

    if (process.env.RATE_LIMIT_SKIP_ADMIN !== 'false' && isAdminPath(path)) {
      return true;
    }

    return false;
  },
});

module.exports = rateLimiter;
