import dotenv from 'dotenv';

dotenv.config();

export interface InferenceRequest {
  content: string;
  model?: string;
}

export interface InferenceResponse {
  subject: string;
  tasks: string[];
  tags: string[];
  confidence: number;
  method: 'ai' | 'fallback'; // Indicates which extraction method was used
  model?: string; // Model name if AI was used
}

const INFERENCE_SERVICE_URL = process.env.INFERENCE_SERVICE_URL || 'http://localhost:11434';
const INFERENCE_SERVICE_TOKEN = process.env.INFERENCE_SERVICE_TOKEN || '';
const DEFAULT_MODEL = process.env.INFERENCE_MODEL || 'phi3.5:mini'; // Ollama model name

/**
 * Call self-hosted inference service (Ollama/vLLM)
 * For now, uses Ollama API format. Can be adapted for vLLM later.
 */
export async function callInferenceService(
  request: InferenceRequest
): Promise<InferenceResponse> {
  const model = request.model || DEFAULT_MODEL;
  const startTime = Date.now();

  try {
    // Structured prompt following expert NLP system instructions
    // Using explicit JSON schema format for better model compliance
    const prompt = `You are an expert natural language processing system that converts unstructured text notes into a single, comprehensive JSON object that conforms precisely to the provided schema.

CRITICAL INSTRUCTIONS:
1. First, analyze the entire note and assign it one single 'category' from: 'work' or 'personal'.
2. Crucially, analyze the note for any actionable items or pending to-dos, regardless of their formatting or placement within the text.
3. Every extracted task must be a concise, standalone action phrase that starts with a verb and makes sense outside the original context.
4. Do NOT include non-actionable statements, casual thoughts, or descriptive sentences in the 'tasks' list.
5. Return ONLY valid JSON - no markdown, no code blocks, no explanations.

REQUIRED JSON SCHEMA:
{
  "subject": "main topic or subject (one short phrase)",
  "tasks": ["actionable task 1", "actionable task 2"],
  "tags": ["relevant tag1", "relevant tag2"]
}

Note content to analyze:
${request.content}

Return ONLY the JSON object matching the schema above, with no additional text, markdown, or formatting:`;

    // Call Ollama API with timeout for large models
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout for large models
    
    try {
      const response = await fetch(`${INFERENCE_SERVICE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(INFERENCE_SERVICE_TOKEN && { Authorization: `Bearer ${INFERENCE_SERVICE_TOKEN}` }),
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: 'json', // Request JSON format
          options: {
            temperature: 0.3,
            top_p: 0.9,
            num_predict: 500, // Limit response length for faster processing
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Inference service error: ${response.statusText}`);
      }

      const responseText = await response.text();
      const processingTime = Date.now() - startTime;

      // Log raw response for debugging
      console.log(`[Inference] Model: ${model}, Response time: ${processingTime}ms`);
      console.log(`[Inference] Raw response (first 1000 chars):`, responseText.substring(0, 1000));

      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from inference service');
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[Inference] Failed to parse response as JSON:`, parseError);
        console.error(`[Inference] Response text:`, responseText);
        throw new Error('Invalid JSON response from inference service');
      }

      // Parse response (Ollama returns response in 'response' field)
      let parsed: any;
      try {
        const responseText = data.response || data.text || JSON.stringify(data);
        console.log(`[Inference] Response text (first 500 chars):`, responseText.substring(0, 500));
        parsed = JSON.parse(responseText);
        console.log(`[Inference] Parsed JSON:`, JSON.stringify(parsed, null, 2));
      } catch (parseError) {
        console.error(`[Inference] JSON parse error:`, parseError);
        // Fallback: try to extract JSON from text
        const responseText = data.response || data.text || JSON.stringify(data);
        console.log(`[Inference] Attempting to extract JSON from text...`);
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log(`[Inference] Found JSON match:`, jsonMatch[0].substring(0, 500));
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          console.error(`[Inference] No JSON found in response. Full response:`, responseText);
          throw new Error('Failed to parse JSON response from inference service');
        }
      }

      // Filter and validate tasks - trust AI extraction more, just basic validation
      const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      console.log(`[Inference] Raw tasks from model:`, rawTasks);
      
      const filteredTasks = rawTasks
        .map((task: any) => String(task).trim())
        .filter((task: string) => {
          // Basic validation - AI should handle the intelligent filtering
          const isValid = (
            task.length > 3 && // Must have content
            task.length < 200 && // Not too long
            !task.match(/^#+\s/) && // Not a heading
            task.length > 0 // Not empty
          );
          if (!isValid) {
            console.log(`[Inference] Filtered out task: "${task}"`);
          }
          return isValid;
        });

      console.log(`[Inference] Final tasks after filtering:`, filteredTasks);
      console.log(`[Inference] Subject:`, parsed.subject || 'Unclassified');
      console.log(`[Inference] Tags:`, Array.isArray(parsed.tags) ? parsed.tags : []);
      console.log(`[Inference] ✓ Using AI model: ${model}`);

      return {
        subject: parsed.subject || 'Unclassified',
        tasks: filteredTasks,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        confidence: parsed.confidence || 0.8,
        method: 'ai',
        model,
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Inference service request timed out after 3 minutes');
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('[Inference] ✗ AI model failed, using fallback extraction:', error.message);
    const processingTime = Date.now() - startTime;

    // Fallback to heuristic extraction
    return fallbackExtraction(request.content, processingTime);
  }
}

/**
 * Fallback extraction when inference service is unavailable
 * More conservative - only extracts clear task indicators
 */
function fallbackExtraction(content: string, _processingTime: number): InferenceResponse {
  // Enhanced heuristic extraction - looks for narrative-style tasks too
  const lines = content.split('\n').filter((line) => line.trim());
  const tasks: string[] = [];
  const tags: string[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    
    // Skip headings and very short lines
    if (trimmed.match(/^#+\s/) || trimmed.length < 10) {
      return;
    }

    // Check for explicit task markers (TODO, checkboxes, bullets)
    if (
      trimmed.match(/^TODO:/i) ||
      trimmed.match(/^\[ \]\s+/) ||
      trimmed.match(/^[-*•]\s+/)
    ) {
      let taskText = trimmed
        .replace(/^\[ \]\s+/, '')
        .replace(/^[-*•]\s+/, '')
        .replace(/^TODO:?\s*/i, '')
        .trim();
      
      if (taskText.length > 3 && taskText.length < 200) {
        tasks.push(taskText);
      }
      return;
    }

    // Look for narrative-style commitments (e.g., "Jonathan will share documentation")
    // Pattern: [Name] [will|committed to|agreed to] [action]
    const commitmentMatch = trimmed.match(/\b(\w+)\s+(will|committed to|agreed to)\s+(.+?)(?:\.|$)/i);
    if (commitmentMatch && commitmentMatch[3]) {
      const action = commitmentMatch[3].trim();
      // Check if it contains actionable verbs
      if (action.match(/\b(share|provide|confirm|check|coordinate|schedule|send|review|update|prepare|write|submit|follow up|document|clarify)\b/i)) {
        let taskText = action.replace(/\.$/, '').trim();
        if (taskText.length > 5 && taskText.length < 150) {
          tasks.push(taskText);
        }
      }
    }

    // Look for "will [verb]" patterns more broadly
    const willMatch = trimmed.match(/\b(\w+)\s+will\s+(\w+[^.!?]*?)(?:\.|$)/i);
    if (willMatch && willMatch[2]) {
      const action = willMatch[2].trim();
      if (action.length > 5 && action.length < 150 && 
          action.match(/\b(share|provide|confirm|check|coordinate|schedule|send|review|update|prepare|write|submit|follow up|document|clarify)\b/i)) {
        tasks.push(action.replace(/\.$/, '').trim());
      }
    }
  });

  // Extract first line as subject (skip if it's a heading)
  let subject = lines[0]?.substring(0, 50) || 'Unclassified';
  if (subject.startsWith('#')) {
    subject = subject.replace(/^#+\s*/, '');
  }

  console.log(`[Inference] ⚠️  Using fallback extraction (heuristics)`);
  console.log(`[Inference] Fallback extracted ${tasks.length} tasks`);

  return {
    subject: subject || 'Unclassified',
    tasks,
    tags,
    confidence: 0.5, // Lower confidence for fallback
    method: 'fallback',
  };
}

/**
 * Health check for inference service
 */
export async function checkInferenceServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${INFERENCE_SERVICE_URL}/api/tags`, {
      method: 'GET',
      headers: {
        ...(INFERENCE_SERVICE_TOKEN && { Authorization: `Bearer ${INFERENCE_SERVICE_TOKEN}` }),
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

