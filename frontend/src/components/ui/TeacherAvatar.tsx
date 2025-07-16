import React, { useEffect, useState } from 'react';
import { useSession } from '../../contexts/SessionContext';

interface TeacherAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showStatus?: boolean;
}

export const TeacherAvatar: React.FC<TeacherAvatarProps> = ({ 
  size = 'md', 
  className = '',
  showStatus = true 
}) => {
  const { session } = useSession();
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthAnimation, setMouthAnimation] = useState('idle');

  // Size configurations
  const sizeConfig = {
    sm: { width: 80, height: 80, containerClass: 'w-20 h-20' },
    md: { width: 120, height: 120, containerClass: 'w-30 h-30' },
    lg: { width: 160, height: 160, containerClass: 'w-40 h-40' }
  };

  const config = sizeConfig[size];

  // Handle blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 2000); // Random blink every 3-5 seconds

    return () => clearInterval(blinkInterval);
  }, []);

  // Handle mouth animation based on AI state
  useEffect(() => {
    if (session.aiState === 'speaking' || session.aiState === 'drawing') {
      setMouthAnimation('talking');
    } else {
      setMouthAnimation('idle');
    }
  }, [session.aiState]);

  const getStatusColor = () => {
    switch (session.aiState) {
      case 'speaking': return 'border-green-500 shadow-green-200';
      case 'processing': return 'border-yellow-500 shadow-yellow-200';
      case 'drawing': return 'border-purple-500 shadow-purple-200';
      case 'listening': return 'border-blue-500 shadow-blue-200';
      default: return 'border-gray-300 shadow-gray-200';
    }
  };

  const getStatusText = () => {
    switch (session.aiState) {
      case 'speaking': return '🗣️ Teaching';
      case 'processing': return '🤔 Thinking';
      case 'drawing': return '✏️ Drawing';
      case 'listening': return '👂 Listening';
      default: return '😊 Ready';
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {/* Avatar Container */}
      <div className={`
        relative ${config.containerClass} rounded-full border-4 transition-all duration-300
        ${getStatusColor()}
        bg-gradient-to-br from-blue-50 to-indigo-100
        shadow-lg hover:shadow-xl transform hover:scale-105
        ${session.aiState === 'speaking' ? 'animate-pulse' : ''}
      `}>
        {/* Background Circle */}
        <div className="absolute inset-2 rounded-full bg-white/90 backdrop-blur-sm"></div>
        
        {/* SVG Avatar */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <svg 
            width={config.width * 0.8} 
            height={config.height * 0.8} 
            viewBox="0 0 120 120" 
            className="overflow-visible"
          >
            {/* Head */}
            <circle 
              cx="60" 
              cy="50" 
              r="30" 
              fill="#F5DEB3" 
              stroke="#DEB887" 
              strokeWidth="2"
              className={session.aiState === 'speaking' ? 'animate-pulse' : ''}
            />
            
            {/* Hair */}
            <path 
              d="M30 35 Q45 20 60 25 Q75 20 90 35 Q85 15 60 15 Q35 15 30 35" 
              fill="#8B4513" 
              className="transition-all duration-300"
            />
            
            {/* Eyes */}
            <g className="transition-all duration-150">
              {/* Left Eye */}
              <ellipse 
                cx="50" 
                cy="45" 
                rx="4" 
                ry={isBlinking ? "1" : "4"} 
                fill="#2C3E50"
                className="transition-all duration-150"
              />
              {/* Right Eye */}
              <ellipse 
                cx="70" 
                cy="45" 
                rx="4" 
                ry={isBlinking ? "1" : "4"} 
                fill="#2C3E50"
                className="transition-all duration-150"
              />
              
              {/* Eye Highlights (when not blinking) */}
              {!isBlinking && (
                <>
                  <circle cx="51" cy="43" r="1" fill="white" />
                  <circle cx="71" cy="43" r="1" fill="white" />
                </>
              )}
            </g>
            
            {/* Nose */}
            <path 
              d="M58 48 Q60 52 62 48" 
              stroke="#DEB887" 
              strokeWidth="1.5" 
              fill="none"
            />
            
            {/* Mouth */}
            <g className="transition-all duration-200">
              {mouthAnimation === 'talking' ? (
                // Animated talking mouth
                <g>
                  <ellipse 
                    cx="60" 
                    cy="60" 
                    rx="6" 
                    ry="4" 
                    fill="#CD5C5C"
                    className="animate-pulse"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="scale"
                      values="1,1;1.2,0.8;1,1;0.8,1.2;1,1"
                      dur="0.6s"
                      repeatCount="indefinite"
                    />
                  </ellipse>
                  {/* Teeth */}
                  <rect x="57" y="58" width="6" height="2" fill="white" rx="1" />
                </g>
              ) : (
                // Idle smile
                <path 
                  d="M52 58 Q60 65 68 58" 
                  stroke="#CD5C5C" 
                  strokeWidth="2" 
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </g>
            
            {/* Glasses (Optional) */}
            <g stroke="#4A4A4A" strokeWidth="2" fill="none">
              <circle cx="50" cy="45" r="8" opacity="0.7" />
              <circle cx="70" cy="45" r="8" opacity="0.7" />
              <path d="M58 45 L62 45" strokeWidth="1.5" />
              <path d="M42 45 L35 50" strokeWidth="1.5" />
              <path d="M78 45 L85 50" strokeWidth="1.5" />
            </g>

            {/* Body/Shoulders */}
            <path 
              d="M35 80 Q60 85 85 80 L85 120 L35 120 Z" 
              fill="#4A90E2" 
              stroke="#357ABD" 
              strokeWidth="1"
            />
            
            {/* Collar */}
            <path 
              d="M45 80 Q60 75 75 80 L75 85 L45 85 Z" 
              fill="#FFFFFF" 
              stroke="#E0E0E0" 
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Speaking indicator */}
        {session.aiState === 'speaking' && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
            <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
          </div>
        )}

        {/* Processing indicator */}
        {session.aiState === 'processing' && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center animate-spin">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}

        {/* Drawing indicator */}
        {session.aiState === 'drawing' && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Status Text */}
      {showStatus && (
        <div className="text-center">
          <span className="text-sm font-medium text-gray-700">
            {getStatusText()}
          </span>
          {session.currentTopic && (
            <p className="text-xs text-gray-500 mt-1 max-w-32 truncate" title={session.currentTopic}>
              {session.currentTopic}
            </p>
          )}
        </div>
      )}

      {/* Voice Wave Animation (when speaking) */}
      {session.aiState === 'speaking' && (
        <div className="flex items-center space-x-1">
          {[0, 150, 300, 450, 600].map((delay, index) => (
            <div 
              key={index}
              className="w-1 bg-green-500 rounded-full animate-pulse" 
              style={{
                height: `${8 + (index % 2) * 4}px`, 
                animationDelay: `${delay}ms`,
                animationDuration: '1s'
              }}
            ></div>
          ))}
        </div>
      )}

      {/* Thinking dots (when processing) */}
      {session.aiState === 'processing' && (
        <div className="flex items-center space-x-1">
          {[0, 200, 400].map((delay, index) => (
            <div 
              key={index}
              className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" 
              style={{animationDelay: `${delay}ms`}}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};
