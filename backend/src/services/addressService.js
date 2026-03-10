const { Address } = require('../models');

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];

const normalize = (value) => String(value || '').trim().toLowerCase();

const isSameAddress = (existing, payload) =>
  normalize(existing.fullName) === normalize(payload.fullName)
  && normalize(existing.phone) === normalize(payload.phone)
  && normalize(existing.addressLine1) === normalize(payload.addressLine1)
  && normalize(existing.addressLine2) === normalize(payload.addressLine2)
  && normalize(existing.city) === normalize(payload.city)
  && normalize(existing.state) === normalize(payload.state)
  && normalize(existing.pincode) === normalize(payload.pincode);

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

  const existingAddresses = await Address.findAll({ where: { userId } });
  const duplicate = existingAddresses.find((address) => isSameAddress(address, payload));

  if (duplicate) {
    if (payload.isDefault && !duplicate.isDefault) {
      await unsetDefaultForUser(userId, duplicate.id);
      await duplicate.update({ isDefault: true });
    }
    return duplicate;
  }

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

  const nextValues = {
    fullName: payload.fullName !== undefined ? payload.fullName : address.fullName,
    phone: payload.phone !== undefined ? payload.phone : address.phone,
    addressLine1: payload.addressLine1 !== undefined ? payload.addressLine1 : address.addressLine1,
    addressLine2: payload.addressLine2 !== undefined ? payload.addressLine2 : address.addressLine2,
    city: payload.city !== undefined ? payload.city : address.city,
    state: payload.state !== undefined ? payload.state : address.state,
    pincode: payload.pincode !== undefined ? payload.pincode : address.pincode,
    isDefault: payload.isDefault !== undefined ? !!payload.isDefault : address.isDefault,
  };

  const existingAddresses = await Address.findAll({ where: { userId } });
  const duplicate = existingAddresses.find((candidate) => candidate.id !== id && isSameAddress(candidate, nextValues));
  if (duplicate) {
    throw createError('This address is already saved.', 409);
  }

  if (payload.isDefault) {
    await unsetDefaultForUser(userId, id);
  }

  await address.update(nextValues);

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
