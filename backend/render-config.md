# Render Backend Service Configuration

## Service Type: Web Service
## Environment: Node

### Build & Deploy Settings
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Node Version:** 18.x

### Environment Variables
Set these in your Render dashboard:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=https://your-frontend-app.onrender.com
ALLOWED_ORIGINS=https://your-frontend-app.onrender.com
```

### Health Check
- **Health Check Path:** `/api/health`

### Auto-Deploy
- **Branch:** `main` or `master`
