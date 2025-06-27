import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import tradingAPI from '../../../services/trading/tradingAPI';
import type { PerformanceMetrics } from '../../../types/trading';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface PerformancePanelProps {
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const PerformancePanel: React.FC<PerformancePanelProps> = ({ 
  timeRange = 'month' 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<string>(timeRange);

  // Load performance metrics
  useEffect(() => {
    const loadPerformanceData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await tradingAPI.getPerformanceMetrics({
          period: selectedRange as 'day' | 'week' | 'month' | 'year' | 'all'
        });
        
        setMetrics(data);
      } catch (err) {
        console.error('Error loading performance metrics:', err);
        setError('Failed to load performance data');
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceData();
  }, [selectedRange]);

  // Calculate aggregated metrics
  const aggregateMetrics = () => {
    if (!metrics.length) return {
      totalSignals: 0,
      successRate: 0,
      averageProfit: 0,
      averageLoss: 0,
      profitFactor: 0
    };

    const total = metrics.reduce((sum, m) => sum + m.totalSignals, 0);
    const successful = metrics.reduce((sum, m) => sum + m.successfulSignals, 0);
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    // Calculate weighted averages
    let totalProfitWeight = 0;
    let totalLossWeight = 0;
    let weightedProfit = 0;
    let weightedLoss = 0;

    metrics.forEach(m => {
      if (m.successfulSignals > 0) {
        totalProfitWeight += m.successfulSignals;
        weightedProfit += m.averageProfit * m.successfulSignals;
      }
      
      if (m.failedSignals > 0) {
        totalLossWeight += m.failedSignals;
        weightedLoss += m.averageLoss * m.failedSignals;
      }
    });

    const averageProfit = totalProfitWeight > 0 ? weightedProfit / totalProfitWeight : 0;
    const averageLoss = totalLossWeight > 0 ? weightedLoss / totalLossWeight : 0;
    const profitFactor = averageLoss !== 0 ? averageProfit / Math.abs(averageLoss) : 0;

    return {
      totalSignals: total,
      successRate,
      averageProfit,
      averageLoss,
      profitFactor
    };
  };

  // Prepare data for pie chart
  const getPieChartData = () => {
    return metrics.map(m => ({
      name: m.strategyName,
      value: m.totalSignals
    }));
  };

  // Prepare data for bar chart
  const getBarChartData = () => {
    return metrics.map(m => ({
      name: m.strategyName,
      winRate: m.winRate,
      profitFactor: m.profitFactor,
      totalSignals: m.totalSignals
    }));
  };

  const aggregated = aggregateMetrics();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Analytics</h2>
        <p className="text-gray-600 mb-4">
          No performance data available for the selected time period. 
          Generate some trading signals first to see performance metrics.
        </p>
        <div className="flex justify-center space-x-2">
          <select
            className="block w-48 rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Performance Analytics</h2>
        <select
          className="block w-48 rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
          value={selectedRange}
          onChange={(e) => setSelectedRange(e.target.value)}
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border-b">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500">Total Signals</h3>
          <p className="text-xl font-semibold">{aggregated.totalSignals}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500">Success Rate</h3>
          <p className="text-xl font-semibold">{aggregated.successRate.toFixed(1)}%</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500">Avg. Profit</h3>
          <p className="text-xl font-semibold text-green-600">
            {aggregated.averageProfit > 0 ? '+' : ''}
            {aggregated.averageProfit.toFixed(2)}%
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500">Avg. Loss</h3>
          <p className="text-xl font-semibold text-red-600">
            {aggregated.averageLoss.toFixed(2)}%
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500">Profit Factor</h3>
          <p className="text-xl font-semibold">
            {aggregated.profitFactor.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Strategy performance bar chart */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-base font-medium text-gray-700 mb-2">Strategy Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getBarChartData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="winRate" name="Win Rate %" fill="#82ca9d" />
                <Bar dataKey="profitFactor" name="Profit Factor" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Strategy distribution pie chart */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-base font-medium text-gray-700 mb-2">Signal Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getPieChartData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent ? (percent * 100).toFixed(1) : '0')}%`}
                >
                  {getPieChartData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} signals`, 'Quantity']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed strategies table */}
      <div className="p-4">
        <h3 className="text-base font-medium text-gray-700 mb-4">Strategy Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Strategy
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Signals
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Win Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Profit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Loss
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit Factor
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.map((metric) => (
                <tr key={metric.strategyName}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.strategyName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">
                    {metric.totalSignals}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                    {metric.winRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                    {metric.averageProfit > 0 ? '+' : ''}
                    {metric.averageProfit.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                    {metric.averageLoss.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                    {metric.profitFactor.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerformancePanel;
