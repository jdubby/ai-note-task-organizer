# Task Extraction Guide

## How Task Extraction Works

The system uses AI (or fallback heuristics) to identify actionable tasks from uploaded notes.

## What Counts as a Task?

A **task** is:
- ✅ An action item that requires someone to do something
- ✅ Something that can be completed (has a clear end state)
- ✅ Usually starts with action verbs (complete, review, send, schedule, etc.)
- ✅ Has a clear action verb

A **task is NOT**:
- ❌ A fact or statement
- ❌ A question
- ❌ A heading or section title
- ❌ Descriptive text
- ❌ Something already completed (unless marked as pending)

## Examples

### ✅ Good Tasks
- "Complete API testing"
- "Review pull requests"
- "Schedule follow-up meeting"
- "Send email to team"
- "Update documentation"
- "Fix bug in login flow"

### ❌ Not Tasks
- "The meeting was productive" (statement)
- "What should we do next?" (question)
- "## Action Items" (heading)
- "We discussed the budget" (description)
- "Completed: API testing" (already done)

## AI Processing

### When Inference Service is Available (Ollama)
The AI uses a structured prompt that:
1. Analyzes the note content
2. Identifies actionable tasks (not facts or descriptions)
3. Extracts subject and tags
4. Returns structured JSON

### When Inference Service is Unavailable (Fallback)
The system uses conservative heuristics:
- Looks for explicit markers: `TODO:`, `[ ]`, action verbs
- Filters out statements, questions, and headings
- Only extracts items with clear action words

## Improving Task Extraction

### Format Your Notes Better

**Good Format:**
```markdown
# Meeting Notes

## Action Items
- Complete API testing by Friday
- Review pull requests
- Schedule follow-up meeting
- Send email to stakeholders

## Discussion
We discussed the budget and timeline.
The project is on track.
```

**Poor Format:**
```markdown
# Meeting Notes

We had a meeting. The project is going well.
We need to do some things.
The team is happy with progress.
```

### Use Clear Task Markers

- `TODO: Task description`
- `- [ ] Task description`
- `* Task description` (with action verbs)
- `- Action verb + description`

### Action Verbs That Help

Tasks starting with these verbs are more likely to be detected:
- complete, finish, do, make, create
- send, review, update, fix
- schedule, call, meet, prepare
- write, submit, follow up
- implement, deploy, test, build
- design, analyze, research

## Troubleshooting

### Too Many False Positives

If the system is extracting non-tasks:
1. Check if Ollama is running: `curl http://localhost:11434/api/tags`
2. Review the note format - use clear task markers
3. Check worker logs for extraction details
4. The system now filters out statements and questions

### Too Few Tasks Extracted

If tasks are being missed:
1. Ensure tasks use action verbs
2. Use explicit markers like `TODO:` or `[ ]`
3. Put tasks in a clear "Action Items" or "Tasks" section
4. Check if inference service is running (better extraction)

### Manual Task Creation

You can always create tasks manually via the API:
```bash
POST /api/tasks
{
  "description": "Your task description",
  "noteId": "note-id",
  "status": "pending"
}
```

## Configuration

### Inference Service (Ollama)

To use AI extraction:
1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull phi3.5:mini`
3. Start Ollama: `ollama serve`
4. Set in `.env`:
   ```env
   INFERENCE_SERVICE_URL=http://localhost:11434
   INFERENCE_MODEL=phi3.5:mini
   ```

### Fallback Mode

If Ollama is not available, the system automatically uses conservative heuristics. This is less accurate but still functional.

## Best Practices

1. **Use clear structure**: Separate tasks from discussion/notes
2. **Use action verbs**: Start tasks with verbs
3. **Mark explicitly**: Use `TODO:`, `[ ]`, or bullet points
4. **Be specific**: "Review PR #123" is better than "Review things"
5. **Separate sections**: Put tasks in their own section

## Example Note Format

```markdown
# Project Planning Meeting

## Summary
We discussed the Q4 roadmap and budget allocation.

## Action Items
- [ ] Complete API testing by Friday
- [ ] Review pull requests from team
- [ ] Schedule follow-up meeting with stakeholders
- [ ] Send budget proposal to finance

## Notes
The team is aligned on priorities.
Budget approval is pending.
```

This format will extract 4 clear tasks from the "Action Items" section.

