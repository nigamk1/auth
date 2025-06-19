# Render Deployment Checklist

Use this checklist to ensure successful deployment of your authentication system to Render.

## Pre-Deployment Setup

### ✅ Code Repository
- [ ] Code is pushed to GitHub
- [ ] All sensitive data is removed from code
- [ ] `.env` files are added to `.gitignore`
- [ ] All dependencies are in `package.json`

### ✅ Database Setup
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with proper permissions
- [ ] Connection string obtained
- [ ] IP allowlist configured (0.0.0.0/0 for Render)

### ✅ Email Service Setup
- [ ] Gmail account with 2FA enabled
- [ ] App password generated
- [ ] Email configuration tested locally

## Render Deployment

### ✅ Backend Deployment
- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Web Service created with Node.js environment
- [ ] Build command set: `npm install && npm run build`
- [ ] Start command set: `npm start`
- [ ] Root directory set to `backend`
- [ ] Health check path set: `/api/health`

### ✅ Backend Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `MONGODB_URI=[your_connection_string]`
- [ ] `JWT_SECRET=[generated_secret]`
- [ ] `JWT_REFRESH_SECRET=[generated_secret]`
- [ ] `EMAIL_HOST=smtp.gmail.com`
- [ ] `EMAIL_PORT=587`
- [ ] `EMAIL_USER=[your_email]`
- [ ] `EMAIL_PASS=[app_password]`
- [ ] `FRONTEND_URL=[frontend_render_url]`
- [ ] `ALLOWED_ORIGINS=[frontend_render_url]`

### ✅ Frontend Deployment
- [ ] Static Site created
- [ ] Build command set: `npm install && npm run build`
- [ ] Publish directory set: `dist`
- [ ] Root directory set to `frontend`

### ✅ Frontend Environment Variables
- [ ] `VITE_API_URL=[backend_render_url]/api`

## Post-Deployment

### ✅ Testing
- [ ] Backend health check responding: `[backend_url]/api/health`
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] Email verification sent
- [ ] Login/logout functionality
- [ ] Password reset flow
- [ ] Protected routes working
- [ ] API calls successful

### ✅ URLs Updated
- [ ] Backend `FRONTEND_URL` updated with actual frontend URL
- [ ] Backend `ALLOWED_ORIGINS` updated with actual frontend URL
- [ ] Frontend `VITE_API_URL` updated with actual backend URL
- [ ] Both services redeployed after URL updates

### ✅ Security
- [ ] All secrets are strong and unique
- [ ] No sensitive data in logs
- [ ] CORS properly configured
- [ ] Rate limiting working
- [ ] HTTPS enabled (automatic on Render)

### ✅ Monitoring
- [ ] Service logs checked for errors
- [ ] Health checks passing
- [ ] Email delivery confirmed
- [ ] Performance tested

## Secret Generation Commands

Generate strong secrets for JWT:

```bash
# JWT Secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret  
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

## Troubleshooting Commands

```bash
# Test database connection
curl [backend_url]/api/health

# Check CORS
curl -H "Origin: [frontend_url]" [backend_url]/api/health

# Test API endpoint
curl -X POST [backend_url]/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Test123!"}'
```

## Notes

- Free tier services sleep after 15 minutes of inactivity
- Cold starts may take 5-10 seconds
- Monitor service logs in Render dashboard
- Keep environment variables secure and backed up

---

✅ All checked? Your authentication system should be live and working on Render!
