const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductMedia = sequelize.define(
    'ProductMedia',
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
      type: {
        type: DataTypes.ENUM('image', 'video'),
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'product_media',
      timestamps: true,
    }
  );

  ProductMedia.associate = (models) => {
    ProductMedia.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  };

  return ProductMedia;
};
