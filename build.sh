#!/bin/bash

# Build script for Render deployment
echo "Starting build process..."

# Install backend dependencies and build
echo "Building backend..."
cd backend
npm install
npm run build

# Install frontend dependencies and build
echo "Building frontend..."
cd ../frontend
npm install
npm run build

echo "Build process completed!"
