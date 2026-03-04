const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductVariant = sequelize.define(
    'ProductVariant',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      size: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      density: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stockQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sku: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'product_variants',
      timestamps: true,
    }
  );

  ProductVariant.associate = (models) => {
    ProductVariant.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    ProductVariant.hasMany(models.CartItem, { foreignKey: 'productVariantId', as: 'cartItems' });
    ProductVariant.hasMany(models.OrderItem, { foreignKey: 'productVariantId', as: 'orderItems' });
  };

  return ProductVariant;
};
