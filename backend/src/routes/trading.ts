/**
 * Trading Alert System API Routes
 * 
 * This file contains all routes related to trading alerts, signals, and strategy management.
 * These routes are protected and require authentication.
 */

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

// Import models
import TradeSignal from '../models/TradeSignal';
import NiftyData from '../models/NiftyData';
import OptionData from '../models/OptionData';
import AlertConfig from '../models/AlertConfig';
import StrategySettings from '../models/StrategySettings';
import PerformanceMetrics from '../models/PerformanceMetrics';

const router = Router();

/**
 * @route GET /api/trading/signals
 * @desc Get recent trade signals with filtering and pagination
 * @access Private
 */
router.get('/signals', authenticate, [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('strategy').optional().isString(),
  query('optionType').optional().isIn(['CE', 'PE']),
  query('minConfidence').optional().isInt({ min: 0, max: 100 }).toInt(),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(`Validation error: ${JSON.stringify(errors.array())}`, 400);
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  const strategy = req.query.strategy as string | undefined;
  const optionType = req.query.optionType as 'CE' | 'PE' | undefined;
  const minConfidence = req.query.minConfidence ? parseInt(req.query.minConfidence as string) : 0;

  // Build query filter
  const filter: any = { confidence: { $gte: minConfidence } };
  if (strategy) filter.strategyName = strategy;
  if (optionType) filter.optionType = optionType;

  // Get signals
  const signals = await TradeSignal.find(filter)
    .sort({ timestamp: -1 })
    .skip(offset)
    .limit(limit);

  // Get total count
  const totalCount = await TradeSignal.countDocuments(filter);

  res.status(200).json({
    success: true,
    message: 'Trade signals retrieved successfully',
    data: {
      signals,
      pagination: {
        total: totalCount,
        offset,
        limit,
        hasMore: offset + signals.length < totalCount
      }
    }
  } as ApiResponse);
}));

/**
 * @route GET /api/trading/option-chain
 * @desc Get option chain data for a specific expiry date
 * @access Private
 */
router.get('/option-chain', authenticate, [
  query('expiry').optional().isString(),
  query('strikes').optional().isInt({ min: 5, max: 50 }).toInt(),
  query('underlying').optional().isString()
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(`Validation error: ${JSON.stringify(errors.array())}`, 400);
  }
  
  const expiry = req.query.expiry as string | undefined;
  const strikes = req.query.strikes ? parseInt(req.query.strikes as string) : 20;
  const underlying = req.query.underlying as string || 'NIFTY';
  
  // Find option chain data
  const filter: any = { symbol: { $regex: `^${underlying}`, $options: 'i' } };
  if (expiry) filter.expiryDate = expiry;
  
  const options = await OptionData.find(filter).limit(200);
  
  res.status(200).json({
    success: true,
    message: 'Option chain data retrieved successfully',
    data: { options }
  } as ApiResponse);
}));

/**
 * @route GET /api/trading/signals/:id
 * @desc Get a specific trade signal by ID
 * @access Private
 */
router.get('/signals/:id', authenticate, [
  param('id').isString().notEmpty()
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(`Validation error: ${JSON.stringify(errors.array())}`, 400);
  }

  const signal = await TradeSignal.findById(req.params.id);
  
  if (!signal) {
    throw new AppError('Trade signal not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Trade signal retrieved successfully',
    data: signal
  } as ApiResponse);
}));

/**
 * @route GET /api/trading/nifty
 * @desc Get recent Nifty data with interval options
 * @access Private
 */
router.get('/nifty', authenticate, [
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('interval').optional().isIn(['1m', '5m', '15m', '30m', '1h', '1d']),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(`Validation error: ${JSON.stringify(errors.array())}`, 400);
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
  const interval = req.query.interval as string || '1m';
  
  // For simplicity, we're just getting the most recent data points
  // In a real app, you would aggregate data based on the requested interval
  const niftyData = await NiftyData.find()
    .sort({ timestamp: -1 })
    .limit(limit);

  res.status(200).json({
    success: true,
    message: 'Nifty data retrieved successfully',
    data: {
      interval,
      data: niftyData.reverse() // Reverse to get chronological order
    }
  } as ApiResponse);
}));

/**
 * @route GET /api/trading/options
 * @desc Get option chain data with filtering
 * @access Private
 */
