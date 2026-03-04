const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const useSsl = process.env.DB_SSL === 'true' || databaseUrl.includes('sslmode=require');
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized,
        },
      }
    : {},
});

module.exports = sequelize;
