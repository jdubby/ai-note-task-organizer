import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../middleware/auth';

let io: SocketIOServer | null = null;

// Map of userId to socket IDs
const userSockets = new Map<string, Set<string>>();

export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  // Authentication middleware for socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Authentication error: Invalid token'));
    }

    // Attach user info to socket
    (socket as any).userId = decoded.userId;
    (socket as any).userEmail = decoded.email;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    const userEmail = (socket as any).userEmail;

    console.log(`Socket connected: ${socket.id} (User: ${userEmail})`);

    // Track user's socket connections
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // Join user-specific room
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (User: ${userEmail})`);
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    });

    // Handle job status subscription
    socket.on('subscribe:job', (jobId: string) => {
      socket.join(`job:${jobId}`);
      console.log(`Socket ${socket.id} subscribed to job ${jobId}`);
    });

    socket.on('unsubscribe:job', (jobId: string) => {
      socket.leave(`job:${jobId}`);
      console.log(`Socket ${socket.id} unsubscribed from job ${jobId}`);
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

/**
 * Emit job progress update to user
 */
export function emitJobProgress(userId: string, jobId: string, progress: number, data?: any) {
  if (!io) return;

  io.to(`user:${userId}`).to(`job:${jobId}`).emit('job:progress', {
    jobId,
    progress,
    data,
  });
}

/**
 * Emit job completion to user
 */
export function emitJobComplete(userId: string, jobId: string, result: any) {
  if (!io) return;

  io.to(`user:${userId}`).to(`job:${jobId}`).emit('job:complete', {
    jobId,
    result,
  });
}

/**
 * Emit job failure to user
 */
export function emitJobFailed(userId: string, jobId: string, error: string) {
  if (!io) return;

  io.to(`user:${userId}`).to(`job:${jobId}`).emit('job:failed', {
    jobId,
    error,
  });
}

/**
 * Get number of connected sockets for a user
 */
export function getUserSocketCount(userId: string): number {
  return userSockets.get(userId)?.size || 0;
}

