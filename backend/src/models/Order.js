const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      addressId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      shippingAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      discountAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      paymentStatus: {
        type: DataTypes.ENUM('pending', 'cod_pending', 'COD_PENDING', 'paid', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      orderStatus: {
        type: DataTypes.ENUM(
          'pending',
          'cod_pending',
          'COD_PENDING',
          'confirmed',
          'processing',
          'packed',
          'shipped',
          'out_for_delivery',
          'delivered',
          'cancelled',
          'returned'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      trackingId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'orders',
      timestamps: true,
    }
  );

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Order.belongsTo(models.Address, { foreignKey: 'addressId', as: 'address' });
    Order.hasMany(models.OrderItem, { foreignKey: 'orderId', as: 'items' });
    Order.hasMany(models.Payment, { foreignKey: 'orderId', as: 'payments' });
  };

  return Order;
};
