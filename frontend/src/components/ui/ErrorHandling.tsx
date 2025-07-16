import React from 'react';
import { 
  ExclamationTriangleIcon, 
  XMarkIcon, 
  ArrowPathIcon,
  SpeakerWaveIcon,
  MicrophoneIcon,
  WifiIcon
} from '@heroicons/react/24/solid';

interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  retryLabel = 'Try Again',
  className = ''
}) => {
  if (!error) return null;

  const getErrorType = (errorMessage: string) => {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('microphone') || message.includes('mic') || message.includes('speech recognition')) {
      return 'microphone';
    }
    if (message.includes('network') || message.includes('connection') || message.includes('failed to fetch')) {
      return 'network';
    }
    if (message.includes('speech') || message.includes('tts') || message.includes('speak')) {
      return 'speech';
    }
    return 'general';
  };

  const errorType = getErrorType(error);

  const getErrorIcon = () => {
    switch (errorType) {
      case 'microphone':
        return <MicrophoneIcon className="w-6 h-6 text-red-500" />;
      case 'network':
        return <WifiIcon className="w-6 h-6 text-red-500" />;
      case 'speech':
        return <SpeakerWaveIcon className="w-6 h-6 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />;
    }
  };

  const getErrorSuggestion = () => {
    switch (errorType) {
      case 'microphone':
        return 'Please check your microphone permissions and try again. Make sure your browser allows microphone access.';
      case 'network':
        return 'Please check your internet connection and try again. The AI teacher needs an active connection.';
      case 'speech':
        return 'There was an issue with text-to-speech. You can still read the response or try again.';
      default:
        return 'Something went wrong. Please try again or refresh the page if the problem persists.';
    }
  };

  return (
    <div className={`
      bg-red-50 border border-red-200 rounded-lg p-4 mb-4
      animate-in slide-in-from-top-2 duration-300
      ${className}
    `}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            Error
          </h3>
          <p className="text-sm text-red-700 mb-2">
            {error}
          </p>
          <p className="text-xs text-red-600">
            {getErrorSuggestion()}
          </p>
          
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex space-x-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <ArrowPathIcon className="w-3 h-3 mr-1" />
                  {retryLabel}
                </button>
              )}
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <XMarkIcon className="w-3 h-3 mr-1" />
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
        
        {!onDismiss && (
          <div className="ml-auto flex-shrink-0">
            <button
              onClick={onDismiss}
              className="inline-flex text-red-400 hover:text-red-600 focus:outline-none focus:text-red-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface FallbackMessageProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onFallback?: () => void;
  fallbackLabel?: string;
  className?: string;
}

export const FallbackMessage: React.FC<FallbackMessageProps> = ({
  title,
  message,
  onRetry,
  onFallback,
  fallbackLabel = 'Use Text Input',
  className = ''
}) => {
  return (
    <div className={`
      bg-yellow-50 border border-yellow-200 rounded-lg p-4
      ${className}
    `}>
      <div className="flex items-center">
        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-2" />
        <h3 className="text-sm font-medium text-yellow-800">
          {title}
        </h3>
      </div>
      
      <p className="mt-2 text-sm text-yellow-700">
        {message}
      </p>
      
      <div className="mt-3 flex space-x-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
          >
            <ArrowPathIcon className="w-3 h-3 mr-1" />
            Try Again
          </button>
        )}
        
        {onFallback && (
          <button
            onClick={onFallback}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
          >
            {fallbackLabel}
          </button>
        )}
      </div>
    </div>
  );
};

interface PermissionPromptProps {
  type: 'microphone' | 'camera' | 'notification';
  onGrant: () => void;
  onDeny: () => void;
  className?: string;
}

export const PermissionPrompt: React.FC<PermissionPromptProps> = ({
  type,
  onGrant,
  onDeny,
  className = ''
}) => {
  const getPromptConfig = () => {
    switch (type) {
      case 'microphone':
        return {
          icon: <MicrophoneIcon className="w-8 h-8 text-blue-500" />,
          title: 'Microphone Access Required',
          message: 'The AI teacher needs access to your microphone to hear your questions and responses.',
          grantLabel: 'Allow Microphone',
          denyLabel: 'Use Text Only'
        };
      case 'camera':
        return {
          icon: (
            <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9H21ZM19 21H5V3H13V9H19V21Z"/>
            </svg>
          ),
          title: 'Camera Access Required',
          message: 'Camera access is needed for enhanced learning features.',
          grantLabel: 'Allow Camera',
          denyLabel: 'Continue Without Camera'
        };
      case 'notification':
        return {
          icon: (
            <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20H14C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20ZM20 17.35L18.65 16H17V11C17 7.9 16.11 5.36 13.3 4.68V4C13.3 3.45 12.85 3 12.3 3C11.75 3 11.3 3.45 11.3 4V4.68C8.49 5.36 7.6 7.9 7.6 11V16H6L4.65 17.35C4.26 17.74 4.26 18.37 4.65 18.76C5.04 19.15 5.67 19.15 6.06 18.76L7 17.83H17L17.94 18.76C18.33 19.15 18.96 19.15 19.35 18.76C19.74 18.37 19.74 17.74 19.35 17.35Z"/>
            </svg>
          ),
          title: 'Notification Permission',
          message: 'Get notified when the AI teacher has responded or needs your attention.',
          grantLabel: 'Allow Notifications',
          denyLabel: 'No Thanks'
        };
    }
  };

  const config = getPromptConfig();

  return (
    <div className={`
      bg-blue-50 border border-blue-200 rounded-lg p-6 text-center
      ${className}
    `}>
      <div className="flex justify-center mb-4">
        {config.icon}
      </div>
      
      <h3 className="text-lg font-medium text-blue-900 mb-2">
        {config.title}
      </h3>
      
      <p className="text-sm text-blue-700 mb-6">
        {config.message}
      </p>
      
      <div className="flex space-x-3 justify-center">
        <button
          onClick={onGrant}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {config.grantLabel}
        </button>
        
        <button
          onClick={onDeny}
          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        >
          {config.denyLabel}
        </button>
      </div>
    </div>
  );
};
