const sequelize = require('../config/db');

const defineUser = require('./User');
const defineAddress = require('./Address');
const defineProduct = require('./Product');
const defineProductVariant = require('./ProductVariant');
const defineProductMedia = require('./ProductMedia');
const defineWishlist = require('./Wishlist');
const defineCart = require('./Cart');
const defineCartItem = require('./CartItem');
const defineOrder = require('./Order');
const defineOrderItem = require('./OrderItem');
const definePayment = require('./Payment');
const defineCoupon = require('./Coupon');
const defineReview = require('./Review');
const defineBookingRequest = require('./BookingRequest');

const models = {
  User: defineUser(sequelize),
  Address: defineAddress(sequelize),
  Product: defineProduct(sequelize),
  ProductVariant: defineProductVariant(sequelize),
  ProductMedia: defineProductMedia(sequelize),
  Wishlist: defineWishlist(sequelize),
  Cart: defineCart(sequelize),
  CartItem: defineCartItem(sequelize),
  Order: defineOrder(sequelize),
  OrderItem: defineOrderItem(sequelize),
  Payment: definePayment(sequelize),
  Coupon: defineCoupon(sequelize),
  Review: defineReview(sequelize),
  BookingRequest: defineBookingRequest(sequelize),
};

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  models,
  ...models,
};
