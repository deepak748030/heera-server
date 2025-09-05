const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

/**
 * Get user notifications
 * GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const {
      isRead,
      type,
      priority,
      limit = 20,
      page = 1
    } = req.query;

    const userId = req.user.id;

    // Build filter object
    const filter = {};

    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    if (type) {
      filter.type = type;
    }

    if (priority) {
      filter.priority = priority;
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const notifications = await Notification.find({ userId: new mongoose.Types.ObjectId(userId), ...filter })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    // Get total count
    const total = await Notification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), ...filter });
    const unreadCount = await Notification.countDocuments({ 
      userId: new mongoose.Types.ObjectId(userId), 
      isRead: false 
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      notifications
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/mark-as-read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/mark-all-as-read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await Notification.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Clear all notifications
 * DELETE /api/notifications/clear-all
 */
const clearAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await Notification.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} notifications cleared`
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get notification statistics
 * GET /api/notifications/stats
 */
const getNotificationStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const stats = await Notification.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: ['$isRead', 0, 1] } },
          read: { $sum: { $cond: ['$isRead', 1, 0] } }
        }
      }
    ]);

    const typeStats = await Notification.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: { $sum: { $cond: ['$isRead', 0, 1] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const priorityStats = await Notification.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const result = {
      overview: stats[0] || { total: 0, unread: 0, read: 0 },
      byType: typeStats,
      byPriority: priorityStats
    };

    res.status(200).json({
      success: true,
      stats: result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Create notification (for testing purposes)
 * POST /api/notifications
 */
const createNotification = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type, title, message, priority, data } = req.body;
    const userId = req.user.id;

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      priority: priority || 'medium',
      data: data || {}
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationStats,
  createNotification
};