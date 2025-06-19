# Deployment Guide for Render

This guide will help you deploy your authentication system to Render.

## Prerequisites

1. GitHub account with your code pushed to a repository
2. Render account (free tier available)
3. MongoDB Atlas account (for database hosting)

## Step 1: Prepare MongoDB Database

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Create a database user
4. Whitelist IP addresses (use `0.0.0.0/0` for all IPs or Render's IP ranges)
5. Get your connection string (it should look like: `mongodb+srv://username:password@cluster.mongodb.net/database`)

## Step 2: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `auth-backend` (or your preferred name)
   - **Runtime**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (or paid for better performance)

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=generate_a_strong_random_string_min_32_chars
   JWT_REFRESH_SECRET=generate_another_strong_random_string_min_32_chars
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   FRONTEND_URL=https://your-frontend-app.onrender.com
   ALLOWED_ORIGINS=https://your-frontend-app.onrender.com
   ```

6. Deploy the service

## Step 3: Deploy Frontend to Render

1. In Render Dashboard, click "New +" → "Static Site"
2. Connect the same GitHub repository
3. Configure the site:
   - **Name**: `auth-frontend` (or your preferred name)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

4. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend-app.onrender.com/api
   ```

5. Deploy the site

## Step 4: Update CORS and Frontend URL

1. Once both services are deployed, note their URLs
2. Update the backend environment variables:
   - `FRONTEND_URL`: Your frontend Render URL
   - `ALLOWED_ORIGINS`: Your frontend Render URL
3. Update the frontend environment variable:
   - `VITE_API_URL`: Your backend Render URL + `/api`

## Step 5: Test Your Deployment

1. Visit your frontend URL
2. Test registration, login, and other features
3. Check the backend health endpoint: `https://your-backend-app.onrender.com/health`

## Security Notes

1. **JWT Secrets**: Generate strong, random strings (32+ characters)
2. **Database**: Use MongoDB Atlas with proper authentication
3. **Email**: Use Gmail App Passwords, not your regular password
4. **CORS**: Only allow your frontend domain in production

## Generating Strong Secrets

You can generate strong secrets using:

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows PowerShell
[System.Web.Security.Membership]::GeneratePassword(32, 5)

# Or use online tools like:
# https://passwordsgenerator.net/
```

## Common Issues

1. **CORS Errors**: Make sure your frontend URL is in `ALLOWED_ORIGINS`
2. **Database Connection**: Ensure MongoDB Atlas is configured correctly
3. **Environment Variables**: Double-check all required env vars are set
4. **Build Failures**: Check build logs in Render dashboard

## Free Tier Limitations

- Backend services on free tier sleep after 15 minutes of inactivity
- Cold starts may take 30+ seconds
- Consider upgrading to paid plans for production use

## Monitoring

- Use Render's built-in logging and metrics
- Monitor your MongoDB Atlas usage
- Set up error tracking (optional)

## Next Steps

1. Set up custom domain (optional)
2. Configure SSL certificates (automatic on Render)
3. Set up monitoring and alerts
4. Consider upgrading to paid plans for better performance
