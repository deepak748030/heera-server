const express = require('express');
const { body } = require('express-validator');
const {
  getCategories,
  getCategory,
  getPopularCategories,
  createCategory
} = require('../controllers/categoryController');

const router = express.Router();

// Public routes (no authentication required)
router.get('/popular', getPopularCategories);
router.get('/:id', getCategory);
router.get('/', getCategories);

// Admin/Authenticated routes (assuming authentication middleware would be applied here)
router.post(
  '/',
  [
    body('name')
      .notEmpty()
      .withMessage('Category name is required')
      .isLength({ max: 50 })
      .withMessage('Category name cannot be longer than 50 characters'),
    body('icon')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Icon cannot be longer than 100 characters'),
    body('color')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage('Color must be a valid hex color code'),
    body('description')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Description cannot be longer than 200 characters'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    body('sortOrder').optional().isNumeric().withMessage('sortOrder must be a number')
  ],
  createCategory
);

module.exports = router;
