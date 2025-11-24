# File Upload Guide

## Supported File Types

The Note Task Organizer accepts text-based files that can be processed by the AI inference service. Currently supported file types:

### Supported Extensions
- `.txt` - Plain text files
- `.md` / `.markdown` - Markdown files
- `.csv` - Comma-separated values
- `.json` - JSON files
- `.html` / `.htm` - HTML files
- `.xml` - XML files

### Supported MIME Types
- `text/plain`
- `text/markdown`
- `text/x-markdown`
- `text/md`
- `text/csv`
- `application/json`
- `text/html`
- `text/xml`
- `application/xml`

## File Size Limits

- **Maximum file size:** 10 MB per file
- **Multiple files:** You can upload multiple files in a single request

## How It Works

1. **Upload**: Files are uploaded via `POST /api/upload`
2. **Validation**: Files are validated by extension and MIME type
3. **Queue**: Valid files are enqueued for background processing
4. **Processing**: Worker reads file content as UTF-8 text
5. **AI Analysis**: Content is sent to inference service for:
   - Subject extraction
   - Task extraction
   - Tag generation
6. **Storage**: Note and tasks are saved to MongoDB

## Example Files

### Markdown Note (Recommended)
```markdown
# Meeting Notes - Q4 Planning

## Agenda
- Review Q3 results
- Plan Q4 initiatives
- Budget allocation

## Action Items
- Schedule follow-up meeting
- Prepare presentation slides
- Review budget proposal

## Tags
#meeting #planning #q4
```

### Plain Text Note
```
TODO List for Today

1. Complete API testing
2. Review pull requests
3. Update documentation
4. Deploy to staging

Priority: High
Category: Development
```

### CSV File
```csv
Task,Status,Due Date
Complete testing,In Progress,2025-12-31
Update docs,Pending,2025-12-15
Deploy,Not Started,2026-01-10
```

## Not Supported

The following file types are **not supported** (will be rejected):

- Binary files: `.pdf`, `.docx`, `.xlsx`, `.pptx`
- Images: `.jpg`, `.png`, `.gif`, etc.
- Archives: `.zip`, `.tar`, `.gz`
- Executables: `.exe`, `.app`, `.bin`
- Media: `.mp4`, `.mp3`, `.avi`, etc.

**Why?** The system processes files as UTF-8 text. Binary files cannot be read as text and would cause errors.

## Future Enhancements

Planned support for additional file types:
- **PDF**: PDF text extraction (requires PDF parsing library)
- **DOCX**: Word document text extraction
- **XLSX**: Excel spreadsheet parsing
- **Images with OCR**: Text extraction from images

## Error Handling

### File Type Not Supported
```json
{
  "message": "File validation error",
  "error": "File type not supported. Allowed types: .txt, .md, .markdown, .csv, .json, .html, .htm, .xml. Received: document.pdf (application/pdf)"
}
```

### File Too Large
```json
{
  "message": "File too large",
  "error": "File size exceeds 10MB limit"
}
```

### Processing Errors
If a file passes validation but fails during processing (e.g., encoding issues), the job will be marked as failed and you'll receive an error in the job status.

## Best Practices

1. **Use Markdown**: Markdown files work best for structured notes with tasks
2. **UTF-8 Encoding**: Ensure files are saved with UTF-8 encoding
3. **Clear Structure**: Use headings, lists, and formatting for better AI extraction
4. **Task Format**: Use bullet points (`-`, `*`) or numbered lists for tasks
5. **File Naming**: Use descriptive filenames - they become note titles

## API Usage

### Upload Single File
```bash
curl -X POST http://localhost:5001/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@note.md" \
  -F "category=work" \
  -F "isPrivate=false"
```

### Upload Multiple Files
```bash
curl -X POST http://localhost:5001/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@note1.md" \
  -F "files=@note2.txt" \
  -F "category=personal"
```

### Check Job Status
```bash
curl -X GET http://localhost:5001/api/jobs/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Postman Collection

The Postman collection includes a pre-configured upload request. Simply:
1. Select the file(s) in the form-data
2. Set category (work/personal)
3. Set isPrivate (true/false)
4. Send request

The job ID will be automatically saved to the environment for status checking.

