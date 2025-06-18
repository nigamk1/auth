#!/bin/bash

# Deploy script for Auth System to Vercel
# This script helps deploy both frontend and backend to Vercel

echo "🚀 Auth System Deployment Script"
echo "================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

echo ""
echo "🔧 Please ensure you have:"
echo "  1. MongoDB Atlas database ready"
echo "  2. Environment variables prepared"
echo "  3. Vercel account logged in"
echo ""

read -p "Do you want to continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo "📋 Deployment Steps:"
echo "1. Deploy Backend first"
echo "2. Deploy Frontend with backend URL"
echo ""

# Deploy Backend
echo "🔴 Deploying Backend..."
echo "========================"
cd backend

echo "Installing backend dependencies..."
npm install

echo "Building backend..."
npm run build

echo "Deploying to Vercel..."
vercel --prod

echo ""
echo "📝 IMPORTANT: Copy the backend URL from above and use it for VITE_API_URL"
echo ""
read -p "Press Enter after you've noted the backend URL..."

cd ..

# Deploy Frontend  
echo ""
echo "🔵 Deploying Frontend..."
echo "========================"
cd frontend

echo "Installing frontend dependencies..."
npm install

echo ""
read -p "Enter your backend URL (e.g., https://your-backend.vercel.app): " BACKEND_URL

# Create production environment file
echo "VITE_API_URL=$BACKEND_URL/api" > .env.production

echo "Building frontend..."
npm run build

echo "Deploying to Vercel..."
vercel --prod

cd ..

echo ""
echo "✅ Deployment Complete!"
echo "======================="
echo ""
echo "📝 Next Steps:"
echo "1. Update ALLOWED_ORIGINS in backend Vercel settings with your frontend URL"
echo "2. Test your application end-to-end"
echo "3. Configure any additional environment variables needed"
echo ""
echo "📖 For detailed configuration, see DEPLOYMENT.md"
