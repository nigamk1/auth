import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import protectedRoutes from './routes/protected';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Set NODE_ENV to production if not set and running on port 10000 (Render's default)
if (!process.env.NODE_ENV && PORT === '10000') {
  process.env.NODE_ENV = 'production';
}

console.log('🔧 Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  MONGODB_URI: process.env.MONGODB_URI ? '✅ Set' : '❌ Missing',
  JWT_SECRET: process.env.JWT_SECRET ? '✅ Set' : '❌ Missing',
  FRONTEND_URL: process.env.FRONTEND_URL || 'Not set'
});

// Connect to database
connectDB();

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('Please set these variables in your Render service settings');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});
app.use('/api/auth', authLimiter);

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'https://auth-tedq.onrender.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Root route - API documentation (browser-friendly)
app.get('/', (req, res) => {
  // Check if request is from a browser
  const userAgent = req.get('User-Agent') || '';
  const isBrowser = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari') || userAgent.includes('Edge');
  
  if (isBrowser && !req.get('Accept')?.includes('application/json')) {
    // Return HTML for browsers
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authentication API Server</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          }
          h1 { color: #4a5568; margin-bottom: 0; }
          h2 { color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
          .status { 
            display: inline-block;
            background: #48bb78;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            margin-left: 1rem;
          }
          .endpoint {
            background: #f7fafc;
            padding: 0.5rem;
            margin: 0.5rem 0;
            border-left: 4px solid #4299e1;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
          }
          .method-post { border-left-color: #f56565; }
          .method-get { border-left-color: #48bb78; }
          .method-put { border-left-color: #ed8936; }
          .info { background: #ebf8ff; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
          .footer { text-align: center; margin-top: 2rem; color: #718096; }
          a { color: #4299e1; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔐 Authentication API Server <span class="status">LIVE</span></h1>
          
          <div class="info">
            <strong>Environment:</strong> ${process.env.NODE_ENV || 'development'} | 
            <strong>Version:</strong> 1.0.0 | 
            <strong>Status:</strong> Running | 
            <strong>Time:</strong> ${new Date().toISOString()}
          </div>

          <h2>📋 Available Endpoints</h2>
          
          <h3>🔍 Health Check</h3>
          <div class="endpoint method-get">GET /health</div>
          <div class="endpoint method-get">GET /api/health</div>
          
          <h3>🔑 Authentication</h3>
          <div class="endpoint method-post">POST /api/auth/register</div>
          <div class="endpoint method-post">POST /api/auth/login</div>
          <div class="endpoint method-post">POST /api/auth/logout</div>
          <div class="endpoint method-post">POST /api/auth/refresh</div>
          <div class="endpoint method-post">POST /api/auth/forgot-password</div>
          <div class="endpoint method-post">POST /api/auth/reset-password</div>
          
          <h3>👤 User Management</h3>
          <div class="endpoint method-get">GET /api/user/profile</div>
          <div class="endpoint method-put">PUT /api/user/profile</div>
          <div class="endpoint method-put">PUT /api/user/change-password</div>
          
          <h3>🛡️ Protected Routes</h3>
          <div class="endpoint method-get">GET /api/protected/dashboard</div>

          <h2>🚀 Quick Links</h2>
          <p>
            • <a href="/health">Health Check</a><br>
            • <a href="/api/health">API Health Check</a><br>
            • Frontend Application: <a href="${process.env.FRONTEND_URL || '#'}" target="_blank">Visit App</a>
          </p>

          <div class="info">
            <strong>🔗 API Base URL:</strong> <code>${req.protocol}://${req.get('host')}/api</code><br>
            <strong>📚 Usage:</strong> All API requests should include <code>Content-Type: application/json</code> header
          </div>

          <div class="footer">
            <p>Built with ❤️ using Node.js, Express, TypeScript & MongoDB</p>
            <p>🔒 Secure Authentication System | Production Ready</p>
          </div>
        </div>
      </body>
      </html>
    `);
  } else {
    // Return JSON for API clients
    res.status(200).json({
      success: true,
      message: 'Authentication API Server',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      endpoints: {
        health: '/health or /api/health',
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          logout: 'POST /api/auth/logout',
          refresh: 'POST /api/auth/refresh',
          forgotPassword: 'POST /api/auth/forgot-password',
          resetPassword: 'POST /api/auth/reset-password'
        },
        user: {
          profile: 'GET /api/user/profile',
          updateProfile: 'PUT /api/user/profile',
          changePassword: 'PUT /api/user/change-password'
        },
        protected: {
          dashboard: 'GET /api/protected/dashboard'
        }
      },
      documentation: 'Visit the frontend application for full documentation'
    });
  }
});

// Health check endpoints (browser-friendly)
app.get('/health', (req, res) => {
  const userAgent = req.get('User-Agent') || '';
  const isBrowser = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari') || userAgent.includes('Edge');
  
  if (isBrowser && !req.get('Accept')?.includes('application/json')) {
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Health Check</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 2rem auto;
            padding: 2rem;
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
          }
          .status { font-size: 4rem; margin-bottom: 1rem; }
          h1 { color: #2d3748; margin-bottom: 1rem; }
          .info { color: #4a5568; margin: 0.5rem 0; }
          .timestamp { background: #f7fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
          a { color: #4299e1; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="status">✅</div>
          <h1>API Health Check</h1>
          <div class="info"><strong>Status:</strong> All systems operational</div>
          <div class="info"><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</div>
          <div class="timestamp">
            <strong>Last Check:</strong><br>
            ${new Date().toLocaleString()}
          </div>
          <p><a href="/">← Back to API Documentation</a></p>
        </div>
      </body>
      </html>
    `);
  } else {
    res.status(200).json({
      status: 'OK',
      message: 'Auth API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Auth API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/protected', protectedRoutes);

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: {
      root: 'GET /',
      health: 'GET /health or GET /api/health',
      auth: 'POST /api/auth/register, POST /api/auth/login, etc.',
      user: 'GET /api/user/profile, PUT /api/user/profile, etc.',
      protected: 'GET /api/protected/dashboard'
    },
    tip: 'Visit the root URL (/) for complete API documentation'
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
