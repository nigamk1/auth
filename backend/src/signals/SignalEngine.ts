/**
 * Signal Engine for processing strategy results and generating trade signals
 */
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { StrategyResult, TradeSignal } from '../types/trading';
import { logger } from '../utils/logger';
import TradeSignalModel from '../models/TradeSignal';

class SignalEngine extends EventEmitter {
  private signalThreshold: number;
  private recentSignals: Map<string, TradeSignal> = new Map();
  private signalCooldown: Map<string, number> = new Map();
  private cooldownPeriod: number; // milliseconds

  constructor(options: { signalThreshold?: number; cooldownPeriod?: number } = {}) {
    super();
    this.signalThreshold = options.signalThreshold || 70; // Min confidence to generate signal
    this.cooldownPeriod = options.cooldownPeriod || 15 * 60 * 1000; // 15 minutes default
  }

  /**
   * Process a strategy result and potentially generate a trade signal
   */
  public processStrategyResult(result: StrategyResult): void {
    try {
      logger.debug(`Processing strategy result from ${result.strategyName}:`, result);

      // Check if the confidence meets our threshold
      if (result.confidence < this.signalThreshold) {
        logger.debug(`Confidence ${result.confidence} below threshold ${this.signalThreshold}, ignoring`);
        return;
      }

      // Check if we're in cooldown for this instrument
      const cooldownKey = `${result.instrument}_${result.signalType}`;
      const cooldownUntil = this.signalCooldown.get(cooldownKey);
      
      if (cooldownUntil && Date.now() < cooldownUntil) {
        logger.debug(`Signal for ${cooldownKey} in cooldown until ${new Date(cooldownUntil).toISOString()}`);
        return;
      }

      // Generate a unique ID for this signal
      const signalId = uuidv4();
      
      // Parse the instrument to get details (e.g., "NIFTY 22700 CE")
      const instrumentParts = result.instrument.split(' ');
      const optionType = instrumentParts.length > 1 ? instrumentParts[instrumentParts.length - 1] as 'CE' | 'PE' : undefined;
      const strikePrice = instrumentParts.length > 1 ? parseFloat(instrumentParts[instrumentParts.length - 2]) : undefined;

      // Calculate target and stop loss (simplified approach)
      const lastPrice = 100; // This would come from actual option data
      const targetMultiplier = result.signalType === 'BUY' ? 1.5 : 0.5;
      const stopMultiplier = result.signalType === 'BUY' ? 0.7 : 1.3;

      const targetPrice = result.signalType === 'BUY' 
        ? lastPrice * targetMultiplier 
        : lastPrice * stopMultiplier;
        
      const stopLossPrice = result.signalType === 'BUY' 
        ? lastPrice * stopMultiplier 
        : lastPrice * targetMultiplier;

      // Generate reasoning based on indicators
      let reasoning = `${result.strategyName} generated a ${result.signalType} signal for ${result.instrument} with ${result.confidence}% confidence. `;
      
      // Add indicator details to reasoning
      if (result.indicators && result.indicators.length > 0) {
        reasoning += 'Indicators: ';
        result.indicators.forEach((indicator, index) => {
          reasoning += `${indicator.name}: ${indicator.value}`;
          if (index < result.indicators.length - 1) {
            reasoning += ', ';
          }
        });
      }

      // Create the trade signal
      const signal: TradeSignal = {
        id: signalId,
        strategyName: result.strategyName,
        signalType: result.signalType === 'BUY' || result.signalType === 'SELL' ? result.signalType : 'BUY',
        instrument: result.instrument,
        entryPrice: lastPrice,
        targetPrice,
        stopLossPrice,
        confidence: result.confidence,
        reasoning,
        indicators: result.indicators,
        timestamp: result.timestamp,
        expiryDate: '2025-06-27', // This would be derived from actual data
        strikePrice: strikePrice || 0,
        optionType: optionType as 'CE' | 'PE' || 'CE',
        underlyingValue: 0 // This would come from actual index data
      };

      // Store signal in recent signals map
      this.recentSignals.set(signalId, signal);
      
      // Set cooldown for this instrument/signal type
      this.signalCooldown.set(cooldownKey, Date.now() + this.cooldownPeriod);

      // Save to database
      this.saveSignal(signal);

      // Emit the signal
      this.emit('signal', signal);
      logger.info(`Generated trade signal: ${signal.signalType} ${signal.instrument} at ${signal.entryPrice}`);
    } catch (error) {
      logger.error('Error processing strategy result:', error);
    }
  }

  /**
   * Save a trade signal to the database
   */
  private async saveSignal(signal: TradeSignal): Promise<void> {
    try {
      await TradeSignalModel.create(signal);
      logger.debug(`Saved trade signal ${signal.id} to database`);
    } catch (error) {
      logger.error(`Error saving trade signal to database:`, error);
    }
  }

  /**
   * Get recent trade signals
   */
  public getRecentSignals(): TradeSignal[] {
    return Array.from(this.recentSignals.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get recent trade signals for a specific strategy
   */
  public getRecentSignalsByStrategy(strategyName: string): TradeSignal[] {
    return this.getRecentSignals().filter(signal => signal.strategyName === strategyName);
  }

  /**
   * Get signal by ID
   */
  public getSignalById(id: string): TradeSignal | undefined {
    return this.recentSignals.get(id);
  }

  /**
   * Set signal threshold
   */
  public setSignalThreshold(threshold: number): void {
    this.signalThreshold = Math.max(0, Math.min(100, threshold));
    logger.info(`Signal threshold set to ${this.signalThreshold}`);
  }

  /**
   * Set cooldown period
   */
  public setCooldownPeriod(periodMs: number): void {
    this.cooldownPeriod = periodMs;
    logger.info(`Signal cooldown period set to ${this.cooldownPeriod}ms`);
  }
}

export default SignalEngine;
