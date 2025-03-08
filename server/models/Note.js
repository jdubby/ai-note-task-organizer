const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  filePath: {
    type: String
  },
  fileName: {
    type: String
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

module.exports = mongoose.model('Note', NoteSchema);