const addressService = require('../services/addressService');

const createAddress = async (req, res, next) => {
  try {
    const data = await addressService.createAddress(req.user.id, req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const getAddresses = async (req, res, next) => {
  try {
    const data = await addressService.getAddresses(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const data = await addressService.updateAddress(req.user.id, req.params.id, req.body);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    await addressService.deleteAddress(req.user.id, req.params.id);
    return res.status(200).json({ success: true, data: { removed: true } });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
};
