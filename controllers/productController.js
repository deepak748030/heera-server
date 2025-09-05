const Product = require('../models/Product');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');


/**
 * Create new product
 * POST /api/products
 */
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      price,
      originalPrice,
      category,
      store,
      unit,
      inStock,
      stockCount,
      isOrganic,
      freshness,
      description,
      isFlashSale
    } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, category, and store are required'
      });
    }

    // Handle images (uploaded via multer)
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/products/${file.filename}`);
    }

    const product = new Product({
      name,
      price,
      originalPrice,
      images,
      category,
      store,
      unit,
      inStock,
      stockCount,
      isOrganic,
      freshness,
      description,
      isFlashSale
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    next(error);
  }
};


/**
 * Get all products with filtering and pagination
 * GET /api/products
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      isOrganic,
      isFlashSale,
      sortBy = 'createdAt',
      order = 'desc',
      limit = 10,
      page = 1,
      inStock
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        filter.category = category;
      } else {
        // Find category by name
        const categoryDoc = await Category.findOne({ name: new RegExp(category, 'i') });
        if (categoryDoc) {
          filter.category = categoryDoc._id;
        } else {
          // If category not found, return empty results
          return res.status(200).json({
            success: true,
            count: 0,
            total: 0,
            totalPages: 0,
            currentPage: pageNum,
            hasNextPage: false,
            hasPrevPage: false,
            products: []
          });
        }
      }
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (isOrganic !== undefined) {
      filter.isOrganic = isOrganic === 'true';
    }

    if (isFlashSale !== undefined) {
      filter.isFlashSale = isFlashSale === 'true';
    }

    if (inStock !== undefined) {
      filter.inStock = inStock === 'true';
    }

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sort = {};
    sort[sortBy] = sortOrder;

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(filter)
      .populate('category', 'name icon color')
      // .populate('store', 'name location verified rating')
      .select('-__v')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages,
      currentPage: pageNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      products
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single product by ID
 * GET /api/products/:id
 */
const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('category', 'name icon color description')
    // .populate('store', 'name location phone verified farmCertified rating yearsInBusiness description');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product is not available'
      });
    }

    // Increment view count
    await Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    res.status(200).json({
      success: true,
      product
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get featured products
 * GET /api/products/featured
 */
const getFeaturedProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({
      isActive: true,
      inStock: true,
      $or: [
        { isFlashSale: true },
        { rating: { $gte: 4.0 } },
        { totalSold: { $gte: 100 } }
      ]
    })
      .populate('category', 'name icon color')
      // .populate('store', 'name location verified')
      .sort({ rating: -1, totalSold: -1 })
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get flash sale products
 * GET /api/products/flash-sale
 */
const getFlashSaleProducts = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const products = await Product.find({
      isActive: true,
      inStock: true,
      isFlashSale: true
    })
      .populate('category', 'name icon color')
      // .populate('store', 'name location verified')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get products by category
 * GET /api/products/category/:categoryId
 */
const getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { limit = 20, page = 1, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortOrder = order === 'desc' ? -1 : 1;
    const sort = {};
    sort[sortBy] = sortOrder;

    const products = await Product.find({
      category: categoryId,
      isActive: true,
      inStock: true
    })
      .populate('store', 'name location verified')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments({
      category: categoryId,
      isActive: true,
      inStock: true
    });

    res.status(200).json({
      success: true,
      category: category.name,
      count: products.length,
      total,
      products
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Search products
 * GET /api/products/search
 */
const searchProducts = async (req, res, next) => {
  try {
    const { q: query, limit = 20, page = 1 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const searchRegex = new RegExp(query.trim(), 'i');

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    })
      .populate('category', 'name icon color')
      // .populate('store', 'name location verified')
      .sort({ rating: -1, totalSold: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments({
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    });

    res.status(200).json({
      success: true,
      query,
      count: products.length,
      total,
      products
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getFlashSaleProducts,
  getProductsByCategory,
  searchProducts,
  createProduct
};