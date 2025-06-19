# Manual Render Frontend Service Configuration

## Service Settings
- **Type**: Static Site
- **Plan**: Free
- **Region**: Oregon (US West) - or closest to your users

## Build Settings
```bash
# Build Command
cd frontend && npm ci && npm run build

# Publish Directory
frontend/dist
```

## Advanced Settings
- **Auto-Deploy**: Yes
- **Custom Domain**: Optional
- **Branch**: main (or your default branch)

## Routes Configuration
Add this rewrite rule for SPA routing:
```
Source: /*
Destination: /index.html
Type: Rewrite
```

## Environment Variables

### API Configuration
```
VITE_API_URL=<your-backend-render-url>
```

### App Settings
```
VITE_APP_NAME=Auth System
VITE_APP_VERSION=1.0.0
VITE_TOKEN_STORAGE_KEY=auth_token
VITE_REFRESH_TOKEN_STORAGE_KEY=refresh_token
```

### Feature Flags
```
VITE_ENABLE_GOOGLE_AUTH=true
VITE_ENABLE_GITHUB_AUTH=true
VITE_ENABLE_EMAIL_VERIFICATION=true
VITE_ENABLE_PASSWORD_RESET=true
```

### OAuth Configuration (if using)
```
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
VITE_GITHUB_CLIENT_ID=<your-github-client-id>
```

### Development Settings
```
VITE_NODE_ENV=production
```

## Post-Deployment
1. Update backend `FRONTEND_URL` env var with your frontend URL
2. Test all functionality
3. Update OAuth redirect URLs in Google/GitHub console

## Example URLs
After deployment, your URLs will look like:
- Frontend: `https://auth-frontend-xyz.onrender.com`
- Backend: `https://auth-backend-xyz.onrender.com`

Make sure to update the backend's `FRONTEND_URL` environment variable with your actual frontend URL.
