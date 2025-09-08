const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  reorderOrder,
  rateOrder,
  getAllOrders, // New: Get all orders (admin)
  updateOrderStatus // New: Update order status (admin)
} = require('../controllers/orderController');

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must have at least one item'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('deliveryAddressId')
    .isMongoId()
    .withMessage('Invalid delivery address ID'),
  body('paymentMethod')
    .isIn(['cod', 'upi', 'card', 'wallet', 'netbanking'])
    .withMessage('Invalid payment method')
];

const rateOrderValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('review')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review cannot be longer than 500 characters')
];

const updateOrderStatusValidation = [
  body('status')
    .isIn(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'])
    .withMessage('Invalid order status')
];

// All routes are protected
router.use(authMiddleware);

// User routes
router.get('/', getOrders);
router.post('/', createOrderValidation, createOrder);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);
router.post('/:id/reorder', reorderOrder);
router.put('/:id/rate', rateOrderValidation, rateOrder);

// Admin routes
router.get('/admin/all', getAllOrders); // Admin: Get all orders
router.put('/admin/:id/status', updateOrderStatusValidation, updateOrderStatus); // Admin: Update order status

module.exports = router;
