const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  reorderOrder,
  rateOrder
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

// All routes are protected
router.use(authMiddleware);

router.get('/', getOrders);
router.post('/', createOrderValidation, createOrder);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);
router.post('/:id/reorder', reorderOrder);
router.put('/:id/rate', rateOrderValidation, rateOrder);

module.exports = router;