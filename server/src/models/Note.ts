import mongoose from 'mongoose';
import { Note as INote } from '@note-task-organizer/types';

interface NoteDocument extends Omit<INote, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const NoteSchema = new mongoose.Schema<NoteDocument>({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  filePath: {
    type: String,
  },
  fileName: {
    type: String,
  },
  subject: {
    type: String,
  },
  tags: {
    type: [String],
    default: [],
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    enum: ['work', 'personal'],
    default: 'work',
  },
  aiMetadata: {
    type: {
      model: { type: String, default: 'fallback' },
      confidence: Number,
      processingTime: Number,
      version: String,
      method: { type: String, enum: ['ai', 'fallback'], default: 'fallback' },
    },
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
NoteSchema.index({ userId: 1, category: 1 });
NoteSchema.index({ userId: 1, createdAt: -1 });
NoteSchema.index({ userId: 1, content: 'text', title: 'text' }); // Text search scoped by userId
NoteSchema.index({ userId: 1, isPrivate: 1 });

export default mongoose.model<NoteDocument>('Note', NoteSchema);

