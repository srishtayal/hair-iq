const bookingService = require('../services/bookingService');

const createBookingRequest = async (req, res, next) => {
  try {
    const data = await bookingService.createBookingRequest(req.body || {});
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const getBookingRequests = async (req, res, next) => {
  try {
    const data = await bookingService.listBookingRequests({
      limit: req.query.limit,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBookingRequest,
  getBookingRequests,
};
