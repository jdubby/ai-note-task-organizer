import fs from 'fs';
import dotenv from 'dotenv';
import Task from '../models/Task';
import Note from '../models/Note';
import { AIProcessingResult, UploadResult } from '@note-task-organizer/types';
import { callInferenceService } from '../services/inferenceService';

dotenv.config();

// Process note content with AI using self-hosted inference service
export async function processNoteWithAI(content: string): Promise<AIProcessingResult> {
  try {
    // Use self-hosted inference service (Ollama/vLLM)
    const result = await callInferenceService({ content });

    return {
      subject: result.subject,
      tasks: result.tasks,
      tags: result.tags,
      confidence: result.confidence,
      method: result.method,
      model: result.model,
    };
  } catch (error) {
    console.error('AI processing error:', error);
    return {
      subject: 'Unclassified',
      tasks: [],
      tags: [],
      confidence: 0,
      method: 'fallback',
    };
  }
}

// Process uploaded file
export async function processUploadedFile(
  file: { path: string; originalname: string },
  userId: string,
  category: 'work' | 'personal' = 'work',
  isPrivate: boolean = false
): Promise<UploadResult> {
  try {
    const filePath = file.path;
    const content = fs.readFileSync(filePath, 'utf8');

    // Process with AI
    const aiResult = await processNoteWithAI(content);

    // Create note with AI metadata
    const newNote = new Note({
      title: file.originalname,
      content,
      userId,
      filePath,
      fileName: file.originalname,
      subject: aiResult.subject,
      tags: aiResult.tags,
      isPrivate,
      category,
      aiMetadata: {
        model: aiResult.model || 'fallback',
        confidence: aiResult.confidence,
        processingTime: Date.now(), // Could track actual processing time if needed
        version: '1.0',
        method: aiResult.method, // Store which method was used
      },
    });

    const savedNote = await newNote.save();

    // Create tasks
    const tasks = [];
    for (const taskDescription of aiResult.tasks) {
      const newTask = new Task({
        description: taskDescription,
        userId,
        noteId: savedNote._id,
        subject: aiResult.subject,
        isPrivate,
        category,
      });

      const savedTask = await newTask.save();
      tasks.push(savedTask);
    }

    return {
      note: {
        ...savedNote.toObject(),
        _id: savedNote._id.toString(),
      },
      tasks: tasks.map((t) => ({
        ...t.toObject(),
        _id: t._id.toString(),
      })),
    };
  } catch (error) {
    console.error('File processing error:', error);
    throw error;
  }
}

