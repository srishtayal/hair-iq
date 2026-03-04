const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const addressRoutes = require('./routes/addressRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const sequelize = require('./config/db');

const app = express();
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const cwdUploadsDir = path.resolve(process.cwd(), 'uploads');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);
app.use(cors());
app.use(morgan('dev'));
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);
app.use(rateLimiter);
app.use('/uploads', express.static(uploadsDir));

// Backward-compatible fallback if files were written relative to cwd in older runs.
if (cwdUploadsDir !== uploadsDir) {
  app.use('/uploads', express.static(cwdUploadsDir));
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/__build', (req, res) => {
  res.status(200).json({ success: true, build: 'admin-basic-auth-v1' });
});

app.get('/health/db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: 'OK', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', db: 'disconnected', message: error.message });
  }
});

app.use('/auth', authRoutes);
app.use(productRoutes);
app.use('/admin-api', adminProductRoutes);
app.use(wishlistRoutes);
app.use(addressRoutes);
app.use(cartRoutes);
app.use(orderRoutes);

app.use(errorHandler);

module.exports = app;
