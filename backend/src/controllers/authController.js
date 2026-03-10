const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { admin, initializeFirebaseAdmin } = require('../config/firebase');
const { User } = require('../models');

const buildAuthResponse = (user, token, needsProfile = false, isNewUser = false) => ({
  token,
  user: {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
  },
  needsProfile,
  isNewUser,
});

const isProfileIncomplete = (user) => {
  const missingName = !user.name || !user.name.trim();
  const missingPhone = !user.phone;
  return missingName || missingPhone;
};

const mapFirebaseErrorToStatus = (error) => {
  const code = error?.code || '';

  if (
    code === 'auth/argument-error' ||
    code === 'auth/invalid-id-token' ||
    code === 'auth/id-token-expired' ||
    code === 'auth/id-token-revoked' ||
    code === 'auth/user-disabled' ||
    code === 'auth/user-not-found'
  ) {
    return 401;
  }

  return 500;
};

const verifyFirebase = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'idToken is required' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured' });
    }

    initializeFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const phone = decoded.phone_number || null;
    const name = decoded.name || null;
    const email = decoded.email || null;

    let user = await User.findOne({ where: { firebase_uid: uid } });
    let isNewUser = false;

    if (user) {
      await user.update({
        lastLoginAt: new Date(),
        name: user.name || name || '',
        email: user.email || email,
        phone: user.phone || phone,
      });
    } else {
      if (phone) {
        user = await User.findOne({ where: { phone } });
      }

      if (user) {
        await user.update({
          firebase_uid: uid,
          name: user.name || name || '',
          email: user.email || email,
          lastLoginAt: new Date(),
        });
      } else {
        if (!phone) {
          return res.status(400).json({ success: false, message: 'Verified Firebase token does not contain phone_number' });
        }

        user = await User.create({
          firebase_uid: uid,
          phone,
          email,
          name: name || '',
          lastLoginAt: new Date(),
        });
        isNewUser = true;
      }
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    const needsProfile = isNewUser || isProfileIncomplete(user);

    return res.status(200).json({
      success: true,
      data: buildAuthResponse(user, token, needsProfile, isNewUser),
    });
  } catch (error) {
    if (error?.code?.startsWith?.('auth/')) {
      const status = mapFirebaseErrorToStatus(error);
      return res.status(status).json({
        success: false,
        message: `Firebase auth failed (${error.code})`,
      });
    }

    return next(error);
  }
};

const completeProfile = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your full name' });
    }

    const incomingPhone = String(phone || '').trim();
    const currentPhone = String(req.user.phone || '').trim();

    if (incomingPhone && currentPhone && incomingPhone !== currentPhone) {
      return res.status(400).json({ success: false, message: 'Mobile number cannot be changed from profile' });
    }

    const finalPhone = currentPhone || incomingPhone;
    if (!finalPhone) {
      return res.status(400).json({ success: false, message: 'Mobile number is missing on your account. Please login again.' });
    }

    if (!currentPhone && finalPhone) {
      const duplicate = await User.findOne({
        where: {
          phone: finalPhone,
          id: { [Op.ne]: req.user.id },
        },
      });

      if (duplicate) {
        return res.status(409).json({ success: false, message: 'This mobile number is already linked to another account' });
      }
    }

    await req.user.update({
      name: String(name).trim(),
      phone: finalPhone,
      email: email || null,
    });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured' });
    }

    const token = jwt.sign(
      {
        userId: req.user.id,
        role: req.user.role,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      data: buildAuthResponse(req.user, token, false, false),
    });
  } catch (error) {
    return next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          name: req.user.name,
          phone: req.user.phone,
          email: req.user.email,
          role: req.user.role,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  verifyFirebase,
  completeProfile,
  getProfile,
};
