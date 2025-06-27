import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Layout from '../ui/Layout';
import LoadingSpinner from '../ui/LoadingSpinner';
import TradingDashboard from '../trading/dashboard/TradingDashboard';
import AlertsList from '../trading/alerts/AlertsList';
import NiftyChart from '../trading/charts/NiftyChart';
import { useTradingSocket } from '../../contexts/trading/TradingSocketContext';

const TradingDashboardPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { connected, lastSignal } = useTradingSocket();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Simulate loading dashboard data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (lastSignal) {
      const message = `${lastSignal.signalType} Alert: ${lastSignal.instrument} @ ${lastSignal.entryPrice}`;
      showToast(message, 'info');
    }
  }, [lastSignal, showToast]);

  if (isLoading) {
    return (
      <Layout title="Trading Dashboard">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Trading Dashboard">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Welcome to your Trading Dashboard, {user?.firstName || 'Trader'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor Nifty movements, live option data, and trade alerts in real-time.
          </p>
        </div>

        {/* Connection status indicator */}
        <div className="mb-6">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {connected ? 'Connected to live data' : 'Connecting to server...'}
            </span>
          </div>
        </div>

        {/* Main dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Nifty chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Nifty 50 Chart</h2>
            <NiftyChart />
          </div>

          {/* Recent alerts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Recent Alerts</h2>
            <AlertsList limit={5} />
          </div>

          {/* Full dashboard */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <TradingDashboard />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TradingDashboardPage;
