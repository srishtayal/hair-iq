const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { createAddress, getAddresses, updateAddress, deleteAddress } = require('../controllers/addressController');

const router = express.Router();

router.post('/addresses', authMiddleware, createAddress);
router.get('/addresses', authMiddleware, getAddresses);
router.put('/addresses/:id', authMiddleware, updateAddress);
router.delete('/addresses/:id', authMiddleware, deleteAddress);

module.exports = router;
