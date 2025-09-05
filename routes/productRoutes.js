const express = require('express');
const {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getFlashSaleProducts,
  getProductsByCategory,
  searchProducts,
  createProduct
} = require('../controllers/productController');
const { uploadMultiple } = require('../middleware/uploadMiddleware');
const router = express.Router();

// Public routes (no authentication required)
router.post('/', uploadMultiple('productImages', 5), createProduct);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/flash-sale', getFlashSaleProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProduct);
router.get('/', getProducts);

module.exports = router;