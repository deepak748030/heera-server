const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot be longer than 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  images: [{
    type: String,
    required: [true, 'At least one image is required']
  }],
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  reviews: {
    type: Number,
    default: 0,
    min: [0, 'Reviews count cannot be negative']
  },
  isFlashSale: {
    type: Boolean,
    default: false,
    index: true
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    // required: [true, 'Store is required'],
    // index: true,
    default: null
  },
  unit: {
    type: String,
    trim: true,
    maxlength: [20, 'Unit cannot be longer than 20 characters']
  },
  inStock: {
    type: Boolean,
    default: true,
    index: true
  },
  stockCount: {
    type: Number,
    min: [0, 'Stock count cannot be negative'],
    default: 0
  },
  isOrganic: {
    type: Boolean,
    default: false,
    index: true
  },
  freshness: {
    type: String,
    trim: true,
    maxlength: [100, 'Freshness cannot be longer than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be longer than 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  totalSold: {
    type: Number,
    default: 0,
    min: [0, 'Total sold cannot be negative']
  },
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  }
}, { timestamps: true });

// Indexes for better performance
productSchema.index({ category: 1, inStock: 1, isActive: 1 });
productSchema.index({ store: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ isFlashSale: 1, isActive: 1 });
productSchema.index({ isOrganic: 1, isActive: 1 });
productSchema.index({ name: 1 });
productSchema.index({ createdAt: -1 });

// Calculate discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);