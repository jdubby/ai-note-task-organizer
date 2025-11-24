import { Queue } from 'bullmq';
import { redisConnection } from '../utils/redis';

export interface UploadJobData {
  userId: string;
  filePath: string;
  fileName: string;
  originalName: string;
  category: 'work' | 'personal';
  isPrivate: boolean;
}

export interface UploadJobResult {
  noteId: string;
  taskIds: string[];
  success: boolean;
  error?: string;
}

// Create upload processing queue
export const uploadQueue = new Queue<UploadJobData, UploadJobResult>('upload-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 24 * 3600, // Keep failed jobs for 24 hours
    },
  },
});

// Helper function to add upload job
export async function enqueueUploadJob(data: UploadJobData) {
  const job = await uploadQueue.add('process-upload', data, {
    jobId: `upload-${data.userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  });
  return job;
}

// Get job status
export async function getJobStatus(jobId: string) {
  const job = await uploadQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;
  const result = job.returnvalue;
  const failedReason = job.failedReason;

  return {
    id: job.id,
    state,
    progress,
    result,
    failedReason,
    data: job.data,
  };
}

export default uploadQueue;

