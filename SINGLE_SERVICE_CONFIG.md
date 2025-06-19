# Single Service Deployment Configuration

## 🚀 For Single Web Service (Backend serves Frontend)

### Build Command:
```bash
npm run install:all && npm run build:all
```

### Start Command:
```bash
npm run start:backend
```

### Environment Variables:
- All the same backend variables
- Frontend will be served by backend at the same URL

## 📋 Steps for Single Service:

1. **Create Web Service** (not static site)
2. **Build Command**: `npm run install:all && npm run build:all`
3. **Start Command**: `npm run start:backend`
4. **Set Environment Variables** (backend ones only)

## 🔧 How it works:

1. **Build phase**: Builds both frontend and backend
2. **Runtime**: Backend serves API routes at `/api/*`
3. **Frontend**: Backend serves React app for all other routes
4. **Single URL**: Everything runs on one domain

## ⚡ Benefits:
- ✅ Single service to manage
- ✅ No CORS issues
- ✅ Cheaper (one service vs two)
- ✅ Same domain for frontend and backend

## ⚠️ Trade-offs:
- ❌ Backend restarts affect frontend
- ❌ Less separation of concerns
- ❌ Frontend doesn't get CDN benefits

---

## 🎯 **RECOMMENDED FOR RENDER**: Use this single service approach!

**Build Command**: `npm run install:all && npm run build:all`
**Start Command**: `npm run start:backend`
