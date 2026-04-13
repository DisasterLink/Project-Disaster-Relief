const express = require('express');
const {
  createRequest,
  getRequests,
  getRequest,
  updateRequestStatus,
  getNearbyRequests,
  getStats,
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/stats', authorize('admin'), getStats);
router.get('/nearby', getNearbyRequests);
router.get('/', getRequests);
router.post('/', createRequest);
router.get('/:id', getRequest);
router.patch('/:id/status', authorize('admin'), updateRequestStatus);

module.exports = router;
