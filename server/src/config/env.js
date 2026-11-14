const path = require('path');
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET_KEY || 'jwt-super-secret-key-smart-clinic-os-2026-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  storageDir: process.env.STORAGE_DIR || path.join(__dirname, '../../../storage'),
};

