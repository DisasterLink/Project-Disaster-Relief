const Resource = require('../models/Resource');

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
const getResources = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};

    const resources = await Resource.find(filter)
      .populate('managedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a new resource
// @route   POST /api/resources
// @access  Private (admin)
const addResource = async (req, res) => {
  try {
    const resource = await Resource.create({
      ...req.body,
      managedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update resource (quantity, allocation, etc.)
// @route   PATCH /api/resources/:id
// @access  Private (admin)
const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Low stock alert
    if (resource.quantity <= resource.lowStockThreshold) {
      req.io.to('staff').emit('resource_low', {
        resourceId: resource._id,
        name: resource.name,
        quantity: resource.quantity,
        unit: resource.unit,
      });
    }

    res.json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a resource
// @route   DELETE /api/resources/:id
// @access  Private (admin)
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    res.json({ success: true, message: 'Resource removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getResources, addResource, updateResource, deleteResource };
