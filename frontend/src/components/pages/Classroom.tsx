import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { aiAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import type { Session, Message, WhiteboardState } from '../../types';
import VoiceRecorder from '../ui/VoiceRecorder';
import Whiteboard from '../ui/WhiteboardNew';
import ChatPanel from '../ui/ChatPanel';
import SessionControls from '../ui/SessionControls';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ClassroomProps {}

const Classroom: React.FC<ClassroomProps> = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();

  // State
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [whiteboardState, setWhiteboardState] = useState<WhiteboardState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentSpeech, setCurrentSpeech] = useState<string>('');

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize session and socket connection
  useEffect(() => {
    if (!sessionId || !token) return;

    const initializeSession = async () => {
      try {
        setIsLoading(true);

        // Get session data
        const sessionData = await aiAPI.getSession(sessionId);
        setSession(sessionData);

        // Get whiteboard state
        const whiteboardData = await aiAPI.getWhiteboardState(sessionId);
        setWhiteboardState(whiteboardData);

        // Initialize socket connection
        socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
          auth: { token },
          transports: ['websocket']
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
          setIsConnected(true);
          socket.emit('join-session', sessionId);
          showToast('Connected to session', 'success');
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
          showToast('Disconnected from session', 'warning');
        });

        socket.on('session-joined', (data) => {
          console.log('Joined session:', data);
        });

        socket.on('ai-response', (response) => {
          const newMessage: Message = {
            id: response.messageId,
            sessionId: sessionId!,
            type: 'ai_response',
            content: {
              text: response.text,
              audioUrl: response.audioUrl
            },
            aiResponse: {
              spokenText: response.text,
              audioUrl: response.audioUrl,
              whiteboardCommands: response.whiteboardCommands,
              confidence: 0.95
            },
            metadata: {
              timestamp: new Date(),
              language: session?.language || 'en',
              processingTime: 1500
            },
            createdAt: new Date()
          };

          setMessages(prev => [...prev, newMessage]);

          // Play AI audio response if available
          if (response.audioUrl && audioRef.current) {
            audioRef.current.src = response.audioUrl;
            audioRef.current.play().catch(console.error);
          }

          // Execute whiteboard commands
          if (response.whiteboardCommands && response.whiteboardCommands.length > 0) {
            response.whiteboardCommands.forEach((command: any) => {
              // Handle whiteboard commands
              console.log('Executing whiteboard command:', command);
            });
          }
        });

        socket.on('whiteboard-event', (event) => {
          // Handle real-time whiteboard updates
          console.log('Whiteboard event:', event);
        });

        socket.on('voice-message-received', (data) => {
          console.log('Voice message received:', data);
        });

        socket.on('error', (error) => {
          showToast(error.message || 'Connection error', 'error');
        });

      } catch (error: any) {
        console.error('Failed to initialize session:', error);
        showToast(error.message || 'Failed to load session', 'error');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-session', sessionId);
        socketRef.current.disconnect();
      }
    };
  }, [sessionId, token, navigate, showToast]);

  // Handle text message sending
  const handleSendMessage = useCallback(async (message: string) => {
    if (!sessionId || !message.trim()) return;

    try {
      // Create user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        sessionId: sessionId,
        type: 'user_text',
        content: { text: message.trim() },
        metadata: {
          timestamp: new Date(),
          language: session?.language || 'en'
        },
        createdAt: new Date()
      };

      setMessages(prev => [...prev, userMessage]);

      // Send to AI and get response
      await aiAPI.sendMessage(sessionId, message.trim());

    } catch (error: any) {
      console.error('Failed to send message:', error);
      showToast(error.message || 'Failed to send message', 'error');
    }
  }, [sessionId, session, showToast]);

  // Handle voice recording
  const handleVoiceRecording = useCallback(async (audioBlob: Blob) => {
    if (!sessionId) return;

    try {
      setIsRecording(true);
      const audioFile = new File([audioBlob], 'voice.wav', { type: 'audio/wav' });
      
      const response = await aiAPI.uploadVoice(sessionId, audioFile);
      
      setMessages(prev => [...prev, response.message]);

      if (response.audioUrl && audioRef.current) {
        audioRef.current.src = response.audioUrl;
        audioRef.current.play().catch(console.error);
      }

    } catch (error: any) {
      console.error('Failed to process voice:', error);
      showToast(error.message || 'Failed to process voice', 'error');
    } finally {
      setIsRecording(false);
    }
  }, [sessionId, showToast]);

  // Handle whiteboard updates
  const handleWhiteboardUpdate = useCallback(async (newState: WhiteboardState) => {
    if (!sessionId) return;

    try {
      await aiAPI.updateWhiteboardState(sessionId, newState);
      setWhiteboardState(newState);

      // Emit whiteboard event to other users
      if (socketRef.current) {
        socketRef.current.emit('whiteboard-event', {
          sessionId,
          event: {
            type: 'update',
            data: newState,
            timestamp: Date.now()
          }
        });
      }

    } catch (error: any) {
      console.error('Failed to update whiteboard:', error);
      showToast(error.message || 'Failed to update whiteboard', 'error');
    }
  }, [sessionId, showToast]);

  // Handle session controls
  const handlePauseSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const updatedSession = await aiAPI.pauseSession(sessionId);
      setSession(updatedSession);
      showToast('Session paused', 'info');
    } catch (error: any) {
      showToast(error.message || 'Failed to pause session', 'error');
    }
  }, [sessionId, showToast]);

  const handleResumeSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const updatedSession = await aiAPI.resumeSession(sessionId);
      setSession(updatedSession);
      showToast('Session resumed', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to resume session', 'error');
    }
  }, [sessionId, showToast]);

  const handleEndSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      await aiAPI.endSession(sessionId);
      showToast('Session ended', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      showToast(error.message || 'Failed to end session', 'error');
    }
  }, [sessionId, showToast, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Session not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">{session.title}</h1>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {session.subject}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <SessionControls
              session={session}
              onPause={handlePauseSession}
              onResume={handleResumeSession}
              onEnd={handleEndSession}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          
          {/* Whiteboard */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Interactive Whiteboard</h2>
            </div>
            <div className="h-full">
              <Whiteboard
                state={whiteboardState}
                onUpdate={handleWhiteboardUpdate}
                sessionId={sessionId!}
              />
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            
            {/* Voice Controls */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Voice Interaction</h3>
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecording}
                isRecording={isRecording}
                disabled={!isConnected || session.status !== 'active'}
              />
              {currentSpeech && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">{currentSpeech}</p>
                </div>
              )}
            </div>

            {/* Chat Panel */}
            <div className="bg-white rounded-lg shadow border border-gray-200 flex-1">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                disabled={!isConnected || session.status !== 'active'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element for playing AI responses */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
};

export default Classroom;
