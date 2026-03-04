const express = require('express');
const { getProducts, getProductBySlug } = require('../controllers/productController');

const router = express.Router();

router.get('/products', getProducts);
router.get('/products/:slug', getProductBySlug);

module.exports = router;
