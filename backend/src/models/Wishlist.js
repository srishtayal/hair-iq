const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Wishlist = sequelize.define(
    'Wishlist',
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
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: 'wishlists',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'productId'],
          name: 'wishlists_user_product_unique',
        },
      ],
    }
  );

  Wishlist.associate = (models) => {
    Wishlist.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Wishlist.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  };

  return Wishlist;
};
