const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateAvailability,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'volunteer']).withMessage('Invalid role'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.patch('/availability', protect, authorize('volunteer'), updateAvailability);

module.exports = router;