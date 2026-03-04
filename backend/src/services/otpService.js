const { admin, initializeFirebaseAdmin } = require('../config/firebase');

const verifyFirebaseIdToken = async (idToken) => {
  initializeFirebaseAdmin();
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  return decodedToken;
};

module.exports = {
  verifyFirebaseIdToken,
};
