/**
 * Types for the trading alert system
 */

// Nifty 50 Index Data
export interface NiftyData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
  timestamp: string;
}

// Option Chain Data
export interface OptionData {
  symbol: string;
  strikePrice: number;
  expiryDate: string;
  optionType: 'CE' | 'PE';
  lastPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  openInterest: number;
  openInterestChange: number;
  impliedVolatility: number;
  bidPrice: number;
  askPrice: number;
  underlyingValue: number;
  timestamp: string;
}

// Technical Indicator Results
export interface IndicatorResult {
  name: string;
  value: number | boolean | string | Array<number>;
  timestamp: string;
}

// Strategy Analysis Result
export interface StrategyResult {
  strategyName: string;
  signalType: 'BUY' | 'SELL' | 'NEUTRAL';
  instrument: string; // e.g., "NIFTY 22700 CE"
  confidence: number; // 0 to 100
  indicators: IndicatorResult[];
  timestamp: string;
}

// Trade Signal
export interface TradeSignal {
  id: string;
  strategyName: string;
  signalType: 'BUY' | 'SELL';
  instrument: string;
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  confidence: number; // 0 to 100
  reasoning: string;
  indicators: IndicatorResult[];
  timestamp: string;
  expiryDate: string;
  strikePrice: number;
  optionType: 'CE' | 'PE';
  underlyingValue: number;
}

// Strategy Information Type
export interface StrategyInfo {
  name: string;
  description: string;
  isEnabled: boolean;
  parameters: Record<string, any>;
  defaultParameters: Record<string, any>;
}

// Alert Configuration
export interface AlertConfig {
  userId: string;
  telegramEnabled: boolean;
  telegramChatId?: string;
  whatsappEnabled: boolean;
  whatsappNumber?: string;
  emailEnabled: boolean;
  emailAddress?: string;
  minConfidence: number;
  strategyFilters: string[]; // List of strategy names to include
  optionTypeFilters: ('CE' | 'PE')[];
}

// Strategy Settings
export interface StrategySettings {
  name: string;
  description: string;
  isEnabled: boolean;
  parameters: Record<string, any>;
}

// Performance Metrics
export interface PerformanceMetrics {
  strategyName: string;
  totalSignals: number;
  successfulSignals: number;
  failedSignals: number;
  winRate: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  period: {
    start: string;
    end: string;
  };
}
