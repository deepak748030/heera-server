const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiration time
 * @returns {string} - JWT token
 */
const generateToken = (payload, expiresIn = config.JWT_EXPIRES_IN) => {
  try {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn,
      issuer: 'grocery-app',
      audience: 'grocery-users'
    });
  } catch (error) {
    throw new Error('Error generating token');
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: 'grocery-app',
      audience: 'grocery-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: '7d', // Refresh token expires in 7 days
      issuer: 'grocery-app',
      audience: 'grocery-refresh'
    });
  } catch (error) {
    throw new Error('Error generating refresh token');
  }
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} - Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: 'grocery-app',
      audience: 'grocery-refresh'
    });
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object} - Decoded token
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    throw new Error('Error decoding token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
  decodeToken
};