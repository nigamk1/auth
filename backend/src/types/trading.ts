/**
 * Trading system types
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
  timestamp: Date;
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
  timestamp: Date;
}

// Technical Indicator Results
export interface IndicatorResult {
  name: string;
  value: number | boolean | string | Array<number>;
  timestamp: Date;
}

// Strategy Analysis Result
export interface StrategyResult {
  strategyName: string;
  signalType: 'BUY' | 'SELL' | 'NEUTRAL';
  instrument: string; // e.g., "NIFTY 22700 CE"
  confidence: number; // 0 to 100
  indicators: IndicatorResult[];
  timestamp: Date;
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
  timestamp: Date;
  expiryDate: string;
  strikePrice: number;
  optionType: 'CE' | 'PE';
  underlyingValue: number;
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

// User Strategy Settings
export interface StrategySettings {
  userId: string;
  strategyName: string;
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
    start: Date;
    end: Date;
  };
}

// WebSocket Message
export interface WebSocketMessage {
  type: 'NIFTY_UPDATE' | 'OPTION_UPDATE' | 'TRADE_SIGNAL' | 'HEARTBEAT' | 'ERROR';
  data: any;
  timestamp: Date;
}
