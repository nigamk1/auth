import React from 'react';
import { MicrophoneIcon, SpeakerWaveIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';

interface StatusIndicatorProps {
  status: 'idle' | 'listening' | 'speaking' | 'loading';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'listening':
        return {
          icon: MicrophoneIcon,
          text: 'Listening to you...',
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'speaking':
        return {
          icon: SpeakerWaveIcon,
          text: 'AI Teacher is speaking...',
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'loading':
        return {
          icon: Cog6ToothIcon,
          text: 'Processing your request...',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          icon: null,
          text: 'Ready to learn',
          color: 'bg-gray-400',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`
      inline-flex items-center space-x-3 px-4 py-3 rounded-lg border
      ${config.bgColor} ${config.borderColor} transition-all duration-300
    `}>
      {/* Status Indicator Dot */}
      <div className="flex items-center space-x-2">
        <div className={`
          w-3 h-3 rounded-full ${config.color}
          ${status !== 'idle' ? 'animate-pulse' : ''}
        `}></div>
        
        {/* Icon */}
        {Icon && (
          <Icon className={`w-5 h-5 ${config.textColor} ${
            status === 'loading' ? 'animate-spin' : ''
          }`} />
        )}
      </div>
      
      {/* Status Text */}
      <span className={`text-sm font-medium ${config.textColor}`}>
        {config.text}
      </span>
      
      {/* Loading Dots */}
      {status === 'loading' && (
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full ${config.color} animate-bounce`}
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};
