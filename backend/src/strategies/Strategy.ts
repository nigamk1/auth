/**
 * Base Strategy Class for Option Trading Strategies
 */
import { EventEmitter } from 'events';
import { NiftyData, OptionData, IndicatorResult, StrategyResult } from '../types/trading';
import { logger } from '../utils/logger';

export abstract class Strategy extends EventEmitter {
  protected name: string;
  protected description: string;
  protected parameters: Record<string, any>;
  protected lastResult: StrategyResult | null = null;
  protected enabled: boolean = true;

  constructor(name: string, description: string, parameters: Record<string, any> = {}) {
    super();
    this.name = name;
    this.description = description;
    this.parameters = parameters;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getParameters(): Record<string, any> {
    return { ...this.parameters };
  }

  public setParameters(parameters: Record<string, any>): void {
    this.parameters = { ...this.parameters, ...parameters };
    logger.debug(`Strategy ${this.name} parameters updated:`, parameters);
  }

  public enable(): void {
    this.enabled = true;
    logger.info(`Strategy ${this.name} enabled`);
  }

  public disable(): void {
    this.enabled = false;
    logger.info(`Strategy ${this.name} disabled`);
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getLastResult(): StrategyResult | null {
    return this.lastResult;
  }

  /**
   * Process new Nifty data through the strategy
   * @param niftyData Latest Nifty index data
   */
  public processNiftyData(niftyData: NiftyData): void {
    if (!this.enabled) return;
    
    // Implementation in specific strategy classes
    this.analyze(niftyData);
  }

  /**
   * Process new Option data through the strategy
   * @param optionData Latest Option data
   */
  public processOptionData(optionData: OptionData): void {
    if (!this.enabled) return;
    
    // Implementation in specific strategy classes
    this.analyzeOption(optionData);
  }

  /**
   * Process batch data (for historical analysis or initial load)
   * @param niftyData Array of historical Nifty data
   * @param optionData Array of historical Option data
   */
  public processBatch(niftyData: NiftyData[], optionData: OptionData[]): void {
    if (!this.enabled) return;
    
    // Implementation in specific strategy classes
    this.analyzeBatch(niftyData, optionData);
  }

  /**
   * Analyze the market data and produce a strategy result
   * This method should be implemented in each specific strategy
   * @param niftyData Latest Nifty index data
   */
  protected abstract analyze(niftyData: NiftyData): void;

  /**
   * Analyze option data
   * This method should be implemented in strategies that use option data
   * @param optionData Latest Option data
   */
  protected abstract analyzeOption(optionData: OptionData): void;

  /**
   * Analyze batch data
   * @param niftyData Array of historical Nifty data
   * @param optionData Array of historical Option data
   */
  protected abstract analyzeBatch(niftyData: NiftyData[], optionData: OptionData[]): void;

  /**
   * Emit a strategy result when analysis is complete
   * @param result The strategy analysis result
   */
  protected emitResult(result: StrategyResult): void {
    this.lastResult = result;
    this.emit('result', result);
    logger.debug(`Strategy ${this.name} emitted result:`, result);
  }
}
