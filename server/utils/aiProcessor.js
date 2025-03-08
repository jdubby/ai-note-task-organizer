const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const Task = require('../models/Task');
const Note = require('../models/Note');
const dotenv = require('dotenv');

// Ensure environment variables are loaded
dotenv.config();

// Configure OpenAI with explicit API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here', // Fallback is just for error handling
});

// Process note content with AI
async function processNoteWithAI(content) {
  try {
    // Detect subject using the chat completions API
    const subjectResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts the main subject or topic from notes."
        },
        {
          role: "user",
          content: `Extract the main subject or topic from the following note:\n\n${content}\n\nSubject:`
        }
      ],
      max_tokens: 50,
      temperature: 0.3,
    });
    
    const subject = subjectResponse.choices[0].message.content.trim();
    
    // Extract tasks using the chat completions API
    const tasksResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts action items and to-do items from notes."
        },
        {
          role: "user",
          content: `Extract all action items or to-do items from the following note. Format each task on a new line starting with "- ":\n\n${content}\n\nTasks:`
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    });
    
    const tasksText = tasksResponse.choices[0].message.content.trim();
    
    // Parse tasks
    const tasks = tasksText
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(2).trim());
    
    return {
      subject,
      tasks
    };
  } catch (error) {
    console.error('AI processing error:', error);
    return {
      subject: 'Unclassified',
      tasks: []
    };
  }
}

// Process uploaded file
async function processUploadedFile(file, category = 'work', isPrivate = false) {
  try {
    const filePath = file.path;
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Process with AI
    const aiResult = await processNoteWithAI(content);
    
    // Create note
    const newNote = new Note({
      title: file.originalname,
      content,
      filePath,
      fileName: file.originalname,
      subject: aiResult.subject,
      isPrivate,
      category
    });
    
    const savedNote = await newNote.save();
    
    // Create tasks
    const tasks = [];
    for (const taskDescription of aiResult.tasks) {
      const newTask = new Task({
        description: taskDescription,
        noteId: savedNote._id,
        subject: aiResult.subject,
        isPrivate,
        category
      });
      
      const savedTask = await newTask.save();
      tasks.push(savedTask);
    }
    
    return {
      note: savedNote,
      tasks
    };
  } catch (error) {
    console.error('File processing error:', error);
    throw error;
  }
}

module.exports = {
  processNoteWithAI,
  processUploadedFile
};