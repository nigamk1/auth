import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import Alert from './Alert';
import Button from './Button';
import { RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface LoadingStateProps {
  loading?: boolean;
  error?: string | Error | null;
  retry?: () => void;
  className?: string;
  children?: React.ReactNode;
  loadingText?: string;
  emptyState?: {
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  data?: any;
}

interface NetworkStatusProps {
  isOnline: boolean;
  className?: string;
}

interface FailoverProps {
  primary: React.ReactNode;
  fallback: React.ReactNode;
  condition: boolean;
  className?: string;
}

// Main loading state wrapper
export const LoadingState: React.FC<LoadingStateProps> = ({
  loading = false,
  error = null,
  retry,
  className = '',
  children,
  loadingText = 'Loading...',
  emptyState,
  data
}) => {
  // Show loading spinner
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <LoadingSpinner className="w-8 h-8 mb-4" />
        <p className="text-gray-600 text-sm">{loadingText}</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    const errorMessage = error instanceof Error ? error.message : error;
    return (
      <div className={`py-12 ${className}`}>
        <div className="mb-4">
          <Alert
            type="error"
            message={errorMessage}
          />
        </div>
        {retry && (
          <div className="flex justify-center">
            <Button
              onClick={retry}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Show empty state
  if (emptyState && (!data || (Array.isArray(data) && data.length === 0))) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {emptyState.title}
        </h3>
        <p className="text-gray-600 mb-6">
          {emptyState.description}
        </p>
        {emptyState.action && (
          <Button
            onClick={emptyState.action.onClick}
            variant="primary"
          >
            {emptyState.action.label}
          </Button>
        )}
      </div>
    );
  }

  // Show content
  return <>{children}</>;
};

// Network status indicator
export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  isOnline,
  className = ''
}) => {
  if (isOnline) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <Wifi className="w-4 h-4" />
        <span className="text-sm font-medium">Online</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-red-600 ${className}`}>
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">Offline</span>
    </div>
  );
};

// Failover component
export const Failover: React.FC<FailoverProps> = ({
  primary,
  fallback,
  condition,
  className = ''
}) => {
  return (
    <div className={className}>
      {condition ? primary : fallback}
    </div>
  );
};

// Skeleton loader for better loading UX
interface SkeletonProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  count = 1,
  height = 'h-4',
  width = 'w-full'
}) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${height} ${width} bg-gray-200 rounded animate-pulse ${
            index > 0 ? 'mt-2' : ''
          }`}
        />
      ))}
    </div>
  );
};

// Progress indicator
interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className = '',
  showLabel = false,
  label
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{label || 'Progress'}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Hook for online/offline status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Hook for retry logic with exponential backoff
export const useRetry = (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
) => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const retry = React.useCallback(async () => {
    if (retryCount >= maxRetries) {
      throw new Error(`Max retries (${maxRetries}) exceeded`);
    }

    setIsRetrying(true);
    const delay = baseDelay * Math.pow(2, retryCount);
    
    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      const result = await fn();
      setRetryCount(0);
      return result;
    } catch (error) {
      setRetryCount(prev => prev + 1);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [fn, retryCount, maxRetries, baseDelay]);

  const reset = React.useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    reset,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries
  };
};

export default LoadingState;
