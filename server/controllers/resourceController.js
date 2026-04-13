const Resource = require('../models/Resource');

const getResources = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};

    const resources = await Resource.find(filter)
      .populate('managedBy', 'name')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addResource = async (req, res) => {
  try {
    const resource = await Resource.create({
      ...req.body,
      managedBy: req.user._id,
    });

    return res.status(201).json({ success: true, data: resource });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    if (resource.quantity <= resource.lowStockThreshold) {
      req.io.to('staff').emit('resource_low', {
        resourceId: resource._id,
        name: resource.name,
        quantity: resource.quantity,
        unit: resource.unit,
      });
    }

    return res.json({ success: true, data: resource });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    return res.json({ success: true, message: 'Resource removed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getResources, addResource, updateResource, deleteResource };