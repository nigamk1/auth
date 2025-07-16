import React from "react";
import type { LoadingSpinnerProps } from "../../types";

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const classes = ["animate-spin", sizeClasses[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex justify-center items-center">
      <svg
        className={classes}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

interface PulsingDotsProps {
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  className?: string;
}

export const PulsingDots: React.FC<PulsingDotsProps> = ({ 
  color = 'blue',
  className = '' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      <div 
        className={`w-2 h-2 ${colorClasses[color]} rounded-full animate-pulse`}
        style={{ animationDelay: '0ms' }}
      />
      <div 
        className={`w-2 h-2 ${colorClasses[color]} rounded-full animate-pulse`}
        style={{ animationDelay: '150ms' }}
      />
      <div 
        className={`w-2 h-2 ${colorClasses[color]} rounded-full animate-pulse`}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
};

interface WaveAnimationProps {
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const WaveAnimation: React.FC<WaveAnimationProps> = ({ 
  color = 'blue',
  size = 'md',
  className = '' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  };

  const sizeClasses = {
    sm: 'w-1 h-4',
    md: 'w-1 h-6',
    lg: 'w-2 h-8'
  };

  return (
    <div className={`flex items-end justify-center space-x-1 ${className}`}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-sm animate-pulse`}
          style={{
            animationDelay: `${i * 100}ms`,
            animationDuration: '800ms',
            animationDirection: 'alternate',
            animationIterationCount: 'infinite'
          }}
        />
      ))}
    </div>
  );
};

export default LoadingSpinner;
