const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress
} = require('../controllers/addressController');

const router = express.Router();

// Validation rules
const addressValidation = [
  body('type')
    .isIn(['home', 'work', 'other'])
    .withMessage('Address type must be home, work, or other'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .matches(/^\d{10}$/)
    .withMessage('Phone number must be exactly 10 digits'),
  body('addressLine1')
    .trim()
    .notEmpty()
    .withMessage('Address Line 1 is required'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('pincode')
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be exactly 6 digits')
];

const updateAddressValidation = [
  body('type')
    .optional()
    .isIn(['home', 'work', 'other'])
    .withMessage('Address type must be home, work, or other'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^\d{10}$/)
    .withMessage('Phone number must be exactly 10 digits'),
  body('addressLine1')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address Line 1 cannot be empty'),
  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty'),
  body('state')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('State cannot be empty'),
  body('pincode')
    .optional()
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be exactly 6 digits')
];

// All routes are protected
router.use(authMiddleware);

router.get('/', getAddresses);
router.get('/default', getDefaultAddress);
router.post('/', addressValidation, addAddress);
router.put('/:id', updateAddressValidation, updateAddress);
router.delete('/:id', deleteAddress);
router.put('/:id/set-default', setDefaultAddress);

module.exports = router;