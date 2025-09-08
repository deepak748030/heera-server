const Category = require('../models/Category');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

/**
 * Get all categories
 * GET /api/categories
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('-__v');

    // Get product count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({
          category: category._id,
          isActive: true,
          inStock: true
        });

        return {
          ...category.toObject(),
          productCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCounts.length,
      categories: categoriesWithCounts
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single category by ID
 * GET /api/categories/:id
 */
const getCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (!category.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Category is not available'
      });
    }

    // Get product count for this category
    const productCount = await Product.countDocuments({
      category: category._id,
      isActive: true,
      inStock: true
    });

    const categoryWithCount = {
      ...category.toObject(),
      productCount
    };

    res.status(200).json({
      success: true,
      category: categoryWithCount
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get popular categories (based on product count and sales)
 * GET /api/categories/popular
 */
const getPopularCategories = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    // Aggregate to get categories with product count and total sales
    const popularCategories = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products'
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' },
          totalSales: { $sum: '$products.totalSold' }
        }
      },
      {
        $match: { productCount: { $gt: 0 } }
      },
      {
        $sort: { totalSales: -1, productCount: -1 }
      },
      {
        $limit: parseInt(limit, 10)
      },
      {
        $project: {
          name: 1,
          icon: 1,
          color: 1,
          description: 1,
          productCount: 1,
          totalSales: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: popularCategories.length,
      categories: popularCategories
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category
 * POST /api/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, color, description, isActive, sortOrder } = req.body;
    let icon = null;
    if (req.file) {
      icon = `${req.protocol}://${req.get('host')}/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.create({
      name,
      icon: icon,
      color,
      description,
      isActive,
      sortOrder
    });

    res.status(201).json({
      success: true,
      category
    });

  } catch (error) {
    // Handle duplicate key error (e.g., category name already exists)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists.'
      });
    }
    next(error);
  }
};

/**
 * Update a category
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color, description, isActive, sortOrder } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    let icon = category.icon; // Default to existing icon
    if (req.file) {
      icon = `${req.protocol}://${req.get('host')}/uploads/categories/${req.file.filename}`;
    }

    category.name = name || category.name;
    category.icon = icon;
    category.color = color || category.color;
    category.description = description || category.description;
    category.isActive = isActive !== undefined ? isActive : category.isActive;
    category.sortOrder = sortOrder !== undefined ? sortOrder : category.sortOrder;

    await category.save();

    res.status(200).json({
      success: true,
      category
    });

  } catch (error) {
    // Handle duplicate key error (e.g., category name already exists)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists.'
      });
    }
    next(error);
  }
};

/**
 * Delete a category
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategory,
  getPopularCategories,
  createCategory,
  updateCategory,
  deleteCategory // Added deleteCategory
};
