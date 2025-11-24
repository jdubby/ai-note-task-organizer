# Ollama Setup Guide

Ollama provides better task extraction than the fallback method. Here's how to set it up.

## Installation

### macOS
```bash
# Download and install from https://ollama.ai
# Or use Homebrew:
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows
Download the installer from https://ollama.ai

## Quick Start

1. **Start Ollama:**
   ```bash
   ollama serve
   ```
   This starts the Ollama server on port 11434.

2. **Pull a model** (in a new terminal):
   ```bash
   # Small, fast model (recommended for development)
   ollama pull phi3.5:mini
   
   # Or slightly larger, better quality
   ollama pull phi3.5:3b
   
   # Or even better (but slower)
   ollama pull llama3.2:3b
   ```

3. **Verify it's working:**
   ```bash
   curl http://localhost:11434/api/tags
   ```
   Should return a list of available models.

## Configuration

Update your `.env` file:
```env
INFERENCE_SERVICE_URL=http://localhost:11434
INFERENCE_MODEL=phi3.5:mini
```

## Running Ollama

### Option 1: Manual Start
```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start your server
cd server
PORT=5001 pnpm dev

# Terminal 3: Start worker
cd server
pnpm dev:worker
```

### Option 2: Background Process
```bash
# Start Ollama in background
ollama serve &

# Or use nohup
nohup ollama serve > /tmp/ollama.log 2>&1 &
```

### Option 3: System Service (Linux/macOS)
Create a service file or use launchd (macOS) / systemd (Linux) to auto-start Ollama.

## Model Recommendations

### Development (Fast, Low Resource)
- `phi3.5:mini` - ~2GB RAM, very fast
- `phi3.5:3b` - ~2.5GB RAM, good quality

### Production (Better Quality)
- `llama3.2:3b` - ~2.5GB RAM, excellent quality
- `llama3.1:8b` - ~5GB RAM, best quality (if you have resources)

## Testing

Test Ollama directly:
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "phi3.5:mini",
  "prompt": "Extract tasks from: Complete API testing, Review docs, Schedule meeting",
  "stream": false
}'
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 11434
lsof -i:11434

# Kill it if needed
kill -9 <PID>
```

### Model Not Found
```bash
# List available models
ollama list

# Pull the model again
ollama pull phi3.5:mini
```

### Out of Memory
- Use a smaller model (`phi3.5:mini`)
- Close other applications
- Check available RAM: `free -h` (Linux) or Activity Monitor (macOS)

### Slow Responses
- Use a smaller model
- Reduce `temperature` in inference service (already set to 0.3)
- Check system resources

## Without Ollama

If you don't want to use Ollama, the system will use fallback extraction. However:
- ✅ It works but is less accurate
- ✅ Only extracts items with clear task markers
- ❌ May miss tasks without explicit markers
- ❌ May include some false positives

The fallback method has been improved to be more conservative and accurate.

## Next Steps

1. Install Ollama: https://ollama.ai
2. Start Ollama: `ollama serve`
3. Pull a model: `ollama pull phi3.5:mini`
4. Restart your worker: `pnpm dev:worker`
5. Try uploading a note again

You should see much better task extraction with Ollama running!

