import React from 'react';

interface AvatarProps {
  status: 'idle' | 'listening' | 'speaking' | 'loading';
}

export const Avatar: React.FC<AvatarProps> = ({ status }) => {
  const getAvatarAnimation = () => {
    switch (status) {
      case 'speaking':
        return 'animate-gentle-bounce';
      case 'listening':
        return 'animate-pulse';
      case 'loading':
        return 'animate-spin';
      default:
        return '';
    }
  };

  const getAvatarColor = () => {
    switch (status) {
      case 'speaking':
        return 'bg-gradient-to-br from-green-400 to-green-600';
      case 'listening':
        return 'bg-gradient-to-br from-blue-400 to-blue-600';
      case 'loading':
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
      default:
        return 'bg-gradient-to-br from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Circle */}
      <div 
        className={`
          w-32 h-32 rounded-full flex items-center justify-center text-white shadow-lg
          transition-all duration-300 ${getAvatarColor()} ${getAvatarAnimation()}
        `}
      >
        {/* Simple Face Icon */}
        <div className="text-5xl">
          {status === 'speaking' ? '🗣️' : 
           status === 'listening' ? '👂' :
           status === 'loading' ? '🤔' : '🤖'}
        </div>
      </div>

      {/* Avatar Speech Bubble */}
      {status === 'speaking' && (
        <div className="relative bg-white rounded-lg px-4 py-2 shadow-md animate-fade-in">
          <div className="text-sm text-gray-700">
            Teaching and explaining...
          </div>
          {/* Speech bubble arrow */}
          <div className="absolute top-[-8px] left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>
          </div>
        </div>
      )}

      {/* Voice Wave Animation */}
      {(status === 'speaking' || status === 'listening') && (
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`
                w-1 bg-current rounded-full transition-all duration-300 animate-wave
                ${status === 'speaking' ? 'text-green-500' : 'text-blue-500'}
              `}
              style={{
                height: `${Math.random() * 20 + 10}px`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
