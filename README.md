# Fresh Grocery Store - Backend API

Enterprise-grade Node.js Express backend for a grocery delivery application with MongoDB/Mongoose, featuring user authentication, product management, order processing, address management, transaction history, and image upload functionality.

## 🚀 Features

### Core Features
- **User Authentication**: JWT-based authentication with secure password hashing
- **User Management**: Profile management, favorites, statistics tracking
- **Address Management**: Multiple addresses per user with default selection
- **Product Catalog**: Advanced filtering, search, categorization
- **Order Processing**: Complete order lifecycle management
- **Transaction Tracking**: Comprehensive financial transaction records
- **Notification System**: Real-time notifications for users
- **Image Upload**: Multer-based file upload with validation
- **Security**: Rate limiting, CORS, Helmet security headers
- **Error Handling**: Comprehensive error handling and validation

### Technical Features
- **Enterprise Architecture**: Clean, modular code structure
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Express-validator for input validation
- **File Upload**: Multer for image processing and storage
- **Documentation**: Comprehensive API documentation
- **Environment Configuration**: Flexible configuration management
- **Logging**: Morgan logging for development and production
- **Security**: Production-ready security implementations

## 📁 Project Structure

```
backend/
├── config/
│   ├── db.js                 # Database connection
│   └── index.js              # Centralized configuration
├── models/
│   ├── User.js               # User schema
│   ├── Address.js            # User addresses schema
│   ├── Product.js            # Product schema
│   ├── Category.js           # Product category schema
│   ├── Store.js              # Store/Merchant schema
│   ├── Order.js              # Order schema
│   ├── Transaction.js        # Transaction schema
│   └── Notification.js       # Notification schema
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User profile logic
│   ├── addressController.js  # Address management
│   ├── productController.js  # Product operations
│   ├── categoryController.js # Category operations
│   ├── orderController.js    # Order processing
│   ├── transactionController.js # Transaction management
│   └── notificationController.js # Notification handling
├── routes/
│   ├── authRoutes.js         # Authentication routes
│   ├── userRoutes.js         # User profile routes
│   ├── addressRoutes.js      # Address routes
│   ├── productRoutes.js      # Product routes
│   ├── categoryRoutes.js     # Category routes
│   ├── orderRoutes.js        # Order routes
│   ├── transactionRoutes.js  # Transaction routes
│   └── notificationRoutes.js # Notification routes
├── middleware/
│   ├── authMiddleware.js     # JWT authentication
│   ├── errorHandler.js       # Global error handling
│   └── uploadMiddleware.js   # File upload handling
├── utils/
│   ├── passwordUtils.js      # Password utilities
│   └── jwtUtils.js           # JWT utilities
├── uploads/                  # File upload directory
│   ├── avatars/             # User avatars
│   ├── products/            # Product images
│   ├── categories/          # Category images
│   ├── stores/              # Store images
│   └── others/              # Other uploads
├── server.js                # Main application entry point
├── package.json
├── .env                     # Environment variables
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn package manager

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd grocery-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/grocery-app
   # or use MongoDB Atlas:
   # MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/grocery-app

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=30d

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Rate Limiting
   MAX_REQUESTS_PER_WINDOW=100
   RATE_LIMIT_WINDOW_MS=900000

   # File Upload Configuration
   MAX_FILE_SIZE=5242880
   ALLOWED_IMAGE_TYPES=image/jpeg,image/jpg,image/png,image/gif,image/webp
   ```

4. **Start the server:**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

5. **Verify installation:**
   Open `http://localhost:5000/health` in your browser or API client.

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user account.
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apt 4B",
  "landmark": "Near Central Park",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "addressType": "home"
}
```

#### POST /api/auth/login
Authenticate existing user.
```json
{
  "phone": "9876543210",
  "password": "password123"
}
```

#### GET /api/auth/me
Get current user profile (Protected).

#### PUT /api/auth/change-password
Change user password (Protected).
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword123"
}
```

### User Management Endpoints

#### PUT /api/users/profile
Update user profile (Protected).
- Supports multipart/form-data for avatar upload
- Field name for avatar: `avatar`

#### GET /api/users/favorites
Get user's favorite products (Protected).

#### POST /api/users/favorites/:productId
Add product to favorites (Protected).

#### DELETE /api/users/favorites/:productId
Remove product from favorites (Protected).

### Address Endpoints

#### GET /api/addresses
Get all user addresses (Protected).

#### POST /api/addresses
Add new address (Protected).
```json
{
  "type": "home",
  "name": "John Doe",
  "phone": "9876543210",
  "addressLine1": "123 Main Street",
  "addressLine2": "Apt 4B",
  "landmark": "Near Park",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "isDefault": true
}
```

#### PUT /api/addresses/:id
Update address (Protected).

#### DELETE /api/addresses/:id
Delete address (Protected).

#### PUT /api/addresses/:id/set-default
Set address as default (Protected).

### Product Endpoints

#### GET /api/products
Get products with filtering and pagination.
Query parameters:
- `category`: Filter by category
- `search`: Search in name/description
- `minPrice`, `maxPrice`: Price range
- `isOrganic`: Filter organic products
- `isFlashSale`: Filter flash sale products
- `sortBy`: Sort field (name, price, rating)
- `order`: Sort order (asc, desc)
- `limit`, `page`: Pagination

#### GET /api/products/:id
Get single product details.

