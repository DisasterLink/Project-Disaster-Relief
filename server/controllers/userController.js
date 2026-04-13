const User = require('../models/User');

// @desc    Get all volunteers
// @route   GET /api/users/volunteers
// @access  Private (admin)
const getVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({ role: 'volunteer' })
      .select('name email phone isAvailable location createdAt')
      .sort({ isAvailable: -1, createdAt: -1 });

    res.json({ success: true, count: volunteers.length, data: volunteers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Private (admin)
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle volunteer availability (admin override)
// @route   PATCH /api/users/:id/availability
// @access  Private (admin)
const setUserAvailability = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAvailable: req.body.isAvailable },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getVolunteers, getAllUsers, setUserAvailability };
