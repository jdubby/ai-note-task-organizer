import express, { Response, Router } from 'express';
import Task from '../models/Task';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all tasks
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, subject, category } = req.query;
    const filter: any = { userId: req.userId };

    if (status) filter.status = status;
    if (subject) filter.subject = subject;
    if (category) filter.category = category;

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    return res.json(tasks);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get a single task
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.json(task);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Create a new task
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { description, status, dueDate, noteId, subject, isPrivate, category } = req.body;

    const newTask = new Task({
      description,
      status,
      dueDate,
      noteId,
      userId: req.userId!,
      subject,
      isPrivate,
      category,
    });

    const task = await newTask.save();
    return res.status(201).json(task);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update a task
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { description, status, dueDate, subject, isPrivate, category } = req.body;

    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.description = description || task.description;
    task.status = status || task.status;
    task.dueDate = dueDate || task.dueDate;
    task.subject = subject || task.subject;
    task.isPrivate = isPrivate !== undefined ? isPrivate : task.isPrivate;
    task.category = category || task.category;
    task.updatedAt = new Date();

    const updatedTask = await task.save();
    return res.json(updatedTask);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete a task
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.deleteOne({ _id: task._id, userId: req.userId });
    return res.json({ message: 'Task removed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Export tasks as CSV or JSON
router.get('/export/:format', async (req: AuthRequest, res: Response) => {
  try {
    const { format } = req.params;
    const { category } = req.query;

    const filter: any = { userId: req.userId };
    if (category) {
      filter.category = category;
    }
    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    if (format === 'json') {
      return res.json(tasks);
    } else if (format === 'csv') {
      const csv = tasks
        .map((task) => {
          return `${task._id},${task.description},${task.status},${task.dueDate || ''},${task.subject || ''},${task.category},${task.createdAt}`;
        })
        .join('\n');

      const headers = 'id,description,status,dueDate,subject,category,createdAt\n';

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
      return res.send(headers + csv);
    } else {
      return res.status(400).json({ message: 'Invalid export format' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;

