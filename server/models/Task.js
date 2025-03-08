const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  dueDate: {
    type: Date
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true
  },
  subject: {
    type: String
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['work', 'personal'],
    default: 'work'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', TaskSchema);