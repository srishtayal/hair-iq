const express = require('express');
const { createBookingRequest, getBookingRequests } = require('../controllers/bookingController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/bookings', createBookingRequest);
router.get('/admin-api/bookings', authMiddleware, requireAdmin, getBookingRequests);

module.exports = router;
