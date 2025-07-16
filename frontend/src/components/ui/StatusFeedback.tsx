import React from 'react';
import { 
  MicrophoneIcon, 
  SpeakerWaveIcon, 
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';
import LoadingSpinner, { PulsingDots, WaveAnimation } from './LoadingSpinner';

interface StatusFeedbackProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'drawing' | 'error' | 'success';
  message?: string;
  error?: string | null;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusFeedback: React.FC<StatusFeedbackProps> = ({
  status,
  message,
  error,
  showIcon = true,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-3 text-base',
    lg: 'p-4 text-lg'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'listening':
        return {
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          icon: <MicrophoneIcon className={`${iconSizes[size]} text-blue-600`} />,
          animation: <WaveAnimation color="blue" size={size} />,
          defaultMessage: 'Listening...'
        };
      case 'processing':
        return {
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          icon: <CpuChipIcon className={`${iconSizes[size]} text-yellow-600`} />,
          animation: <LoadingSpinner size={size === 'sm' ? 'sm' : 'md'} className="text-yellow-600" />,
          defaultMessage: 'Thinking...'
        };
      case 'speaking':
        return {
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          icon: <SpeakerWaveIcon className={`${iconSizes[size]} text-green-600`} />,
          animation: <PulsingDots color="green" />,
          defaultMessage: 'Speaking...'
        };
      case 'drawing':
        return {
          bgColor: 'bg-purple-50 border-purple-200',
          textColor: 'text-purple-800',
          icon: (
            <svg className={`${iconSizes[size]} text-purple-600`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9H21ZM19 21H5V3H13V9H19V21Z"/>
            </svg>
          ),
          animation: <PulsingDots color="blue" />,
          defaultMessage: 'Drawing...'
        };
      case 'error':
        return {
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          icon: <ExclamationTriangleIcon className={`${iconSizes[size]} text-red-600`} />,
          animation: null,
          defaultMessage: 'Error occurred'
        };
      case 'success':
        return {
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          icon: <CheckCircleIcon className={`${iconSizes[size]} text-green-600`} />,
          animation: null,
          defaultMessage: 'Success!'
        };
      default: // idle
        return {
          bgColor: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-600',
          icon: null,
          animation: null,
          defaultMessage: 'Ready'
        };
    }
  };

  const config = getStatusConfig();
  const displayMessage = error || message || config.defaultMessage;

  if (status === 'idle' && !message && !error) {
    return null; // Don't show anything for idle state unless there's a specific message
  }

  return (
    <div className={`
      ${config.bgColor} 
      ${config.textColor}
      ${sizeClasses[size]}
      border rounded-lg flex items-center justify-center space-x-2
      transition-all duration-300 ease-in-out
      ${className}
    `}>
      {showIcon && config.icon && (
        <div className="flex-shrink-0">
          {config.icon}
        </div>
      )}
      
      {config.animation && (
        <div className="flex-shrink-0">
          {config.animation}
        </div>
      )}
      
      <span className="font-medium">
        {displayMessage}
      </span>
    </div>
  );
};

interface MicrophoneStatusProps {
  isListening: boolean;
  isSupported: boolean;
  error?: string | null;
  className?: string;
}

export const MicrophoneStatus: React.FC<MicrophoneStatusProps> = ({
  isListening,
  isSupported,
  error,
  className = ''
}) => {
  if (!isSupported) {
    return (
      <StatusFeedback
        status="error"
        message="Microphone not supported"
        className={className}
        size="sm"
      />
    );
  }

  if (error) {
    return (
      <StatusFeedback
        status="error"
        error={error}
        className={className}
        size="sm"
      />
    );
  }

  if (isListening) {
    return (
      <StatusFeedback
        status="listening"
        message="Listening for your voice..."
        className={className}
        size="sm"
      />
    );
  }

  return null;
};
