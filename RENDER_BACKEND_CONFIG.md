# Manual Render Backend Service Configuration

## Service Settings
- **Type**: Web Service
- **Environment**: Node
- **Plan**: Free (or Starter for production)
- **Region**: Oregon (US West) - or closest to your users

## Build & Start Commands
```bash
# Build Command
cd backend && npm ci --only=production && npm run build

# Start Command  
cd backend && npm start
```

## Advanced Settings
- **Auto-Deploy**: Yes
- **Health Check Path**: `/api/health`
- **Port**: 10000 (automatically set via PORT env var)

## Environment Variables

### Required (Auto-generated)
```
NODE_ENV=production
PORT=10000
```

### Database
```
MONGODB_URI=<your-mongodb-atlas-connection-string>
```

### JWT Configuration (Auto-generate these)
```
JWT_ACCESS_SECRET=<generate-64-char-random-string>
JWT_REFRESH_SECRET=<generate-64-char-random-string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PASSWORD_RESET_SECRET=<generate-64-char-random-string>
PASSWORD_RESET_EXPIRES_IN=10m
```

### Email Configuration (Gmail)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=<your-gmail-address>
EMAIL_PASS=<your-gmail-app-password>
EMAIL_FROM=Auth System <your-gmail-address>
```

### CORS Configuration
```
FRONTEND_URL=<your-frontend-render-url>
ALLOWED_ORIGINS=<your-frontend-render-url>
```

### OAuth (Optional)
```
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>
SESSION_SECRET=<generate-64-char-random-string>
```

## Generate Secrets
Use this Node.js script to generate secure secrets:
```javascript
const crypto = require('crypto');
console.log('JWT_ACCESS_SECRET:', crypto.randomBytes(64).toString('hex'));
console.log('JWT_REFRESH_SECRET:', crypto.randomBytes(64).toString('hex'));
console.log('PASSWORD_RESET_SECRET:', crypto.randomBytes(64).toString('hex'));
console.log('SESSION_SECRET:', crypto.randomBytes(64).toString('hex'));
```
