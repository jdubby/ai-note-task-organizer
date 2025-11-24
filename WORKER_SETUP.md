# Worker Setup Guide

## Issue: MongoDB Buffering Timeout

If you see errors like:
```
Operation `notes.insertOne()` buffering timed out after 10000ms
```

This means the worker process doesn't have a MongoDB connection established.

## Solution

The worker process needs its own MongoDB connection. This has been fixed in the code - the worker now connects to MongoDB before processing jobs.

## How It Works

1. **Main Server** (`server/src/index.ts`):
   - Connects to MongoDB on startup
   - Handles API requests
   - Enqueues jobs to Redis

2. **Worker Process** (`server/src/workers/index.ts`):
   - **Now connects to MongoDB** before starting workers
   - Processes jobs from Redis queue
   - Saves notes/tasks to MongoDB

## Running the Worker

### Development
```bash
cd server
pnpm dev:worker
```

### Production
```bash
cd server
pnpm build
node dist/server/src/workers/index.js
```

## Verification

When the worker starts, you should see:
```
MongoDB connected (worker)
Starting background workers...
Upload worker started and ready to process jobs
Redis connected
```

If you see "MongoDB connection error", check:
1. MongoDB is running: `docker-compose ps mongodb`
2. `MONGODB_URI` is set in `.env`
3. Connection string is correct

## Troubleshooting

### Worker can't connect to MongoDB
- Check MongoDB is running: `docker-compose ps mongodb`
- Verify `MONGODB_URI` in `.env`
- Check network connectivity
- Review MongoDB logs: `docker-compose logs mongodb`

### Jobs still timing out
- Ensure worker is running: `ps aux | grep workers/index`
- Check worker logs for errors
- Verify MongoDB connection in worker logs
- Check if MongoDB is under heavy load

### Connection Pool Issues
If you have many workers, you may need to adjust connection pool settings:
```typescript
mongoose.connect(mongoUri, {
  maxPoolSize: 10, // Maximum connections per worker
  minPoolSize: 2,  // Minimum connections
});
```

## Architecture

```
┌─────────────┐
│ API Server  │─── Connects to MongoDB
└──────┬──────┘
       │
       │ Enqueues jobs
       ▼
┌─────────────┐
│ Redis Queue │
└──────┬──────┘
       │
       │ Worker pulls jobs
       ▼
┌─────────────┐
│   Worker    │─── Now connects to MongoDB
└──────┬──────┘
       │
       │ Saves notes/tasks
       ▼
┌─────────────┐
│  MongoDB    │
└─────────────┘
```

## Best Practices

1. **Always run worker separately**: Don't run worker in the same process as API server
2. **Monitor connections**: Check MongoDB connection count
3. **Graceful shutdown**: Worker handles SIGTERM/SIGINT to close connections
4. **Error handling**: Failed jobs are retried automatically (3 attempts)

