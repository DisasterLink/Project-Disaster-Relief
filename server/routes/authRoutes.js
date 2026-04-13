const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateAvailability } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['civilian', 'volunteer']).withMessage('Invalid role'),
];

router.post('/register', registerValidation, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/availability', protect, authorize('volunteer'), updateAvailability);

module.exports = router;
