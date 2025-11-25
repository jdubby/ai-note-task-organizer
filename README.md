# Note Task Organizer

A privacy-first, AI-assisted web application that helps you organize your notes and automatically extract tasks using self-hosted AI models. Upload your markdown or plain text notes, and the app will identify action items, categorize your notes by subject, and help you track your tasks—all while keeping your data private and secure.

## Features

### Core Functionality
- **AI-Powered Task Extraction**: Automatically identifies action items and to-do items from your notes using self-hosted language models (Ollama)
- **Subject Detection**: Uses AI to categorize your notes by subject
- **Automatic Tagging**: AI extracts relevant tags from your notes for better organization
- **Note Organization**: Separate work and personal notes with category support
- **Task Management**: Track task status (pending, in-progress, completed)
- **Due Date Tracking**: Set and manage due dates for your tasks
- **File Upload**: Upload text-based files (markdown, plain text, etc.) with background processing
- **Real-time Updates**: Socket.IO integration for live job progress and completion notifications
- **Search Functionality**: Full-text search through your notes and tasks
- **Privacy Controls**: Mark notes as private for sensitive information

### Client Features
- **User Authentication**: Login and registration with JWT tokens
- **Protected Routes**: Automatic authentication checks and redirects
- **Dashboard**: Overview with statistics, recent notes, and pending tasks
- **Notes Management**: View, search, and delete notes with category filtering
- **Tasks Management**: Filter by status/subject, edit tasks, update due dates, mark complete
- **File Upload Interface**: Drag-and-drop upload with real-time progress tracking
- **Responsive UI**: Material-UI components with modern, clean design
- **Category Switching**: Toggle between work and personal categories
- **Real-time Job Tracking**: Live updates for file processing progress

### Backend Features
- **Multi-tenant Architecture**: Secure user isolation with JWT authentication
- **Background Processing**: Asynchronous file processing with BullMQ and Redis
- **Fallback Extraction**: Heuristic-based task extraction when AI is unavailable
- **RESTful API**: Type-safe API with comprehensive error handling

## Tech Stack

### Frontend
- **React 19** with **Material-UI v6**
- **TypeScript** - Fully migrated and type-safe
- **React Router v7** - Client-side routing
- **Socket.IO Client** - Real-time updates
- **Axios** - HTTP client with automatic authentication

### Backend
- **Node.js** with **Express** and **TypeScript**
- **MongoDB** for data storage
- **Redis** for caching and job queues
- **BullMQ** for background job processing
- **Socket.IO** for real-time updates
- **JWT** for authentication
- **Multer** for file uploads

### AI & Infrastructure
- **Ollama** for self-hosted language models (phi4-mini:3.8b, phi3.5:mini, mixtral:8x7b)
- **Docker Compose** for local development
- **MinIO** for object storage (S3-compatible)

### Development
- **pnpm** workspaces for monorepo management
- **TypeScript** for type safety
- **Shared types package** for client-server type consistency

## Architecture

The application follows a monorepo structure with separate packages:

```
note-task-organizer/
├── client/          # React frontend application
├── server/          # Express API server
├── packages/
│   └── types/       # Shared TypeScript types
└── docker-compose.yml  # Local development services
```

### Data Flow

1. User uploads files via the API
2. Files are validated and stored temporarily
3. Background worker processes files asynchronously
4. Worker calls inference service (Ollama) for AI extraction
5. Extracted tasks, subjects, and tags are saved to MongoDB
6. Real-time updates are sent via Socket.IO
7. Client receives completion notification

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher) - `npm install -g pnpm`
- **Docker** and **Docker Compose** (for local development services)
- **Ollama** (optional, for AI features) - See [OLLAMA_SETUP.md](./OLLAMA_SETUP.md)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/jdubby/ai-note-task-organizer.git
cd ai-note-task-organizer
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the `server/` directory:

```bash
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/note-task-organizer

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRES_IN=7d

# AI Inference Service (Ollama)
AI_INFERENCE_URL=http://localhost:11434
AI_MODEL=phi4-mini:3.8b

# MinIO/S3 (optional, for production)
# S3_ENDPOINT=http://localhost:9000
# S3_ACCESS_KEY=minioadmin
# S3_SECRET_KEY=minioadmin
# S3_BUCKET=notes
```

