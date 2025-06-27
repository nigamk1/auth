/**
 * Trading API Service
 */
import axios from 'axios';
import { tokenStorage } from '../api';
// Import types for trading API
import type { 
  TradeSignal,
  NiftyData,
  OptionData,
  AlertConfig,
  StrategySettings,
  PerformanceMetrics,
  StrategyInfo
} from '../../types';

// API Response type
interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Signals response type
interface SignalsResponse {
  signals: TradeSignal[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}


// Create axios instance for trading API
const tradingApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
tradingApi.interceptors.request.use(config => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trading API service
const tradingAPI = {
  // Get recent trade signals
  getSignals: async (
    params: { 
      limit?: number; 
      offset?: number; 
      strategy?: string;
      optionType?: 'CE' | 'PE';
      minConfidence?: number;
    } = {}
  ): Promise<SignalsResponse> => {
    const response = await tradingApi.get<ApiResponse<SignalsResponse>>('/trading/signals', { params });
    return response.data.data as SignalsResponse;
  },

  // Get specific signal by ID
  getSignalById: async (id: string): Promise<TradeSignal> => {
    const response = await tradingApi.get<ApiResponse<TradeSignal>>(`/trading/signals/${id}`);
    return response.data.data as TradeSignal;
  },

  // Get recent Nifty data
  getNiftyData: async (params: { limit?: number; interval?: string } = {}): Promise<NiftyData[]> => {
    const response = await tradingApi.get<ApiResponse<NiftyData[]>>('/trading/nifty', { params });
    return response.data.data as NiftyData[];
  },

  // Get option chain data
  getOptionsData: async (
    params: { 
      expiryDate: string;
      strikePrice?: number;
      optionType?: 'CE' | 'PE';
    }
  ): Promise<OptionData[]> => {
    const response = await tradingApi.get<ApiResponse<OptionData[]>>('/trading/options', { params });
    return response.data.data as OptionData[];
  },

  // Get full option chain
  getOptionChain: async (
    params: {
      expiry?: string;
      strikes?: number;
      underlying?: string;
    } = {}
  ): Promise<{ options: OptionData[] }> => {
    const response = await tradingApi.get<ApiResponse<{ options: OptionData[] }>>('/trading/option-chain', { params });
    return response.data.data as { options: OptionData[] };
  },

  // Get alert configuration
  getAlertConfig: async (): Promise<AlertConfig> => {
    const response = await tradingApi.get<ApiResponse<AlertConfig>>('/trading/alerts/config');
    return response.data.data as AlertConfig;
  },

  // Update alert configuration
  updateAlertConfig: async (config: Partial<AlertConfig>): Promise<AlertConfig> => {
    const response = await tradingApi.put<ApiResponse<AlertConfig>>('/trading/alerts/config', config);
    return response.data.data as AlertConfig;
  },

  // Get available strategies
  getStrategies: async (): Promise<StrategyInfo[]> => {
    const response = await tradingApi.get<ApiResponse<StrategyInfo[]>>('/trading/strategies');
    return response.data.data as StrategyInfo[];
  },

  // Update strategy settings
  updateStrategy: async (
    strategyName: string, 
    settings: { isEnabled: boolean; parameters: Record<string, any> }
  ): Promise<StrategySettings> => {
    const response = await tradingApi.put<ApiResponse<StrategySettings>>(
      `/trading/strategies/${strategyName}`, 
      settings
    );
    return response.data.data as StrategySettings;
  },

  // Get performance metrics
  getPerformanceMetrics: async (
    params: { strategyName?: string; period?: 'day' | 'week' | 'month' | 'year' | 'all' } = {}
  ): Promise<PerformanceMetrics[]> => {
    const response = await tradingApi.get<ApiResponse<PerformanceMetrics[]>>('/trading/performance', { params });
    return response.data.data as PerformanceMetrics[];
  },
  
  // Get dashboard summary data
  getDashboard: async (): Promise<any> => {
    const response = await tradingApi.get<ApiResponse<any>>('/trading/dashboard');
    return response.data.data;
  },

  // Save user trading preferences - custom method for user profile settings
  savePreferences: async (preferences: any): Promise<any> => {
    // This merges trading preferences with alert configuration
    const response = await tradingApi.put<ApiResponse<any>>('/trading/alerts/config', preferences);
    return response.data.data;
  }
};

export default tradingAPI;
