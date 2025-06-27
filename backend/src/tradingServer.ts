/**
 * Main application for the trading alert system
 */
import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import WebSocketServer from './websockets/WebSocketServer';
import DataEngine from './data/DataEngine';
import StrategyEngine from './strategies/StrategyEngine';
import SignalEngine from './signals/SignalEngine';
import AlertSystem from './alerts/AlertSystem';
import { NiftyData, OptionData, TradeSignal } from './types/trading';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Connect to MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trading-alerts';
    await mongoose.connect(uri);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize WebSocket server
const wsServer = new WebSocketServer(server);

// Set up routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import routes
import tradingRoutes from './routes/trading';
app.use('/api/trading', tradingRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, async () => {
  // Connect to database
  await connectDB();
  
  logger.info(`Server running on port ${PORT}`);

  // Initialize trading system components
  await initializeTradingSystem();
});

/**
 * Initialize the trading alert system
 */
async function initializeTradingSystem() {
  try {
    const userId = 'system'; // Default user ID for system-level strategies
    
    // Initialize data engine
    const dataEngine = new DataEngine(
      process.env.UPSTOX_API_KEY || '',
      process.env.UPSTOX_API_SECRET || ''
    );

    // Initialize strategy engine
    const strategyEngine = new StrategyEngine(userId);

    // Initialize signal engine
    const signalEngine = new SignalEngine();

    // Initialize alert system
    const alertSystem = new AlertSystem();

    // Connect components

    // Data -> Strategy
    dataEngine.on('niftyData', (data: NiftyData) => {
      strategyEngine.processNiftyData(data);
      
      // Also broadcast to WebSocket clients
      wsServer.broadcastNiftyData(data);
    });

    dataEngine.on('optionData', (data: OptionData) => {
      strategyEngine.processOptionData(data);
      
      // Also broadcast to WebSocket clients
      wsServer.broadcastOptionData(data);
    });

    // Strategy -> Signal
    strategyEngine.on('strategyResult', (result) => {
      signalEngine.processStrategyResult(result);
    });

    // Signal -> Alert
    signalEngine.on('signal', (signal: TradeSignal) => {
      alertSystem.processSignal(signal);
      
      // Broadcast signal to WebSocket clients
      wsServer.broadcastTradeSignal(signal);
    });

    logger.info('Trading alert system initialized successfully');
  } catch (error) {
    logger.error('Error initializing trading system:', error);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  server.close(() => {
    mongoose.connection.close().then(() => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    }).catch(err => {
      logger.error('Error closing MongoDB connection:', err);
      process.exit(1);
    });
  });
});
