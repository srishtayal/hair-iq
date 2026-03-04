const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define(
    'Payment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      gateway: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      razorpayOrderId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      paymentId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rawResponse: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: 'payments',
      timestamps: true,
    }
  );

  Payment.associate = (models) => {
    Payment.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
  };

  return Payment;
};
