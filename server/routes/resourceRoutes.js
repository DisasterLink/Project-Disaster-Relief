const express = require('express');
const {
  getResources,
  addResource,
  updateResource,
  deleteResource,
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getResources);
router.post('/', authorize('admin'), addResource);
router.patch('/:id', authorize('admin'), updateResource);
router.delete('/:id', authorize('admin'), deleteResource);

module.exports = router;
