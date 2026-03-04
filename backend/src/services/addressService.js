const { Address } = require('../models');

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];

const validateAddressPayload = (payload, partial = false) => {
  if (!partial) {
    const missing = requiredFields.filter((key) => !payload[key]);
    if (missing.length) {
      throw createError(`Missing required fields: ${missing.join(', ')}`, 400);
    }
  }
};

const unsetDefaultForUser = async (userId, excludeId) => {
  const where = excludeId ? { userId, id: { [require('sequelize').Op.ne]: excludeId } } : { userId };
  await Address.update({ isDefault: false }, { where });
};

const createAddress = async (userId, payload) => {
  validateAddressPayload(payload);

  if (payload.isDefault) {
    await unsetDefaultForUser(userId);
  }

  return Address.create({
    userId,
    fullName: payload.fullName,
    phone: payload.phone,
    addressLine1: payload.addressLine1,
    addressLine2: payload.addressLine2 || null,
    city: payload.city,
    state: payload.state,
    pincode: payload.pincode,
    isDefault: !!payload.isDefault,
  });
};

const getAddresses = async (userId) => {
  return Address.findAll({
    where: { userId },
    order: [
      ['isDefault', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
};

const updateAddress = async (userId, id, payload) => {
  validateAddressPayload(payload, true);

  const address = await Address.findOne({ where: { id, userId } });
  if (!address) {
    throw createError('Address not found', 404);
  }

  if (payload.isDefault) {
    await unsetDefaultForUser(userId, id);
  }

  await address.update({
    fullName: payload.fullName !== undefined ? payload.fullName : address.fullName,
    phone: payload.phone !== undefined ? payload.phone : address.phone,
    addressLine1: payload.addressLine1 !== undefined ? payload.addressLine1 : address.addressLine1,
    addressLine2: payload.addressLine2 !== undefined ? payload.addressLine2 : address.addressLine2,
    city: payload.city !== undefined ? payload.city : address.city,
    state: payload.state !== undefined ? payload.state : address.state,
    pincode: payload.pincode !== undefined ? payload.pincode : address.pincode,
    isDefault: payload.isDefault !== undefined ? !!payload.isDefault : address.isDefault,
  });

  return address;
};

const deleteAddress = async (userId, id) => {
  const address = await Address.findOne({ where: { id, userId } });
  if (!address) {
    throw createError('Address not found', 404);
  }

  await address.destroy();
};

module.exports = {
  createAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
};
