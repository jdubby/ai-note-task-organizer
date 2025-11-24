#!/bin/bash

# Start Docker services
echo "Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 5

# Check if services are running
docker-compose ps

echo ""
echo "Development environment ready!"
echo "MongoDB: mongodb://admin:password@localhost:27017/note-task-organizer?authSource=admin"
echo "Redis: localhost:6379"
echo "MinIO: http://localhost:9000 (admin/minioadmin)"
echo "MinIO Console: http://localhost:9001"

