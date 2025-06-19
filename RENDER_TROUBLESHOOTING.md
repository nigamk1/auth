# Render Deployment - Quick Fix Guide

## ❌ Common Error: `npm run dev` not found

If you're seeing this error during deployment:
```
==> Running 'npm run dev'
npm error Missing script: "dev"
```

This means Render is trying to run the wrong command. Here's how to fix it:

## ✅ Solution: Manual Service Creation

Instead of using the Blueprint (render.yaml), create services manually:

### 1. Backend Service

1. **Create Web Service**:
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your repository
   - Configure:

```
Name: auth-backend
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm ci && npm run build
Start Command: npm start
```

2. **Environment Variables**:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=your-mongodb-connection-string
JWT_ACCESS_SECRET=your-generated-secret
JWT_REFRESH_SECRET=your-generated-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PASSWORD_RESET_SECRET=your-generated-secret
PASSWORD_RESET_EXPIRES_IN=10m
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Auth System <your-email@gmail.com>
```

### 2. Frontend Service

1. **Create Static Site**:
   - Click "New" → "Static Site"
   - Connect same repository
   - Configure:

```
Name: auth-frontend
Branch: main
Root Directory: frontend
Build Command: npm ci && npm run build
Publish Directory: dist
```

2. **Environment Variables**:
```
VITE_API_URL=https://your-backend-name.onrender.com
VITE_APP_NAME=Auth System
VITE_APP_VERSION=1.0.0
VITE_TOKEN_STORAGE_KEY=auth_token
VITE_REFRESH_TOKEN_STORAGE_KEY=refresh_token
VITE_ENABLE_GOOGLE_AUTH=true
VITE_ENABLE_GITHUB_AUTH=true
VITE_ENABLE_EMAIL_VERIFICATION=true
VITE_ENABLE_PASSWORD_RESET=true
```

## 🔧 Alternative: Fix the Root Issue

If you want to use Blueprint deployment, remove the problematic scripts:

1. **Delete from root package.json**:
   - Remove `"dev"` script
   - Remove `"dev:backend"` script  
   - Remove `"dev:frontend"` script
   - Remove `concurrently` dependency

2. **Update render.yaml**: Use the simplified version in `render-simple.yaml`

## 🧪 Test Locally First

Before deploying, test the build commands locally:

```bash
# Test backend build
cd backend
npm ci
npm run build
npm start

# Test frontend build (in new terminal)
cd frontend
npm ci
npm run build
npm run preview
```

## 🆘 If Still Having Issues

1. **Check Build Logs**: Look at the detailed error in Render dashboard
2. **Use Individual Services**: Skip Blueprint and create services manually
3. **Verify package.json**: Ensure all required scripts exist in individual packages
4. **Contact Support**: Render has excellent support for deployment issues

## 📚 Resources

- [Render Node.js Guide](https://render.com/docs/deploy-node-express-app)
- [Render Static Site Guide](https://render.com/docs/deploy-create-react-app)
- [Render Environment Variables](https://render.com/docs/environment-variables)
