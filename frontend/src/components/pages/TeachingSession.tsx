import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MicrophoneIcon, StopIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { TranscriptDisplay } from '../ui/TranscriptDisplay';
import { useSpeechRecognition, useSpeechSynthesis } from '../../hooks';
import { classroomAPI } from '../../services/api';
import { StatusIndicator } from '../ui/StatusIndicator';
import { TeacherAvatar } from '../ui/TeacherAvatar';
import { LottieTeacherAvatar } from '../ui/LottieTeacherAvatar';
import { Whiteboard } from '../ui/Whiteboard';
import { SessionStatus } from '../ui/SessionStatus';
import { StatusFeedback, MicrophoneStatus } from '../ui/StatusFeedback';
import { ErrorDisplay, FallbackMessage, PermissionPrompt } from '../ui/ErrorHandling';
import { TextInputFallback } from '../ui/TextInputFallback';
import { useSession } from '../../contexts/SessionContext';
import type { WhiteboardRef } from '../ui/Whiteboard';

export const TeachingSession: React.FC = () => {
  const [isTTSEnabled, setIsTTSEnabled] = useState<boolean>(true);
  const [avatarType, setAvatarType] = useState<'svg' | 'lottie'>('svg');
  const [showTextInput, setShowTextInput] = useState<boolean>(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const whiteboardRef = useRef<WhiteboardRef>(null);

  // Use session context
  const {
    session,
    startSession,
    endSession,
    addUserMessage,
    addAIMessage,
    setAIState,
    setUserState,
    setError,
    setConnectionStatus,
    isAIBusy,
    isUserTurn,
    shouldShowPrompt
  } = useSession();

  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  const {
    speak,
    cancel: cancelSpeech,
    isSpeaking,
    isSupported: isTTSSupported,
    error: ttsError
  } = useSpeechSynthesis({
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8
  });

  // Initialize session when component mounts
  useEffect(() => {
    startSession('Mathematics'); // Default subject, can be made configurable
    setConnectionStatus('connected');
    
    return () => {
      endSession();
    };
  }, [startSession, setConnectionStatus, endSession]);

  // Auto-submit transcript when speech ends and we have content
  useEffect(() => {
    if (!isListening && transcript.trim() && !isAIBusy) {
      handleSubmitMessage(transcript);
    }
  }, [isListening, transcript, isAIBusy]);

  // Handle TTS when AI is speaking
  useEffect(() => {
    if (isSpeaking) {
      setAIState('speaking');
    } else if (session.aiState === 'speaking' && !isSpeaking) {
      setAIState('idle');
    }
  }, [isSpeaking, session.aiState]); // Removed setAIState as it's now stable

  // Cancel speech when new message starts
  useEffect(() => {
    if (session.aiState === 'processing' || isListening) {
      cancelSpeech();
    }
  }, [session.aiState, isListening, cancelSpeech]);

  // Update user state based on listening
  useEffect(() => {
    if (isListening) {
      setUserState('speaking');
    } else if (session.userState === 'speaking' && !isListening) {
      setUserState('idle');
    }
  }, [isListening, session.userState]); // Removed setUserState as it's now stable

  // Handle prompting logic
  useEffect(() => {
    if (shouldShowPrompt && isUserTurn && !isListening) {
      // Show visual prompt or start listening automatically after a delay
      const timer = setTimeout(() => {
        if (!isListening && isUserTurn) {
          console.log('Auto-starting listening due to prompt state');
          setUserState('speaking');
          startListening();
        }
      }, 3000); // 3 second delay before auto-listening
      
      return () => clearTimeout(timer);
    }
  }, [shouldShowPrompt, isUserTurn, isListening]); // Removed stable functions

  // Handle sending message to AI
  const handleSubmitMessage = useCallback(async (message: string) => {
    if (!message.trim() || !session.sessionId) return;

    // Add user message to session
    addUserMessage(message);
    setAIState('processing');
    setError(null);

    try {
      console.log('Sending message to AI:', message);
      
      // Try new AI teacher API first, fallback to legacy if it fails
      try {
        const aiTeacherResponse = await classroomAPI.sendMessage(
          message, 
          session.sessionId,
          { subject: session.subject || 'general', studentLevel: 'intermediate' }
        );
        
        console.log('AI Teacher Response:', aiTeacherResponse);
        
        // Validate API response
        if (!aiTeacherResponse) {
          throw new Error('AI Teacher API returned undefined response');
        }
        
        // Add AI message to session with drawing instructions (convert to strings)
        const instructionStrings = aiTeacherResponse.drawingInstructions?.map((instr: any) => 
          typeof instr === 'string' ? instr : JSON.stringify(instr)
        ) || [];
        addAIMessage(aiTeacherResponse.explanation || 'AI response received but no explanation provided', instructionStrings);
        
        // Apply drawing instructions to whiteboard (now handling string instructions)
        if (aiTeacherResponse.drawingInstructions?.length > 0 && whiteboardRef.current) {
          console.log('Applying AI drawing instructions:', aiTeacherResponse.drawingInstructions);
          setAIState('drawing');
          whiteboardRef.current.applyDrawingInstructions(aiTeacherResponse.drawingInstructions);
        }

        // Start text-to-speech if enabled
        if (isTTSEnabled && isTTSSupported && aiTeacherResponse.explanation) {
          try {
            setAIState('speaking');
            await speak(aiTeacherResponse.explanation);
          } catch (ttsErr) {
            console.warn('Text-to-speech failed:', ttsErr);
            setAIState('idle');
          }
        } else {
          // If TTS is disabled or not supported, just show response for a duration
          setAIState('speaking');
          const speakingDuration = Math.max(2000, aiTeacherResponse.explanation.length * 50);
          setTimeout(() => {
            setAIState('idle');
          }, speakingDuration);
        }
        
      } catch (aiError) {
        console.warn('AI Teacher API failed, trying legacy API:', aiError);
        
        // Fallback to legacy API
        const legacyResponse = await classroomAPI.legacySendMessage(message);
        console.log('Legacy API Response:', legacyResponse);
        
        // Add legacy response to session
        addAIMessage(legacyResponse.response);

        // Start text-to-speech for legacy response if enabled
        if (isTTSEnabled && isTTSSupported && legacyResponse.response) {
          try {
            setAIState('speaking');
            await speak(legacyResponse.response);
          } catch (ttsErr) {
            console.warn('Text-to-speech failed:', ttsErr);
            setAIState('idle');
          }
        } else {
          setAIState('speaking');
          const speakingDuration = Math.max(2000, legacyResponse.response.length * 50);
          setTimeout(() => {
            setAIState('idle');
          }, speakingDuration);
        }
      }
      
      // Reset transcript after successful submission
      resetTranscript();

    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response. Please try again.';
      setError(errorMessage);
      setLastError(errorMessage);
      setAIState('idle');
      setRetryCount(prev => prev + 1);
    }
  }, [session.sessionId, addUserMessage, setAIState, setError, classroomAPI, isTTSEnabled, isTTSSupported, speak, resetTranscript, whiteboardRef]);

  // Enhanced microphone click with permission handling
  const handleMicClick = async () => {
    // Check for speech recognition support
    if (!isSupported) {
      setLastError('Speech recognition is not supported in your browser. Please try using Chrome or Edge.');
      setError('Speech recognition is not supported in your browser. Please try using Chrome or Edge.');
      setShowTextInput(true); // Show text fallback
      return;
    }

    // Check for microphone permissions
    try {
      if (!isListening) {
        // Request microphone permission before starting
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
        
        setUserState('speaking');
        setLastError(null);
        startListening();
      } else {
        stopListening();
      }
    } catch (permissionError) {
      console.error('Microphone permission denied:', permissionError);
      setLastError('Microphone access denied. Please allow microphone access or use text input.');
      setError('Microphone access denied. Please allow microphone access or use text input.');
      setShowPermissionPrompt(true);
    }
  };

  // Enhanced retry logic
  const handleRetry = () => {
    setLastError(null);
    setError(null);
    setRetryCount(0);
    
    // Retry the last action based on current state
    if (session.lastStudentInput) {
      handleSubmitMessage(session.lastStudentInput);
    }
  };

  // Text input fallback handler
  const handleTextSubmit = async (message: string) => {
    setShowTextInput(false);
    await handleSubmitMessage(message);
  };

  // Permission prompt handlers
  const handlePermissionGrant = async () => {
    setShowPermissionPrompt(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setLastError(null);
      setError(null);
      // Auto-start listening after permission granted
      setTimeout(() => {
        setUserState('speaking');
        startListening();
      }, 500);
    } catch (error) {
      setLastError('Failed to access microphone. Using text input instead.');
      setShowTextInput(true);
    }
  };

  const handlePermissionDeny = () => {
    setShowPermissionPrompt(false);
    setShowTextInput(true);
  };

  // Handle speech recognition errors
  useEffect(() => {
    if (speechError) {
      setLastError(speechError);
      setError(speechError);
      
      // Show fallback options for speech errors
      if (speechError.toLowerCase().includes('not-allowed') || speechError.toLowerCase().includes('permission')) {
        setShowPermissionPrompt(true);
      } else if (speechError.toLowerCase().includes('no-speech') || speechError.toLowerCase().includes('aborted')) {
        // Auto-retry for no speech detected, up to 3 times
        if (retryCount < 3) {
          setTimeout(() => {
            setLastError(null);
            setError(null);
            startListening();
          }, 1000);
        } else {
          setShowTextInput(true);
        }
      }
    }
  }, [speechError, retryCount, startListening]);

  // Clear errors when session changes successfully
  useEffect(() => {
    if (session.aiState === 'speaking' || session.aiState === 'drawing') {
      setLastError(null);
      if (session.lastError) {
        setError(null);
      }
    }
  }, [session.aiState, session.lastError]); // Removed setError as it's now stable

  // Map session AI state to component status
  const mapAIStateToStatus = (aiState: typeof session.aiState): 'idle' | 'listening' | 'speaking' | 'loading' => {
    switch (aiState) {
      case 'processing': return 'loading';
      case 'drawing': return 'speaking';
      case 'speaking': return 'speaking';
      case 'listening': return 'listening';
      default: return 'idle';
    }
  };

  const componentStatus = mapAIStateToStatus(session.aiState);

  const handleTTSToggle = () => {
    setIsTTSEnabled(!isTTSEnabled);
    if (isSpeaking) {
      cancelSpeech();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            AI Virtual Classroom
          </h1>
          <p className="text-gray-600">
            Your personal AI teacher is ready to help you learn
          </p>
        </div>

        {/* Session Status */}
        <SessionStatus />

        {/* Enhanced Error Handling and Status Feedback */}
        <div className="mb-4 space-y-3">
          {/* Error Display */}
          {(session.lastError || lastError) && (
            <ErrorDisplay
              error={session.lastError || lastError}
              onRetry={handleRetry}
              onDismiss={() => {
                setError(null);
                setLastError(null);
              }}
              retryLabel={retryCount > 2 ? 'Use Text Input' : 'Try Again'}
            />
          )}

          {/* Status Feedback */}
          <div className="flex justify-center">
            <StatusFeedback
              status={session.aiState === 'processing' ? 'processing' : 
                     session.aiState === 'speaking' ? 'speaking' :
                     session.aiState === 'drawing' ? 'drawing' :
                     isListening ? 'listening' : 'idle'}
              message={
                session.aiState === 'processing' ? 'AI is thinking about your question...' :
                session.aiState === 'speaking' ? 'AI is explaining the concept...' :
                session.aiState === 'drawing' ? 'AI is drawing on the whiteboard...' :
                isListening ? 'Listening for your voice...' : undefined
              }
              size="md"
            />
          </div>

          {/* Microphone Status */}
          <div className="flex justify-center">
            <MicrophoneStatus
              isListening={isListening}
              isSupported={isSupported}
              error={speechError}
            />
          </div>

          {/* Fallback for repeated failures */}
          {retryCount >= 3 && !showTextInput && (
            <div className="flex justify-center">
              <FallbackMessage
                title="Having trouble with voice?"
                message="Try typing your message instead while we work on the voice recognition."
                onRetry={handleRetry}
                onFallback={() => setShowTextInput(true)}
                fallbackLabel="Use Text Input"
              />
            </div>
          )}

          {/* Quick Text Input for emergencies */}
          {!isListening && !session.aiState.includes('processing') && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowTextInput(true)}
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-3 h-3 mr-1" />
                Type Message
              </button>
            </div>
          )}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Side - Avatar and Controls */}
          <div className="flex flex-col items-center justify-center space-y-6 bg-white rounded-2xl shadow-lg p-8">
            {/* Status Indicator */}
            <StatusIndicator status={componentStatus} />
            
            {/* Avatar */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              {/* Avatar Type Selector */}
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
                <button
                  onClick={() => setAvatarType('svg')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    avatarType === 'svg' 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  SVG
                </button>
                <button
                  onClick={() => setAvatarType('lottie')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    avatarType === 'lottie' 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Lottie
                </button>
              </div>

              {/* Conditional Avatar Rendering */}
              {avatarType === 'svg' ? (
                <TeacherAvatar size="lg" showStatus={false} />
              ) : (
                <LottieTeacherAvatar size="lg" showStatus={false} />
              )}
            </div>

            {/* AI Response Display */}
            {session.lastAIResponse && session.aiState === 'speaking' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md">
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 text-lg">🤖</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-green-800">AI Teacher says:</p>
                      {isSpeaking && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600">Speaking...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-green-700">{session.lastAIResponse}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Voice Controls */}
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-4">
                {/* Microphone Button */}
                <button
                  onClick={handleMicClick}
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold
                    transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50
                    ${isListening 
                      ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 animate-pulse' 
                      : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
                    }
                  `}
                  disabled={componentStatus === 'loading' || isAIBusy}
                >
                  {isListening ? (
                    <StopIcon className="w-8 h-8" />
                  ) : (
                    <MicrophoneIcon className="w-8 h-8" />
                  )}
                </button>

                {/* TTS Toggle Button */}
                {isTTSSupported && (
                  <button
                    onClick={handleTTSToggle}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-semibold
                      transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-50
                      ${isTTSEnabled 
                        ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500 text-white' 
                        : 'bg-gray-300 hover:bg-gray-400 focus:ring-gray-500 text-gray-600'
                      }
                    `}
                    title={isTTSEnabled ? 'Disable voice output' : 'Enable voice output'}
                  >
                    {isTTSEnabled ? (
                      <SpeakerWaveIcon className="w-6 h-6" />
                    ) : (
                      <SpeakerXMarkIcon className="w-6 h-6" />
                    )}
                  </button>
                )}
              </div>
              
              <p className="text-sm text-gray-600 text-center">
                {isListening ? 'Click to stop recording' : 'Click to start speaking'}
                {isTTSSupported && (
                  <span className="block text-xs text-gray-500 mt-1">
                    Voice output: {isTTSEnabled ? 'ON' : 'OFF'}
                  </span>
                )}
              </p>
              
              {componentStatus === 'loading' && (
                <div className="text-sm text-blue-600 animate-pulse">
                  Processing your message...
                </div>
              )}

              {/* Speech Recognition Support Warning */}
              {!isSupported && (
                <div className="text-sm text-amber-600 text-center">
                  ⚠️ Speech recognition not supported in this browser
                </div>
              )}

              {/* TTS Support Warning */}
              {!isTTSSupported && (
                <div className="text-sm text-amber-600 text-center">
                  ⚠️ Voice output not supported in this browser
                </div>
              )}
            </div>

            {/* Transcript Display */}
            <div className="w-full max-w-md">
              <TranscriptDisplay
                transcript={transcript}
                interimTranscript={interimTranscript}
                isListening={isListening}
                error={speechError || session.lastError || ttsError}
              />
            </div>
          </div>

          {/* Right Side - Whiteboard */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                  Interactive Whiteboard
                </h2>
                <p className="text-sm text-gray-600">
                  Watch as your AI teacher explains concepts visually
                </p>
              </div>
              <div className="flex-1 p-4">
                <Whiteboard ref={whiteboardRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${
              componentStatus === 'idle' ? 'bg-gray-400' :
              componentStatus === 'listening' ? 'bg-blue-500' :
              componentStatus === 'speaking' ? 'bg-green-500' :
              'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-gray-600 capitalize">
              {componentStatus === 'idle' ? 'Ready to learn' :
               componentStatus === 'listening' ? 'Listening...' :
               componentStatus === 'speaking' ? 'AI is speaking...' :
               'Processing...'}
            </span>
          </div>
        </div>

        {/* Modal Components */}
        {/* Text Input Fallback */}
        <TextInputFallback
          isVisible={showTextInput}
          onSubmit={handleTextSubmit}
          onClose={() => setShowTextInput(false)}
          placeholder="Type your question or message here..."
          disabled={session.aiState === 'processing'}
        />

        {/* Permission Prompt */}
        <PermissionPrompt
          type="microphone"
          onGrant={handlePermissionGrant}
          onDeny={handlePermissionDeny}
          className={showPermissionPrompt ? 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' : 'hidden'}
        />
      </div>
    </div>
  );
};

export default TeachingSession;
