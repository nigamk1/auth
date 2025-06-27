/**
 * Data Engine for Upstox API Connection
 * Handles WebSocket connections to get real-time Nifty and Option Chain data
 */
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import axios from 'axios';
import { NiftyData, OptionData } from '../types/trading';
import NiftyDataModel from '../models/NiftyData';
import OptionDataModel from '../models/OptionData';
import { logger } from '../utils/logger';

class DataEngine extends EventEmitter {
  private ws: WebSocket | null = null;
  private apiToken: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectInterval: number = 5000;
  private isConnected: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = Date.now();

  constructor(private apiKey: string, private apiSecret: string) {
    super();
    this.authenticateUpstox();
  }

  /**
   * Authenticate with Upstox API to get access token
   */
  private async authenticateUpstox(): Promise<void> {
    try {
      // NOTE: This is a placeholder. In a real implementation, you would use the 
      // Upstox SDK or API to authenticate based on their documentation
      const response = await axios.post('https://api.upstox.com/v2/login', {
        apiKey: this.apiKey,
        apiSecret: this.apiSecret
      });

      if (response.data && response.data.token) {
        this.apiToken = response.data.token;
        logger.info('Successfully authenticated with Upstox API');
        this.connect();
      } else {
        logger.error('Failed to authenticate with Upstox API');
      }
    } catch (error) {
      logger.error('Upstox authentication error:', error);
      // Retry authentication after delay
      setTimeout(() => this.authenticateUpstox(), this.reconnectInterval);
    }
  }

