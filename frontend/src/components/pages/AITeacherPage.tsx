import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../ui/Layout';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import MessageList from '../ui/MessageList';
import LoadingState, { NetworkStatus, useNetworkStatus, useRetry } from '../ui/LoadingState';
import { LanguageSelector } from '../ui/LanguageSelector';
import { useLanguage } from '../../contexts/LanguageContext';
import { UI_TRANSLATIONS } from '../../types/language';
import VoiceHandler from '../voice/VoiceHandlerEnhanced';
import { AiWhiteboard } from '../ai/AiWhiteboard';
import { getServerUrl, getApiUrl } from '../../utils/environment';
import io, { Socket } from 'socket.io-client';

interface Session {
  id: string;
  title: string;
  subject: string;
  status: 'active' | 'completed' | 'paused';
  aiPersonality: {
    name: string;
    voice: string;
    teachingStyle: string;
  };
  metadata: {
    sessionType: string;
    difficulty: string;
    tags: string[];
  };
  startedAt: string;
}

interface Message {
  id: string;
  speaker: 'user' | 'ai';
  content: string;
  timestamp: Date;
  audioData?: any;
  metadata?: any;
}

export const AITeacherPage: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { currentLanguage, translate, getVoiceSettings } = useLanguage();
  const socketRef = useRef<Socket | null>(null);
  const isOnline = useNetworkStatus();
  
  // Connection management
  const connectSocket = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('No authentication token found. Please log in again.');

    return new Promise<void>((resolve, reject) => {
      const newSocket = io(getServerUrl(), {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      const timeout = setTimeout(() => {
        newSocket.disconnect();
        reject(new Error('Connection timeout - Backend server may not be running'));
      }, 15000);

      newSocket.on('connect', () => {
        clearTimeout(timeout);
        setIsConnected(true);
        setConnectionError(null);
        console.log('Connected to AI Teacher Socket');
        resolve();
      });

      newSocket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('Socket connection error:', error);
        let errorMessage = 'Failed to connect to server';
        
        if (error.message.includes('Invalid authentication token')) {
          errorMessage = 'Authentication failed. Please log in again.';
          // Clear invalid token
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        } else if (error.message.includes('ECONNREFUSED') || (error as any).type === 'TransportError') {
          errorMessage = 'Backend server is not running. Please start the server.';
        } else {
          errorMessage = error.message || 'Connection failed';
        }
        
        setConnectionError(errorMessage);
        reject(new Error(errorMessage));
      });

      newSocket.on('disconnect', (reason) => {
        setIsConnected(false);
        console.log('Disconnected from AI Teacher Socket:', reason);
        
        if (reason === 'io server disconnect') {
          // Server disconnected the client, likely due to auth issues
          setConnectionError('Server disconnected. Please refresh and log in again.');
        }
      });

      socketRef.current = newSocket;
    });
  };
  
  const { retry: retryConnection, isRetrying } = useRetry(connectSocket);

  // Socket.IO connection
  useEffect(() => {
    const initConnection = async () => {
      try {
        await connectSocket();
      } catch (error) {
        console.error('Failed to connect:', error);
        setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      }
    };

    initConnection();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('session-joined', (data) => {
      setSession(data.session);
      setMessages(data.transcript?.messages || []);
      setCurrentSessionId(data.session.id);
    });

    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('whiteboard-updated', (data) => {
      // Handle whiteboard updates
      console.log('Whiteboard updated:', data);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionError(error.message || 'Socket error occurred');
    });

    return () => {
      socket.off('session-joined');
      socket.off('new-message');
      socket.off('whiteboard-updated');
      socket.off('error');
    };
  }, []);

  // Handle voice transcription results
  const handleVoiceTranscription = (text: string) => {
    console.log('Voice transcription received:', text);
    // Transcription is automatically sent to AI via socket in VoiceHandler
  };

  // Handle AI response with audio
  const handleAIResponse = (text: string, audioData?: ArrayBuffer) => {
    console.log('AI response received:', text);
    // Audio is automatically played by VoiceHandler
    if (audioData) {
      console.log('Audio data received, length:', audioData.byteLength);
    }
  };

  const createNewSession = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const voiceSettings = getVoiceSettings();
      
      const response = await fetch(getApiUrl('/ai/sessions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: translate(UI_TRANSLATIONS.aiTeacher),
          subject: 'General Learning',
          aiPersonality: {
            name: 'Professor AI',
            voice: voiceSettings.ttsVoice || 'en-US-Standard-A',
            teachingStyle: 'patient',
            language: currentLanguage
          },
          metadata: {
            sessionType: 'lesson',
            difficulty: 'beginner',
            tags: ['interactive', 'voice', currentLanguage],
            language: currentLanguage
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (socketRef.current) {
          // Send language preference with join session
          socketRef.current.emit('join-session', {
            sessionId: data.session.id,
            language: currentLanguage,
            voiceSettings
          });
        }
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-3 sm:space-y-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {translate(UI_TRANSLATIONS.aiTeacher)}
            </h1>
            <LanguageSelector size="md" showLabel={false} />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Network Status */}
              <NetworkStatus isOnline={isOnline} />
              
              {/* Retry Button */}
              {(!isConnected || connectionError) && !isRetrying && (
                <Button
                  onClick={retryConnection}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Retry
                </Button>
              )}
              
              {isRetrying && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <LoadingSpinner className="w-4 h-4" />
                  <span className="text-sm">Reconnecting...</span>
                </div>
              )}
            </div>
            
            {session && (
              <div className="text-sm text-gray-600">
                <span className="sm:hidden">Session: </span>
                <span className="hidden sm:inline">Session: {session.title} | Status: {session.status}</span>
                <span className="sm:hidden">{session.title} ({session.status})</span>
              </div>
            )}
            
            {connectionError && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
                {connectionError}
              </div>
            )}
          </div>
        </div>

        {!session ? (
          <LoadingState
            loading={isLoading}
            error={connectionError}
            retry={retryConnection}
            loadingText="Creating AI session..."
            emptyState={{
              title: translate(UI_TRANSLATIONS.startSession),
              description: "Create a new interactive session with voice conversation and whiteboard collaboration in your preferred language.",
              action: {
                label: translate(UI_TRANSLATIONS.startSession),
                onClick: createNewSession
              }
            }}
          >
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {translate(UI_TRANSLATIONS.startSession)}
              </h2>
              <p className="text-gray-600 mb-8">
                Create a new interactive session with voice conversation and whiteboard collaboration in your preferred language.
              </p>
              
              {/* Connection Status Warning */}
              {!isConnected && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                  <h3 className="text-sm font-medium text-yellow-900 mb-2">Backend Server Not Available</h3>
                  <p className="text-xs text-yellow-700">
                    The AI Teacher backend server is not running. Please start the backend server to enable AI features.
                  </p>
                  <div className="mt-3">
                    <Button
                      onClick={retryConnection}
                      variant="outline"
                      size="sm"
                      disabled={isRetrying}
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                    >
                      {isRetrying ? 'Connecting...' : 'Retry Connection'}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Language Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Selected Language</h3>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">
                  {currentLanguage === 'en' ? '🇺🇸' : currentLanguage === 'hi' ? '🇮🇳' : '🇮🇳'}
                </span>
                <span className="text-blue-800 font-medium">
                  {currentLanguage === 'en' ? 'English' : 
                   currentLanguage === 'hi' ? 'हिंदी' : 'Hinglish'}
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                AI will respond in this language
              </p>
            </div>
            
            <Button
              onClick={createNewSession}
              disabled={isLoading || !isConnected}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? <LoadingSpinner className="w-4 h-4" /> : translate(UI_TRANSLATIONS.startSession)}
            </Button>
            </div>
          </LoadingState>
        ) : (
          <div className="space-y-6">
            {/* Mobile/Tablet: Stack vertically */}
            <div className="block lg:hidden space-y-6">
              {/* Voice Controls Panel */}
              <div className="bg-white rounded-lg shadow-lg border p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Voice Controls</h3>
                <VoiceHandler
                  socket={socketRef.current}
                  sessionId={currentSessionId}
                  isConnected={isConnected}
                  onTranscriptionReceived={handleVoiceTranscription}
                  onAIResponseReceived={handleAIResponse}
                  disabled={!session || !isConnected}
                />
              </div>

              {/* Chat Panel */}
              <div className="bg-white rounded-lg shadow-lg border flex flex-col">
                <div className="p-4 border-b flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Conversation with {session?.aiPersonality?.name || 'AI Teacher'}
                  </h3>
                </div>
                
                <div className="flex-1 min-h-0">
                  <MessageList
                    messages={messages}
                    maxMessageLength={250}
                    messagesPerPage={6}
                    className="h-80"
                  />
                </div>
              </div>

              {/* Whiteboard Panel */}
              <div className="bg-white rounded-lg shadow-lg border">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Interactive Whiteboard
                  </h3>
                </div>
                
                <div className="p-2">
                  <AiWhiteboard
                    sessionId={currentSessionId || 'default'}
                    width={window.innerWidth - 80}
                    height={300}
                    className="border border-gray-300 rounded-lg w-full"
                    onElementAdded={(element) => {
                      console.log('Element added:', element);
                      if (socketRef.current && currentSessionId) {
                        socketRef.current.emit('whiteboard-element-added', {
                          sessionId: currentSessionId,
                          element
                        });
                      }
                    }}
                    onStateChanged={(state) => {
                      console.log('Whiteboard state changed:', state);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-6">
              {/* Voice Controls Panel */}
              <div className="lg:col-span-1">
                <VoiceHandler
                  socket={socketRef.current}
                  sessionId={currentSessionId}
                  isConnected={isConnected}
                  onTranscriptionReceived={handleVoiceTranscription}
                  onAIResponseReceived={handleAIResponse}
                  disabled={!session || !isConnected}
                />
              </div>

              {/* Chat Panel */}
              <div className="lg:col-span-1 bg-white rounded-lg shadow-lg border flex flex-col">
                <div className="p-4 border-b flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Conversation with {session?.aiPersonality?.name || 'AI Teacher'}
                  </h3>
                </div>
                
                <div className="flex-1 min-h-0">
                  <MessageList
                    messages={messages}
                    maxMessageLength={300}
                    messagesPerPage={8}
                    className="h-96"
                  />
                </div>
              </div>

              {/* Whiteboard Panel */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-lg border">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Interactive Whiteboard
                  </h3>
                </div>
                
                <div className="p-2">
                  <AiWhiteboard
                    sessionId={currentSessionId || 'default'}
                    width={450}
                    height={400}
                    className="border border-gray-300 rounded-lg"
                    onElementAdded={(element) => {
                      console.log('Element added:', element);
                      if (socketRef.current && currentSessionId) {
                        socketRef.current.emit('whiteboard-element-added', {
                          sessionId: currentSessionId,
                          element
                        });
                      }
                    }}
                    onStateChanged={(state) => {
                      console.log('Whiteboard state changed:', state);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
