const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const { status, subject, category } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (subject) filter.subject = subject;
    if (category) filter.category = category;
    
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const { description, status, dueDate, noteId, subject, isPrivate, category } = req.body;
    
    const newTask = new Task({
      description,
      status,
      dueDate,
      noteId,
      subject,
      isPrivate,
      category
    });
    
    const task = await newTask.save();
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  try {
    const { description, status, dueDate, subject, isPrivate, category } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    task.description = description || task.description;
    task.status = status || task.status;
    task.dueDate = dueDate || task.dueDate;
    task.subject = subject || task.subject;
    task.isPrivate = isPrivate !== undefined ? isPrivate : task.isPrivate;
    task.category = category || task.category;
    
    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    await task.remove();
    res.json({ message: 'Task removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export tasks as CSV or JSON
router.get('/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const { category } = req.query;
    
    const filter = category ? { category } : {};
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    
    if (format === 'json') {
      return res.json(tasks);
    } else if (format === 'csv') {
      const csv = tasks.map(task => {
        return `${task._id},${task.description},${task.status},${task.dueDate || ''},${task.subject || ''},${task.category},${task.createdAt}`;
      }).join('\n');
      
      const headers = 'id,description,status,dueDate,subject,category,createdAt\n';
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
      res.send(headers + csv);
    } else {
      res.status(400).json({ message: 'Invalid export format' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;