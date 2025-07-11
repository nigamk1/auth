import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { voiceService } from '../../utils/voice';
import { aiTeacherService } from '../../utils/aiTeacher';
import Session from '../../models/Session';
import Transcript from '../../models/Transcript';
import WhiteboardState from '../../models/WhiteboardState';
import { logger } from '../../utils/logger';
import { Buffer } from 'buffer';

interface AuthenticatedSocket {
  id: string;
  userId: string;
  email: string;
  sessionId?: string;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: (data: any) => void) => void;
  disconnect: () => void;
}

class AITeacherSocketHandler {
  private io: SocketIOServer;
  private activeUsers: Map<string, string> = new Map(); // socketId -> userId
  private activeSessions: Map<string, string[]> = new Map(); // sessionId -> socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      maxHttpBufferSize: 10e6, // 10MB for audio files
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('AI Teacher Socket.IO handler initialized');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware() {
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
        
        socket.userId = decoded.userId;
        socket.email = decoded.email;
        
        logger.info(`Socket authenticated for user: ${socket.userId}`);
        next();
        
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      logger.info(`New socket connection: ${socket.id} for user: ${socket.userId}`);
      
      this.activeUsers.set(socket.id, socket.userId);

      // Handle user questions (text input)
      socket.on('user-question', async (data: { question: string; sessionId: string; language?: string }) => {
        try {
          const { question, sessionId, language = 'en' } = data;
          
          logger.info(`Received question from user ${socket.userId}: ${question}`);

          // Get AI response using the aiTeacherService
          const aiResponse = await aiTeacherService.generateResponse(
            question,
            {
              name: 'AI Assistant',
              voice: 'female',
              teachingStyle: 'patient'
            },
            {
              sessionId: sessionId || 'standalone-chat',
              previousMessages: [],
              currentTopic: 'General Q&A',
              studentLevel: 'beginner'
            }
          );
          
          // Emit AI response back to client
          socket.emit('ai-response', {
            question,
            answer: aiResponse.text,
            sessionId,
            timestamp: new Date()
          });

          logger.info(`Sent AI response to user ${socket.userId}`);
        } catch (error) {
          logger.error('Error processing user question:', error);
          socket.emit('error', { message: 'Failed to process question' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.userId}`);
        this.activeUsers.delete(socket.id);
      });
    });
  }

  /**
   * Get active session statistics
   */
  public getSessionStats() {
    return {
      activeUsers: this.activeUsers.size,
      activeSessions: this.activeSessions.size,
      totalConnections: this.io.engine.clientsCount
    };
  }
}

export default AITeacherSocketHandler;