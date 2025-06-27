import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { useTradingSocket } from '../../../contexts/trading/TradingSocketContext';
import tradingAPI from '../../../services/trading/tradingAPI';
import type { NiftyData } from '../../../types/trading';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface NiftyChartProps {
  height?: number;
  showVolume?: boolean;
}

const NiftyChart: React.FC<NiftyChartProps> = ({ 
  height = 400,
  showVolume = true
}) => {
  const { niftyData: latestNiftyData } = useTradingSocket();
  const [historicalData, setHistoricalData] = useState<NiftyData[]>([]);
  const [chartData, setChartData] = useState<NiftyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '1d' | '5d' | '1m'>('1d');

  // Load historical data
  useEffect(() => {
    const loadNiftyData = async () => {
      setIsLoading(true);
      try {
        // Define limit based on timeRange
        let limit: number;
        let interval: string;
        
        switch (timeRange) {
          case '1h':
            limit = 60;
            interval = '1m';
            break;
          case '1d':
            limit = 75;
            interval = '5m';
            break;
          case '5d':
            limit = 120;
            interval = '15m';
            break;
          case '1m':
            limit = 30;
            interval = '1d';
            break;
          default:
            limit = 75;
            interval = '5m';
        }
        
        const data = await tradingAPI.getNiftyData({ limit, interval });
        setHistoricalData(data);
        
      } catch (error) {
        console.error('Error loading Nifty data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNiftyData();
  }, [timeRange]);

  // Update chart data when new data comes in via socket
  useEffect(() => {
    if (latestNiftyData && historicalData.length > 0) {
      // Check if we already have this timestamp in our data
      const existingIndex = historicalData.findIndex(
        item => new Date(item.timestamp).getTime() === new Date(latestNiftyData.timestamp).getTime()
      );

      let updatedData: NiftyData[];
      
      if (existingIndex >= 0) {
        // Update existing data point
        updatedData = [...historicalData];
        updatedData[existingIndex] = latestNiftyData;
      } else {
        // Add new data point and remove oldest to keep the array size consistent
        updatedData = [...historicalData.slice(1), latestNiftyData];
      }
      
      setHistoricalData(updatedData);
    }
  }, [latestNiftyData, historicalData]);

  // Format chart data
  useEffect(() => {
    // Process and format the data for the chart
    const formatted = historicalData.map(item => ({
      ...item,
      // Format timestamp for display
      formattedTime: formatTimeByRange(new Date(item.timestamp), timeRange)
    }));
    
    setChartData(formatted);
  }, [historicalData, timeRange]);

  // Helper function to format time based on range
  const formatTimeByRange = (date: Date, range: string): string => {
    switch (range) {
      case '1h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '1d':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '5d':
        return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit' })}`;
      case '1m':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Time range selector */}
      <div className="flex justify-end mb-4 space-x-2">
        {(['1h', '1d', '5d', '1m'] as const).map(range => (
          <button
            key={range}
            className={`px-3 py-1 text-xs rounded ${
              timeRange === range 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setTimeRange(range)}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Price chart */}
      <div className="mb-4">
        <ResponsiveContainer width="100%" height={showVolume ? height * 0.7 : height}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 10 }}
              minTickGap={20}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              tick={{ fontSize: 10 }}
              orientation="right"
              width={40}
            />
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(2)}`, 'Price']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#3b82f6" 
              fill="url(#colorPrice)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Volume chart - only if showVolume is true */}
      {showVolume && (
        <div>
          <ResponsiveContainer width="100%" height={height * 0.25}>
            <AreaChart
              data={chartData}
              margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="formattedTime" 
                tick={{ fontSize: 10 }}
                minTickGap={20}
                height={0}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[0, 'auto']}
                tick={{ fontSize: 10 }}
                orientation="right"
                width={40}
              />
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString()}`, 'Volume']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="volume" 
                stroke="#10b981" 
                fill="url(#colorVolume)" 
                strokeWidth={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default NiftyChart;
