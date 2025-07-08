import React from 'react';
import { PlayIcon, PauseIcon, StopIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import type { Session } from '../../types';

interface SessionControlsProps {
  session: Session;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onViewAnalytics?: () => void;
}

const SessionControls: React.FC<SessionControlsProps> = ({
  session,
  onPause,
  onResume,
  onEnd,
  onViewAnalytics
}) => {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Session Info */}
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            Duration: {formatDuration(session.duration)}
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(session.status)}`}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-2">
        
        {/* Pause/Resume Button */}
        {session.status === 'active' ? (
          <button
            onClick={onPause}
            className="flex items-center space-x-1 px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
            title="Pause Session"
          >
            <PauseIcon className="w-4 h-4" />
            <span className="text-sm">Pause</span>
          </button>
        ) : session.status === 'paused' ? (
          <button
            onClick={onResume}
            className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            title="Resume Session"
          >
            <PlayIcon className="w-4 h-4" />
            <span className="text-sm">Resume</span>
          </button>
        ) : null}

        {/* Analytics Button */}
        {onViewAnalytics && (
          <button
            onClick={onViewAnalytics}
            className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            title="View Analytics"
          >
            <ChartBarIcon className="w-4 h-4" />
            <span className="text-sm">Analytics</span>
          </button>
        )}

        {/* End Session Button */}
        {session.status !== 'completed' && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to end this session?')) {
                onEnd();
              }
            }}
            className="flex items-center space-x-1 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            title="End Session"
          >
            <StopIcon className="w-4 h-4" />
            <span className="text-sm">End</span>
          </button>
        )}
      </div>

      {/* Session Metadata */}
      <div className="text-xs text-gray-500 border-l border-gray-200 pl-4">
        <div>Messages: {session.metadata.totalMessages}</div>
        <div>Questions: {session.metadata.totalQuestions}</div>
      </div>
    </div>
  );
};

export default SessionControls;