router.get('/options', authenticate, [
  query('expiryDate').isString().notEmpty(),
  query('strikePrice').optional().isFloat(),
  query('optionType').optional().isIn(['CE', 'PE']),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(`Validation error: ${JSON.stringify(errors.array())}`, 400);
  }

  const expiryDate = req.query.expiryDate as string;
  const strikePrice = req.query.strikePrice ? parseFloat(req.query.strikePrice as string) : undefined;
  const optionType = req.query.optionType as 'CE' | 'PE' | undefined;

  // Build filter
  const filter: any = { expiryDate };
  if (strikePrice) filter.strikePrice = strikePrice;
  if (optionType) filter.optionType = optionType;

  // Get latest data for each option
  const optionData = await OptionData.aggregate([
    { $match: filter },
    { $sort: { timestamp: -1 } },
    { $group: {
      _id: { symbol: '$symbol', strikePrice: '$strikePrice', optionType: '$optionType' },
      doc: { $first: '$$ROOT' }
    }},
    { $replaceRoot: { newRoot: '$doc' } },
    { $sort: { strikePrice: 1 } }
  ]);

  res.status(200).json({
    success: true,
    message: 'Options data retrieved successfully',
    data: optionData
  } as ApiResponse);
}));

/**
 * @route GET /api/trading/alerts/config
 * @desc Get user's alert configuration
 * @access Private
 */
router.get('/alerts/config', authenticate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  
  // Get or create alert config
  let alertConfig = await AlertConfig.findOne({ userId });
  
  if (!alertConfig) {
    // Create default config
    alertConfig = await AlertConfig.create({
      userId,
      emailEnabled: true,
      emailAddress: req.user.email,
      telegramEnabled: false,
      whatsappEnabled: false,
      minConfidence: 70,
      strategyFilters: [],
      optionTypeFilters: []
    });
  }

  res.status(200).json({
    success: true,
    message: 'Alert configuration retrieved successfully',
    data: alertConfig
  } as ApiResponse);
}));

/**
 * @route PUT /api/trading/alerts/config
 * @desc Update user's alert configuration
 * @access Private
 */
router.put('/alerts/config', authenticate, [
  body('telegramEnabled').optional().isBoolean(),
  body('telegramChatId').optional().isString(),
  body('whatsappEnabled').optional().isBoolean(),
  body('whatsappNumber').optional().isString(),
  body('emailEnabled').optional().isBoolean(),
  body('emailAddress').optional().isEmail().normalizeEmail(),
  body('minConfidence').optional().isInt({ min: 0, max: 100 }),
  body('strategyFilters').optional().isArray(),
  body('optionTypeFilters').optional().isArray()
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(`Validation error: ${JSON.stringify(errors.array())}`, 400);
  }

  const userId = req.user._id;
  
  // Update or create config
  const alertConfig = await AlertConfig.findOneAndUpdate(
    { userId },
    { 
      ...req.body,
      userId // Ensure userId is set
    },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Alert configuration updated successfully',
    data: alertConfig
  } as ApiResponse);
}));

/**
 * @route GET /api/trading/strategies
 * @desc Get list of available strategies and their settings
 * @access Private
 */
router.get('/strategies', authenticate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  
  // Get strategy settings for this user
  const strategiesSettings = await StrategySettings.find({ userId });
  
  // Create a map of strategy name to settings
  const settingsMap = strategiesSettings.reduce((acc, setting) => {
    acc[setting.strategyName] = {
      isEnabled: setting.isEnabled,
      parameters: setting.parameters
    };
    return acc;
  }, {} as Record<string, any>);
  
  // Hard-coded list of available strategies (in a real app, this would come from the StrategyEngine)
  const availableStrategies = [
    {
      name: 'RSI Strategy',
      description: 'Identifies overbought/oversold conditions in the Nifty index using RSI indicator',
      defaultParameters: {
        rsiPeriod: 14,
        overboughtThreshold: 70,
        oversoldThreshold: 30
      }
    },
    {
      name: 'Open Interest Strategy',
      description: 'Identifies significant open interest changes in options to detect institutional positioning',
      defaultParameters: {
        oiChangeThreshold: 20,
        lookbackPeriod: 3,
        volumeConfirmationThreshold: 1.5
      }
    }
  ];
  
  // Merge available strategies with user settings
  const strategies = availableStrategies.map(strategy => ({
    ...strategy,
    isEnabled: settingsMap[strategy.name]?.isEnabled ?? true,
    parameters: settingsMap[strategy.name]?.parameters ?? strategy.defaultParameters
  }));

  res.status(200).json({
    success: true,
    message: 'Strategies retrieved successfully',
    data: strategies
  } as ApiResponse);
}));

