@echo off
REM Deployment preparation script for Render (Windows)
echo 🚀 Preparing Auth System for Render deployment...

REM Check if we're in the right directory
if not exist "render.yaml" (
    echo ❌ Error: render.yaml not found. Please run this script from the project root.
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Backend dependencies installation failed!
    exit /b 1
)

cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Frontend dependencies installation failed!
    exit /b 1
)

cd ..

REM Build projects
echo 🔨 Building projects...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Backend build failed!
    exit /b 1
)

cd ..\frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed!
    exit /b 1
)

cd ..

echo ✅ Build successful!
echo.
echo 📋 Next steps:
echo 1. Push your code to GitHub/GitLab/Bitbucket
echo 2. Go to https://render.com and create a new Blueprint
echo 3. Connect your repository
echo 4. Set the required environment variables (see DEPLOYMENT.md)
echo 5. Deploy!
echo.
echo 📖 See DEPLOYMENT.md for detailed instructions
pause
