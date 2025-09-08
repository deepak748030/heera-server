const express = require('express');
const { body } = require('express-validator');
const {
  getCategories,
  getCategory,
  getPopularCategories,
  createCategory,
  updateCategory,
  deleteCategory // Added deleteCategory
} = require('../controllers/categoryController');
const { uploadSingle } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public routes (no authentication required)
router.get('/popular', getPopularCategories);
router.get('/:id', getCategory);
router.get('/', getCategories);

// Admin/Authenticated routes (assuming authentication middleware would be applied here)
router.post(
  '/',
  uploadSingle('categoryImg'), createCategory
);

router.put(
  '/:id',
  uploadSingle('categoryImg'), updateCategory
);

router.delete('/:id', deleteCategory); // Added delete route

module.exports = router;
