const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

/**
 * Get user transactions
 * GET /api/transactions
 */
const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      status,
      paymentMethod,
      limit = 10,
      page = 1,
      sortBy = 'timestamp',
      order = 'desc'
    } = req.query;

    const userId = req.user.id;

    // Build filter object
    const filter = {};

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sort = {};
    sort[sortBy] = sortOrder;

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const transactions = await Transaction.find({ userId: new mongoose.Types.ObjectId(userId), ...filter })
      .populate('orderId', 'orderNumber status items')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    // Get total count
    const total = await Transaction.countDocuments({ userId: new mongoose.Types.ObjectId(userId), ...filter });
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      totalPages,
      currentPage: pageNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      transactions
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single transaction
 * GET /api/transactions/:id
 */
const getTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({ 
      _id: new mongoose.Types.ObjectId(id), 
      userId: new mongoose.Types.ObjectId(userId) 
    })
      .populate('orderId', 'orderNumber status items deliveryAddress')
      .select('-__v');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      transaction
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction statistics
 * GET /api/transactions/stats
 */
const getTransactionStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get transaction statistics
    const stats = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          completedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          completedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
          },
          pendingTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          failedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get transaction by payment method
    const paymentMethodStats = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get monthly transaction data (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: 'completed',
          timestamp: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const result = {
      overview: stats[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        completedTransactions: 0,
        completedAmount: 0,
        pendingTransactions: 0,
        failedTransactions: 0
      },
      paymentMethods: paymentMethodStats,
      monthlyData: monthlyStats
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
 * Get recent transactions
 * GET /api/transactions/recent
 */
const getRecentTransactions = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const userId = req.user.id;

    const transactions = await Transaction.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate('orderId', 'orderNumber status')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10))
      .select('type amount status paymentMethod timestamp merchantName orderNumber');

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Download transaction receipt
 * GET /api/transactions/:id/receipt
 */
const downloadReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({ 
      _id: new mongoose.Types.ObjectId(id), 
      userId: new mongoose.Types.ObjectId(userId) 
    })
      .populate('orderId', 'orderNumber items deliveryAddress')
      .select('-__v');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Receipt is only available for completed transactions'
      });
    }

    // In a real application, you would generate a PDF receipt here
    // For now, we'll return the transaction data formatted as a receipt
    const receipt = {
      receiptNumber: `RCP-${transaction.transactionId}`,
      transactionDate: transaction.timestamp,
      orderNumber: transaction.orderNumber,
      paymentMethod: transaction.paymentMethod,
      amount: transaction.amount,
      status: transaction.status,
      customerDetails: transaction.customerDetails,
      breakdown: transaction.breakdown,
      merchant: {
        name: transaction.merchantName || 'Fresh Grocery Store',
        address: 'Local Store Address',
        phone: '1234567890'
      }
    };

    res.status(200).json({
      success: true,
      receipt
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  getTransactionStats,
  getRecentTransactions,
  downloadReceipt
};