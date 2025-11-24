import express, { Response, Router } from 'express';
import Note from '../models/Note';
import Task from '../models/Task';
import { processNoteWithAI } from '../utils/aiProcessor';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all notes
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;
    const filter: any = { userId: req.userId };
    if (category) {
      filter.category = category;
    }

    const notes = await Note.find(filter).sort({ createdAt: -1 }).lean();
    // Convert to plain objects to ensure all fields including aiMetadata are included
    return res.json(notes.map(note => ({
      ...note,
      _id: note._id.toString(),
    })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get a single note
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    // Convert to plain object to ensure all fields including aiMetadata are included
    return res.json({
      ...note,
      _id: note._id.toString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Create a new note
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, isPrivate, category } = req.body;

    // Process with AI to detect subject
    const aiResult = await processNoteWithAI(content);

    const newNote = new Note({
      title,
      content,
      userId: req.userId!,
      subject: aiResult.subject,
      tags: aiResult.tags,
      isPrivate,
      category,
      aiMetadata: {
        model: aiResult.model || 'fallback',
        confidence: aiResult.confidence,
        processingTime: Date.now(),
        version: '1.0',
        method: aiResult.method,
      },
    });

    const note = await newNote.save();
    return res.status(201).json(note);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update a note
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, subject, isPrivate, category, tags } = req.body;

    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.title = title || note.title;
    note.content = content || note.content;
    note.subject = subject || note.subject;
    note.isPrivate = isPrivate !== undefined ? isPrivate : note.isPrivate;
    note.category = category || note.category;
    note.tags = tags || note.tags;
    note.updatedAt = new Date();

    const updatedNote = await note.save();
    return res.json(updatedNote);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete note
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Delete associated tasks (scoped to user)
    await Task.deleteMany({ noteId: note._id, userId: req.userId });

    // Use deleteOne() instead of remove()
    await Note.deleteOne({ _id: note._id, userId: req.userId });

    return res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Search notes
router.get('/search/:term', async (req: AuthRequest, res: Response) => {
  try {
    const { term } = req.params;
    const { category } = req.query;

    const filter: any = {
      userId: req.userId,
      $text: { $search: term },
    };

    if (category) {
      filter.category = category;
    }

    const notes = await Note.find(filter).sort({ createdAt: -1 }).lean();
    // Convert to plain objects to ensure all fields including aiMetadata are included
    return res.json(notes.map(note => ({
      ...note,
      _id: note._id.toString(),
    })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;

