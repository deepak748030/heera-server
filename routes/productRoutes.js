const express = require('express');
const {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getFlashSaleProducts,
  getProductsByCategory,
  searchProducts
} = require('../controllers/productController');

const router = express.Router();

// Public routes (no authentication required)
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/flash-sale', getFlashSaleProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProduct);
router.get('/', getProducts);

module.exports = router;