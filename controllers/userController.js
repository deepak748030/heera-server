const User = require('../models/User');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const { getFileUrl, deleteFile } = require('../middleware/uploadMiddleware');
const path = require('path');

/**
 * Update user profile
 * PUT /api/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email } = req.body;
    const userId = req.user.id;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered'
        });
      }
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Handle avatar upload
    if (req.file) {
      // Delete old avatar if it's not the default one
      const user = await User.findById(userId);
      if (user.avatar && !user.avatar.includes('pexels.com')) {
        const avatarPath = user.avatar.split('/uploads/')[1];
        if (avatarPath) {
          const oldAvatarPath = path.join(__dirname, '../uploads', avatarPath);
          deleteFile(oldAvatarPath);
        }
      }

      const relativePath = path.relative(path.join(__dirname, '../uploads'), req.file.path);
      updateData.avatar = getFileUrl(req, relativePath);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Add product to favorites
 * POST /api/users/favorites/:productId
 */
const addToFavorites = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }

    // Check if already in favorites
    const user = await User.findById(userId);
    if (user.favorites.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in favorites'
      });
    }

    // Add to favorites
    user.favorites.push(productId);
    await user.save();

    const updatedUser = await User.findById(userId)
      .populate('favorites', 'name price images rating')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Product added to favorites',
      favorites: updatedUser.favorites
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Remove product from favorites
 * DELETE /api/users/favorites/:productId
 */
const removeFromFavorites = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    
    if (!user.favorites.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product not in favorites'
      });
    }

    // Remove from favorites
    user.favorites = user.favorites.filter(id => id.toString() !== productId);
    await user.save();

    const updatedUser = await User.findById(userId)
      .populate('favorites', 'name price images rating')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Product removed from favorites',
      favorites: updatedUser.favorites
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get user favorites
 * GET /api/users/favorites
 */
const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'favorites',
        select: 'name price originalPrice images category rating reviews isFlashSale store unit inStock freshness',
        populate: [
          { path: 'category', select: 'name icon color' },
          { path: 'store', select: 'name location verified' }
        ]
      })
      .select('favorites');

    res.status(200).json({
      success: true,
      favorites: user.favorites
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile statistics
 * GET /api/users/stats
 */
const getStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('totalOrders totalSpent favorites');

    const stats = {
      totalOrders: user.totalOrders,
      totalSpent: user.totalSpent,
      favoriteProducts: user.favorites.length,
      memberSince: user.createdAt
    };

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate user account
 * PUT /api/users/deactivate
 */
const deactivateAccount = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully',
      user
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  getStats,
  deactivateAccount
};