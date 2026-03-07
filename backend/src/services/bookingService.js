const crypto = require('crypto');
const { BookingRequest } = require('../models');
const logger = require('../utils/logger');

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const PHONE_REGEX = /^\d{9,10}$/;

const createBookingRequest = async (payload = {}) => {
  const name = String(payload.name || '').trim();
  const digitsOnlyPhone = String(payload.phone || '').replace(/\D/g, '');
  const phone = digitsOnlyPhone.length > 10 ? digitsOnlyPhone.slice(-10) : digitsOnlyPhone;
  const area = String(payload.area || '').trim();
  const address = String(payload.address || '').trim();
  const preferredDate = String(payload.preferredDate || '').trim();
  const preferredTime = String(payload.preferredTime || '').trim();

  if (!name || !phone || !area || !address || !preferredDate || !preferredTime) {
    throw createError('All fields are required', 400);
  }

  if (!PHONE_REGEX.test(phone)) {
    throw createError('Invalid phone number', 400);
  }

  const booking = await BookingRequest.create({
    id: crypto.randomUUID(),
    name,
    phone,
    area,
    address,
    preferredDate,
    preferredTime,
    source: 'delhi_ncr_poster',
    status: 'new',
  });

  logger.info('New booking request received', {
    bookingId: booking.id,
    phone,
    preferredDate,
    preferredTime,
  });

  return {
    id: booking.id,
  };
};

const listBookingRequests = async ({ limit = 50 } = {}) => {
  const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const bookings = await BookingRequest.findAll({
    order: [['createdAt', 'DESC']],
    limit: parsedLimit,
  });

  return bookings.map((booking) => ({
    id: booking.id,
    name: booking.name,
    phone: booking.phone,
    area: booking.area,
    address: booking.address,
    preferredDate: booking.preferredDate,
    preferredTime: booking.preferredTime,
    source: booking.source,
    status: booking.status,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  }));
};

module.exports = {
  createBookingRequest,
  listBookingRequests,
};