#### GET /api/products/featured
Get featured products.

#### GET /api/products/flash-sale
Get flash sale products.

#### GET /api/products/search
Search products.
Query parameters:
- `q`: Search query

### Category Endpoints

#### GET /api/categories
Get all categories.

#### GET /api/categories/:id
Get single category.

#### GET /api/categories/popular
Get popular categories.

### Order Endpoints

#### POST /api/orders
Create new order (Protected).
```json
{
  "items": [
    {
      "productId": "product_id_here",
      "quantity": 2,
      "price": 100,
      "name": "Product Name",
      "image": "image_url",
      "unit": "per kg"
    }
  ],
  "deliveryAddressId": "address_id_here",
  "paymentMethod": "cod",
  "specialInstructions": "Handle with care"
}
```

#### GET /api/orders
Get user orders (Protected).
Query parameters:
- `status`: Filter by status (active, delivered, cancelled)
- `limit`, `page`: Pagination

#### GET /api/orders/:id
Get single order (Protected).

#### PUT /api/orders/:id/cancel
Cancel order (Protected).

#### POST /api/orders/:id/reorder
Reorder previous order (Protected).

#### PUT /api/orders/:id/rate
Rate completed order (Protected).
```json
{
  "rating": 5,
  "review": "Excellent service!"
}
```

### Transaction Endpoints

#### GET /api/transactions
Get user transactions (Protected).
Query parameters:
- `type`: Filter by type (payment, refund, cashback)
- `status`: Filter by status (completed, pending, failed)
- `limit`, `page`: Pagination

#### GET /api/transactions/:id
Get single transaction (Protected).

#### GET /api/transactions/stats
Get transaction statistics (Protected).

#### GET /api/transactions/recent
Get recent transactions (Protected).

### Notification Endpoints

#### GET /api/notifications
Get user notifications (Protected).
Query parameters:
- `isRead`: Filter by read status
- `type`: Filter by type
- `priority`: Filter by priority

#### PUT /api/notifications/:id/mark-as-read
Mark notification as read (Protected).

#### PUT /api/notifications/mark-all-as-read
Mark all notifications as read (Protected).

#### DELETE /api/notifications/:id
Delete notification (Protected).

#### DELETE /api/notifications/clear-all
Clear all notifications (Protected).

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/grocery-app` |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `30d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `MAX_REQUESTS_PER_WINDOW` | Rate limit max requests | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `MAX_FILE_SIZE` | Max upload file size | `5242880` (5MB) |
| `ALLOWED_IMAGE_TYPES` | Allowed image MIME types | `image/jpeg,image/jpg,image/png,image/gif,image/webp` |

### File Upload Configuration

The application supports image uploads for:
- User avatars (`/api/users/profile`)
- Product images
- Category icons
- Store images

Files are stored in the `uploads/` directory with organized subdirectories:
- `uploads/avatars/` - User profile pictures
- `uploads/products/` - Product images
- `uploads/categories/` - Category icons
- `uploads/stores/` - Store images
- `uploads/others/` - Miscellaneous files

### Security Features

1. **Rate Limiting**: Prevents abuse with configurable limits
2. **CORS**: Cross-origin resource sharing configuration
3. **Helmet**: Security headers for protection
4. **JWT Authentication**: Secure token-based authentication
5. **Password Hashing**: Bcrypt with salt for secure password storage
6. **Input Validation**: Express-validator for request validation
7. **File Upload Validation**: MIME type and size restrictions

## 🗄️ Database Models

### User Model
- Authentication and profile information
- Favorites tracking
- Order statistics
- KYC and seller status

### Address Model
- Multiple addresses per user
- Default address management
- Validation for Indian addresses

### Product Model
- Comprehensive product information
- Category and store relationships
- Inventory management
- Pricing and discounts

### Order Model
- Complete order lifecycle
- Embedded order items
- Tracking information
- Payment integration

### Transaction Model
- Financial transaction records
- Payment method tracking
- Detailed breakdowns

### Notification Model
- User notifications
- Type and priority classification
- Read status tracking

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**: Set production values
2. **Database**: Use MongoDB Atlas or production MongoDB
3. **Security**: Update CORS origins for production domains
4. **Logging**: Configure production logging
5. **File Upload**: Configure cloud storage (AWS S3, etc.)
6. **SSL**: Enable HTTPS
7. **Process Manager**: Use PM2 or similar for production
8. **Monitoring**: Set up error tracking and monitoring

### Production Start

```bash
# Install production dependencies
npm ci --only=production

# Start with PM2
npm install -g pm2
pm2 start server.js --name grocery-api

# Or start directly
NODE_ENV=production npm start
```

## 🛡️ Error Handling

The application includes comprehensive error handling:

- **Mongoose Errors**: Validation and cast errors
- **JWT Errors**: Token expiration and validation
- **Multer Errors**: File upload errors
- **Custom Errors**: Application-specific errors
- **Global Handler**: Centralized error response formatting

## 📝 Logging

Logging is configured based on environment:
- **Development**: Detailed console logs with Morgan
- **Production**: Combined logs for monitoring

## 🧪 Testing

To run tests (when implemented):
```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

---

**Fresh Grocery Store Backend API v1.0.0**
Enterprise-grade Node.js Express backend with MongoDB, featuring complete grocery delivery functionality.#   h e e r a - s e r v e r  
 