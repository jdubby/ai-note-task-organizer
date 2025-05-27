# AI Note Task Organizer - Complete Documentation

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Installation Guide](#installation-guide)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [AI Integration](#ai-integration)
- [Project Structure](#project-structure)
- [Usage Examples](#usage-examples)
- [Development Guidelines](#development-guidelines)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

The AI Note Task Organizer is a full-stack web application that revolutionizes how you manage notes and tasks. By leveraging artificial intelligence, it automatically extracts actionable tasks from your notes, categorizes content by subject, and provides intelligent organization features.

### Key Capabilities
- **Intelligent Task Extraction**: Uses OpenAI's GPT models to identify action items and to-do tasks from unstructured notes
- **Automated Subject Detection**: AI-powered categorization of notes by topic and subject matter
- **Multi-format Support**: Processes both markdown and plain text files
- **Privacy Controls**: Supports private notes for sensitive information
- **Advanced Search**: Full-text search across notes and tasks
- **Data Export**: Export tasks in CSV or JSON formats for external use

## Features

### Core Features
- **AI-Powered Task Extraction**: Automatically identifies action items and to-do items from your notes
- **Subject Detection**: Uses AI to categorize your notes by subject
- **Note Organization**: Separate work and personal notes
- **Task Management**: Track task status (pending, in-progress, completed)
- **Due Date Tracking**: Set and manage due dates for your tasks
- **File Upload**: Drag and drop or file picker for uploading multiple files
- **Search Functionality**: Search through your notes and tasks
- **Data Export**: Download tasks in CSV or JSON format
- **Privacy Controls**: Mark notes as private for sensitive information

### User Interface Features
- Modern React-based interface with Material-UI components
- Responsive design for desktop and mobile devices
- Intuitive drag-and-drop file upload
- Real-time task status updates
- Advanced filtering and sorting options

## Technology Stack

### Backend
- **Runtime**: Node.js (v14+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: OpenAI API (GPT-3.5-turbo)
- **File Upload**: Multer middleware
- **Authentication**: CORS-enabled API
- **Environment Management**: dotenv

### Frontend
- **Framework**: React with Material-UI
- **Build Tool**: Create React App (inferred from project structure)
- **HTTP Client**: Axios (likely, standard for React applications)

### Development Tools
- **Process Manager**: Nodemon for development
- **Version Control**: Git with comprehensive .gitignore
- **Package Management**: npm

## System Architecture

### High-Level Architecture

```
???????????????????    ???????????????????    ???????????????????
?   React Client  ?    ?  Express Server ?    ?    MongoDB     ?
?   (Frontend)    ??????   (Backend)     ??????   (Database)   ?
???????????????????    ???????????????????    ???????????????????
                              ?
                              ?
                       ???????????????????
                       ?   OpenAI API    ?
                       ? (AI Processing) ?
                       ???????????????????
```

### Component Architecture

```
server/
??? server.js           # Main application entry point
??? models/             # Database models (Note, Task)
??? routes/             # API route handlers
??? utils/              # AI processing utilities
??? uploads/            # File storage directory
```

## Installation Guide

### Prerequisites

Before installation, ensure you have:
- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- OpenAI API key

### Step-by-Step Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/jdubby/ai-note-task-organizer.git
cd ai-note-task-organizer
```

#### 2. Install Server Dependencies

```bash
cd server
npm install
```

#### 3. Install Client Dependencies

```bash
cd ../client
npm install
```

#### 4. Environment Configuration

Create a `.env` file in the `server` directory:

```bash
cd ../server
cp .env.example .env  # If example exists, or create new file
```

Add the following environment variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/note-task-organizer
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/database

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Server Configuration
PORT=5000
NODE_ENV=development
```

#### 5. Database Setup

If using local MongoDB:
```bash
# Start MongoDB service (varies by OS)
# macOS with Homebrew:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod

# Windows: Start MongoDB as a service
```

#### 6. Start the Application

Development mode (run both server and client):

```bash
# Terminal 1 - Start the server
cd server
npm run dev  # or npm start

# Terminal 2 - Start the client
cd ../client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------||
| `MONGODB_URI` | MongoDB connection string | Yes | N/A |
| `OPENAI_API_KEY` | OpenAI API key for AI processing | Yes | N/A |
| `PORT` | Server port number | No | 5000 |
| `NODE_ENV` | Environment mode | No | development |

### MongoDB Configuration

The application uses MongoDB with increased timeout settings for better reliability:

```javascript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
});
```

### File Upload Configuration

Files are stored in the `server/uploads` directory with timestamp-based naming:
- Maximum file size: Not explicitly limited (configure as needed)
- Supported formats: Text files (.txt, .md, etc.)
- Naming convention: `${timestamp}-${originalname}`

## API Documentation

### Base URL
All API endpoints are prefixed with `/api`

### Notes Endpoints

#### GET /api/notes
Retrieve all notes with optional category filtering.

**Query Parameters:**
- `category` (optional): Filter by 'work' or 'personal'

**Response:**
```json
[
  {
    "_id": "note_id",
    "title": "Meeting Notes",
    "content": "Discussion about project timeline...",
    "subject": "Project Planning",
    "category": "work",
    "isPrivate": false,
    "fileName": "meeting-notes.txt",
    "createdAt": "2023-12-01T10:00:00Z"
  }
]
```

#### GET /api/notes/:id
Retrieve a specific note by ID.

#### POST /api/notes
Create a new note.

**Request Body:**
```json
{
  "title": "New Note",
  "content": "Note content here...",
  "category": "work",
  "isPrivate": false
}
```

#### PUT /api/notes/:id
Update an existing note.

#### DELETE /api/notes/:id
Delete a note and its associated tasks.

#### GET /api/notes/search/:term
Search notes by content.

### Tasks Endpoints

#### GET /api/tasks
Retrieve all tasks with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by 'pending', 'in-progress', 'completed'
- `category` (optional): Filter by 'work' or 'personal'

#### GET /api/tasks/:id
Retrieve a specific task by ID.

#### POST /api/tasks
Create a new task.

**Request Body:**
```json
{
  "description": "Complete project documentation",
  "status": "pending",
  "dueDate": "2023-12-15T00:00:00Z",
  "noteId": "associated_note_id",
  "category": "work",
  "isPrivate": false
}
```

#### PUT /api/tasks/:id
Update an existing task.

#### DELETE /api/tasks/:id
Delete a task.

#### GET /api/tasks/export/csv
Export tasks as CSV file.

#### GET /api/tasks/export/json
Export tasks as JSON file.

### File Upload Endpoint

#### POST /api/upload
Upload and process files.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: Form data with files and metadata

**Form Fields:**
- `files`: File(s) to upload (multiple files supported)
- `category`: 'work' or 'personal'
- `isPrivate`: 'true' or 'false'

**Response:**
```json
{
  "message": "Files processed successfully",
  "results": [
    {
      "note": {
        "_id": "note_id",
        "title": "uploaded-file.txt",
        "subject": "Detected Subject"
      },
      "tasks": [
        {
          "_id": "task_id",
          "description": "Extracted task description"
        }
      ]
    }
  ]
}
```

## Database Schema

### Note Model

```javascript
{
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
}
```

### Task Model

```javascript
{
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
}
```

## AI Integration

### OpenAI Configuration

The application uses OpenAI's GPT-3.5-turbo model for AI processing:

```javascript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

### AI Processing Functions

#### Subject Detection

The AI analyzes note content to extract the main subject or topic:

```javascript
// System prompt for subject detection
"You are a helpful assistant that extracts the main subject or topic from notes."

// User prompt
`Extract the main subject or topic from the following note:

${content}

Subject:`
```

#### Task Extraction

The AI identifies action items and to-do items:

```javascript
// System prompt for task extraction
"You are a helpful assistant that extracts action items and to-do items from notes."

// User prompt
`Extract all action items or to-do items from the following note. Format each task on a new line starting with "- ":

${content}

Tasks:`
```

### AI Processing Pipeline

1. **File Upload**: User uploads text files
2. **Content Extraction**: File content is read and processed
3. **Subject Analysis**: AI determines the main topic/subject
4. **Task Extraction**: AI identifies actionable items
5. **Database Storage**: Note and extracted tasks are saved
6. **Response**: Results are returned to the client

### Error Handling

The AI processor includes comprehensive error handling:

```javascript
try {
  const aiResult = await processNoteWithAI(content);
  // Process results
} catch (error) {
  console.error('AI processing error:', error);
  return {
    subject: 'Unclassified',
    tasks: []
  };
}
```

## Project Structure

### Root Directory
```
ai-note-task-organizer/
??? client/                 # React frontend (submodule)
??? server/                 # Express backend
??? package.json           # Root package configuration
??? .gitignore            # Git ignore rules
??? README.md             # Project overview
??? push_to_github.sh     # Deployment script
??? setup_github_remote.sh # Git setup script
```

### Server Directory Structure
```
server/
??? server.js             # Main application entry point
??? package.json          # Server dependencies
??? .env                  # Environment variables
??? models/               # Mongoose models
?   ??? Note.js          # Note schema
?   ??? Task.js          # Task schema
??? routes/               # Express route handlers
?   ??? notes.js         # Note-related endpoints
?   ??? tasks.js         # Task-related endpoints
??? utils/                # Utility functions
?   ??? aiProcessor.js   # AI processing logic
??? uploads/              # File upload storage
```

### Key Files Description

| File | Purpose |
|------|---------||
| `server/server.js` | Main Express application with middleware and route setup |
| `server/models/Note.js` | MongoDB schema for notes |
| `server/models/Task.js` | MongoDB schema for tasks |
| `server/utils/aiProcessor.js` | OpenAI integration and AI processing logic |
| `server/routes/notes.js` | API endpoints for note operations |
| `server/routes/tasks.js` | API endpoints for task operations |

## Usage Examples

### Upload and Process Files

```bash
curl -X POST http://localhost:5000/api/upload \
  -F "files=@meeting-notes.txt" \
  -F "category=work" \
  -F "isPrivate=false"
```

### Create a Note Manually

```bash
curl -X POST http://localhost:5000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Project Ideas",
    "content": "1. Implement user authentication 2. Add real-time notifications 3. Create mobile app",
    "category": "work",
    "isPrivate": false
  }'
```

### Update Task Status

```bash
curl -X PUT http://localhost:5000/api/tasks/[task_id] \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### Search Notes

```bash
curl "http://localhost:5000/api/notes/search/project?category=work"
```

### Export Tasks

```bash
# Export as CSV
curl "http://localhost:5000/api/tasks/export/csv" -o tasks.csv

# Export as JSON
curl "http://localhost:5000/api/tasks/export/json" -o tasks.json
```

## Development Guidelines

### Code Structure

1. **Models**: Define clear, well-documented Mongoose schemas
2. **Routes**: Keep route handlers focused and use proper HTTP status codes
3. **Utils**: Create reusable utility functions for common operations
4. **Error Handling**: Implement comprehensive error handling with meaningful messages

### Best Practices

1. **Environment Variables**: Never commit sensitive data like API keys
2. **Validation**: Validate all input data before processing
3. **Logging**: Use console.log for development, consider winston for production
4. **Testing**: Write unit tests for utility functions and API endpoints
5. **Documentation**: Keep code well-commented and documentation updated

### Adding New Features

1. **Database Changes**: Update models first, then create migrations if needed
2. **API Endpoints**: Follow REST conventions and maintain consistency
3. **AI Features**: Test AI integration thoroughly with various input types
4. **Frontend Integration**: Ensure API changes are compatible with frontend

## Deployment

### Production Environment

#### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/production-db
OPENAI_API_KEY=your-production-api-key
PORT=5000
```

#### Production Build Steps

1. **Build Frontend:**
```bash
cd client
npm run build
```

2. **Configure Static Serving:**
The server is already configured to serve static files in production:

```javascript
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}
```

3. **Deploy to Platform:**
- **Heroku**: Use the included scripts and ensure environment variables are set
- **AWS/GCP**: Configure load balancer and environment variables
- **DigitalOcean**: Use App Platform or Droplets with PM2

#### Database Deployment

- **MongoDB Atlas**: Recommended for production
- **Local MongoDB**: Ensure proper backup and security configurations

### Deployment Scripts

The project includes deployment scripts:

- `push_to_github.sh`: Automated Git operations
- `setup_github_remote.sh`: Git remote configuration

## Troubleshooting

### Common Issues

#### MongoDB Connection Issues

**Problem**: `MongoServerSelectionError`

**Solutions:**
1. Check MongoDB service is running
2. Verify connection string in `.env`
3. Ensure IP whitelist (for MongoDB Atlas)
4. Check network connectivity

#### OpenAI API Issues

**Problem**: `Authentication failed`

**Solutions:**
1. Verify API key in `.env` file
2. Check OpenAI account billing and usage limits
3. Ensure API key has correct permissions

#### File Upload Issues

**Problem**: Files not uploading or processing

**Solutions:**
1. Check `uploads` directory exists and has write permissions
2. Verify file size limits
3. Ensure supported file formats
4. Check server disk space

#### AI Processing Errors

**Problem**: Tasks not being extracted

**Solutions:**
1. Verify OpenAI API key and connection
2. Check file content encoding (should be UTF-8)
3. Review AI processing logs
4. Test with simpler content first

### Debug Mode

Enable debug logging:

```javascript
// Add to server.js
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}
```

### Performance Optimization

1. **Database Indexing**: Add indexes for frequently queried fields
2. **Caching**: Implement Redis for API response caching
3. **File Processing**: Consider async job queues for large files
4. **AI Rate Limiting**: Implement rate limiting for OpenAI API calls

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add: new feature description"`
5. Push to your fork: `git push origin feature-name`
6. Create a Pull Request

### Code Style

- Use consistent indentation (2 spaces)
- Follow JavaScript ES6+ standards
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Testing Guidelines

- Write unit tests for new utility functions
- Test API endpoints with various inputs
- Verify AI processing with different content types
- Test error handling scenarios

### Pull Request Guidelines

1. **Description**: Provide clear description of changes
2. **Testing**: Include information about testing performed
3. **Documentation**: Update documentation for new features
4. **Breaking Changes**: Clearly note any breaking changes

---

## License

This project is licensed under the ISC License. See the LICENSE file for details.

## Support

For support and questions:
1. Check this documentation first
2. Review existing GitHub issues
3. Create a new issue with detailed description
4. Include error messages and steps to reproduce

---

*Last updated: December 2024*