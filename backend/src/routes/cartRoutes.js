const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { addToCart, getCart, updateCartItem, removeCartItem, mergeCart } = require('../controllers/cartController');

const router = express.Router();

router.post('/cart/add', addToCart);
router.get('/cart', getCart);
router.put('/cart/item/:id', updateCartItem);
router.delete('/cart/item/:id', removeCartItem);
router.post('/cart/merge', authMiddleware, mergeCart);

module.exports = router;
