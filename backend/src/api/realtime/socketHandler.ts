import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '../../utils/logger';
import { AITeacherService } from '../../utils/aiTeacher';
import { VoiceService } from '../../utils/voice';
import TeachingSession from '../../models/TeachingSession';
import WhiteboardState from '../../models/WhiteboardState';
import Session from '../../models/Session';
import SessionMemory from '../../models/SessionMemory';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
  sessionId?: string;
}

interface SocketUser {
  userId: string;
  userName: string;
  socketId: string;
  sessionId?: string;
  joinedAt: Date;
}

interface WhiteboardUpdateData {
  sessionId: string;
  elements: any[];
  action: 'add' | 'update' | 'delete' | 'clear';
  element?: any;
  userId: string;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  message: string;
  type: 'user' | 'ai' | 'system';
  timestamp: Date;
}

interface AIResponse {
  sessionId: string;
  response: string;
  type: 'answer' | 'explanation' | 'diagram' | 'assessment';
  whiteboardActions?: any[];
  followUpQuestions?: string[];
  confidence?: number;
}

interface VoiceReply {
  sessionId: string;
  audioUrl: string | null;
  text: string;
  duration: number;
  voice: 'male' | 'female' | 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'text-only';
}

export class RealTimeSocketHandler {
  private io: Server;
  private connectedUsers = new Map<string, SocketUser>();
  private sessionRooms = new Map<string, Set<string>>(); // sessionId -> Set of socketIds
  private aiTeacher: AITeacherService;
  private voiceService: VoiceService;

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Initialize AI and Voice services
    this.aiTeacher = new AITeacherService();
    this.voiceService = new VoiceService();

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('🔌 Socket.IO server initialized with AI and Voice services');
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
        socket.userId = decoded.userId;
        socket.userName = decoded.name || 'Unknown User';
        
