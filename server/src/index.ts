import express, { Request, Response } from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { authenticateToken, AuthRequest } from './middleware/auth';
import { enqueueUploadJob, getJobStatus } from './queues/uploadQueue';
import { initializeSocketIO } from './services/socketService';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
initializeSocketIO(httpServer);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with increased timeout
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    bufferCommands: false, // Disable buffering - fail fast if not connected
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Allowed file types for text-based processing
const allowedMimeTypes = [
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'text/md',
  'text/csv',
  'application/json',
  'text/html',
  'text/xml',
  'application/xml',
];

const allowedExtensions = ['.txt', '.md', '.markdown', '.csv', '.json', '.html', '.htm', '.xml'];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
  const isValidExtension = allowedExtensions.includes(ext);

  if (isValidMimeType || isValidExtension) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type not supported. Allowed types: ${allowedExtensions.join(', ')}. ` +
          `Received: ${file.originalname} (${file.mimetype})`
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Routes
import authRouter from './routes/auth';
import notesRouter from './routes/notes';
import tasksRouter from './routes/tasks';

app.use('/api/auth', authRouter);
app.use('/api/notes', notesRouter);
app.use('/api/tasks', tasksRouter);

// File upload endpoint (requires authentication) - now enqueues jobs
app.post('/api/upload', authenticateToken, (req: AuthRequest, res: Response, next: express.NextFunction) => {
  upload.array('files')(req, res, (err: any) => {
    if (err) {
      // Handle file validation errors
      if (err.message && err.message.includes('File type not supported')) {
        res.status(400).json({
          message: 'File validation error',
          error: err.message,
        });
        return;
      }
      res.status(400).json({
        message: 'Upload error',
        error: err.message || 'Unknown upload error',
      });
      return;
    }
    next();
  });
}, async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    console.log('Upload request received:', files);
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const { category, isPrivate } = req.body;
    const jobIds = [];

    // Enqueue each file for background processing
    for (const file of files) {
      try {
        const job = await enqueueUploadJob({
          userId: req.userId!,
          filePath: file.path,
          fileName: file.filename,
          originalName: file.originalname,
          category: (category as 'work' | 'personal') || 'work',
          isPrivate: isPrivate === 'true',
        });

        jobIds.push({
          jobId: job.id,
          fileName: file.originalname,
        });
      } catch (fileError: any) {
        console.error('Error enqueueing file:', file.originalname, fileError);
        jobIds.push({
          jobId: null,
          fileName: file.originalname,
          error: fileError.message,
        });
      }
    }

    return res.status(202).json({
      message: 'Files queued for processing',
      jobs: jobIds,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({
      message: 'Error queuing files',
      error: error.message,
    });
  }
});

// Job status endpoint
app.get('/api/jobs/:jobId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const status = await getJobStatus(jobId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Verify job belongs to user
    if (status.data.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    return res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Job status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching job status',
    });
  }
});

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../../client/build')));

  // Any routes not handled before will return the React app
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, '../../client/build', 'index.html'));
  });
}

// For development, add a simple route for the root path
app.get('/', (_req: Request, res: Response) => {
  res.send('API is running...');
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready for connections`);
});

