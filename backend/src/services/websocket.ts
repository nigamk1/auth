import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { WhiteboardState } from '../models/WhiteboardState';

interface SocketUser {
  id: string;
  email: string;
  name: string;
}

interface WhiteboardEvent {
  type: 'draw' | 'erase' | 'clear' | 'shape' | 'text';
  data: any;
  timestamp: number;
}

class WebSocketService {
  private io: Server | null = null;
  private connectedUsers = new Map<string, SocketUser>();

  initialize(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.data.user = {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`
        };
        
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      const user = socket.data.user as SocketUser;
      this.connectedUsers.set(socket.id, user);
      
      console.log(`User connected: ${user.email}`);

      // Join session room
      socket.on('join-session', async (sessionId: string) => {
        try {
          const session = await Session.findById(sessionId);
          if (!session || session.userId.toString() !== user.id) {
            socket.emit('error', { message: 'Unauthorized access to session' });
            return;
          }

          socket.join(sessionId);
          socket.emit('session-joined', { sessionId });
          
          // Get whiteboard state for this session
          const whiteboardState = await WhiteboardState.findOne({ sessionId });
          
          // Send current session state
          socket.emit('session-state', {
            session: session.toObject(),
            whiteboardState: whiteboardState?.toObject() || null
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to join session' });
        }
      });

      // Leave session room
      socket.on('leave-session', (sessionId: string) => {
        socket.leave(sessionId);
        socket.emit('session-left', { sessionId });
      });

      // Handle whiteboard events
      socket.on('whiteboard-event', async (data: { sessionId: string; event: WhiteboardEvent }) => {
        try {
          const { sessionId, event } = data;
          
          // Verify user has access to session
          const session = await Session.findById(sessionId);
          if (!session || session.userId.toString() !== user.id) {
            socket.emit('error', { message: 'Unauthorized access to session' });
            return;
          }

          // Broadcast to other users in the session
          socket.to(sessionId).emit('whiteboard-event', event);
          
          // Update whiteboard state in database
          let whiteboardState = await WhiteboardState.findOne({ sessionId });
          
          if (!whiteboardState) {
            whiteboardState = new WhiteboardState({
              sessionId,
              userId: user.id,
              elements: [],
              version: 1,
              lastModified: new Date(),
              metadata: {
                totalElements: 0,
                canvasSize: { width: 800, height: 600 },
                backgroundColor: '#ffffff'
              }
            });
          }
          
          whiteboardState.version += 1;
          whiteboardState.lastModified = new Date();
          await whiteboardState.save();
          
        } catch (error) {
          socket.emit('error', { message: 'Failed to process whiteboard event' });
        }
      });

      // Handle voice messages
      socket.on('voice-message', (data: { sessionId: string; audioData: Buffer; duration: number }) => {
        // Broadcast voice message to session participants
        socket.to(data.sessionId).emit('voice-message-received', {
          userId: user.id,
          userName: user.name,
          audioData: data.audioData,
          duration: data.duration,
          timestamp: new Date()
        });
      });

      // Handle typing indicators
      socket.on('typing-start', (sessionId: string) => {
        socket.to(sessionId).emit('user-typing', { userId: user.id, userName: user.name });
      });

      socket.on('typing-stop', (sessionId: string) => {
        socket.to(sessionId).emit('user-stopped-typing', { userId: user.id });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.id);
        console.log(`User disconnected: ${user.email}`);
      });
    });

    console.log('WebSocket service initialized with Socket.IO');
  }

  sendToRoom(roomId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(roomId).emit(event, data);
    }
  }

  sendToUser(userId: string, event: string, data: any) {
    if (this.io) {
      // Find socket by user ID
      for (const [socketId, user] of this.connectedUsers.entries()) {
        if (user.id === userId) {
          this.io.to(socketId).emit(event, data);
          break;
        }
      }
    }
  }

  broadcastToAll(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Send AI response to session
  sendAIResponse(sessionId: string, response: {
    messageId: string;
    text: string;
    audioUrl?: string;
    whiteboardCommands?: any[];
  }) {
    this.sendToRoom(sessionId, 'ai-response', response);
  }

  // Send whiteboard command execution results
  sendWhiteboardUpdate(sessionId: string, update: {
    commandId: string;
    result: 'success' | 'error';
    elements?: any[];
    error?: string;
  }) {
    this.sendToRoom(sessionId, 'whiteboard-update', update);
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get users in session
  getUsersInSession(sessionId: string): SocketUser[] {
    const users: SocketUser[] = [];
    if (this.io) {
      const room = this.io.sockets.adapter.rooms.get(sessionId);
      if (room) {
        for (const socketId of room) {
          const user = this.connectedUsers.get(socketId);
          if (user) {
            users.push(user);
          }
        }
      }
    }
    return users;
  }

  // Legacy methods for backward compatibility
  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public getUserSessionCount(): number {
    return this.connectedUsers.size;
  }

  public broadcastToUser(userId: string, event: string, data: any): void {
    this.sendToUser(userId, event, data);
  }

  public broadcastToSession(sessionId: string, event: string, data: any): void {
    this.sendToRoom(sessionId, event, data);
  }
}

export const websocketService = new WebSocketService();
export { WebSocketService };
