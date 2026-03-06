const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');
const { sequelize } = require('./models');
const { mountAdmin } = require('./admin/admin');
const { ensureSchema } = require('./db/ensureSchema');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await ensureSchema(sequelize);
    // NOTE: Keep only for local/dev quick testing. Remove in production.
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
    }


    const adminInfo = await mountAdmin(app);

    // eslint-disable-next-line no-console
    console.log('Database connected');
    // eslint-disable-next-line no-console
    console.log(`Admin panel mounted at ${adminInfo.rootPath}`);

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
