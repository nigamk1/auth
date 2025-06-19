# Render Deployment Guide

This guide will help you deploy your full-stack authentication system to Render.

## Prerequisites

1. **GitHub Repository**: Push your code to a GitHub repository
2. **Render Account**: Create a free account at [render.com](https://render.com)
3. **MongoDB Atlas**: Set up a free MongoDB database at [mongodb.com](https://www.mongodb.com/atlas)

## Step 1: Prepare Your Database

1. Create a MongoDB Atlas cluster (free tier)
2. Create a database user with read/write permissions
3. Get your connection string (replace `<password>` with your actual password)
4. Add your Render IP to the IP allowlist (or use `0.0.0.0/0` for all IPs)

## Step 2: Deploy Backend API

1. **Create Web Service in Render:**
   - Go to your Render dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your auth project

2. **Configure Service:**
   - **Name:** `auth-backend-api` (or any name you prefer)
   - **Environment:** `Node`
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/authdb
   JWT_SECRET=your-super-secret-jwt-key-256-bits-long
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-256-bits-long
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   FRONTEND_URL=https://your-frontend-name.onrender.com
   ALLOWED_ORIGINS=https://your-frontend-name.onrender.com
   ```

4. **Health Check:**
   - **Health Check Path:** `/api/health`

5. Click "Create Web Service"

## Step 3: Deploy Frontend

1. **Create Static Site in Render:**
   - Click "New" → "Static Site"
   - Connect the same GitHub repository

2. **Configure Service:**
   - **Name:** `auth-frontend-app` (or any name you prefer)
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

3. **Set Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-name.onrender.com/api
   ```

4. Click "Create Static Site"

## Step 4: Update URLs

After both services are deployed, you'll get URLs like:
- Backend: `https://auth-backend-api.onrender.com`
- Frontend: `https://auth-frontend-app.onrender.com`

Update the environment variables in both services with the actual URLs:

### Backend Updates:
- `FRONTEND_URL=https://auth-frontend-app.onrender.com`
- `ALLOWED_ORIGINS=https://auth-frontend-app.onrender.com`

### Frontend Updates:
- `VITE_API_URL=https://auth-backend-api.onrender.com/api`

## Step 5: Generate Secure Secrets

Generate strong secrets for JWT tokens:

```bash
# Generate JWT secrets (run these in terminal)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Use these for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

## Step 6: Email Configuration (Gmail)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use this app password for `EMAIL_PASS`

## Step 7: Test Deployment

1. Visit your frontend URL
2. Try registering a new account
3. Check email functionality
4. Test login/logout
5. Verify protected routes work

## Step 8: Optional OAuth Setup

### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-backend-name.onrender.com/api/auth/google/callback`
6. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### GitHub OAuth:
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL:
   - `https://your-backend-name.onrender.com/api/auth/github/callback`
4. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

## Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Verify `ALLOWED_ORIGINS` includes your frontend URL
   - Check that `FRONTEND_URL` is set correctly

2. **Database Connection:**
   - Verify MongoDB connection string
   - Check IP allowlist in MongoDB Atlas

3. **Email Not Working:**
   - Verify Gmail app password
   - Check email service configuration

4. **Build Failures:**
   - Check build logs in Render dashboard
   - Verify all dependencies are in package.json

### Logs:
- Check service logs in Render dashboard
- Monitor health check status
- Use browser developer tools for frontend issues

## Security Notes

- Never commit real environment variables to Git
- Use strong, unique passwords for all services
- Regularly rotate JWT secrets
- Monitor application logs for security issues
- Keep dependencies updated

## Free Tier Limitations

Render free tier includes:
- 750 hours/month for web services
- Static sites have no hour limits
- Services sleep after 15 minutes of inactivity
- 5-10 second cold start times

For production applications, consider upgrading to a paid plan for better performance and uptime.
