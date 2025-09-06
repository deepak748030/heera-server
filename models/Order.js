const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String
  },
  unit: {
    type: String
  },
  variant: {
    type: String
  }
}, { _id: false });

const orderTrackingStepSchema = new mongoose.Schema({
  status: {
    type: String,
    required: [true, 'Status is required'],
    trim: true
  },
  time: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  orderNumber: {
    type: String,
    // required: [true, 'Order number is required'],
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  items: {
    type: [orderItemSchema],
    validate: {
      validator: function (items) {
        return items && items.length > 0;
      },
      message: 'Order must have at least one item'
    }
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: [0, 'Delivery fee cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  finalAmount: {
    type: Number,
    required: [true, 'Final amount is required'],
    min: [0, 'Final amount cannot be negative']
  },
  deliveryAddress: {
    name: {
      type: String,
      required: [true, 'Delivery address name is required']
    },
    phone: {
      type: String,
      required: [true, 'Delivery address phone is required']
    },
    address: {
      type: String,
      required: [true, 'Delivery address is required']
    },
    landmark: String,
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required']
    }
  },
  estimatedDelivery: {
    type: Date
  },
  actualDelivery: {
    type: Date
  },
  // store: {
  //   name: String,
  //   phone: String,
  //   location: String,
  // },
  paymentMethod: {
    type: String,
    enum: ['cod', 'upi', 'card', 'wallet', 'netbanking'],
    required: [true, 'Payment method is required']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  orderTracking: [orderTrackingStepSchema],
  canCancel: {
    type: Boolean,
    default: true
  },
  canReorder: {
    type: Boolean,
    default: false
  },
  canRate: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5']
  },
  review: {
    type: String,
    trim: true,
    maxlength: [500, 'Review cannot be longer than 500 characters']
  },
  promoCode: {
    type: String,
    trim: true
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [200, 'Special instructions cannot be longer than 200 characters']
  }
}, { timestamps: true });

// Indexes for better performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      // Use a more robust order number generation
      const count = await this.constructor.countDocuments({});
      this.orderNumber = `HRA${String(count + 1).padStart(6, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Calculate final amount before saving
orderSchema.pre('save', function (next) {
  if (this.isModified('totalAmount') || this.isModified('deliveryFee') || this.isModified('discount') || this.isNew) {
    this.finalAmount = this.totalAmount + this.deliveryFee - this.discount;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);