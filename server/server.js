const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { processUploadedFile } = require('./utils/aiProcessor');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with increased timeout
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000, // Increase socket timeout
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Routes
app.use('/api/notes', require('./routes/notes'));
app.use('/api/tasks', require('./routes/tasks'));

// File upload endpoint
// Update the upload endpoint with better error handling
app.post('/api/upload', upload.array('files'), async (req, res) => {
  try {
    console.log('Upload request received:', req.files);
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const { category, isPrivate } = req.body;
    const results = [];
    
    for (const file of req.files) {
      console.log('Processing file:', file.originalname);
      try {
        const result = await processUploadedFile(
          file, 
          category || 'work',
          isPrivate === 'true'
        );
        results.push(result);
      } catch (fileError) {
        console.error('Error processing individual file:', file.originalname, fileError);
        // Continue with other files even if one fails
        results.push({
          error: true,
          file: file.originalname,
          message: fileError.message
        });
      }
    }
    
    res.status(200).json({ 
      message: 'Files processed successfully', 
      results 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Error processing files', 
      error: error.message 
    });
  }
});

// Add this near the end of your server.js file, after all other routes
// but before the app.listen() call

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Any routes not handled before will return the React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// For development, add a simple route for the root path
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});