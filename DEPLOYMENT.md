# Deployment Guide for Render

This guide explains how to deploy your authentication system to Render.

## Quick Deploy with render.yaml

1. **Fork/Clone Repository**: Make sure your code is in a Git repository (GitHub, GitLab, or Bitbucket).

2. **Connect to Render**:
   - Go to [Render.com](https://render.com)
   - Sign up/Login with your Git provider
   - Click "New" → "Blueprint"
   - Connect your repository
   - Render will automatically detect the `render.yaml` file

3. **Environment Variables**:
   The following environment variables will be automatically configured:
   - `JWT_ACCESS_SECRET` (auto-generated)
   - `JWT_REFRESH_SECRET` (auto-generated)
   - `PASSWORD_RESET_SECRET` (auto-generated)
   
   **You need to manually set these in the Render dashboard**:
   - `EMAIL_USER` - Your email address for sending emails
   - `EMAIL_PASS` - Your email app password (for Gmail, use App Password)
   - `EMAIL_FROM` - Display name for emails
   - `VITE_GOOGLE_CLIENT_ID` (if using Google OAuth)
   - `VITE_GITHUB_CLIENT_ID` (if using GitHub OAuth)

## Manual Deployment

### Backend (Web Service)

1. **Create Web Service**:
   - Service Type: Web Service
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Environment: Node

2. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_ACCESS_SECRET=<generate-random-secret>
   JWT_REFRESH_SECRET=<generate-random-secret>
   PASSWORD_RESET_SECRET=<generate-random-secret>
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   PASSWORD_RESET_EXPIRES_IN=10m
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=<your-email>
   EMAIL_PASS=<your-app-password>
   EMAIL_FROM=<your-display-name>
   FRONTEND_URL=<your-frontend-url-from-render>
   ```

### Frontend (Static Site)

1. **Create Static Site**:
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

2. **Environment Variables**:
   ```
   VITE_API_URL=<your-backend-url-from-render>
   VITE_APP_NAME=Auth System
   VITE_APP_VERSION=1.0.0
   VITE_TOKEN_STORAGE_KEY=auth_token
   VITE_REFRESH_TOKEN_STORAGE_KEY=refresh_token
   VITE_ENABLE_GOOGLE_AUTH=true
   VITE_ENABLE_GITHUB_AUTH=true
   VITE_ENABLE_EMAIL_VERIFICATION=true
   VITE_ENABLE_PASSWORD_RESET=true
   ```

### Database

**Option 1: Render PostgreSQL (Recommended)**
- Render provides free PostgreSQL databases
- You'll need to modify your code to use PostgreSQL instead of MongoDB

**Option 2: MongoDB Atlas**
- Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
- Get the connection string and use it as `MONGODB_URI`

## Important Notes

1. **Free Tier Limitations**:
   - Services spin down after 15 minutes of inactivity
   - Cold starts may take 10-30 seconds
   - 750 hours/month free tier

2. **Domain Configuration**:
   - Backend: `https://your-app-name.onrender.com`
   - Frontend: `https://your-frontend-name.onrender.com`

3. **HTTPS**: Render provides free SSL certificates automatically

4. **Monitoring**: Use Render's built-in logs and metrics for monitoring

## Post-Deployment Checklist

- [ ] Backend health check accessible: `https://your-backend.onrender.com/api/health`
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Password reset emails are sent
- [ ] JWT tokens are working
- [ ] CORS is properly configured
- [ ] Environment variables are set correctly

## Troubleshooting

1. **Build Failures**: Check the build logs in Render dashboard
2. **CORS Errors**: Verify `FRONTEND_URL` and `ALLOWED_ORIGINS` environment variables
3. **Database Connection**: Ensure `MONGODB_URI` is correct and accessible
4. **Email Issues**: Verify email credentials and app passwords

## Useful Commands for Development

```bash
# Test health endpoint
curl https://your-backend.onrender.com/api/health

# Check environment
curl https://your-backend.onrender.com/health
```
