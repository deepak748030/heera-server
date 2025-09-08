const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot be longer than 50 characters']
  },
  icon: {
    type: String,
    trim: true,
    maxlength: [100, 'Icon cannot be longer than 100 characters']
  },
  color: {
    type: String,
    trim: true,
    default: '#FFFFFF',
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be longer than 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Indexes for better performance
categorySchema.index({ isActive: 1, sortOrder: 1 });
categorySchema.index({ name: 1 });

module.exports = mongoose.model('Category', categorySchema);
