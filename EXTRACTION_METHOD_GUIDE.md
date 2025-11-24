# How to Check Which Extraction Method Was Used

The system uses two methods for extracting tasks from notes:
1. **AI Model** (Ollama) - More accurate, understands context
2. **Fallback Extraction** (Heuristics) - Pattern-based, works when AI is unavailable

## Method 1: Check Worker Logs

The worker logs clearly indicate which method was used:

### AI Model Used:
```
[Inference] Model: phi4-mini:3.8b, Response time: 1234ms
[Inference] ✓ Using AI model: phi4-mini:3.8b
[Inference] Raw tasks from model: [...]
[Inference] Final tasks after filtering: [...]
```

### Fallback Extraction Used:
```
[Inference] ✗ AI model failed, using fallback extraction: [error message]
[Inference] ⚠️  Using fallback extraction (heuristics)
[Inference] Fallback extracted 3 tasks
```

**To view logs:**
```bash
# If worker is running in terminal, you'll see logs there
# Or check log files:
tail -f /tmp/worker-*.log
```

## Method 2: Check Database (Note Metadata)

Each note stores extraction metadata in the `aiMetadata` field:

```javascript
{
  "aiMetadata": {
    "model": "phi4-mini:3.8b",  // Model name or "fallback"
    "method": "ai",              // "ai" or "fallback"
    "confidence": 0.8,            // 0.8 for AI, 0.5 for fallback
    "processingTime": 1234567890,
    "version": "1.0"
  }
}
```

### Using MongoDB:
```javascript
// Find notes using AI
db.notes.find({ "aiMetadata.method": "ai" })

// Find notes using fallback
db.notes.find({ "aiMetadata.method": "fallback" })

// Check a specific note
db.notes.findOne({ _id: ObjectId("...") })
```

### Using API:
```bash
# Get a note and check aiMetadata
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/notes/NOTE_ID

# Response will include:
# {
#   "aiMetadata": {
#     "method": "ai",  // or "fallback"
#     "model": "phi4-mini:3.8b",
#     "confidence": 0.8
#   }
# }
```

## Method 3: Confidence Score

- **AI Model**: `confidence: 0.8` (default)
- **Fallback**: `confidence: 0.5`

Lower confidence usually indicates fallback extraction.

## Quick Check Script

```bash
# Check recent notes and their extraction method
mongosh note-task-organizer --eval "
  db.notes.find({}, {
    title: 1,
    'aiMetadata.method': 1,
    'aiMetadata.model': 1,
    'aiMetadata.confidence': 1
  }).sort({ createdAt: -1 }).limit(10).pretty()
"
```

## Troubleshooting

### If AI is not being used:

1. **Check Ollama is running:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Check environment variables:**
   ```bash
   # In server/.env
   INFERENCE_SERVICE_URL=http://localhost:11434
   INFERENCE_MODEL=phi4-mini:3.8b
   ```

3. **Check worker logs for connection errors:**
   ```bash
   # Look for "ECONNREFUSED" or "fetch failed"
   tail -f /tmp/worker-*.log | grep -i "inference\|error"
   ```

4. **Restart worker after fixing:**
   ```bash
   cd server
   pnpm dev:worker
   ```

## Summary

- **Logs**: Look for `✓ Using AI model` or `⚠️ Using fallback extraction`
- **Database**: Check `aiMetadata.method` field (`"ai"` or `"fallback"`)
- **Confidence**: `0.8` = AI, `0.5` = Fallback

