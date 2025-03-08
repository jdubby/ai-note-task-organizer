#!/bin/bash

# Set up remote origin
git remote add origin https://github.com/jdubby/ai-note-task-organizer.git

# Stage all files
git add .

# Commit
git commit -m "Initial commit: Note Task Organizer application"

# Push to GitHub
git push -u origin main

echo "Repository setup complete!"
