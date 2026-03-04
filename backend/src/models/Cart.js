const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cart = sequelize.define(
    'Cart',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      sessionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'carts',
      timestamps: true,
    }
  );

  Cart.associate = (models) => {
    Cart.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Cart.hasMany(models.CartItem, { foreignKey: 'cartId', as: 'items' });
  };

  return Cart;
};
