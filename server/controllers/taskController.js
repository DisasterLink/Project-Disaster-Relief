const Task = require('../models/Task');
const Request = require('../models/Request');

const createTask = async (req, res) => {
  try {
    const { requestId, volunteerId, notes, estimatedArrival } = req.body;

    const request = await Request.findOneAndUpdate(
      { _id: requestId, status: 'pending' },
      { status: 'assigned' },
      { returnDocument: 'after' }
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

    request.assignedTask = task._id;
    await request.save();

    const populated = await task.populate([
      { path: 'requestId' },
      { path: 'volunteerId', select: 'name phone email' },
    ]);

    req.io.to(`user_${volunteerId}`).emit('task_assigned', {
      taskId: task._id,
      request: { type: request.type, urgency: request.urgency, location: request.location },
    });

    req.io.to(`user_${request.submittedBy}`).emit('sos_assigned', {
      message: 'A volunteer has been assigned to your request',
      taskId: task._id,
    });

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('requestId')
      .populate('volunteerId', 'name phone email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ volunteerId: req.user._id })
      .populate('requestId')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

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
      await Request.findByIdAndUpdate(task.requestId, { status: 'resolved' }, { returnDocument: 'after' });
    } else if (status === 'en_route') {
      await Request.findByIdAndUpdate(task.requestId, { status: 'in_progress' }, { returnDocument: 'after' });
    }

    await task.save();

    req.io.emit('status_updated', {
      taskId: task._id,
      requestId: task.requestId,
      status: task.status,
    });

    if (status === 'completed') {
      const request = await Request.findById(task.requestId);
      if (request) {
        req.io.to(`user_${request.submittedBy}`).emit('sos_resolved', {
          message: 'Your request has been marked as resolved. Stay safe.',
        });
      }
    }

    return res.json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createTask, getAllTasks, getMyTasks, updateTaskStatus };