# Render Deployment Checklist

## ✅ Pre-Deployment (Completed)
- [x] `render.yaml` configuration file created
- [x] Health check endpoints configured (`/health` and `/api/health`)
- [x] CORS configuration updated for Render domains
- [x] Production environment variables documented
- [x] Build scripts optimized for production
- [x] Frontend API URL configuration for production
- [x] Deployment documentation created
- [x] Build test successful

## 📋 Deployment Steps

### 1. Repository Setup
- [ ] Push code to GitHub/GitLab/Bitbucket
- [ ] Ensure `render.yaml` is in the root directory
- [ ] Verify all files are committed and pushed

### 2. Database Setup
- [ ] Create MongoDB Atlas cluster (free tier available)
- [ ] Get connection string for `MONGODB_URI`
- [ ] Whitelist Render IP addresses in MongoDB Atlas

### 3. Email Setup (Gmail recommended)
- [ ] Enable 2-factor authentication on Gmail
- [ ] Generate App Password: Google Account → Security → App passwords
- [ ] Note down: Email address and App password

### 4. Render Deployment
- [ ] Sign up at [render.com](https://render.com)
- [ ] Connect your Git provider (GitHub/GitLab/Bitbucket)
- [ ] Create new "Blueprint" service
- [ ] Select your repository
- [ ] Render will detect `render.yaml` automatically

### 5. Environment Variables Setup
Required environment variables to set manually in Render dashboard:

**Backend Service:**
- [ ] `EMAIL_USER` - Your Gmail address
- [ ] `EMAIL_PASS` - Your Gmail App Password
- [ ] `EMAIL_FROM` - Display name for emails
- [ ] `MONGODB_URI` - Your MongoDB Atlas connection string

**Optional (if using OAuth):**
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GITHUB_CLIENT_ID`
- [ ] `GITHUB_CLIENT_SECRET`
- [ ] `VITE_GOOGLE_CLIENT_ID` (Frontend)
- [ ] `VITE_GITHUB_CLIENT_ID` (Frontend)

### 6. Post-Deployment Testing
- [ ] Backend health check: `https://your-backend.onrender.com/api/health`
- [ ] Frontend loads: `https://your-frontend.onrender.com`
- [ ] User registration works
- [ ] Email verification/password reset emails sent
- [ ] User login works
- [ ] Protected routes work
- [ ] JWT tokens functioning correctly

## 🔧 Troubleshooting

### Common Issues
1. **Build Failures**: Check build logs in Render dashboard
2. **CORS Errors**: Verify frontend URL is set correctly in backend env vars
3. **Database Connection**: Ensure MongoDB URI is correct and accessible
4. **Email Not Sending**: Verify Gmail App Password and settings

### Getting Help
- Render Documentation: https://render.com/docs
- Deployment Guide: See `DEPLOYMENT.md`
- Health Check: Use `/api/health` endpoint for debugging

## 🚀 Expected URLs After Deployment
- **Backend**: `https://auth-backend-[random].onrender.com`
- **Frontend**: `https://auth-frontend-[random].onrender.com`
- **Health Check**: `https://auth-backend-[random].onrender.com/api/health`

## 💡 Tips
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep may take 10-30 seconds (cold start)
- Use paid plans for production applications requiring 24/7 uptime
- Monitor logs in Render dashboard for any issues
