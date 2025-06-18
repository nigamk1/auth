# PowerShell Deploy script for Auth System to Vercel
# This script helps deploy both frontend and backend to Vercel

Write-Host "🚀 Auth System Deployment Script" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI is installed" -ForegroundColor Green
}
catch {
    Write-Host "❌ Vercel CLI is not installed. Installing..." -ForegroundColor Red
    npm install -g vercel
}

Write-Host ""
Write-Host "🔧 Please ensure you have:" -ForegroundColor Yellow
Write-Host "  1. MongoDB Atlas database ready" -ForegroundColor Yellow
Write-Host "  2. Environment variables prepared" -ForegroundColor Yellow
Write-Host "  3. Vercel account logged in" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Do you want to continue? (y/n)"

if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Deployment Steps:" -ForegroundColor Cyan
Write-Host "1. Deploy Backend first" -ForegroundColor Cyan
Write-Host "2. Deploy Frontend with backend URL" -ForegroundColor Cyan
Write-Host ""

# Deploy Backend
Write-Host "🔴 Deploying Backend..." -ForegroundColor Red
Write-Host "========================" -ForegroundColor Red
Set-Location backend

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Building backend..." -ForegroundColor Yellow
npm run build

Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host ""
Write-Host "📝 IMPORTANT: Copy the backend URL from above and use it for VITE_API_URL" -ForegroundColor Magenta
Write-Host ""
Read-Host "Press Enter after you've noted the backend URL"

Set-Location ..

# Deploy Frontend  
Write-Host ""
Write-Host "🔵 Deploying Frontend..." -ForegroundColor Blue
Write-Host "========================" -ForegroundColor Blue
Set-Location frontend

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
$backendUrl = Read-Host "Enter your backend URL (e.g., https://your-backend.vercel.app)"

# Create production environment file
"VITE_API_URL=$backendUrl/api" | Out-File -FilePath .env.production -Encoding utf8

Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build

Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

Set-Location ..

Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update ALLOWED_ORIGINS in backend Vercel settings with your frontend URL" -ForegroundColor Cyan
Write-Host "2. Test your application end-to-end" -ForegroundColor Cyan
Write-Host "3. Configure any additional environment variables needed" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 For detailed configuration, see DEPLOYMENT.md" -ForegroundColor Yellow
