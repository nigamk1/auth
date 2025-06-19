#!/bin/bash

# Vercel Deployment Helper Script
# This script helps you prepare and deploy your auth system to Vercel

echo "🚀 Auth System Vercel Deployment Helper"
echo "======================================="

echo "📋 Pre-deployment Checklist:"
echo "1. ✅ MongoDB Atlas cluster created"
echo "2. ✅ Gmail app password generated (or SMTP configured)"
echo "3. ✅ GitHub repository created and code pushed"
echo "4. ✅ Vercel account created"
echo ""

echo "🔧 Deployment Steps:"
echo ""

echo "STEP 1: Deploy Backend"
echo "----------------------"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click 'New Project'"
echo "3. Import your GitHub repository"
echo "4. Set Root Directory to: backend"
echo "5. Add the following environment variables:"
echo ""
echo "Required Environment Variables (Backend):"
echo "NODE_ENV=production"
echo "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auth_system"
echo "JWT_ACCESS_SECRET=$(openssl rand -hex 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
echo "PASSWORD_RESET_SECRET=$(openssl rand -hex 32)"
echo "EMAIL_USER=your-email@gmail.com"
echo "EMAIL_APP_PASSWORD=your-gmail-app-password"
echo "EMAIL_FROM=your-email@gmail.com"
echo "FRONTEND_URL=https://your-frontend-domain.vercel.app"
echo "ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app"
echo ""

echo "STEP 2: Deploy Frontend"
echo "-----------------------"
echo "1. Create another new project in Vercel"
echo "2. Import the same GitHub repository"
echo "3. Set Root Directory to: frontend"
echo "4. Add the following environment variables:"
echo ""
echo "Required Environment Variables (Frontend):"
echo "VITE_API_URL=https://your-backend-domain.vercel.app/api"
echo "VITE_APP_NAME=Auth System"
echo ""

echo "STEP 3: Update Backend CORS"
echo "---------------------------"
echo "After frontend is deployed, update backend environment variables:"
echo "FRONTEND_URL=https://your-actual-frontend-domain.vercel.app"
echo "ALLOWED_ORIGINS=https://your-actual-frontend-domain.vercel.app"
echo ""

echo "🔍 Testing Deployment:"
echo "1. Visit https://your-backend-domain.vercel.app/health"
echo "2. Visit your frontend URL"
echo "3. Test registration and login"
echo ""

echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo ""

echo "💡 Helpful Commands:"
echo "Generate JWT secrets:"
echo "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo ""

echo "Check backend health:"
echo "  curl https://your-backend-domain.vercel.app/health"
echo ""

echo "✨ Happy deploying!"
