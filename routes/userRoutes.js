const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const {
  updateProfile,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  getStats,
  deactivateAccount,
  getAllUsers // Added getAllUsers
} = require('../controllers/userController');

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

// All routes are protected
router.use(authMiddleware);

// Profile routes
router.put('/profile', uploadSingle('avatar'), updateProfileValidation, updateProfile);
router.get('/stats', getStats);
router.put('/deactivate', deactivateAccount);

// Favorites routes
router.get('/favorites', getFavorites);
router.post('/favorites/:productId', addToFavorites);
router.delete('/favorites/:productId', removeFromFavorites);

// Get all users route
router.get('/', getAllUsers); // Added get all users route

module.exports = router;
