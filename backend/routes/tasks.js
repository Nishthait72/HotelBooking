const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/tasks
// @desc    Get staff tasks (Admin sees all, Staff sees their own or all staff tasks)
// @access  Private (Admin & Staff)
router.get('/', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    } else if (req.user.role === 'Staff' && req.query.mine === 'true') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email role')
      .populate('room', 'roomNumber type floor')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/tasks
// @desc    Create a new staff task
// @access  Private (Admin & Staff)
router.post('/', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    const { title, description, assignedTo, room, priority, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Please provide task title' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      assignedTo: assignedTo || req.user._id,
      room: room || null,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      status: 'pending',
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('room', 'roomNumber type floor');

    res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task status or details
// @access  Private (Admin & Staff)
router.put('/:id', protect, authorize('Admin', 'Staff'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { status, title, description, assignedTo, room, priority, dueDate } = req.body;

    if (status) task.status = status;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;
    if (room !== undefined) task.room = room;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('room', 'roomNumber type floor');

    res.json({ success: true, data: populatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