/**
 * @route PUT /api/trading/strategies/:name
 * @desc Update strategy settings
 * @access Private
 */
router.put('/strategies/:name', authenticate, [
  param('name').isString().notEmpty(),
  body('isEnabled').isBoolean(),
  body('parameters').isObject()
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(`Validation error: ${JSON.stringify(errors.array())}`, 400);
  }

  const userId = req.user._id;
  const strategyName = req.params.name;
  const { isEnabled, parameters } = req.body;
  
  // Update or create strategy settings
  const strategySettings = await StrategySettings.findOneAndUpdate(
    { userId, strategyName },
    { userId, strategyName, isEnabled, parameters },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Strategy settings updated successfully',
    data: strategySettings
  } as ApiResponse);
}));

/**
 * @route GET /api/trading/performance
 * @desc Get performance metrics for strategies
 * @access Private
 */
router.get('/performance', authenticate, [
  query('strategyName').optional().isString(),
  query('period').optional().isIn(['day', 'week', 'month', 'year', 'all']).default('month'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(`Validation error: ${JSON.stringify(errors.array())}`, 400);
  }

  const strategyName = req.query.strategyName as string | undefined;
  const period = req.query.period as string || 'month';
  
  // Build filter
  const filter: any = { userId: req.user._id };
  if (strategyName) filter.strategyName = strategyName;

  // Calculate date range based on period
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'day':
      startDate = new Date(now.setDate(now.getDate() - 1));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default: // 'all' or anything else
      startDate = new Date(0); // Beginning of time
  }
  
  filter.timestamp = { $gte: startDate };
  
  // This would get performance metrics from the PerformanceMetrics model
  // For now we'll return some dummy data
  const performanceData = [
    {
      strategyName: 'RSI Strategy',
      totalSignals: 42,
      successfulSignals: 28,
      failedSignals: 14,
      winRate: 66.67,
      averageProfit: 1.8,
      averageLoss: 0.7,
      profitFactor: 2.57,
      period: {
        start: startDate,
        end: new Date()
      }
    },
    {
      strategyName: 'Open Interest Strategy',
      totalSignals: 37,
      successfulSignals: 22,
      failedSignals: 15,
      winRate: 59.46,
      averageProfit: 2.1,
      averageLoss: 0.9,
      profitFactor: 2.33,
      period: {
        start: startDate,
        end: new Date()
      }
    }
  ];
  
  // Filter by strategy name if provided
  const filteredData = strategyName
    ? performanceData.filter(item => item.strategyName === strategyName)
    : performanceData;

  res.status(200).json({
    success: true,
    message: 'Performance metrics retrieved successfully',
    data: filteredData
  } as ApiResponse);
}));

/**
 * @route GET /api/trading/dashboard
 * @desc Get trading dashboard summary data
 * @access Private
 */
router.get('/dashboard', authenticate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;

  // Get latest Nifty data
  const latestNifty = await NiftyData.findOne().sort({ timestamp: -1 });
  
  // Get recent signals - last 5
  const recentSignals = await TradeSignal.find()
    .sort({ timestamp: -1 })
    .limit(5);
  
  // Get alert config
  const alertConfig = await AlertConfig.findOne({ userId });
  
  // Get enabled strategies
  const enabledStrategies = await StrategySettings.find({ 
    userId,
    isEnabled: true 
  });
  
  // Get performance summary
  const performanceSummary = {
    totalSignalsToday: 12,
    successfulSignalsToday: 8,
    failedSignalsToday: 4,
    winRateToday: 66.67,
    winRateOverall: 62.5
  };

  res.status(200).json({
    success: true,
    message: 'Dashboard data retrieved successfully',
    data: {
      market: latestNifty,
      recentSignals,
      alertConfig,
      enabledStrategies: enabledStrategies.length,
      performance: performanceSummary
    }
  } as ApiResponse);
}));

export default router;
