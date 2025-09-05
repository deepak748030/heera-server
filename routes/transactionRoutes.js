const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getTransactions,
  getTransaction,
  getTransactionStats,
  getRecentTransactions,
  downloadReceipt
} = require('../controllers/transactionController');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

router.get('/stats', getTransactionStats);
router.get('/recent', getRecentTransactions);
router.get('/:id/receipt', downloadReceipt);
router.get('/:id', getTransaction);
router.get('/', getTransactions);

module.exports = router;