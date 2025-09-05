const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    required: [true, 'Address type is required']
  },
  name: {
    type: String,
    required: [true, 'Recipient name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be longer than 50 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\d{10}$/, 'Phone number must be 10 digits']
  },
  addressLine1: {
    type: String,
    required: [true, 'Address Line 1 is required'],
    trim: true,
    maxlength: [200, 'Address line 1 cannot be longer than 200 characters']
  },
  addressLine2: {
    type: String,
    trim: true,
    maxlength: [200, 'Address line 2 cannot be longer than 200 characters']
  },
  landmark: {
    type: String,
    trim: true,
    maxlength: [100, 'Landmark cannot be longer than 100 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City name cannot be longer than 50 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State name cannot be longer than 50 characters']
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
    match: [/^\d{6}$/, 'Pincode must be 6 digits']
  },
  isDefault: {
    type: Boolean,
    default: false
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
  }
}, { timestamps: true });

// Indexes for better performance
addressSchema.index({ userId: 1, isDefault: 1 });
addressSchema.index({ pincode: 1 });

// Ensure only one default address per user
addressSchema.pre('save', async function(next) {
  try {
    if (this.isDefault) {
      await this.constructor.updateMany(
        { userId: this.userId, _id: { $ne: this._id } },
        { $set: { isDefault: false } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to format full address
addressSchema.methods.getFullAddress = function() {
  let address = this.addressLine1;
  if (this.addressLine2) address += ', ' + this.addressLine2;
  if (this.landmark) address += ', Near ' + this.landmark;
  address += ', ' + this.city + ', ' + this.state + ' - ' + this.pincode;
  return address;
};

module.exports = mongoose.model('Address', addressSchema);