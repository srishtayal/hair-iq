const ensureProductColumns = async (sequelize) => {
  const queryInterface = sequelize.getQueryInterface();
  const tableName = 'products';
  const definition = await queryInterface.describeTable(tableName);

  if (!definition.shortDescription) {
    await queryInterface.addColumn(tableName, 'shortDescription', {
      type: 'TEXT',
      allowNull: true,
    });
  }

  if (!definition.longDescription) {
    await queryInterface.addColumn(tableName, 'longDescription', {
      type: 'TEXT',
      allowNull: true,
    });
  }

  if (!definition.price) {
    await queryInterface.addColumn(tableName, 'price', {
      type: 'BIGINT',
      allowNull: false,
      defaultValue: 0,
    });
  }
};

const ensureSchema = async (sequelize) => {
  await ensureProductColumns(sequelize);
};

module.exports = {
  ensureSchema,
};
