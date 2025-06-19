# 🚀 Quick Deployment Guide

## Ready to Deploy? Here's what you need:

### 1. **Environment Setup** (5 minutes)
- [ ] MongoDB Atlas account & cluster
- [ ] Gmail app password (or SMTP service)
- [ ] GitHub repository with your code
- [ ] Vercel account

### 2. **Deploy Backend** (10 minutes)
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project" → Import from GitHub
3. **Set Root Directory to: `backend`**
4. Add these environment variables:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auth_system
JWT_ACCESS_SECRET=your-64-char-secret
JWT_REFRESH_SECRET=your-64-char-secret  
PASSWORD_RESET_SECRET=your-64-char-secret
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=https://your-frontend-domain.vercel.app
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

5. Deploy!

### 3. **Deploy Frontend** (5 minutes)
1. Create another Vercel project
2. Import same GitHub repo
3. **Set Root Directory to: `frontend`**
4. Add environment variable:

```env
VITE_API_URL=https://your-backend-domain.vercel.app/api
```

5. Deploy!

### 4. **Update CORS** (2 minutes)
Update your backend environment variables with the actual frontend URL:
```env
FRONTEND_URL=https://your-actual-frontend-domain.vercel.app
ALLOWED_ORIGINS=https://your-actual-frontend-domain.vercel.app
```

### 5. **Test Everything** (5 minutes)
- Visit `https://your-backend-domain.vercel.app/health`
- Open your frontend URL
- Test registration and login

## 🔧 Helpful Tools

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Test backend health:**
```bash
curl https://your-backend-domain.vercel.app/health
```

## 📞 Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Run `./deploy.ps1` (Windows) or `./deploy.sh` (Mac/Linux) for guided deployment

**Total time: ~30 minutes** ⏱️
