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

const backfillOrderItemPrices = async (sequelize) => {
  await sequelize.query(`
    UPDATE order_items AS oi
    SET "priceAtPurchase" = COALESCE(NULLIF(p.price, 0), NULLIF(v.price, 0), oi."priceAtPurchase")
    FROM product_variants AS v
    LEFT JOIN products AS p ON p.id = v."productId"
    WHERE oi."productVariantId" = v.id
      AND (oi."priceAtPurchase" IS NULL OR oi."priceAtPurchase" = 0)
  `);
};

const backfillOrderTotals = async (sequelize) => {
  await sequelize.query(`
    UPDATE orders AS o
    SET "totalAmount" = GREATEST(
      0,
      COALESCE(items.items_total, 0) + COALESCE(o."shippingAmount", 0) - COALESCE(o."discountAmount", 0)
    )
    FROM (
      SELECT oi."orderId" AS order_id, SUM(oi.quantity * oi."priceAtPurchase") AS items_total
      FROM order_items AS oi
      GROUP BY oi."orderId"
    ) AS items
    WHERE o.id = items.order_id
      AND (o."totalAmount" IS NULL OR o."totalAmount" = 0)
  `);
};

const ensureSchema = async (sequelize) => {
  await ensureProductColumns(sequelize);
  await backfillOrderItemPrices(sequelize);
  await backfillOrderTotals(sequelize);
};

module.exports = {
  ensureSchema,
};
