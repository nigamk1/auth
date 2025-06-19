# Pre-Deployment Checklist

## ✅ Code Preparation

- [ ] All code committed and pushed to GitHub
- [ ] Environment variables removed from code (use .env files)
- [ ] Production builds tested locally
- [ ] All TypeScript errors resolved
- [ ] Dependencies properly listed in package.json

## ✅ Database Setup

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with proper permissions
- [ ] IP whitelist configured (0.0.0.0/0 for Render)
- [ ] Connection string obtained and tested

## ✅ Environment Variables

### Backend
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000` (Render requirement)
- [ ] `MONGODB_URI` (MongoDB Atlas connection string)
- [ ] `JWT_SECRET` (32+ character random string)
- [ ] `JWT_REFRESH_SECRET` (32+ character random string)
- [ ] `EMAIL_USER` (Gmail address)
- [ ] `EMAIL_PASS` (Gmail app password, not regular password)
- [ ] `FRONTEND_URL` (will be filled after frontend deployment)
- [ ] `ALLOWED_ORIGINS` (will be filled after frontend deployment)

### Frontend
- [ ] `VITE_API_URL` (will be filled after backend deployment)

## ✅ Render Account Setup

- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Payment method added (if using paid plans)

## ✅ Deployment Steps

### Backend Deployment
1. [ ] Create Web Service on Render
2. [ ] Connect GitHub repository
3. [ ] Set build command: `cd backend && npm install && npm run build`
4. [ ] Set start command: `cd backend && npm start`
5. [ ] Add all environment variables
6. [ ] Deploy and wait for completion
7. [ ] Test health endpoint: `https://your-backend.onrender.com/health`

### Frontend Deployment
1. [ ] Create Static Site on Render
2. [ ] Connect same GitHub repository
3. [ ] Set build command: `cd frontend && npm install && npm run build`
4. [ ] Set publish directory: `frontend/dist`
5. [ ] Add `VITE_API_URL` environment variable
6. [ ] Deploy and wait for completion

### Final Configuration
- [ ] Update backend `FRONTEND_URL` with frontend URL
- [ ] Update backend `ALLOWED_ORIGINS` with frontend URL
- [ ] Redeploy backend service
- [ ] Test complete application flow

## ✅ Post-Deployment Testing

- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] Email sending works (password reset)
- [ ] User login works
- [ ] JWT tokens refresh automatically
- [ ] Protected routes work correctly
- [ ] User profile management works
- [ ] Password change works
- [ ] Logout works properly

## ✅ Security Verification

- [ ] No sensitive data in repository
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Security headers present
- [ ] SSL/HTTPS working
- [ ] Environment variables secure

## 🚨 Common Issues

### Backend Issues
- **503 Service Unavailable**: Check build logs, ensure all dependencies installed
- **Database connection failed**: Verify MongoDB URI and IP whitelist
- **CORS errors**: Check ALLOWED_ORIGINS configuration
- **JWT errors**: Verify JWT secrets are set correctly

### Frontend Issues
- **Blank page**: Check browser console for errors
- **API calls failing**: Verify VITE_API_URL is correct
- **Build failures**: Check build logs for TypeScript or dependency issues

### Environment Issues
- **Missing variables**: All required env vars must be set in Render dashboard
- **Wrong values**: Double-check connection strings and URLs
- **Case sensitivity**: Environment variable names are case-sensitive

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Verify all environment variables
3. Test locally first
4. Check MongoDB Atlas connectivity
5. Review build and runtime logs

## 🎉 Success!

Once everything is working:
- [ ] Save your deployment URLs
- [ ] Update documentation with live URLs
- [ ] Set up monitoring/alerts
- [ ] Consider upgrading to paid plans for production
- [ ] Set up custom domain (optional)
