const Request = require('../models/Request');
const Task = require('../models/Task');

// @desc    Create SOS request
// @route   POST /api/requests
// @access  Private (civilian)
const createRequest = async (req, res) => {
  try {
    const { type, urgency, description, location, numberOfPeople } = req.body;

    const newRequest = await Request.create({
      submittedBy: req.user._id,
      type,
      urgency: urgency || 'medium',
      description,
      location: {
        type: 'Point',
        coordinates: [parseFloat(location.lng), parseFloat(location.lat)],
        address: location.address || '',
      },
      numberOfPeople: numberOfPeople || 1,
    });

    // Populate submittedBy for broadcasting
    const populated = await newRequest.populate('submittedBy', 'name phone');

    // Broadcast new SOS to all volunteers and admins via Socket.IO
    req.io.to('staff').emit('new_request', {
      requestId: populated._id,
      type: populated.type,
      urgency: populated.urgency,
      description: populated.description,
      location: populated.location,
      submittedBy: populated.submittedBy,
      numberOfPeople: populated.numberOfPeople,
      status: populated.status,
      priorityScore: populated.priorityScore,
      createdAt: populated.createdAt,
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all requests (with filters)
// @route   GET /api/requests
// @access  Private
const getRequests = async (req, res) => {
  try {
    const { status, type, urgency, limit = 50 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (urgency) filter.urgency = urgency;

    // Civilians only see their own requests
    if (req.user.role === 'civilian') {
      filter.submittedBy = req.user._id;
    }

    const requests = await Request.find(filter)
      .populate('submittedBy', 'name phone')
      .populate('assignedTask')
      .sort({ priorityScore: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single request
// @route   GET /api/requests/:id
// @access  Private
const getRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('submittedBy', 'name phone email')
      .populate({ path: 'assignedTask', populate: { path: 'volunteerId', select: 'name phone' } });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update request status
// @route   PATCH /api/requests/:id/status
// @access  Private (admin)
const updateRequestStatus = async (req, res) => {
  try {
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Notify relevant parties via Socket.IO
    req.io.emit('request_status_updated', {
      requestId: request._id,
      status: request.status,
    });

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get nearby requests (geospatial)
// @route   GET /api/requests/nearby?lng=XX&lat=YY&radius=5000
// @access  Private
const getNearbyRequests = async (req, res) => {
  try {
    const { lng, lat, radius = 10000 } = req.query; // radius in meters

    const requests = await Request.find({
      status: { $in: ['pending', 'assigned'] },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      },
    }).populate('submittedBy', 'name phone');

    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin stats
// @route   GET /api/requests/stats
// @access  Private (admin)
const getStats = async (req, res) => {
  try {
    const stats = await Request.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const byType = await Request.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const totalToday = await Request.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    res.json({ success: true, data: { byStatus: stats, byType, totalToday } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequest,
  updateRequestStatus,
  getNearbyRequests,
  getStats,
};
