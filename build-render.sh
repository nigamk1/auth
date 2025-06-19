#!/bin/bash
set -e

echo "🚀 Starting build process..."

echo "📦 Installing backend dependencies..."
cd backend
npm ci --production=false

echo "🔨 Building backend..."
npm run build

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm ci

echo "🔨 Building frontend..."
npm run build

echo "✅ Build completed successfully!"
echo "Backend built: backend/dist/"
echo "Frontend built: frontend/dist/"
