import mongoose from 'mongoose';
import { Task as ITask } from '@note-task-organizer/types';

interface TaskDocument extends Omit<ITask, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const TaskSchema = new mongoose.Schema<TaskDocument>({
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending',
  },
  dueDate: {
    type: Date,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true,
  } as mongoose.SchemaDefinitionProperty,
  subject: {
    type: String,
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
TaskSchema.index({ userId: 1, category: 1 });
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, createdAt: -1 });
TaskSchema.index({ userId: 1, noteId: 1 });

export default mongoose.model<TaskDocument>('Task', TaskSchema);