        logger.info(`🔐 Socket authenticated for user: ${socket.userId}`);
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`🔌 User connected: ${socket.userId} (${socket.id})`);

      // Register user
      this.registerUser(socket);

      // Session management
      socket.on('join-session', (data) => this.handleJoinSession(socket, data));
      socket.on('leave-session', (data) => this.handleLeaveSession(socket, data));

      // Whiteboard events
      socket.on('whiteboard-update', (data) => this.handleWhiteboardUpdate(socket, data));
      socket.on('whiteboard-cursor', (data) => this.handleCursorUpdate(socket, data));

      // Chat events
      socket.on('chat-message', (data) => this.handleChatMessage(socket, data));
      socket.on('ai-question', (data) => this.handleAIQuestion(socket, data));

      // AI interaction events
      socket.on('ai-typing-start', (data) => this.handleAITypingStart(socket, data));
      socket.on('ai-typing-stop', (data) => this.handleAITypingStop(socket, data));

      // Voice events
      socket.on('voice-request', (data) => this.handleVoiceRequest(socket, data));

      // Presence events
      socket.on('user-activity', (data) => this.handleUserActivity(socket, data));

      // Disconnect handler
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  private registerUser(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    const user: SocketUser = {
      userId: socket.userId,
      userName: socket.userName || 'Unknown User',
      socketId: socket.id,
      joinedAt: new Date()
    };

    this.connectedUsers.set(socket.id, user);
    
    // Emit user connected event
    socket.emit('connection-success', {
      userId: socket.userId,
      userName: socket.userName,
      connectedAt: new Date()
    });

    logger.info(`👤 User registered: ${socket.userId}`);
  }

  private async handleJoinSession(socket: AuthenticatedSocket, data: { 
    sessionId: string; 
    language?: 'en' | 'hi' | 'hinglish';
    voiceSettings?: any;
  }) {
    try {
      const { sessionId, language = 'en', voiceSettings } = data;

      // Verify session access
      const session = await Session.findOne({
        _id: sessionId,
        userId: socket.userId
      });

      if (!session) {
        socket.emit('error', { message: 'Session not found or access denied' });
        return;
      }

      // Join socket room
      socket.join(sessionId);
      socket.sessionId = sessionId;

      // Store language preference for this socket
      (socket as any).language = language;
      (socket as any).voiceSettings = voiceSettings;

      // Update user session
      const user = this.connectedUsers.get(socket.id);
      if (user) {
        user.sessionId = sessionId;
        this.connectedUsers.set(socket.id, user);
      }

      // Track session rooms
      if (!this.sessionRooms.has(sessionId)) {
        this.sessionRooms.set(sessionId, new Set());
      }
      this.sessionRooms.get(sessionId)!.add(socket.id);

      // Get current whiteboard state
      const whiteboardState = await WhiteboardState.findOne({ sessionId });

      socket.emit('session-joined', {
        sessionId,
        session: {
          id: session._id,
          title: session.title,
          subject: session.subject,
          createdAt: session.createdAt,
          language
        },
        whiteboardState: whiteboardState ? {
          elements: whiteboardState.elements,
          canvasState: whiteboardState.canvasState
        } : null,
        connectedUsers: this.getSessionUsers(sessionId)
      });

      // Notify others in session
      socket.to(sessionId).emit('user-joined-session', {
        userId: socket.userId,
        userName: socket.userName,
        joinedAt: new Date()
      });

      logger.info(`🏠 User ${socket.userId} joined session: ${sessionId}`);

    } catch (error) {
      logger.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  }

  private handleLeaveSession(socket: AuthenticatedSocket, data: { sessionId: string }) {
    const { sessionId } = data;
    
    socket.leave(sessionId);
    
    // Update tracking
    if (this.sessionRooms.has(sessionId)) {
      this.sessionRooms.get(sessionId)!.delete(socket.id);
      if (this.sessionRooms.get(sessionId)!.size === 0) {
        this.sessionRooms.delete(sessionId);
      }
    }

    // Update user
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      user.sessionId = undefined;
      this.connectedUsers.set(socket.id, user);
    }

    // Notify others
    socket.to(sessionId).emit('user-left-session', {
      userId: socket.userId,
      userName: socket.userName,
      leftAt: new Date()
    });

    socket.emit('session-left', { sessionId });
    logger.info(`🚪 User ${socket.userId} left session: ${sessionId}`);
  }

  private async handleWhiteboardUpdate(socket: AuthenticatedSocket, data: WhiteboardUpdateData) {
    try {
      const { sessionId, elements, action, element } = data;

      // Update database
      let updateQuery: any = {};
      
      switch (action) {
        case 'add':
          if (element) {
            updateQuery = { $push: { elements: element } };
          }
          break;
        case 'update':
          if (element) {
            updateQuery = { 
              $set: { 
                'elements.$[elem]': element 
              }
            };
          }
          break;
        case 'delete':
          if (element?.id) {
            updateQuery = { $pull: { elements: { id: element.id } } };
          }
          break;
        case 'clear':
          updateQuery = { $set: { elements: [] } };
          break;
      }

      if (Object.keys(updateQuery).length > 0) {
        await WhiteboardState.findOneAndUpdate(
          { sessionId },
          {
            ...updateQuery,
            $set: {
              ...updateQuery.$set,
              'metadata.lastModifiedBy': socket.userId,
              updatedAt: new Date()
            }
          },
          { 
            upsert: true, 
            new: true,
            arrayFilters: element?.id ? [{ 'elem.id': element.id }] : undefined
          }
        );
      }

      // Save whiteboard snapshot to session memory
      const sessionMemory = await SessionMemory.findOne({ sessionId });
      if (sessionMemory && (action === 'add' || action === 'update' || action === 'clear')) {
        const whiteboardState = await WhiteboardState.findOne({ sessionId });
        if (whiteboardState) {
          await sessionMemory.saveWhiteboardSnapshot({
            elements: whiteboardState.elements,
            canvasState: whiteboardState.canvasState || {
              zoom: 1,
              viewBox: { x: 0, y: 0, width: 800, height: 600 },
              backgroundColor: '#ffffff'
            },
            createdBy: socket.userId!
          });
        }
      }

      // Emit to all users in session except sender
      const updateData = {
        sessionId,
        action,
        element,
        elements: action === 'clear' ? [] : undefined,
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date()
      };

      socket.to(sessionId).emit('whiteboardUpdate', updateData);

      logger.info(`🎨 Whiteboard ${action} by ${socket.userId} in session ${sessionId}`);

    } catch (error) {
      logger.error('Error handling whiteboard update:', error);
      socket.emit('error', { message: 'Failed to update whiteboard' });
    }
  }

  private handleCursorUpdate(socket: AuthenticatedSocket, data: any) {
    const { sessionId, position } = data;
    
    // Broadcast cursor position to others in session
    socket.to(sessionId).emit('cursor-update', {
      userId: socket.userId,
      userName: socket.userName,
      position,
      timestamp: new Date()
    });
  }

  private async handleChatMessage(socket: AuthenticatedSocket, data: any) {
    try {
      const { sessionId, message } = data;

      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        userId: socket.userId!,
        userName: socket.userName!,
        message,
        type: 'user',
        timestamp: new Date()
      };

      // Save to session memory
      const sessionMemory = await SessionMemory.findOne({ sessionId });
      if (sessionMemory) {
        await sessionMemory.addChatMessage({
          id: chatMessage.id,
          type: 'user',
          content: message,
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date()
        });
      }

      // Emit to all users in session
      this.io.to(sessionId).emit('chat-message', chatMessage);

      logger.info(`💬 Chat message from ${socket.userId} in session ${sessionId}`);

    } catch (error) {
      logger.error('Error handling chat message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private async handleAIQuestion(socket: AuthenticatedSocket, data: any) {
    try {
      const { sessionId, question } = data;
      const language = (socket as any).language || 'en';

      // Emit AI thinking indicator
      this.io.to(sessionId).emit('ai-thinking', {
        sessionId,
        isThinking: true,
        question,
        timestamp: new Date()
      });

      // Get session context for AI
      const session = await Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Get session memory for conversation context
      const sessionMemory = await SessionMemory.findOne({ sessionId });
      const previousMessages = sessionMemory?.chatLog?.slice(-10) || []; // Last 10 messages for context

      // Build AI context with language preference
      const aiContext = {
        sessionId,
        previousMessages: previousMessages.map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content,
          timestamp: msg.timestamp
        })),
        currentTopic: session.subject,
        learningObjectives: session.metadata?.tags || [],
        studentLevel: session.metadata?.difficulty || 'beginner',
        language: language as 'en' | 'hi' | 'hinglish'
      };

      // AI personality based on session and language
      const aiPersonality = {
        name: 'Professor AI',
        voice: 'friendly',
        teachingStyle: 'patient' as const,
        subject: session.subject,
        difficulty: session.metadata?.difficulty as 'beginner' | 'intermediate' | 'advanced',
        language: language as 'en' | 'hi' | 'hinglish'
      };

      // Generate AI response with language support
      const aiResponse = await this.aiTeacher.generateResponse(
        question,
        aiPersonality,
        aiContext
      );

      // Save AI response to session memory
      if (sessionMemory) {
        await sessionMemory.addChatMessage({
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: aiResponse.text,
          userId: 'ai',
          userName: 'AI Teacher',
          timestamp: new Date(),
          metadata: {
            confidence: 0.95,
            language,
            whiteboardActions: aiResponse.whiteboardActions,
            followUpQuestions: aiResponse.followUpQuestions
          }
        });
      }

      // Emit AI response
      const finalResponse: AIResponse = {
        sessionId,
        response: aiResponse.text,
        type: 'answer',
        whiteboardActions: aiResponse.whiteboardActions,
        followUpQuestions: aiResponse.followUpQuestions,
        confidence: 0.95
      };

      this.emitAIAnswer(sessionId, finalResponse);

      logger.info(`🤖 AI responded in ${language} for session ${sessionId}: ${aiResponse.text.substring(0, 50)}...`);

    } catch (error) {
      logger.error('Error handling AI question:', error);
      
      // Stop thinking indicator
      this.io.to(data.sessionId).emit('ai-thinking', {
        sessionId: data.sessionId,
        isThinking: false,
        timestamp: new Date()
      });
      
      socket.emit('error', { message: 'Failed to process AI question' });
    }
  }

  private handleAITypingStart(socket: AuthenticatedSocket, data: { sessionId: string }) {
    socket.to(data.sessionId).emit('ai-typing', {
      sessionId: data.sessionId,
      isTyping: true,
      timestamp: new Date()
    });
  }

  private handleAITypingStop(socket: AuthenticatedSocket, data: { sessionId: string }) {
    socket.to(data.sessionId).emit('ai-typing', {
      sessionId: data.sessionId,
      isTyping: false,
      timestamp: new Date()
    });
  }

  private async handleVoiceRequest(socket: AuthenticatedSocket, data: any) {
    try {
      const { sessionId, text } = data;
      const language = (socket as any).language || 'en';
      const voiceSettings = (socket as any).voiceSettings || {};

      logger.info(`🎤 Voice request for session ${sessionId} in ${language}`);

      // Generate TTS with language support
      try {
        const ttsResult = await this.voiceService.textToSpeech(text, {
          language: language as 'en' | 'hi' | 'hinglish',
          voice: voiceSettings.ttsVoice,
          speed: 1.0
        });

        // Create temporary audio URL (in production, you'd upload to cloud storage)
        const audioUrl = `/api/voice/temp-audio-${Date.now()}.mp3`;
        
        const voiceReply: VoiceReply = {
          sessionId,
          audioUrl,
          text,
          duration: ttsResult.duration,
          voice: voiceSettings.ttsVoice || 'alloy'
        };

        this.emitVoiceReply(sessionId, voiceReply);

        logger.info(`🔊 Voice generated in ${language} for session ${sessionId}`);

      } catch (ttsError) {
        logger.warn('TTS failed, falling back to text-only response:', ttsError);
        
        // Fallback: just emit text without audio
        const voiceReply: VoiceReply = {
          sessionId,
          audioUrl: null,
          text,
          duration: Math.floor(text.length * 0.1),
          voice: 'text-only'
        };

        this.emitVoiceReply(sessionId, voiceReply);
      }

    } catch (error) {
      logger.error('Error handling voice request:', error);
      socket.emit('error', { message: 'Failed to generate voice reply' });
    }
  }

  private handleUserActivity(socket: AuthenticatedSocket, data: any) {
    const { sessionId, activity } = data;
    
    socket.to(sessionId).emit('user-activity', {
      userId: socket.userId,
      userName: socket.userName,
      activity,
      timestamp: new Date()
    });
  }

  private handleDisconnect(socket: AuthenticatedSocket) {
    const user = this.connectedUsers.get(socket.id);
    
    if (user) {
      // Remove from session rooms
      if (user.sessionId) {
        const sessionUsers = this.sessionRooms.get(user.sessionId);
        if (sessionUsers) {
          sessionUsers.delete(socket.id);
          if (sessionUsers.size === 0) {
            this.sessionRooms.delete(user.sessionId);
          }
        }

        // Notify session users
        socket.to(user.sessionId).emit('user-disconnected', {
          userId: user.userId,
          userName: user.userName,
          disconnectedAt: new Date()
        });
      }

      // Remove from connected users
      this.connectedUsers.delete(socket.id);
    }

    logger.info(`🔌 User disconnected: ${socket.userId} (${socket.id})`);
  }

  // Public methods for emitting events from other parts of the application

  public async emitAIAnswer(sessionId: string, aiResponse: AIResponse) {
    this.io.to(sessionId).emit('aiAnswer', aiResponse);
    
    // Stop thinking indicator
    this.io.to(sessionId).emit('ai-thinking', {
      sessionId,
      isThinking: false,
      timestamp: new Date()
    });

    // Save AI response to session memory
    try {
      const sessionMemory = await SessionMemory.findOne({ sessionId });
      if (sessionMemory) {
        await sessionMemory.addChatMessage({
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'ai',
          content: aiResponse.response,
          timestamp: new Date(),
          metadata: {
            confidence: aiResponse.confidence,
            aiModel: 'AI Assistant'
          }
        });
      }
    } catch (error) {
      logger.error('Error saving AI response to session memory:', error);
    }

    logger.info(`🤖 AI answer emitted to session ${sessionId}`);
  }

  public emitWhiteboardUpdate(sessionId: string, updateData: WhiteboardUpdateData) {
    this.io.to(sessionId).emit('whiteboardUpdate', updateData);
    logger.info(`🎨 Whiteboard update emitted to session ${sessionId}`);
  }

  public emitVoiceReply(sessionId: string, voiceReply: VoiceReply) {
    this.io.to(sessionId).emit('voiceReply', voiceReply);
    logger.info(`🎤 Voice reply emitted to session ${sessionId}`);
  }

  public emitChatMessage(sessionId: string, message: ChatMessage) {
    this.io.to(sessionId).emit('chat-message', message);
    logger.info(`💬 Chat message emitted to session ${sessionId}`);
  }

  // Utility methods

  private getSessionUsers(sessionId: string): SocketUser[] {
    const socketIds = this.sessionRooms.get(sessionId) || new Set();
    return Array.from(socketIds)
      .map(socketId => this.connectedUsers.get(socketId))
      .filter(user => user !== undefined) as SocketUser[];
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  public getSessionsCount(): number {
    return this.sessionRooms.size;
  }

  public getSocketIO(): Server {
    return this.io;
  }
}

export default RealTimeSocketHandler;
