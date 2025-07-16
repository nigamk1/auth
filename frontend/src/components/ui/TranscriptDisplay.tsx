import React from 'react';

interface TranscriptDisplayProps {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  error: string | null;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcript,
  interimTranscript,
  isListening,
  error
}) => {
  const hasContent = transcript || interimTranscript;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-red-500">⚠️</span>
          <span className="text-sm font-medium text-red-800">Speech Recognition Error</span>
        </div>
        <p className="mt-1 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!hasContent && !isListening) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center text-gray-500">
          <span className="text-2xl block mb-2">🎤</span>
          <p className="text-sm">Click the microphone to start speaking</p>
        </div>
      </div>
    );
  }

  if (isListening && !hasContent) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-blue-800">Listening...</span>
        </div>
        <p className="mt-1 text-sm text-blue-700">Start speaking, I'm listening to you</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Your Message</span>
        {isListening && (
          <div className="flex items-center space-x-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>
      
      <div className="min-h-[3rem] text-gray-900">
        {/* Final transcript */}
        {transcript && (
          <span className="text-gray-900">{transcript}</span>
        )}
        
        {/* Interim transcript (live typing effect) */}
        {interimTranscript && (
          <span className="text-gray-500 italic">
            {transcript && ' '}
            {interimTranscript}
            <span className="animate-pulse">|</span>
          </span>
        )}
      </div>
      
      {isListening && (
        <div className="mt-2 text-xs text-blue-600">
          💡 Tip: Speak clearly and pause briefly when finished
        </div>
      )}
    </div>
  );
};
