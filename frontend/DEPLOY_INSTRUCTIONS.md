# Frontend Deployment Configuration for Render

## Quick Setup Instructions:

### 1. Create Static Site on Render
- Service Type: **Static Site**
- Repository: Connect your GitHub repo
- Branch: `main`

### 2. Build Settings
```
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

### 3. Environment Variables
```
VITE_API_URL=https://auth-tedq.onrender.com/api
```

### 4. Auto-Deploy
- Enable auto-deploy from `main` branch
- Frontend will redeploy automatically when you push changes

## After Deployment:

### Update Backend CORS
Once you get your frontend URL (like `https://auth-frontend-xyz.onrender.com`), update your backend service environment variables:

```
FRONTEND_URL=https://your-frontend-url.onrender.com
ALLOWED_ORIGINS=https://your-frontend-url.onrender.com,http://localhost:5173
```

## Expected Result:
- Users can visit your frontend URL and use the full authentication system
- Register, login, dashboard, profile management, etc.
- Frontend communicates with your live backend API
