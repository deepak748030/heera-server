const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    enum: ['payment', 'refund', 'cashback', 'fee'],
    required: [true, 'Transaction type is required'],
    index: true
  },
  orderId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order'
  },
  orderNumber: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'card', 'cod', 'wallet', 'netbanking'],
    required: [true, 'Payment method is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be longer than 200 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  merchantName: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    trim: true
  },
  upiTransactionId: {
    type: String,
    trim: true
  },
  fees: {
    type: Number,
    default: 0,
    min: [0, 'Fees cannot be negative']
  },
  taxes: {
    type: Number,
    default: 0,
    min: [0, 'Taxes cannot be negative']
  },
  customerDetails: {
    name: String,
    phone: String,
    email: String
  },
  merchantDetails: {
    name: String,
    merchantId: String,
    phone: String,
    address: String
  },
  paymentDetails: {
    gateway: String,
    gatewayTransactionId: String,
    bankReference: String,
    paymentMode: String,
    upiId: String,
    cardLast4: String,
    cardType: String
  },
  breakdown: {
    itemsTotal: {
      type: Number,
      min: [0, 'Items total cannot be negative']
    },
    deliveryFee: {
      type: Number,
      min: [0, 'Delivery fee cannot be negative']
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative']
    },
    taxes: {
      type: Number,
      min: [0, 'Taxes cannot be negative']
    },
    processingFee: {
      type: Number,
      min: [0, 'Processing fee cannot be negative']
    },
    finalAmount: {
      type: Number,
      min: [0, 'Final amount cannot be negative']
    }
  },
  failureReason: {
    type: String,
    trim: true
  },
  refundAmount: {
    type: Number,
    min: [0, 'Refund amount cannot be negative']
  },
  refundDate: {
    type: Date
  }
}, { timestamps: true });

// Indexes for better performance
transactionSchema.index({ userId: 1, timestamp: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ orderId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);