  /**
   * Connect to Upstox WebSocket for real-time data
   */
  private connect(): void {
    try {
      // Replace with the actual Upstox WebSocket URL
      this.ws = new WebSocket('wss://api.upstox.com/v2/feed');

      this.ws.on('open', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        logger.info('Connected to Upstox WebSocket');
        
        // Subscribe to Nifty 50 data
        this.subscribeToNifty();
        
        // Subscribe to Option Chain data
        this.subscribeToOptionChain();
        
        // Start heartbeat to keep connection alive
        this.startHeartbeat();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.processMessage(data);
      });

      this.ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });

      this.ws.on('close', () => {
        this.isConnected = false;
        this.stopHeartbeat();
        logger.warn('WebSocket connection closed');
        this.attemptReconnect();
      });
    } catch (error) {
      logger.error('Error connecting to WebSocket:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Process incoming WebSocket messages
   */
  private processMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      
      // Handle different message types
      if (message.type === 'heartbeat') {
        this.lastHeartbeat = Date.now();
        return;
      }

      // Process Nifty data
      if (message.type === 'marketData' && message.symbol === 'NSE:NIFTY50') {
        const niftyData: NiftyData = {
          symbol: 'NIFTY50',
          price: message.ltp || 0,
          change: message.change || 0,
          changePercent: message.changePercent || 0,
          high: message.high || 0,
          low: message.low || 0,
          open: message.open || 0,
          close: message.close || 0,
          volume: message.volume || 0,
          timestamp: new Date(message.timestamp || Date.now())
        };

        // Save to database
        this.saveNiftyData(niftyData);
        
        // Emit for real-time processing
        this.emit('niftyData', niftyData);
      }

      // Process Option Chain data
      if (message.type === 'marketData' && message.instrumentType === 'option') {
        const optionData: OptionData = {
          symbol: message.symbol,
          strikePrice: message.strikePrice || 0,
          expiryDate: message.expiry || '',
          optionType: message.optionType === 'call' ? 'CE' : 'PE',
          lastPrice: message.ltp || 0,
          change: message.change || 0,
          changePercent: message.changePercent || 0,
          volume: message.volume || 0,
          openInterest: message.openInterest || 0,
          openInterestChange: message.openInterestChange || 0,
          impliedVolatility: message.impliedVolatility || 0,
          bidPrice: message.bidPrice || 0,
          askPrice: message.askPrice || 0,
          underlyingValue: message.underlyingValue || 0,
          timestamp: new Date(message.timestamp || Date.now())
        };

        // Save to database
        this.saveOptionData(optionData);
        
        // Emit for real-time processing
        this.emit('optionData', optionData);
      }
    } catch (error) {
      logger.error('Error processing WebSocket message:', error);
    }
  }

  /**
   * Subscribe to Nifty 50 data
   */
  private subscribeToNifty(): void {
    if (this.ws && this.isConnected) {
      const subscriptionMessage = {
        type: 'subscribe',
        symbols: ['NSE:NIFTY50'],
        feeds: ['marketData', 'depthData']
      };
      
      this.ws.send(JSON.stringify(subscriptionMessage));
      logger.info('Subscribed to Nifty 50 data');
    }
  }

  /**
   * Subscribe to Option Chain data
   * Will need to dynamically subscribe based on strikes around current Nifty price
   */
  private subscribeToOptionChain(): void {
    if (this.ws && this.isConnected) {
      // This would typically be a function that calculates relevant strikes
      // based on current Nifty price and subscribes to both CE and PE
      // For now, we'll use a placeholder list
      
      // Get nearest expiry options at strikes near current price
      const symbols = [
        'NSE:NIFTY25JUN22000CE', 'NSE:NIFTY25JUN22000PE',
        'NSE:NIFTY25JUN22100CE', 'NSE:NIFTY25JUN22100PE',
        'NSE:NIFTY25JUN22200CE', 'NSE:NIFTY25JUN22200PE',
        'NSE:NIFTY25JUN22300CE', 'NSE:NIFTY25JUN22300PE',
        'NSE:NIFTY25JUN22400CE', 'NSE:NIFTY25JUN22400PE',
      ];
      
      const subscriptionMessage = {
        type: 'subscribe',
        symbols: symbols,
        feeds: ['marketData', 'depthData']
      };
      
      this.ws.send(JSON.stringify(subscriptionMessage));
      logger.info(`Subscribed to ${symbols.length} option symbols`);
    }
  }

  /**
   * Save Nifty data to the database
   */
  private async saveNiftyData(data: NiftyData): Promise<void> {
    try {
      await NiftyDataModel.create(data);
      logger.debug(`Saved Nifty data: ${data.price}`);
    } catch (error) {
      logger.error('Error saving Nifty data to database:', error);
    }
  }

  /**
   * Save Option data to the database
   */
  private async saveOptionData(data: OptionData): Promise<void> {
    try {
      await OptionDataModel.create(data);
      logger.debug(`Saved Option data: ${data.symbol} @ ${data.lastPrice}`);
    } catch (error) {
      logger.error('Error saving Option data to database:', error);
    }
  }

  /**
   * Start heartbeat to keep WebSocket connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.isConnected) {
        // Send heartbeat
        this.ws.send(JSON.stringify({ type: 'heartbeat' }));
        
        // Check if we're still receiving heartbeats
        const now = Date.now();
        if (now - this.lastHeartbeat > 30000) {
          logger.warn('No heartbeat received in 30 seconds, reconnecting...');
          this.reconnect();
        }
      }
    }, 15000);
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect with backoff strategy
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
      logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, delay);
    } else {
      logger.error('Maximum reconnection attempts reached. Please restart the service.');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  /**
   * Force a reconnection
   */
  private reconnect(): void {
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
      this.isConnected = false;
      this.stopHeartbeat();
    }
    this.connect();
  }

  /**
   * Get the latest Nifty price from the database
   */
  public async getLatestNiftyPrice(): Promise<number> {
    try {
      const latestData = await NiftyDataModel.findOne().sort({ timestamp: -1 });
      return latestData ? latestData.price : 0;
    } catch (error) {
      logger.error('Error getting latest Nifty price:', error);
      return 0;
    }
  }

  /**
   * Get latest option chain data for a specific expiry
   */
  public async getLatestOptionChain(expiryDate: string): Promise<OptionData[]> {
    try {
      // Get current Nifty price
      const niftyPrice = await this.getLatestNiftyPrice();
      
      // Calculate range of strikes to return (e.g., 500 points above and below)
      const lowerStrike = Math.floor(niftyPrice / 100) * 100 - 500;
      const upperStrike = Math.ceil(niftyPrice / 100) * 100 + 500;
      
      // Get latest data for each strike and option type
      const optionChain = await OptionDataModel.find({
        expiryDate,
        strikePrice: { $gte: lowerStrike, $lte: upperStrike }
      }).sort({ timestamp: -1 }).limit(100);
      
      return optionChain;
    } catch (error) {
      logger.error('Error getting option chain data:', error);
      return [];
    }
  }

  /**
   * Graceful shutdown
   */
  public shutdown(): void {
    logger.info('Shutting down DataEngine...');
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }
  }
}

export default DataEngine;
