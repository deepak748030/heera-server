const bcrypt = require('bcryptjs');
const config = require('../config');

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(config.BCRYPT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Error hashing password');
  }
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} - True if passwords match
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result
 */
const validatePassword = (password) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!password) {
    result.isValid = false;
    result.errors.push('Password is required');
    return result;
  }

  if (password.length < 6) {
    result.isValid = false;
    result.errors.push('Password must be at least 6 characters long');
  }

  if (password.length > 128) {
    result.isValid = false;
    result.errors.push('Password cannot be longer than 128 characters');
  }

  // Check for at least one letter and one number
  // Optional: Enable this for stronger password requirements
  // if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
  //   result.isValid = false;
  //   result.errors.push('Password must contain at least one letter and one number');
  // }

  return result;
};

/**
 * Generate a random password
 * @param {number} length - Password length (default: 12)
 * @returns {string} - Generated password
 */
const generatePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePassword,
  generatePassword
};