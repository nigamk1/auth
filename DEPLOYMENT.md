# Vercel Deployment Guide

This guide will help you deploy your full-stack authentication system to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Set up a cloud MongoDB database at [mongodb.com/atlas](https://www.mongodb.com/atlas)
3. **GitHub Repository**: Push your code to GitHub
4. **Email Service**: Gmail app password or SMTP service for email functionality

## Deployment Steps

### 1. Prepare Your Database

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/database`)
5. Whitelist all IP addresses (0.0.0.0/0) for Vercel deployment

### 2. Deploy Backend

1. **Push to GitHub**: Make sure your code is in a GitHub repository

2. **Import to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - **Important**: Set the root directory to `backend`

3. **Configure Environment Variables**:
   Go to Project Settings → Environment Variables and add:

   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/auth_system
   JWT_ACCESS_SECRET=your-super-secure-access-secret-256-bits-long
   JWT_REFRESH_SECRET=your-super-secure-refresh-secret-256-bits-long
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   PASSWORD_RESET_SECRET=your-password-reset-secret-256-bits-long
   PASSWORD_RESET_EXPIRES_IN=10m
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_APP_PASSWORD=your-gmail-app-password
   EMAIL_FROM=your-email@gmail.com
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
   GOOGLE_CLIENT_ID=your-google-oauth-client-id
   GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
   GITHUB_CLIENT_ID=your-github-oauth-client-id
   GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
   ```

4. **Deploy**: Click "Deploy" and wait for the build to complete

5. **Note the Backend URL**: Save the deployed backend URL (e.g., `https://your-backend.vercel.app`)

### 3. Deploy Frontend

1. **Create New Vercel Project**:
   - Import the same GitHub repository
   - **Important**: Set the root directory to `frontend`

2. **Configure Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-domain.vercel.app/api
   VITE_APP_NAME=Auth System
   VITE_APP_VERSION=1.0.0
   VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
   VITE_GITHUB_CLIENT_ID=your-github-oauth-client-id
   VITE_ENABLE_GOOGLE_AUTH=true
   VITE_ENABLE_GITHUB_AUTH=true
   VITE_ENABLE_EMAIL_VERIFICATION=true
   VITE_ENABLE_PASSWORD_RESET=true
   ```

3. **Deploy**: Click "Deploy"

4. **Update Backend CORS**: Go back to your backend project and update the environment variables:
   ```
   FRONTEND_URL=https://your-actual-frontend-domain.vercel.app
   ALLOWED_ORIGINS=https://your-actual-frontend-domain.vercel.app
   ```

### 4. Configure OAuth (Optional)

#### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-backend-domain.vercel.app/api/auth/google/callback`
   - `https://your-frontend-domain.vercel.app/auth/callback`

#### GitHub OAuth:
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `https://your-backend-domain.vercel.app/api/auth/github/callback`

### 5. Email Configuration

#### Gmail (Recommended):
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this 16-character password as `EMAIL_APP_PASSWORD`

#### Alternative SMTP:
Configure your SMTP provider details in the backend environment variables.

### 6. Security Considerations

1. **Generate Strong Secrets**: Use a tool like this to generate 256-bit secrets:
   ```javascript
   require('crypto').randomBytes(32).toString('hex')
   ```

2. **Environment Variables**: Never commit `.env` files to Git

3. **Domain Validation**: Make sure CORS is properly configured with your actual domains

4. **Database Security**: Use MongoDB Atlas with proper user permissions

### 7. Testing the Deployment

1. **Health Check**: Visit `https://your-backend-domain.vercel.app/health`
2. **Frontend**: Visit your frontend URL
3. **Registration**: Test user registration
4. **Login**: Test user login
5. **Password Reset**: Test email functionality
6. **OAuth**: Test social login (if configured)

### 8. Monitoring and Logs

- **Vercel Dashboard**: Monitor function logs and performance
- **MongoDB Atlas**: Monitor database performance and connections
- **Email Logs**: Check email delivery status

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure `ALLOWED_ORIGINS` includes your frontend domain
2. **Database Connection**: Verify MongoDB URI and network access
3. **Email Not Sending**: Check Gmail app password and SMTP settings
4. **OAuth Errors**: Verify client IDs and callback URLs
5. **Build Errors**: Check Node.js version compatibility

### Environment Variables Checklist:

**Backend (Required)**:
- [ ] `MONGODB_URI`
- [ ] `JWT_ACCESS_SECRET`
- [ ] `JWT_REFRESH_SECRET`
- [ ] `EMAIL_USER`
- [ ] `EMAIL_APP_PASSWORD`
- [ ] `FRONTEND_URL`
- [ ] `ALLOWED_ORIGINS`

**Frontend (Required)**:
- [ ] `VITE_API_URL`

**Optional** (for OAuth):
- [ ] `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- [ ] `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test API endpoints individually
4. Check MongoDB Atlas logs
5. Verify CORS configuration

The deployment should be live and fully functional once all steps are completed!
