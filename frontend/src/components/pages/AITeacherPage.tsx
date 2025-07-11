import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../ui/Layout';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import MessageList from '../ui/MessageListNew';
import { useRetry } from '../ui/LoadingState';
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

    socket.on('aiAnswer', (data) => {
      console.log('AI answer received:', data);
      const aiMessage = {
        id: `ai-${Date.now()}`,
        speaker: 'ai' as const,
        content: data.response,
        timestamp: new Date(),
        metadata: data
      };
      setMessages(prev => [...prev, aiMessage]);
    });

    socket.on('ai-thinking', (data) => {
      if (data.isThinking) {
        const thinkingMessage = {
          id: `thinking-${Date.now()}`,
          speaker: 'ai' as const,
          content: 'AI is thinking...',
          timestamp: new Date(),
          metadata: { isThinking: true }
        };
        setMessages(prev => [...prev, thinkingMessage]);
      } else {
        // Remove thinking message
        setMessages(prev => prev.filter(msg => !msg.metadata?.isThinking));
      }
    });

    socket.on('whiteboardUpdate', (data) => {
      // Handle whiteboard updates
      console.log('Whiteboard updated:', data);
      // TODO: Update whiteboard state if needed
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionError(error.message || 'Socket error occurred');
    });

    return () => {
      socket.off('session-joined');
      socket.off('new-message');
      socket.off('aiAnswer');
      socket.off('ai-thinking');
      socket.off('whiteboardUpdate');
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

  // Handle sending text messages
  const sendTextMessage = async (message: string) => {
    if (!message.trim() || !currentSessionId || !socketRef.current) return;
    
    try {
      // Add user message to local state immediately
      const userMessage = {
        id: `user-${Date.now()}`,
        speaker: 'user' as const,
        content: message.trim(),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Send message as AI question to get AI response
      socketRef.current.emit('ai-question', {
        sessionId: currentSessionId,
        question: message.trim(),
        language: currentLanguage
      });
      
    } catch (error) {
      console.error('Failed to send message:', error);
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
            voice: voiceSettings.ttsVoice || 'alloy',
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Professional Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      {translate(UI_TRANSLATIONS.aiTeacher)}
                    </h1>
                    <p className="text-sm text-gray-500">Intelligent Learning Assistant</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Connection Status Indicator */}
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  isConnected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                
                {/* Language Selector */}
                <div className="hidden sm:block">
                  <LanguageSelector size="md" showLabel={true} />
                </div>
                
                {/* Retry Button */}
                {(!isConnected || connectionError) && !isRetrying && (
                  <Button
                    onClick={retryConnection}
                    size="sm"
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
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
            </div>
            
            {/* Session Info Bar */}
            {session && (
              <div className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-900">
                        Active Session: {session.title}
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Started {new Date(session.startedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      session.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error Alert */}
            {connectionError && (
              <div className="pb-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{connectionError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {!session ? (
            /* Welcome Screen */
            <div className="text-center py-16">
              <div className="max-w-3xl mx-auto">
                {/* Hero Icon */}
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Welcome to AI Teacher
                </h2>
                <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                  Start an intelligent learning session with voice conversation, interactive whiteboard, 
                  and real-time collaboration in your preferred language.
                </p>
                
                {/* Feature Cards */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Voice Interaction</h3>
                    <p className="text-gray-600 text-sm">Speak naturally to the AI and get intelligent voice responses</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Conversation</h3>
                    <p className="text-gray-600 text-sm">Ask questions and get personalized learning assistance</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Whiteboard</h3>
                    <p className="text-gray-600 text-sm">Collaborate in real-time with drawing and visual learning tools</p>
                  </div>
                </div>
                
                {/* Connection Status */}
                {!isConnected && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 max-w-lg mx-auto">
                    <div className="flex items-center justify-center mb-3">
                      <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-amber-900 mb-2">Backend Server Required</h3>
                    <p className="text-sm text-amber-800 mb-4">
                      The AI Teacher backend server is not running. Please start the server to enable all features.
                    </p>
                    <Button
                      onClick={retryConnection}
                      variant="outline"
                      size="sm"
                      disabled={isRetrying}
                      className="text-amber-700 border-amber-300 hover:bg-amber-100"
                    >
                      {isRetrying ? (
                        <>
                          <LoadingSpinner className="w-4 h-4 mr-2" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Try Again
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {/* Language Selection */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 max-w-lg mx-auto">
                  <h3 className="font-semibold text-blue-900 mb-3">Selected Language</h3>
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <span className="text-3xl">
                      {currentLanguage === 'en' ? '🇺🇸' : currentLanguage === 'hi' ? '🇮🇳' : '🇮🇳'}
                    </span>
                    <span className="text-lg font-medium text-blue-800">
                      {currentLanguage === 'en' ? 'English' : 
                       currentLanguage === 'hi' ? 'हिंदी' : 'Hinglish'}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    AI will respond and interact in this language
                  </p>
                </div>
                
                {/* Start Session Button */}
                <Button
                  onClick={createNewSession}
                  disabled={isLoading || !isConnected}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner className="w-5 h-5 mr-2" />
                      Creating Session...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 002.5-2.5S14 6 13 6h-2M9 10v3.5m0 0V15" />
                      </svg>
                      {translate(UI_TRANSLATIONS.startSession)}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Learning Interface */
            <div className="space-y-6">
              {/* Mobile Layout */}
              <div className="block xl:hidden space-y-6">
                {/* Voice Controls Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <h3 className="text-lg font-bold text-white">Voice Controls</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <VoiceHandler
                      socket={socketRef.current}
                      sessionId={currentSessionId}
                      isConnected={isConnected}
                      onTranscriptionReceived={handleVoiceTranscription}
                      onAIResponseReceived={handleAIResponse}
                      disabled={!session || !isConnected}
                    />
                  </div>
                </div>

                {/* Conversation Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <h3 className="text-lg font-bold text-white">
                          Conversation with {session?.aiPersonality?.name || 'AI Teacher'}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
                        <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-96">
                    <MessageList
                      messages={messages}
                      maxMessageLength={200}
                      messagesPerPage={6}
                      className="h-full"
                      onSendMessage={sendTextMessage}
                      disabled={!isConnected || !currentSessionId}
                    />
                  </div>
                </div>

                {/* Whiteboard Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <h3 className="text-lg font-bold text-white">Interactive Whiteboard</h3>
                      </div>
                      <div className="flex items-center space-x-2 text-white text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>Real-time</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <AiWhiteboard
                      sessionId={currentSessionId || 'default'}
                      socket={socketRef.current}
                      width={Math.min(window.innerWidth - 100, 800)}
                      height={400}
                      className="border border-gray-200 rounded-xl shadow-inner"
                      onElementAdded={(element) => {
                        console.log('Element added:', element);
                        if (socketRef.current && currentSessionId) {
                          socketRef.current.emit('whiteboard-update', {
                            sessionId: currentSessionId,
                            type: 'element-added',
                            element
                          });
                        }
                      }}
                      onStateChanged={(state) => {
                        console.log('Whiteboard state changed:', state);
                        if (socketRef.current && currentSessionId) {
                          socketRef.current.emit('whiteboard-update', {
                            sessionId: currentSessionId,
                            type: 'state-changed',
                            state
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden xl:block">
                <div className="grid grid-cols-12 gap-6 min-h-[600px]">
                  {/* Voice Controls Panel */}
                  <div className="col-span-3">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 h-full">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          <h3 className="text-lg font-bold text-white">Voice Controls</h3>
                        </div>
                      </div>
                      <div className="p-6">
                        <VoiceHandler
                          socket={socketRef.current}
                          sessionId={currentSessionId}
                          isConnected={isConnected}
                          onTranscriptionReceived={handleVoiceTranscription}
                          onAIResponseReceived={handleAIResponse}
                          disabled={!session || !isConnected}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conversation Panel */}
                  <div className="col-span-4">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 h-full flex flex-col">
                      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-2xl px-6 py-4 flex-shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <h3 className="text-lg font-bold text-white">
                              {session?.aiPersonality?.name || 'AI Teacher'}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
                            <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-h-0">
                        <MessageList
                          messages={messages}
                          maxMessageLength={300}
                          messagesPerPage={8}
                          className="h-full"
                          onSendMessage={sendTextMessage}
                          disabled={!isConnected || !currentSessionId}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Whiteboard Panel */}
                  <div className="col-span-5">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 h-full flex flex-col">
                      <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-t-2xl px-6 py-4 flex-shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <h3 className="text-lg font-bold text-white">Interactive Whiteboard</h3>
                          </div>
                          <div className="flex items-center space-x-2 text-white text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>Real-time</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 p-4">
                        <AiWhiteboard
                          sessionId={currentSessionId || 'default'}
                          socket={socketRef.current}
                          width={500}
                          height={500}
                          className="border border-gray-200 rounded-xl shadow-inner w-full h-full"
                          onElementAdded={(element) => {
                            console.log('Element added:', element);
                            if (socketRef.current && currentSessionId) {
                              socketRef.current.emit('whiteboard-update', {
                                sessionId: currentSessionId,
                                type: 'element-added',
                                element
                              });
                            }
                          }}
                          onStateChanged={(state) => {
                            console.log('Whiteboard state changed:', state);
                            if (socketRef.current && currentSessionId) {
                              socketRef.current.emit('whiteboard-update', {
                                sessionId: currentSessionId,
                                type: 'state-changed',
                                state
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
