// Start workers - this file should be run as a separate process
import mongoose from 'mongoose';
import { uploadWorker } from './uploadWorker';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Connection for worker process
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Connect to MongoDB before starting workers
mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    bufferCommands: false, // Disable buffering - fail fast if not connected
  })
  .then(() => {
    console.log('MongoDB connected (worker)');
    console.log('Starting background workers...');
    console.log('Upload worker started and ready to process jobs');
  })
  .catch((err) => {
    console.error('MongoDB connection error (worker):', err);
    process.exit(1);
  });

// Keep process alive
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down workers...');
  await uploadWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down workers...');
  await uploadWorker.close();
  process.exit(0);
});
