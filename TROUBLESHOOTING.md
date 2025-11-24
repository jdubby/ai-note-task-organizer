# Troubleshooting Guide

## Common Issues

### 403 Forbidden on Registration/Login (macOS)

**Problem:** Getting 403 errors when trying to register or login.

**Cause:** macOS AirPlay Receiver (ControlCenter) uses port 5000 by default, blocking your server.

**Solutions:**

#### Option 1: Disable AirPlay Receiver (Recommended)
1. Open **System Settings** (or System Preferences on older macOS)
2. Go to **General** → **AirDrop & Handoff**
3. Turn off **AirPlay Receiver**

#### Option 2: Use a Different Port
Update your `.env` file:
```env
PORT=5001
```

Or start server with:
```bash
PORT=5001 pnpm dev
```

Then update Postman environment variable `base_url` to `http://localhost:5001`

#### Option 3: Kill ControlCenter (Temporary)
```bash
killall ControlCenter
```
Note: This will restart on next login.

### MongoDB Connection Issues

**Problem:** `MongoDB connection error: Authentication failed`

**Solution:** 
1. Check Docker is running: `docker-compose ps`
2. Verify MongoDB is healthy: `docker-compose ps mongodb`
3. Check `.env` file has correct `MONGODB_URI`
4. For development, you can use connection without auth:
   ```env
   MONGODB_URI=mongodb://localhost:27017/note-task-organizer
   ```

### Worker Not Processing Jobs

**Problem:** Jobs stay in "waiting" or "active" state

**Solution:**
1. Ensure worker is running: `pnpm dev:worker`
2. Check Redis is running: `docker-compose ps redis`
3. Check worker logs for errors
4. Verify Redis connection in worker logs

### Socket.IO Connection Issues

**Problem:** Can't connect to Socket.IO

**Solution:**
1. Ensure server is running with Socket.IO initialized
2. Check `CLIENT_URL` in `.env` matches your frontend URL
3. Verify token is being sent in connection:
   ```javascript
   socket.io('http://localhost:5000', {
     auth: { token: 'your-jwt-token' }
   })
   ```

### Port Already in Use

**Problem:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port
PORT=5001 pnpm dev
```

### TypeScript Build Errors

**Problem:** `error TS6059: File is not under 'rootDir'`

**Solution:**
This is a known limitation when importing from shared packages. The build still works - this only affects `type-check`. You can:
1. Ignore it (build works fine)
2. Use `pnpm build` instead of `pnpm type-check`
3. Adjust tsconfig.json to remove rootDir restriction

### Jobs Not Completing

**Problem:** Upload jobs stay in "active" state

**Possible Causes:**
1. Worker not running
2. Inference service unavailable (will use fallback)
3. MongoDB connection issues
4. File processing errors

**Debug:**
1. Check worker logs: `tail -f /tmp/worker-*.log`
2. Check server logs for errors
3. Verify MongoDB connection
4. Test inference service: `curl http://localhost:11434/api/tags` (if using Ollama)

## Getting Help

1. Check server logs: `tail -f /tmp/server-*.log`
2. Check worker logs: `tail -f /tmp/worker-*.log`
3. Verify services: `docker-compose ps`
4. Test endpoints individually with curl
5. Check Postman collection for correct request format

