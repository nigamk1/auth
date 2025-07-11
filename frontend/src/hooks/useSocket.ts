import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getServerUrl } from '../utils/environment';

interface UseSocketOptions {
  serverUrl?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface SocketEvents {
  // Connection events
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: any) => void;
  
  // AI events
  onAIAnswer?: (data: AIAnswerEvent) => void;
  onAIThinking?: (data: AIThinkingEvent) => void;
  onAITyping?: (data: AITypingEvent) => void;
  
  // Whiteboard events
  onWhiteboardUpdate?: (data: WhiteboardUpdateEvent) => void;
  onCursorUpdate?: (data: CursorUpdateEvent) => void;
  
  // Chat events
  onChatMessage?: (data: ChatMessageEvent) => void;
  
  // Session events
  onSessionJoined?: (data: SessionJoinedEvent) => void;
  onUserJoinedSession?: (data: UserJoinedEvent) => void;
  onUserLeftSession?: (data: UserLeftEvent) => void;
  onUserDisconnected?: (data: UserDisconnectedEvent) => void;
  onUserActivity?: (data: UserActivityEvent) => void;
  
  // Voice events
  onVoiceReply?: (data: VoiceReplyEvent) => void;
}

// Event interfaces
interface AIAnswerEvent {
  sessionId: string;
  response: string;
  type: 'answer' | 'explanation' | 'diagram' | 'assessment';
  whiteboardActions?: any[];
  followUpQuestions?: string[];
  confidence?: number;
}

interface AIThinkingEvent {
  sessionId: string;
  isThinking: boolean;
  question?: string;
  timestamp: Date;
}

interface AITypingEvent {
  sessionId: string;
  isTyping: boolean;
  timestamp: Date;
}

interface WhiteboardUpdateEvent {
  sessionId: string;
  action: 'add' | 'update' | 'delete' | 'clear';
  element?: any;
  elements?: any[];
  userId: string;
  userName?: string;
  timestamp: Date;
}

interface CursorUpdateEvent {
  userId: string;
  userName: string;
  position: { x: number; y: number };
  timestamp: Date;
}

interface ChatMessageEvent {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  message: string;
  type: 'user' | 'ai' | 'system';
  timestamp: Date;
}

interface SessionJoinedEvent {
  sessionId: string;
  session: any;
  whiteboardState: any;
  connectedUsers: any[];
}

interface UserJoinedEvent {
  userId: string;
  userName: string;
  joinedAt: Date;
}

interface UserLeftEvent {
  userId: string;
  userName: string;
  leftAt: Date;
}

interface UserDisconnectedEvent {
  userId: string;
  userName: string;
  disconnectedAt: Date;
}

interface UserActivityEvent {
  userId: string;
  userName: string;
  activity: string;
  timestamp: Date;
}

interface VoiceReplyEvent {
  sessionId: string;
  audioUrl: string;
  text: string;
  duration: number;
  voice: 'male' | 'female';
}

export const useSocket = (events: SocketEvents, options: UseSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const {
    serverUrl = getServerUrl(),
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000
  } = options;

  // Initialize socket connection
  const connect = useCallback((token?: string) => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    const authToken = token || localStorage.getItem('accessToken');
    if (!authToken) {
      console.error('No authentication token available for socket connection');
      return null;
    }

    socketRef.current = io(serverUrl, {
      auth: {
        token: authToken
      },
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      autoConnect
    });

    // Connection events
    socketRef.current.on('connect', () => {
      console.log('🔌 Socket connected:', socketRef.current?.id);
      events.onConnect?.();
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      events.onDisconnect?.(reason);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
      events.onError?.(error);
    });

    socketRef.current.on('error', (error) => {
      console.error('🔌 Socket error:', error);
      events.onError?.(error);
    });

    // AI events
    socketRef.current.on('aiAnswer', events.onAIAnswer || (() => {}));
    socketRef.current.on('ai-thinking', events.onAIThinking || (() => {}));
    socketRef.current.on('ai-typing', events.onAITyping || (() => {}));

    // Whiteboard events
    socketRef.current.on('whiteboardUpdate', events.onWhiteboardUpdate || (() => {}));
    socketRef.current.on('cursor-update', events.onCursorUpdate || (() => {}));

    // Chat events
    socketRef.current.on('chat-message', events.onChatMessage || (() => {}));

    // Session events
    socketRef.current.on('session-joined', events.onSessionJoined || (() => {}));
    socketRef.current.on('user-joined-session', events.onUserJoinedSession || (() => {}));
    socketRef.current.on('user-left-session', events.onUserLeftSession || (() => {}));
    socketRef.current.on('user-disconnected', events.onUserDisconnected || (() => {}));
    socketRef.current.on('user-activity', events.onUserActivity || (() => {}));

    // Voice events
    socketRef.current.on('voiceReply', events.onVoiceReply || (() => {}));

    return socketRef.current;
  }, [serverUrl, autoConnect, reconnection, reconnectionAttempts, reconnectionDelay, events]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // Join a session
  const joinSession = useCallback((sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-session', { sessionId });
    }
  }, []);

  // Leave a session
  const leaveSession = useCallback((sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-session', { sessionId });
    }
  }, []);

  // Send chat message
  const sendChatMessage = useCallback((sessionId: string, message: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat-message', { sessionId, message });
    }
  }, []);

  // Ask AI question
  const askAIQuestion = useCallback((sessionId: string, question: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ai-question', { sessionId, question });
    }
  }, []);

  // Update whiteboard
  const updateWhiteboard = useCallback((sessionId: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('whiteboard-update', { sessionId, ...data });
    }
  }, []);

  // Update cursor position
  const updateCursor = useCallback((sessionId: string, position: { x: number; y: number }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('whiteboard-cursor', { sessionId, position });
    }
  }, []);

  // Start AI typing indicator
  const startAITyping = useCallback((sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ai-typing-start', { sessionId });
    }
  }, []);

  // Stop AI typing indicator
  const stopAITyping = useCallback((sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ai-typing-stop', { sessionId });
    }
  }, []);

  // Request voice reply
  const requestVoiceReply = useCallback((sessionId: string, text: string, voice: 'male' | 'female' = 'female') => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('voice-request', { sessionId, text, voice });
    }
  }, []);

  // Send user activity
  const sendUserActivity = useCallback((sessionId: string, activity: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('user-activity', { sessionId, activity });
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, autoConnect]);

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    joinSession,
    leaveSession,
    sendChatMessage,
    askAIQuestion,
    updateWhiteboard,
    updateCursor,
    startAITyping,
    stopAITyping,
    requestVoiceReply,
    sendUserActivity,
    isConnected: socketRef.current?.connected || false
  };
};

export default useSocket;
