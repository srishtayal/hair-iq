const admin = require('firebase-admin');
const path = require('path');

const normalizePrivateKey = (privateKey) => {
  if (typeof privateKey !== 'string') return privateKey;
  return privateKey.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
};

const normalizeServiceAccount = (serviceAccount) => {
  if (!serviceAccount || typeof serviceAccount !== 'object') return null;

  return {
    ...serviceAccount,
    private_key: normalizePrivateKey(serviceAccount.private_key),
  };
};

const hasRequiredServiceAccountFields = (serviceAccount) => {
  if (!serviceAccount) return false;
  return Boolean(serviceAccount.project_id && serviceAccount.client_email && serviceAccount.private_key);
};

const parseServiceAccountFromEnv = (value) => {
  if (!value) return null;

  const candidates = [];
  const trimmed = String(value).trim();
  candidates.push(trimmed);

  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    candidates.push(trimmed.slice(1, -1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const normalized = normalizeServiceAccount(parsed);
      if (hasRequiredServiceAccountFields(normalized)) {
        return normalized;
      }
    } catch {
      // keep trying
    }

    try {
      const decoded = Buffer.from(candidate, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      const normalized = normalizeServiceAccount(parsed);
      if (hasRequiredServiceAccountFields(normalized)) {
        return normalized;
      }
    } catch {
      // keep trying
    }
  }

  return null;
};

const serviceAccountFromSeparateEnv = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };
};

const initializeFirebaseAdmin = () => {
  if (admin.apps.length) {
    return admin;
  }

  const serviceAccountFromJsonEnv = parseServiceAccountFromEnv(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const serviceAccountFromEnvParts = serviceAccountFromSeparateEnv();

  if (serviceAccountFromJsonEnv || serviceAccountFromEnvParts) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountFromJsonEnv || serviceAccountFromEnvParts),
    });

    return admin;
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    throw new Error('Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH');
  }

  const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const serviceAccount = normalizeServiceAccount(require(resolvedPath));

  if (!hasRequiredServiceAccountFields(serviceAccount)) {
    throw new Error('Firebase service account file is missing required fields');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin;
};

module.exports = {
  admin,
  initializeFirebaseAdmin,
};
