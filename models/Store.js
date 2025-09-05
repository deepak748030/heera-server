const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Store name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Store name cannot be longer than 100 characters']
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  location: {
    type: String,
    required: [true, 'Store location is required'],
    trim: true,
    maxlength: [200, 'Location cannot be longer than 200 characters']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\d{10}$/, 'Phone number must be 10 digits']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  verified: {
    type: Boolean,
    default: false
  },
  farmCertified: {
    type: Boolean,
    default: false
  },
  yearsInBusiness: {
    type: Number,
    min: [0, 'Years in business cannot be negative'],
    max: [100, 'Years in business cannot be more than 100']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be longer than 500 characters']
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: {
      type: String,
      match: [/^\d{6}$/, 'Pincode must be 6 digits']
    }
  },
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalProducts: {
    type: Number,
    default: 0,
    min: [0, 'Total products cannot be negative']
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: [0, 'Total orders cannot be negative']
  }
}, { timestamps: true });

// Indexes for better performance
storeSchema.index({ isActive: 1, verified: 1 });
storeSchema.index({ rating: -1 });
storeSchema.index({ location: 1 });

module.exports = mongoose.model('Store', storeSchema);