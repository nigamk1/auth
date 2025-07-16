import React from 'react';
import { useSession } from '../../contexts/SessionContext';

export const SessionStatus: React.FC = () => {
  const { session, sessionDuration } = useSession();

  const formatDuration = (ms: number | null): string => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'speaking': return 'text-green-600 bg-green-50';
      case 'listening': return 'text-blue-600 bg-blue-50';
      case 'processing': return 'text-yellow-600 bg-yellow-50';
      case 'drawing': return 'text-purple-600 bg-purple-50';
      case 'waiting': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!session.isSessionActive) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Session Status</h3>
        <div className="text-xs text-gray-500">
          {formatDuration(sessionDuration)}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* AI State */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">AI:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(session.aiState)}`}>
            {session.aiState}
          </span>
        </div>

        {/* User State */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">User:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(session.userState)}`}>
            {session.userState}
          </span>
        </div>

        {/* Current Topic */}
        {session.currentTopic && (
          <div className="col-span-2 flex items-center justify-between">
            <span className="text-gray-600">Topic:</span>
            <span className="text-gray-800 font-medium text-right max-w-32 truncate" title={session.currentTopic}>
              {session.currentTopic}
            </span>
          </div>
        )}

        {/* Current Step */}
        {session.currentStep > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Step:</span>
            <span className="text-gray-800 font-medium">
              {session.currentStep}
            </span>
          </div>
        )}

        {/* Interaction Count */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Interactions:</span>
          <span className="text-gray-800 font-medium">
            {session.totalInteractions}
          </span>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Connection:</span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              session.connectionStatus === 'connected' ? 'bg-green-500' :
              session.connectionStatus === 'connecting' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}></div>
            <span className="text-gray-800 font-medium capitalize">
              {session.connectionStatus}
            </span>
          </div>
        </div>

        {/* Expecting Input Indicator */}
        {session.expectingUserInput && (
          <div className="col-span-2 text-center">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {session.shouldPromptUser ? '💬 Ready for your input' : '⏳ Waiting for you to speak'}
            </span>
          </div>
        )}
      </div>

      {/* Learning Progress */}
      {(session.learningGoals.length > 0 || session.completedConcepts.length > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-600 mb-2">Learning Progress</div>
          <div className="space-y-1">
            {session.completedConcepts.length > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Completed:</span>
                <span className="text-green-600 font-medium">
                  {session.completedConcepts.length} concepts
                </span>
              </div>
            )}
            {session.strugglingAreas.length > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Struggling:</span>
                <span className="text-orange-600 font-medium">
                  {session.strugglingAreas.length} areas
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {session.lastError && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {session.lastError}
          </div>
        </div>
      )}
    </div>
  );
};
