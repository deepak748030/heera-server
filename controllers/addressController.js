const Address = require('../models/Address');
const { validationResult } = require('express-validator');

/**
 * Get all addresses for user
 * GET /api/addresses
 */
const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: addresses.length,
      addresses
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Add new address
 * POST /api/addresses
 */
const addAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const addressData = {
      ...req.body,
      userId: req.user.id
    };

    // If this is the user's first address, make it default
    const existingAddresses = await Address.countDocuments({ userId: req.user.id });
    if (existingAddresses === 0) {
      addressData.isDefault = true;
    }

    const address = await Address.create(addressData);

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update address
 * PUT /api/addresses/:id
 */
const updateAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    // Check if address exists and belongs to user
    const existingAddress = await Address.findOne({ _id: id, userId: req.user.id });
    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Prevent changing isDefault through this endpoint
    const updateData = { ...req.body };
    delete updateData.isDefault;

    const address = await Address.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete address
 * DELETE /api/addresses/:id
 */
const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if address exists and belongs to user
    const address = await Address.findOne({ _id: id, userId: req.user.id });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If deleting default address, make another address default
    if (address.isDefault) {
      const otherAddress = await Address.findOne({ 
        userId: req.user.id, 
        _id: { $ne: id } 
      });
      
      if (otherAddress) {
        otherAddress.isDefault = true;
        await otherAddress.save();
      }
    }

    await Address.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Set default address
 * PUT /api/addresses/:id/set-default
 */
const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if address exists and belongs to user
    const address = await Address.findOne({ _id: id, userId: req.user.id });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Remove default from all other addresses
    await Address.updateMany(
      { userId: req.user.id, _id: { $ne: id } },
      { $set: { isDefault: false } }
    );

    // Set this address as default
    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      message: 'Default address updated successfully',
      address
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get default address
 * GET /api/addresses/default
 */
const getDefaultAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ 
      userId: req.user.id, 
      isDefault: true 
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'No default address found'
      });
    }

    res.status(200).json({
      success: true,
      address
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress
};