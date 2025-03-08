#!/bin/bash

# Set up the remote repository
git remote add origin https://github.com/jdubby/note-task-organizer.git

# Fetch the remote branches (if any)
git fetch

# Ensure we're on the main branch
git checkout -b main

# Add all files
git add .

# Commit the files
git commit -m "Initial commit"

# Push to GitHub
git push -u origin main

echo "Repository has been pushed to GitHub successfully!"
