// Load environment variables first, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import protectedRoutes from './routes/protected';
import aiRoutes from './api/ai/routes';
import whiteboardRoutes from './api/whiteboard/routes';
import sessionMemoryRoutes from './routes/sessionMemory';

// Socket.IO
import RealTimeSocketHandler from './api/realtime/socketHandler';
import { setSocketHandler, injectSocketHandler } from './middleware/socketMiddleware';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const socketHandler = new RealTimeSocketHandler(server);
setSocketHandler(socketHandler);

// Connect to database
connectDB();

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
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
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

// Socket.IO middleware
app.use(injectSocketHandler);

// Health check endpoint
app.get('/health', (req, res) => {
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
app.use('/api/ai', aiRoutes);
app.use('/api/whiteboard', whiteboardRoutes);
app.use('/api/session-memory', sessionMemoryRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// Start server (only in development)
if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔌 Real-time Socket.IO enabled`);
    logger.info(`📝 Whiteboard API available at /api/whiteboard`);
    logger.info(`🧠 AI Teaching API available at /api/ai/teaching`);
  });
}

export default app;
