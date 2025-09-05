require('dotenv').config();

module.exports = {
  // Database Configuration
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/grocery-app',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Rate Limiting Configuration
  MAX_REQUESTS_PER_WINDOW: parseInt(process.env.MAX_REQUESTS_PER_WINDOW) || 100,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  
  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: process.env.ALLOWED_IMAGE_TYPES?.split(',') || [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ],
  
  // Security Configuration
  BCRYPT_ROUNDS: 12,
  
  // Pagination Configuration
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};