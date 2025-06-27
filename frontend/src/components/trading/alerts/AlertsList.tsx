import React, { useState, useEffect } from 'react';
import { useTradingSocket } from '../../../contexts/trading/TradingSocketContext';
import tradingAPI from '../../../services/trading/tradingAPI';
import type { TradeSignal } from '../../../types/trading';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface AlertsListProps {
  limit?: number;
  onAlertClick?: (signal: TradeSignal) => void;
}

const AlertsList: React.FC<AlertsListProps> = ({ limit, onAlertClick }) => {
  const { recentSignals } = useTradingSocket();
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    strategyName: '',
    optionType: '' as '' | 'CE' | 'PE',
    minConfidence: 0
  });

  // Load initial data from API
  useEffect(() => {
    const loadSignals = async () => {
      setIsLoading(true);
      try {
        const params: any = { limit: limit || 20 };
        if (filters.strategyName) params.strategy = filters.strategyName;
        if (filters.optionType) params.optionType = filters.optionType;
        if (filters.minConfidence > 0) params.minConfidence = filters.minConfidence;
        
        const response = await tradingAPI.getSignals(params);
        setSignals(response.signals);
      } catch (error) {
        console.error('Error loading signals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSignals();
  }, [limit, filters]);

  // Update signals when new ones arrive via WebSocket
  useEffect(() => {
    if (recentSignals.length > 0) {
      // Apply filters
      let filteredSignals = [...recentSignals];
      
      if (filters.strategyName) {
        filteredSignals = filteredSignals.filter(s => s.strategyName === filters.strategyName);
      }
      
      if (filters.optionType) {
        filteredSignals = filteredSignals.filter(s => s.optionType === filters.optionType);
      }
      
      if (filters.minConfidence > 0) {
        filteredSignals = filteredSignals.filter(s => s.confidence >= filters.minConfidence);
      }
      
      // Limit if required
      if (limit && filteredSignals.length > limit) {
        filteredSignals = filteredSignals.slice(0, limit);
      }
      
      setSignals(filteredSignals);
    }
  }, [recentSignals, limit, filters]);

  // Handle filter changes
  const handleFilterChange = (name: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No alerts found matching your criteria</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters - only show if not limited */}
      {!limit && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Strategy
            </label>
            <select
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-800"
              value={filters.strategyName}
              onChange={(e) => handleFilterChange('strategyName', e.target.value)}
            >
              <option value="">All Strategies</option>
              <option value="RSI Strategy">RSI Strategy</option>
              <option value="Open Interest Strategy">Open Interest Strategy</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Option Type
            </label>
            <select
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-800"
              value={filters.optionType}
              onChange={(e) => handleFilterChange('optionType', e.target.value as '' | 'CE' | 'PE')}
            >
              <option value="">All Types</option>
              <option value="CE">Call (CE)</option>
              <option value="PE">Put (PE)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min Confidence
            </label>
            <select
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-800"
              value={filters.minConfidence}
              onChange={(e) => handleFilterChange('minConfidence', parseInt(e.target.value))}
            >
              <option value="0">Any Confidence</option>
              <option value="50">50% or higher</option>
              <option value="70">70% or higher</option>
              <option value="90">90% or higher</option>
            </select>
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className="space-y-4">
        {signals.map((signal) => (
          <div 
            key={signal.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            style={{ 
              borderLeftColor: signal.signalType === 'BUY' ? '#10B981' : '#EF4444' 
            }}
            onClick={() => onAlertClick && onAlertClick(signal)}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-1">
                  <span className={`font-semibold ${
                    signal.signalType === 'BUY' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {signal.signalType} {signal.instrument}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Strategy: {signal.strategyName}
                </p>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="text-sm font-medium">
                  <div className="text-gray-900 dark:text-white">
                    Entry: ₹{signal.entryPrice.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Target: ₹{signal.targetPrice.toFixed(2)} | 
                    SL: ₹{signal.stopLossPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-2 flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(signal.timestamp).toLocaleString()}
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-semibold px-2 py-1 rounded">
                {signal.confidence}% confidence
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsList;
