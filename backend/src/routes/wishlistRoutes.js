const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { addWishlistItem, getWishlist, removeWishlistItem } = require('../controllers/wishlistController');

const router = express.Router();

router.post('/wishlist', authMiddleware, addWishlistItem);
router.get('/wishlist', authMiddleware, getWishlist);
router.delete('/wishlist/:productId', authMiddleware, removeWishlistItem);

module.exports = router;
