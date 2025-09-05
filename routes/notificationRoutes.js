const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationStats,
  createNotification
} = require('../controllers/notificationController');

const router = express.Router();

// Validation rules
const createNotificationValidation = [
  body('type')
    .isIn(['order', 'delivery', 'promotion', 'rating', 'wishlist', 'cart', 'system', 'warning', 'success'])
    .withMessage('Invalid notification type'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level')
];

// All routes are protected
router.use(authMiddleware);

router.get('/stats', getNotificationStats);
router.put('/mark-all-as-read', markAllAsRead);
router.delete('/clear-all', clearAllNotifications);
router.post('/', createNotificationValidation, createNotification);
router.put('/:id/mark-as-read', markAsRead);
router.delete('/:id', deleteNotification);
router.get('/', getNotifications);

module.exports = router;