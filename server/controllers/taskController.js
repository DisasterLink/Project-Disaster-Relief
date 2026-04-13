const Task = require('../models/Task');
const Request = require('../models/Request');
const User = require('../models/User');

// @desc    Create and assign a task to a volunteer
// @route   POST /api/tasks
// @access  Private (admin)
const createTask = async (req, res) => {
  try {
    const { requestId, volunteerId, notes, estimatedArrival } = req.body;

    // Atomically check and update request (prevent race conditions)
    const request = await Request.findOneAndUpdate(
      { _id: requestId, status: 'pending' },
      { status: 'assigned' },
      { new: true }
    );

    if (!request) {
      return res.status(409).json({
        success: false,
        message: 'Request is already assigned or does not exist',
      });
    }

    const task = await Task.create({
      requestId,
      volunteerId,
      notes,
      estimatedArrival,
    });

    // Link task back to request
    request.assignedTask = task._id;
    await request.save();

    const populated = await task.populate([
      { path: 'requestId' },
      { path: 'volunteerId', select: 'name phone email' },
    ]);

    // Notify volunteer
    req.io.to(`user_${volunteerId}`).emit('task_assigned', {
      taskId: task._id,
      request: { type: request.type, urgency: request.urgency, location: request.location },
    });

    // Notify the civilian who submitted the request
    req.io.to(`user_${request.submittedBy}`).emit('sos_assigned', {
      message: 'A volunteer has been assigned to your request!',
      taskId: task._id,
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all tasks (admin view)
// @route   GET /api/tasks
// @access  Private (admin)
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('requestId')
      .populate('volunteerId', 'name phone email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get volunteer's own tasks
// @route   GET /api/tasks/my-tasks
// @access  Private (volunteer)
const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ volunteerId: req.user._id })
      .populate('requestId')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private (volunteer)
const updateTaskStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      volunteerId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or not yours' });
    }

    task.status = status;
    if (notes) task.notes = notes;
    if (status === 'completed') {
      task.completedAt = new Date();

      // Update the linked request to resolved
      await Request.findByIdAndUpdate(task.requestId, { status: 'resolved' });
    } else if (status === 'en_route') {
      await Request.findByIdAndUpdate(task.requestId, { status: 'in_progress' });
    }

    await task.save();

    // Broadcast status update to all
    req.io.emit('status_updated', {
      taskId: task._id,
      requestId: task.requestId,
      status: task.status,
    });

    // Notify civilian of task completion
    if (status === 'completed') {
      const request = await Request.findById(task.requestId);
      if (request) {
        req.io.to(`user_${request.submittedBy}`).emit('sos_resolved', {
          message: 'Your request has been marked as resolved. Stay safe!',
        });
      }
    }

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createTask, getAllTasks, getMyTasks, updateTaskStatus };
