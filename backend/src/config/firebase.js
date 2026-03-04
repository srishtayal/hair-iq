const admin = require('firebase-admin');
const path = require('path');

const initializeFirebaseAdmin = () => {
  if (admin.apps.length) {
    return admin;
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is not set');
  }

  const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const serviceAccount = require(resolvedPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin;
};

module.exports = {
  admin,
  initializeFirebaseAdmin,
};
