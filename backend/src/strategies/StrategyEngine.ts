/**
 * Strategy Engine for managing and running all trading strategies
 */
import { EventEmitter } from 'events';
import { Strategy } from './Strategy';
import { RsiStrategy } from './RsiStrategy';
import { OpenInterestStrategy } from './OpenInterestStrategy';
import { NiftyData, OptionData, StrategyResult } from '../types/trading';
import { logger } from '../utils/logger';
import StrategySettings from '../models/StrategySettings';

class StrategyEngine extends EventEmitter {
  private strategies: Map<string, Strategy> = new Map();
  private userId: string;
  
  constructor(userId: string) {
    super();
    this.userId = userId;
    
    // Initialize with default strategies
    this.initializeDefaultStrategies();
  }

  /**
   * Initialize default strategies
   */
  private async initializeDefaultStrategies(): Promise<void> {
    try {
      // Add RSI Strategy
      await this.addStrategy(new RsiStrategy());
      
      // Add OI Strategy
      await this.addStrategy(new OpenInterestStrategy());

      logger.info(`Initialized default strategies for user ${this.userId}`);
    } catch (error) {
      logger.error('Error initializing default strategies:', error);
    }
  }

  /**
   * Add a strategy to the engine
   */
  public async addStrategy(strategy: Strategy): Promise<void> {
    const strategyName = strategy.getName();

    // Check if we already have a strategy with this name
    if (this.strategies.has(strategyName)) {
      logger.warn(`Strategy ${strategyName} already exists. Updating...`);
      this.strategies.delete(strategyName);
    }

    // Try to load user settings for this strategy
    try {
      const settings = await StrategySettings.findOne({
        userId: this.userId,
        strategyName
      });

      if (settings) {
        // Apply saved settings
        strategy.setParameters(settings.parameters);
        
        // Set enabled state
        if (settings.isEnabled) {
          strategy.enable();
        } else {
          strategy.disable();
        }
        
        logger.info(`Loaded settings for strategy ${strategyName}`);
      }
    } catch (error) {
      logger.error(`Error loading settings for strategy ${strategyName}:`, error);
    }

    // Listen for strategy results
    strategy.on('result', (result: StrategyResult) => {
      this.emit('strategyResult', result);
    });

    // Add to our collection
    this.strategies.set(strategyName, strategy);
    logger.info(`Strategy ${strategyName} added to engine`);
  }

  /**
   * Get a strategy by name
   */
  public getStrategy(name: string): Strategy | undefined {
    return this.strategies.get(name);
  }

  /**
   * Get all strategies
   */
  public getAllStrategies(): Strategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get all strategy names
   */
  public getStrategyNames(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Process new Nifty data through all enabled strategies
   */
  public processNiftyData(data: NiftyData): void {
    this.strategies.forEach(strategy => {
      if (strategy.isEnabled()) {
        strategy.processNiftyData(data);
      }
    });
  }

  /**
   * Process new Option data through all enabled strategies
   */
  public processOptionData(data: OptionData): void {
    this.strategies.forEach(strategy => {
      if (strategy.isEnabled()) {
        strategy.processOptionData(data);
      }
    });
  }

  /**
   * Process batch data through all enabled strategies
   */
  public processBatch(niftyData: NiftyData[], optionData: OptionData[]): void {
    this.strategies.forEach(strategy => {
      if (strategy.isEnabled()) {
        strategy.processBatch(niftyData, optionData);
      }
    });
  }

  /**
   * Enable a strategy
   */
  public async enableStrategy(name: string): Promise<boolean> {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      logger.warn(`Strategy ${name} not found`);
      return false;
    }

    strategy.enable();

    // Update database settings
    try {
      await StrategySettings.findOneAndUpdate(
        { userId: this.userId, strategyName: name },
        { isEnabled: true },
        { upsert: true }
      );
    } catch (error) {
      logger.error(`Error updating strategy settings for ${name}:`, error);
      return false;
    }

    return true;
  }

  /**
   * Disable a strategy
   */
  public async disableStrategy(name: string): Promise<boolean> {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      logger.warn(`Strategy ${name} not found`);
      return false;
    }

    strategy.disable();

    // Update database settings
    try {
      await StrategySettings.findOneAndUpdate(
        { userId: this.userId, strategyName: name },
        { isEnabled: false },
        { upsert: true }
      );
    } catch (error) {
      logger.error(`Error updating strategy settings for ${name}:`, error);
      return false;
    }

    return true;
  }

  /**
   * Update strategy parameters
   */
  public async updateStrategyParameters(name: string, parameters: Record<string, any>): Promise<boolean> {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      logger.warn(`Strategy ${name} not found`);
      return false;
    }

    strategy.setParameters(parameters);

    // Update database settings
    try {
      await StrategySettings.findOneAndUpdate(
        { userId: this.userId, strategyName: name },
        { parameters },
        { upsert: true }
      );
    } catch (error) {
      logger.error(`Error updating strategy parameters for ${name}:`, error);
      return false;
    }

    return true;
  }
}

export default StrategyEngine;
