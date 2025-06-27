/**
 * WebSocket server for real-time trading data and alerts
 */
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { logger } from '../utils/logger';
import { NiftyData, OptionData, TradeSignal } from '../types/trading';

class WebSocketServer {
  private io: Server;
  
  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        // In production, specify your frontend domain
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com']
          : ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupEventHandlers();
    
    logger.info('WebSocket server initialized');
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`New client connected: ${socket.id}`);

      // Handle client disconnection
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      // Handle client requesting to join specific rooms
      socket.on('join', (rooms: string[]) => {
        // Leave all rooms first
        Array.from(socket.rooms)
          .filter(room => room !== socket.id)
          .forEach(room => socket.leave(room));
          
        // Join requested rooms
        rooms.forEach(room => {
          socket.join(room);
          logger.debug(`Client ${socket.id} joined room: ${room}`);
        });
      });

      // Handle client authentication
      socket.on('authenticate', (token: string) => {
        // In a real app, verify the token and store user ID with the socket
        // For now, we'll just log it
        logger.debug(`Client ${socket.id} authenticated`);
      });
    });
  }

  /**
   * Broadcast Nifty data to all clients
   */
  public broadcastNiftyData(data: NiftyData): void {
    this.io.to('nifty').emit('nifty_update', data);
  }

  /**
   * Broadcast option chain data
   */
  public broadcastOptionData(data: OptionData): void {
    this.io.to('options').emit('option_update', data);
    
    // Also broadcast to a room specific to this instrument
    const instrumentRoom = `option_${data.symbol}`;
    this.io.to(instrumentRoom).emit('option_update', data);
  }

  /**
   * Broadcast trade signal to all clients
   */
  public broadcastTradeSignal(signal: TradeSignal): void {
    this.io.to('signals').emit('trade_signal', signal);
    
    // Also broadcast to rooms for specific strategies
    this.io.to(`strategy_${signal.strategyName}`).emit('trade_signal', signal);
  }

  /**
   * Broadcast error message
   */
  public broadcastError(error: string): void {
    this.io.emit('error', { message: error });
  }

  /**
   * Send a message to a specific client
   */
  public sendToClient(socketId: string, event: string, data: any): void {
    this.io.to(socketId).emit(event, data);
  }

  /**
   * Get the server instance
   */
  public getServer(): Server {
    return this.io;
  }
}

export default WebSocketServer;
