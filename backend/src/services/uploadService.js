const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');

const parseCloudinaryUrl = (cloudinaryUrl) => {
  try {
    const parsed = new URL(cloudinaryUrl);
    if (parsed.protocol !== 'cloudinary:') return null;

    return {
      apiKey: decodeURIComponent(parsed.username),
      apiSecret: decodeURIComponent(parsed.password),
      cloudName: parsed.hostname,
    };
  } catch {
    return null;
  }
};

const uploadToCloudinary = async (file, cloudinaryUrl) => {
  const creds = parseCloudinaryUrl(cloudinaryUrl);
  if (!creds) {
    throw new Error('Invalid CLOUDINARY_URL format');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `timestamp=${timestamp}${creds.apiSecret}`;
  const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

  const fileAsDataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  const body = new URLSearchParams({
    file: fileAsDataUri,
    api_key: creds.apiKey,
    timestamp: String(timestamp),
    signature,
  });

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${creds.cloudName}/auto/upload`,
    body.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data.secure_url;
};

const saveToLocalUploads = async (file) => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.originalname || '') || `.${(file.mimetype.split('/')[1] || 'bin')}`;
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  await fs.writeFile(filePath, file.buffer);

  return `/uploads/${fileName}`;
};

const uploadMedia = async (file) => {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudinaryUrl) {
    return uploadToCloudinary(file, cloudinaryUrl);
  }

  return saveToLocalUploads(file);
};

module.exports = {
  uploadMedia,
};
