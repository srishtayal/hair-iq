const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Coupon = sequelize.define(
    'Coupon',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      discountType: {
        type: DataTypes.ENUM('percentage', 'fixed'),
        allowNull: false,
      },
      value: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      minOrderValue: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      maxDiscount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      usageLimit: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'coupons',
      timestamps: true,
    }
  );

  return Coupon;
};
