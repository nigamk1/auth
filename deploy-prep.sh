#!/bin/bash

# Deployment preparation script for Render
echo "🚀 Preparing Auth System for Render deployment..."

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm install
cd ../frontend && npm install
cd ..

# Build projects
echo "🔨 Building projects..."
cd backend && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    exit 1
fi

cd ../frontend && npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

cd ..

echo "✅ Build successful!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub/GitLab/Bitbucket"
echo "2. Go to https://render.com and create a new Blueprint"
echo "3. Connect your repository"
echo "4. Set the required environment variables (see DEPLOYMENT.md)"
echo "5. Deploy!"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
