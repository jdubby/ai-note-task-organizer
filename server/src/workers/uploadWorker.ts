import { Worker, Job } from 'bullmq';
import { redisConnection } from '../utils/redis';
import { UploadJobData, UploadJobResult } from '../queues/uploadQueue';
import { processUploadedFile } from '../utils/aiProcessor';
import { emitJobProgress, emitJobComplete, emitJobFailed } from '../services/socketService';
import fs from 'fs';

// Create worker to process upload jobs
export const uploadWorker = new Worker<UploadJobData, UploadJobResult>(
  'upload-processing',
  async (job: Job<UploadJobData, UploadJobResult>) => {
    const { userId, filePath, originalName, category, isPrivate } = job.data;

    try {
      // Update job progress and emit to client
      await job.updateProgress(10);
      emitJobProgress(userId, job.id!, 10, { message: 'Starting file processing' });

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Create file object for processing
      const file = {
        path: filePath,
        originalname: originalName,
      };

      await job.updateProgress(30);
      emitJobProgress(userId, job.id!, 30, { message: 'Reading file content' });

      // Process file with AI
      await job.updateProgress(50);
      emitJobProgress(userId, job.id!, 50, { message: 'Processing with AI' });
      
      const result = await processUploadedFile(file, userId, category, isPrivate);

      await job.updateProgress(80);
      emitJobProgress(userId, job.id!, 80, { message: 'Saving to database' });

      // Extract IDs from result
      const noteId = result.note._id;
      const taskIds = result.tasks.map((task) => task._id);

      await job.updateProgress(100);
      
      const jobResult = {
        noteId,
        taskIds,
        success: true,
      };

      // Emit completion event
      emitJobComplete(userId, job.id!, {
        note: result.note,
        tasks: result.tasks,
      });

      return jobResult;
    } catch (error: any) {
      console.error(`Error processing upload job ${job.id}:`, error);
      
      // Emit failure event
      emitJobFailed(userId, job.id!, error.message || 'Unknown error');
      
      throw error; // Re-throw to mark job as failed
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // Per second
    },
  }
);

// Worker event handlers
uploadWorker.on('completed', (job: Job) => {
  console.log(`Upload job ${job.id} completed successfully`);
});

uploadWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`Upload job ${job?.id} failed:`, err.message);
});

uploadWorker.on('error', (err: Error) => {
  console.error('Upload worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await uploadWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await uploadWorker.close();
  process.exit(0);
});

export default uploadWorker;

