#!/bin/bash
# Quick test script for Ollama model task extraction

MODEL="${1:-phi4-mini:3.8b}"
echo "Testing ${MODEL} with Ollama..."
echo ""

# First check if Ollama is running
if ! curl -s --max-time 2 http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "❌ Ollama is not running or not accessible"
  exit 1
fi

echo "✓ Ollama is running"
echo ""

# Test with a simple note containing tasks
echo "Sending request (this may take 10-60 seconds for ${MODEL})..."
echo "Note: Press Ctrl+C to cancel if it takes too long"
echo ""

# Use curl with max-time (works on macOS)
RESPONSE=$(curl -s --max-time 120 -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"${MODEL}\",
    \"prompt\": \"Extract tasks from this note. Return ONLY valid JSON:\\n\\n{\\n  \\\"subject\\\": \\\"main topic\\\",\\n  \\\"tasks\\\": [\\\"task 1\\\", \\\"task 2\\\"],\\n  \\\"tags\\\": [\\\"tag1\\\", \\\"tag2\\\"]\\n}\\n\\nNote: I need to review the quarterly report, schedule a meeting with the team, and update the project timeline.\\n\\nReturn ONLY the JSON object:\",
    \"stream\": false,
    \"format\": \"json\",
    \"options\": {
      \"temperature\": 0.3,
      \"num_predict\": 200
    }
  }")

EXIT_CODE=$?

if [ $EXIT_CODE -eq 28 ]; then
  echo ""
  echo "❌ Request timed out after 120 seconds"
  echo "   ${MODEL} may be taking longer than expected"
  exit 1
fi

if [ -z "$RESPONSE" ]; then
  echo "❌ Empty response from Ollama"
  exit 1
fi

# Try to parse and pretty-print JSON
echo "$RESPONSE" | python3 -m json.tool 2>&1

if [ $? -ne 0 ]; then
  echo ""
  echo "⚠️  Response is not valid JSON. Raw response:"
  echo "$RESPONSE"
fi

