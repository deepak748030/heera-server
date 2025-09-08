const express = require('express');
const {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getFlashSaleProducts,
  getProductsByCategory,
  searchProducts,
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct
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
router.get('/all', getAllProducts); // New route to get all products
router.get('/', getProducts);
router.put('/:id', uploadMultiple('productImages', 5), updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
