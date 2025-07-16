import React from 'react';
import { CheckCircleIcon, SparklesIcon, AcademicCapIcon } from '@heroicons/react/24/solid';

interface SuccessToastProps {
  isVisible: boolean;
  message: string;
  type?: 'success' | 'achievement' | 'learning';
  duration?: number;
  onDismiss?: () => void;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  isVisible,
  message,
  type = 'success',
  duration = 3000,
  onDismiss
}) => {
  React.useEffect(() => {
    if (isVisible && duration > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onDismiss]);

  if (!isVisible) return null;

  const getConfig = () => {
    switch (type) {
      case 'achievement':
        return {
          icon: <SparklesIcon className="w-5 h-5 text-yellow-600" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        };
      case 'learning':
        return {
          icon: <AcademicCapIcon className="w-5 h-5 text-blue-600" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        };
      default:
        return {
          icon: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm
      ${config.bgColor} ${config.borderColor} ${config.textColor}
      border rounded-lg shadow-lg p-4
      animate-in slide-in-from-top-2 duration-300
    `}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

interface ProgressIndicatorProps {
  steps: Array<{
    label: string;
    completed: boolean;
    current?: boolean;
  }>;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-3">Learning Progress</h3>
      
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className={`
              w-4 h-4 rounded-full flex items-center justify-center
              ${step.completed 
                ? 'bg-green-500 text-white' 
                : step.current 
                  ? 'bg-blue-500 text-white animate-pulse' 
                  : 'bg-gray-200 text-gray-400'
              }
            `}>
              {step.completed ? (
                <CheckCircleIcon className="w-3 h-3" />
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>
            
            <span className={`
              text-sm
              ${step.completed 
                ? 'text-green-700 font-medium' 
                : step.current 
                  ? 'text-blue-700 font-medium' 
                  : 'text-gray-500'
              }
            `}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface LearningTipProps {
  tip: string;
  isVisible: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const LearningTip: React.FC<LearningTipProps> = ({
  tip,
  isVisible,
  onDismiss,
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <div className={`
      bg-blue-50 border border-blue-200 rounded-lg p-3
      animate-in slide-in-from-left-2 duration-300
      ${className}
    `}>
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0">
          💡
        </div>
        <div className="flex-1">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Tip: </span>
            {tip}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