### 4. Start Docker services

Start MongoDB, Redis, and MinIO using Docker Compose:

```bash
docker-compose up -d
```

Or use the convenience script:

```bash
./scripts/dev.sh
```

This will start:
- **MongoDB** on port `27017`
- **Redis** on port `6379`
- **MinIO** on ports `9000` (API) and `9001` (Console)

### 5. (Optional) Set up Ollama for AI features

If you want to use AI-powered task extraction:

1. Install Ollama: See [OLLAMA_SETUP.md](./OLLAMA_SETUP.md)
2. Start Ollama server: `ollama serve`
3. Pull a model: `ollama pull phi4-mini:3.8b`

The application will automatically fall back to heuristic extraction if Ollama is unavailable.

### 6. Start the development servers

In separate terminals:

**Terminal 1 - API Server:**
```bash
cd server
PORT=5001 pnpm dev
```

**Terminal 2 - Background Worker:**
```bash
cd server
pnpm dev:worker
```

**Terminal 3 - Client (if needed):**
```bash
cd client
pnpm start
```

Or use the root script to start everything:

```bash
pnpm dev
```

## API Testing

A Postman collection is included for end-to-end API testing:

- **Collection**: `Note-Task-Organizer-API.postman_collection.json`
- **Environment**: `Note-Task-Organizer.postman_environment.json`

See [POSTMAN_TESTING.md](./POSTMAN_TESTING.md) for detailed instructions.

## Project Structure

```
note-task-organizer/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   └── pages/         # Page components
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic services
│   │   ├── workers/       # Background job workers
│   │   ├── queues/        # BullMQ queue definitions
│   │   ├── middleware/    # Express middleware
│   │   └── utils/         # Utility functions
│   └── package.json
├── packages/
│   └── types/             # Shared TypeScript types
│       └── src/
│           └── index.ts
├── docker-compose.yml     # Local development services
├── scripts/               # Utility scripts
└── package.json           # Root workspace config
```

## Key Features Explained

### AI Task Extraction

The application uses self-hosted language models (via Ollama) to extract:
- **Tasks**: Action items and to-do items from notes
- **Subject**: Main topic or category of the note
- **Tags**: Relevant keywords for organization

If the AI service is unavailable, the system automatically falls back to heuristic-based extraction.

See [TASK_EXTRACTION.md](./TASK_EXTRACTION.md) for details on extraction methods.

### Background Processing

File uploads are processed asynchronously:
1. File is uploaded and validated
2. Job is enqueued in Redis
3. Background worker processes the file
4. Real-time progress updates via Socket.IO
5. Completion notification with extracted data

### Authentication

JWT-based authentication with:
- User registration
- Login with email/password
- Protected API routes
- User-scoped data access

## Documentation

- [DESIGN.md](./DESIGN.md) - Architecture design document
- [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) - Ollama installation and configuration
- [POSTMAN_TESTING.md](./POSTMAN_TESTING.md) - API testing guide
- [FILE_UPLOAD_GUIDE.md](./FILE_UPLOAD_GUIDE.md) - Supported file types and upload process
- [TASK_EXTRACTION.md](./TASK_EXTRACTION.md) - Task extraction details
- [EXTRACTION_METHOD_GUIDE.md](./EXTRACTION_METHOD_GUIDE.md) - How to check extraction method
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions

## Development

### Type Checking

```bash
pnpm type-check
```

### Building

```bash
pnpm build
```

### Formatting

```bash
pnpm format
```

### Testing Ollama

Test the Ollama inference service directly:

```bash
./test_ollama.sh phi4-mini:3.8b
```

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues:

- Port conflicts (especially port 5000 on macOS)
- MongoDB connection issues
- Worker not processing jobs
- Socket.IO connection problems
- AI extraction not working

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license here]

## Status

**Current Phase**: Phase 2 - AI Inference Integration ✅

- ✅ Phase 0: Foundations (Monorepo, TypeScript, Docker)
- ✅ Phase 1: Core CRUD & Auth (JWT, MongoDB, File Upload)
- ✅ Phase 2: AI Inference Integration (Ollama, Background Workers, Socket.IO)
- 🚧 Phase 3: UX Enhancements (In Progress)
- ⏳ Phase 4: Hardening & Ops (Planned)
