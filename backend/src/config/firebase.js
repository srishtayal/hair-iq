const admin = require('firebase-admin');
const path = require('path');

const parseServiceAccountFromEnv = (value) => {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    try {
      const decoded = Buffer.from(value, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
};

const initializeFirebaseAdmin = () => {
  if (admin.apps.length) {
    return admin;
  }

  const serviceAccountFromEnv = parseServiceAccountFromEnv(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (serviceAccountFromEnv) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountFromEnv),
    });

    return admin;
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    throw new Error('Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH');
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
