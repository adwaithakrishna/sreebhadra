const isProd = process.env.NODE_ENV === 'production';

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required environment variable ${name}. Copy server/.env.example to server/.env and fill it in.`);
    process.exit(1);
  }
  return v;
}

const config = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  mongoUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  clientOrigins: (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
  // Package departures and date validation use the business locale. Keep this
  // aligned with the documented default when BUSINESS_TIMEZONE is not set.
  timeZone: process.env.BUSINESS_TIMEZONE || 'Asia/Kolkata',
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    publicBaseUrl: (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, ''),
    cloudinary: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    },
  },
};

if (isProd && config.jwtSecret.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters in production.');
  process.exit(1);
}

module.exports = config;
