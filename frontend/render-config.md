# Render Frontend Service Configuration

## Service Type: Static Site

### Build & Deploy Settings
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Node Version:** 18.x

### Environment Variables
Set these in your Render dashboard:

```
VITE_API_URL=https://your-backend-api.onrender.com/api
```

### Auto-Deploy
- **Branch:** `main` or `master`

### Additional Configuration
- The frontend will be automatically deployed as a static site
- All routes will be handled by React Router (SPA mode)
- The build output will be served from the `dist` directory
