# Vercel Deployment Helper Script for Windows PowerShell
# This script helps you prepare and deploy your auth system to Vercel

Write-Host "🚀 Auth System Vercel Deployment Helper" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Pre-deployment Checklist:" -ForegroundColor Yellow
Write-Host "1. ✅ MongoDB Atlas cluster created"
Write-Host "2. ✅ Gmail app password generated (or SMTP configured)"
Write-Host "3. ✅ GitHub repository created and code pushed"
Write-Host "4. ✅ Vercel account created"
Write-Host ""

Write-Host "🔧 Deployment Steps:" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 1: Deploy Backend" -ForegroundColor Magenta
Write-Host "----------------------"
Write-Host "1. Go to https://vercel.com/dashboard"
Write-Host "2. Click 'New Project'"
Write-Host "3. Import your GitHub repository"
Write-Host "4. Set Root Directory to: backend"
Write-Host "5. Add the following environment variables:"
Write-Host ""
Write-Host "Required Environment Variables (Backend):" -ForegroundColor Green
Write-Host "NODE_ENV=production"
Write-Host "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auth_system"

# Generate random secrets
$accessSecret = [System.Web.Security.Membership]::GeneratePassword(64, 0)
$refreshSecret = [System.Web.Security.Membership]::GeneratePassword(64, 0)
$resetSecret = [System.Web.Security.Membership]::GeneratePassword(64, 0)

Write-Host "JWT_ACCESS_SECRET=$accessSecret" -ForegroundColor DarkGreen
Write-Host "JWT_REFRESH_SECRET=$refreshSecret" -ForegroundColor DarkGreen
Write-Host "PASSWORD_RESET_SECRET=$resetSecret" -ForegroundColor DarkGreen
Write-Host "EMAIL_USER=your-email@gmail.com"
Write-Host "EMAIL_APP_PASSWORD=your-gmail-app-password"
Write-Host "EMAIL_FROM=your-email@gmail.com"
Write-Host "FRONTEND_URL=https://your-frontend-domain.vercel.app"
Write-Host "ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app"
Write-Host ""

Write-Host "STEP 2: Deploy Frontend" -ForegroundColor Magenta
Write-Host "-----------------------"
Write-Host "1. Create another new project in Vercel"
Write-Host "2. Import the same GitHub repository"
Write-Host "3. Set Root Directory to: frontend"
Write-Host "4. Add the following environment variables:"
Write-Host ""
Write-Host "Required Environment Variables (Frontend):" -ForegroundColor Green
Write-Host "VITE_API_URL=https://your-backend-domain.vercel.app/api"
Write-Host "VITE_APP_NAME=Auth System"
Write-Host ""

Write-Host "STEP 3: Update Backend CORS" -ForegroundColor Magenta
Write-Host "---------------------------"
Write-Host "After frontend is deployed, update backend environment variables:"
Write-Host "FRONTEND_URL=https://your-actual-frontend-domain.vercel.app"
Write-Host "ALLOWED_ORIGINS=https://your-actual-frontend-domain.vercel.app"
Write-Host ""

Write-Host "🔍 Testing Deployment:" -ForegroundColor Yellow
Write-Host "1. Visit https://your-backend-domain.vercel.app/health"
Write-Host "2. Visit your frontend URL"
Write-Host "3. Test registration and login"
Write-Host ""

Write-Host "📖 For detailed instructions, see DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "💡 Helpful Commands:" -ForegroundColor Yellow
Write-Host "Generate Node.js crypto secret:"
Write-Host "  node -e `"console.log(require('crypto').randomBytes(32).toString('hex'))`""
Write-Host ""

Write-Host "Check backend health (using curl if available):"
Write-Host "  curl https://your-backend-domain.vercel.app/health"
Write-Host ""

Write-Host "✨ Happy deploying!" -ForegroundColor Green

# Keep the window open
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
