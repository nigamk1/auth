#!/bin/bash

# Full-stack start script for Render
echo "🚀 Starting Full-Stack Auth System..."

# Start backend in background
echo "📡 Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 5

# Serve frontend static files
echo "🌐 Starting frontend server..."
cd ../frontend && npm run preview &
FRONTEND_PID=$!

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID

echo "🛑 Application stopped"
