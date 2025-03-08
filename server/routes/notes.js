const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Task = require('../models/Task'); // Add this import
const fs = require('fs');
const path = require('path');
const { processNoteWithAI } = require('../utils/aiProcessor');

// Get all notes
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    
    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single note
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new note
router.post('/', async (req, res) => {
  try {
    const { title, content, isPrivate, category } = req.body;
    
    // Process with AI to detect subject
    const aiResult = await processNoteWithAI(content);
    
    const newNote = new Note({
      title,
      content,
      subject: aiResult.subject,
      isPrivate,
      category
    });
    
    const note = await newNote.save();
    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a note
router.put('/:id', async (req, res) => {
  try {
    const { title, content, subject, isPrivate, category } = req.body;
    
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    note.title = title || note.title;
    note.content = content || note.content;
    note.subject = subject || note.subject;
    note.isPrivate = isPrivate !== undefined ? isPrivate : note.isPrivate;
    note.category = category || note.category;
    
    const updatedNote = await note.save();
    res.json(updatedNote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete note
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Delete associated tasks
    await Task.deleteMany({ noteId: note._id });
    
    // Use deleteOne() instead of remove()
    await Note.deleteOne({ _id: note._id });
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search notes
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const { category } = req.query;
    
    const filter = {
      $text: { $search: term }
    };
    
    if (category) {
      filter.category = category;
    }
    
    const notes = await Note.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;