import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTradingSocket } from '../../../contexts/trading/TradingSocketContext';
import tradingAPI from '../../../services/trading/tradingAPI';
import type { TradeSignal, StrategyInfo } from '../../../types/trading';
import LoadingSpinner from '../../ui/LoadingSpinner';
import AlertsList from '../alerts/AlertsList';
import OptionChain from '../chains/OptionChain';
import StrategiesPanel from '../strategies/StrategiesPanel';
import PerformancePanel from '../performance/PerformancePanel';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const TradingDashboard: React.FC = () => {
  const { user } = useAuth();
  const { niftyData, connected } = useTradingSocket();
  
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [strategies, setStrategies] = useState<StrategyInfo[]>([]);
  const [signals, setSignals] = useState<TradeSignal[]>([]);

  // Load initial data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // Load strategies
        const strategiesData = await tradingAPI.getStrategies();
        setStrategies(strategiesData);
        
        // Load recent signals
        const signalsData = await tradingAPI.getSignals({ limit: 20 });
        setSignals(signalsData.signals);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Define tabs
  const tabs = [
    { name: 'Alerts', content: <AlertsList /> },
    { name: 'Option Chain', content: <OptionChain /> },
    { name: 'Strategies', content: <StrategiesPanel strategies={strategies} /> },
    { name: 'Performance', content: <PerformancePanel timeRange="month" /> },
  ];

  return (
    <div className="w-full">
      {/* Nifty data header */}
      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-6 flex flex-wrap justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Nifty 50</h3>
          {niftyData ? (
            <div className="flex items-center">
              <span className="text-2xl font-bold mr-3">{niftyData.price.toFixed(2)}</span>
              <span 
                className={`text-sm font-medium ${
                  niftyData.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {niftyData.changePercent >= 0 ? '+' : ''}
                {niftyData.changePercent.toFixed(2)}% 
                ({niftyData.change.toFixed(2)})
              </span>
            </div>
          ) : (
            <span className="text-sm">Loading data...</span>
          )}
        </div>
        
        <div className="flex flex-col text-sm text-gray-600 dark:text-gray-300">
          <div className="grid grid-cols-2 gap-x-6">
            <span>Open: {niftyData?.open.toFixed(2) || '-'}</span>
            <span>High: {niftyData?.high.toFixed(2) || '-'}</span>
            <span>Close: {niftyData?.close.toFixed(2) || '-'}</span>
            <span>Low: {niftyData?.low.toFixed(2) || '-'}</span>
          </div>
        </div>
        
        <div className="flex items-center mt-2 sm:mt-0">
          <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs">
            {connected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tab.Group onChange={setActiveTab} defaultIndex={0}>
        <Tab.List className="flex space-x-1 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
          {tabs.map((tab, idx) => (
            <Tab
              key={idx}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-md py-2.5 text-sm font-medium leading-5',
                  'focus:outline-none focus:ring-0',
                  selected
                    ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-400 shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          {isLoading ? (
            <div className="flex justify-center p-10">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            tabs.map((tab, idx) => (
              <Tab.Panel
                key={idx}
                className={classNames(
                  'rounded-lg bg-white dark:bg-gray-800 p-4',
                  'focus:outline-none focus:ring-0'
                )}
              >
                {tab.content}
              </Tab.Panel>
            ))
          )}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default TradingDashboard;
