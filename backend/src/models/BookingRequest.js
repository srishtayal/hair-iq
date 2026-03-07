const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BookingRequest = sequelize.define(
    'BookingRequest',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      area: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      preferredDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      preferredTime: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      source: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'delhi_ncr_poster',
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'new',
      },
    },
    {
      tableName: 'booking_requests',
      timestamps: true,
    }
  );

  return BookingRequest;
};
