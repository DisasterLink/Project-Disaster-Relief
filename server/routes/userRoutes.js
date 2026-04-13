const express = require('express');
const {
  getVolunteers,
  getAllUsers,
  setUserAvailability,
  promoteToAdmin,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllUsers);
router.get('/volunteers', getVolunteers);
router.patch('/:id/promote', promoteToAdmin);
router.patch('/:id/availability', setUserAvailability);

module.exports = router;