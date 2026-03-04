const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Review = sequelize.define(
    'Review',
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
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      reviewText: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'reviews',
      timestamps: true,
    }
  );

  Review.associate = (models) => {
    Review.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Review.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  };

  return Review;
};
