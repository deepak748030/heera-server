const Order = require('../models/Order');
const Product = require('../models/Product');
const Address = require('../models/Address');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

/**
 * Create new order
 * POST /api/orders
 */
const createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      items,
      deliveryAddressId,
      paymentMethod,
      promoCode,
      specialInstructions
    } = req.body;

    const userId = req.user.id;

    // Validate delivery address
    const deliveryAddress = await Address.findOne({
      _id: deliveryAddressId,
      userId
    });

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery address'
      });
    }

    // Validate products and calculate totals
    let totalAmount = 0;
    const orderItems = [];
    const storeInfo = { name: 'Fresh Grocery Store', phone: '1234567890', location: 'Local Store' };

    for (const item of items) {
      const product = await Product.findById(item.productId)
      // .populate('store', 'name phone location');

      if (!product || !product.isActive || !product.inStock) {
        return res.status(400).json({
          success: false,
          message: `Product ${product?.name || 'Unknown'} is not available`
        });
      }

      if (product.stockCount < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stockCount}`
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      // Update store info if available
      if (product.store) {
        // storeInfo.name = product.store.name || storeInfo.name;
        // storeInfo.phone = product.store.phone || storeInfo.phone;
        // storeInfo.location = product.store.location || storeInfo.location;
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        image: product.images[0],
        unit: product.unit,
        variant: item.variant || ''
      });
    }

    // Calculate delivery fee and discount
    const deliveryFee = totalAmount >= 500 ? 0 : 40; // Free delivery above ₹500
    const discount = 0; // Apply promo code logic here
    const finalAmount = totalAmount + deliveryFee - discount;

    // Create order
    const order = await Order.create({
      userId,
      items: orderItems,
      totalAmount,
      deliveryFee,
      discount,
      finalAmount,
      deliveryAddress: {
        name: deliveryAddress.name,
        phone: deliveryAddress.phone,
        address: deliveryAddress.getFullAddress(),
        landmark: deliveryAddress.landmark,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        pincode: deliveryAddress.pincode
      },
      // store: storeInfo,
      paymentMethod,
      promoCode,
      specialInstructions,
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      orderTracking: [{
        status: 'Order Placed',
        time: new Date(),
        description: 'Your order has been placed successfully',
        completed: true
      }]
    });

    // Update product stock and sales
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          stockCount: -item.quantity,
          totalSold: item.quantity
        }
      });
    }

    // Update user statistics
    await User.findByIdAndUpdate(userId, {
      $inc: {
        totalOrders: 1,
        totalSpent: finalAmount
      }
    });

    // Create transaction record
    await Transaction.create({
      userId,
      type: 'payment',
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: finalAmount,
      status: paymentMethod === 'cod' ? 'pending' : 'completed',
      paymentMethod,
      description: `Payment for order ${order.orderNumber}`,
      transactionId: uuidv4(),
      merchantName: 'Fresh Grocery Store',
      customerDetails: {
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email
      },
      breakdown: {
        itemsTotal: totalAmount,
        deliveryFee,
        discount,
        finalAmount
      }
    });

    // Create notification
    await Notification.create({
      userId,
      type: 'order',
      title: 'Order Placed Successfully!',
      message: `Your order ${order.orderNumber} has been placed and will be delivered soon.`,
      data: { orderId: order._id, orderNumber: order.orderNumber }
    });

    // Populate the order before sending response
    const populatedOrder = await Order.findById(order._id)
      .populate('items.productId', 'name images category');
    // .populate('items.productId', 'name images category store');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: populatedOrder
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get user orders
 * GET /api/orders
 */
const getOrders = async (req, res, next) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const userId = req.user.id;

    const filter = { userId };

    if (status) {
      if (status === 'active') {
        filter.status = { $in: ['pending', 'confirmed', 'preparing', 'out_for_delivery'] };
      } else if (status === 'delivered') {
        filter.status = 'delivered';
      } else if (status === 'cancelled') {
        filter.status = 'cancelled';
      } else {
        filter.status = status;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      orders
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single order
 * GET /api/orders/:id
 */
const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: id, userId })
      .populate('items.productId', 'name images category');
    //  .populate('items.productId', 'name images category store');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order
 * PUT /api/orders/:id/cancel
 */
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.canCancel || order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This order cannot be cancelled'
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.canCancel = false;
    order.canReorder = true;

    // Add tracking step
    order.orderTracking.push({
      status: 'Order Cancelled',
      time: new Date(),
      description: 'Order has been cancelled by user',
      completed: true
    });

    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          stockCount: item.quantity,
          totalSold: -item.quantity
        }
      });
    }

    // Update user statistics
    await User.findByIdAndUpdate(userId, {
      $inc: {
        totalOrders: -1,
        totalSpent: -order.finalAmount
      }
    });

    // Update transaction status
    await Transaction.findOneAndUpdate(
      { orderId: order._id, userId: userId },
      { status: 'cancelled' }
    );

    // Create notification
    await Notification.create({
      userId,
      type: 'order',
      title: 'Order Cancelled',
      message: `Your order ${order.orderNumber} has been cancelled successfully.`,
      data: { orderId: order._id, orderNumber: order.orderNumber }
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Reorder
 * POST /api/orders/:id/reorder
 */
const reorderOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const originalOrder = await Order.findOne({ _id: id, userId });

    if (!originalOrder) {
      return res.status(404).json({
        success: false,
        message: 'Original order not found'
      });
    }

    if (!originalOrder.canReorder) {
      return res.status(400).json({
        success: false,
        message: 'This order cannot be reordered'
      });
    }

    // Check product availability
    const items = [];
    let totalAmount = 0;
    const unavailableProducts = [];

    for (const item of originalOrder.items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive || !product.inStock) {
        unavailableProducts.push(item.name);
        continue;
      }

      if (product.stockCount < item.quantity) {
        unavailableProducts.push(`${item.name} (insufficient stock)`);
        continue;
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      items.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        image: product.images[0],
        unit: product.unit,
        variant: item.variant || ''
      });
    }

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No products from the original order are currently available',
        unavailableProducts
      });
    }

    const deliveryFee = totalAmount >= 500 ? 0 : 40;
    const finalAmount = totalAmount + deliveryFee;

    // Create new order
    const newOrder = await Order.create({
      userId,
      items,
      totalAmount,
      deliveryFee,
      discount: 0,
      finalAmount,
      deliveryAddress: originalOrder.deliveryAddress,
      // store: originalOrder.store,
      paymentMethod: originalOrder.paymentMethod,
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000),
      orderTracking: [{
        status: 'Order Placed',
        time: new Date(),
        description: 'Reorder placed successfully',
        completed: true
      }]
    });

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          stockCount: -item.quantity,
          totalSold: item.quantity
        }
      });
    }

    // Update user statistics
    await User.findByIdAndUpdate(userId, {
      $inc: {
        totalOrders: 1,
        totalSpent: finalAmount
      }
    });

    // Create transaction
    await Transaction.create({
      userId,
      type: 'payment',
      orderId: newOrder._id,
      orderNumber: newOrder.orderNumber,
      amount: finalAmount,
      status: originalOrder.paymentMethod === 'cod' ? 'pending' : 'completed',
      paymentMethod: originalOrder.paymentMethod,
      description: `Payment for reorder ${newOrder.orderNumber}`,
      transactionId: uuidv4(),
      merchantName: 'Fresh Grocery Store',
      customerDetails: {
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email
      },
      breakdown: {
        itemsTotal: totalAmount,
        deliveryFee,
        discount: 0,
        finalAmount
      }
    });

    // Create notification
    await Notification.create({
      userId,
      type: 'order',
      title: 'Reorder Placed Successfully!',
      message: `Your reorder ${newOrder.orderNumber} has been placed and will be delivered soon.`,
      data: { orderId: newOrder._id, orderNumber: newOrder.orderNumber }
    });

    res.status(201).json({
      success: true,
      message: 'Reorder placed successfully',
      order: newOrder
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Rate order
 * PUT /api/orders/:id/rate
 */
const rateOrder = async (req, res, next) => {
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
    const { rating, review } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.canRate || order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'This order cannot be rated'
      });
    }

    if (order.rating) {
      return res.status(400).json({
        success: false,
        message: 'Order has already been rated'
      });
    }

    order.rating = rating;
    order.review = review;
    order.canRate = false;

    await order.save();

    // Create notification for rating
    await Notification.create({
      userId,
      type: 'rating',
      title: 'Thank you for your rating!',
      message: `You rated order ${order.orderNumber} with ${rating} stars.`,
      data: { orderId: order._id, orderNumber: order.orderNumber, rating }
    });

    res.status(200).json({
      success: true,
      message: 'Order rated successfully',
      order
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  cancelOrder,
  reorderOrder,
  rateOrder
};