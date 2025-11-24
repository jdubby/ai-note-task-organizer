# Postman Collection - Testing Guide

## Overview

This Postman collection provides comprehensive end-to-end testing for the Note Task Organizer API. It includes all endpoints with automatic token management and variable handling.

## Setup

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Import both files:
   - `Note-Task-Organizer-API.postman_collection.json`
   - `Note-Task-Organizer.postman_environment.json`
4. Select the environment: **Note Task Organizer - Local**

### 2. Configure Base URL

**Default:** The collection uses `http://localhost:5001` to avoid macOS AirPlay Receiver conflicts.

**⚠️ Important on macOS:** Port 5000 is often used by AirPlay Receiver, causing 403 errors. The collection defaults to port 5001.

**To use port 5000 instead:**
1. Disable AirPlay Receiver: System Settings → General → AirDrop & Handoff → Turn off AirPlay Receiver
2. Update `base_url` in environment to `http://localhost:5000`
3. Start server: `PORT=5000 pnpm dev`

**To use port 5001 (recommended):**
1. Start server: `PORT=5001 pnpm dev`
2. Collection is already configured for port 5001

To change the base URL:
1. Select the environment: **Note Task Organizer - Local**
2. Edit the `base_url` variable
3. For production, use your production URL

### 3. Start Services

Before testing, ensure services are running:

```bash
# Terminal 1: Start API server (using port 5001 to avoid macOS AirPlay conflict)
cd server
PORT=5001 pnpm dev

# Terminal 2: Start worker (for file uploads)
cd server
pnpm dev:worker

# Terminal 3: Start Docker services
docker-compose up -d
```

**Note:** If you prefer port 5000, disable AirPlay Receiver first (see Troubleshooting section).

## Testing Workflow

### Step 1: Authentication

1. **Register User** - Creates a new account
   - Automatically saves `auth_token`, `user_id`, and `user_email` to environment
   - Or use **Login** if user already exists

2. **Get Current User** - Verify authentication
   - Should return your user information

### Step 2: Create Content

1. **Create Note** - Creates a note manually
   - Automatically saves `note_id` to environment
   - AI will extract subject and tasks

2. **Create Task** - Creates a task manually
   - Automatically saves `task_id` to environment
   - Can link to a note using `note_id`

### Step 3: File Upload (Background Processing)

1. **Upload File** - Upload a markdown/text file
   - Returns `202 Accepted` with job ID
   - Automatically saves `upload_job_id` to environment
   - File is processed asynchronously by worker

2. **Get Job Status** - Check upload processing status
   - States: `waiting`, `active`, `completed`, `failed`
   - Shows progress percentage
   - Poll this endpoint until `completed`

3. **Get All Notes** - Verify note was created
   - Should show the uploaded note after job completes

4. **Get All Tasks** - Verify tasks were extracted
   - Should show tasks extracted from the uploaded file

### Step 4: CRUD Operations

1. **Get All Notes** - List all your notes
   - Optional query: `?category=work` or `?category=personal`

2. **Get Note by ID** - Get specific note
   - Uses `note_id` from environment

3. **Update Note** - Modify a note
   - Updates title, content, tags, etc.

4. **Search Notes** - Text search
   - Search term in URL path
   - Optional category filter

5. **Get All Tasks** - List all tasks
   - Optional filters: `?status=pending&category=work`

6. **Update Task** - Change task status/description
   - Mark as completed, change due date, etc.

7. **Export Tasks** - Download tasks
   - JSON: `/api/tasks/export/json`
   - CSV: `/api/tasks/export/csv`

### Step 5: Cleanup

1. **Delete Task** - Remove a task
2. **Delete Note** - Remove a note (also deletes associated tasks)

## Collection Structure

```
Note Task Organizer API
├── Authentication
│   ├── Register User
│   ├── Login
│   └── Get Current User
├── Notes
│   ├── Get All Notes
│   ├── Get Note by ID
│   ├── Create Note
│   ├── Update Note
│   ├── Delete Note
│   └── Search Notes
├── Tasks
│   ├── Get All Tasks
│   ├── Get Task by ID
│   ├── Create Task
│   ├── Update Task
│   ├── Delete Task
│   ├── Export Tasks (JSON)
│   └── Export Tasks (CSV)
├── File Upload
│   ├── Upload File
│   └── Get Job Status
└── Health Check
    └── API Health
```

## Environment Variables

The collection automatically manages these variables:

- `base_url` - API base URL (default: http://localhost:5000)
- `auth_token` - JWT token (auto-set after login/register)
- `user_id` - Current user ID (auto-set after login/register)
- `user_email` - Current user email (auto-set after login/register)
- `note_id` - Last created note ID (auto-set after creating note)
- `task_id` - Last created task ID (auto-set after creating task)
- `upload_job_id` - Last upload job ID (auto-set after uploading file)

## Test Scripts

The collection includes automatic test scripts that:

1. **After Register/Login**: Save token and user info to environment
2. **After Create Note**: Save note ID to environment
3. **After Create Task**: Save task ID to environment
4. **After Upload File**: Save job ID to environment

## Example Test Flow

### Complete End-to-End Test

1. **Register User** → Token saved automatically
2. **Get Current User** → Verify authentication
3. **Upload File** → Get job ID
4. **Get Job Status** → Wait for completion (poll if needed)
5. **Get All Notes** → Verify note created
6. **Get All Tasks** → Verify tasks extracted
7. **Update Task** → Mark a task as completed
8. **Search Notes** → Test search functionality
9. **Export Tasks** → Download tasks as CSV/JSON
10. **Delete Note** → Cleanup

## Tips

1. **File Upload**: Create a test markdown file with tasks:
   ```markdown
   # Test Note
   
   ## Tasks
   - Task 1
   - Task 2
   - Task 3
   ```

2. **Job Status**: Poll the job status endpoint every 2-3 seconds until state is `completed`

3. **Multiple Files**: The upload endpoint accepts multiple files - add more files to the form-data

4. **Error Testing**: Try requests without `Authorization` header to test authentication

5. **Environment Switching**: Create multiple environments for dev/staging/production

## Troubleshooting

### Token Not Saving
- Check that test scripts are enabled in Postman settings
- Verify response format matches expected structure

### Job Not Processing
- Ensure worker is running: `pnpm dev:worker`
- Check Redis is running: `docker-compose ps redis`
- Check worker logs for errors

### 401 Unauthorized
- Token may have expired (default: 7 days)
- Re-run Login or Register to get new token

### 404 Not Found
- Check that IDs in environment variables are correct
- Verify resource belongs to authenticated user

## Next Steps

- Add more test cases for edge cases
- Create automated test suite using Postman's test runner
- Set up CI/CD integration with Newman (Postman CLI)

