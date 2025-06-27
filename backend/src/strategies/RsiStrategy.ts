/**
 * RSI-based Strategy for Option Trading
 * Identifies overbought/oversold conditions in the Nifty index
 * and suggests option trades based on the analysis
 */
import { Strategy } from './Strategy';
import { NiftyData, OptionData, IndicatorResult, StrategyResult } from '../types/trading';
import { RSI } from 'technicalindicators';
import { logger } from '../utils/logger';

export class RsiStrategy extends Strategy {
  private rsiPeriod: number;
  private overboughtThreshold: number;
  private oversoldThreshold: number;
  private priceHistory: number[] = [];
  private maxHistorySize: number;

  constructor(parameters: Record<string, any> = {}) {
    super(
      'RSI Strategy',
      'Identifies overbought/oversold conditions in the Nifty index using RSI indicator',
      {
        rsiPeriod: 14,
        overboughtThreshold: 70,
        oversoldThreshold: 30,
        signalConfirmationPeriod: 2,
        ...parameters
      }
    );

    this.rsiPeriod = this.parameters.rsiPeriod;
    this.overboughtThreshold = this.parameters.overboughtThreshold;
    this.oversoldThreshold = this.parameters.oversoldThreshold;
    this.maxHistorySize = Math.max(100, this.rsiPeriod * 3); // Keep enough data for calculations
  }

  protected analyze(niftyData: NiftyData): void {
    // Add the latest price to our history
    this.priceHistory.push(niftyData.price);

    // Trim history to max size
    if (this.priceHistory.length > this.maxHistorySize) {
      this.priceHistory = this.priceHistory.slice(-this.maxHistorySize);
    }

    // We need at least rsiPeriod + 1 prices to calculate RSI
    if (this.priceHistory.length <= this.rsiPeriod) {
      logger.debug(`RSI Strategy: Not enough price history (${this.priceHistory.length}/${this.rsiPeriod + 1})`);
      return;
    }

    // Calculate RSI
    const rsiInput = {
      values: this.priceHistory,
      period: this.rsiPeriod
    };
    
    const rsiResults = RSI.calculate(rsiInput);
    if (!rsiResults || rsiResults.length === 0) {
      logger.debug('RSI Strategy: Could not calculate RSI');
      return;
    }

    // Get the latest RSI value
    const currentRsi = rsiResults[rsiResults.length - 1];
    const previousRsi = rsiResults.length > 1 ? rsiResults[rsiResults.length - 2] : currentRsi;

    // Create indicator result
    const rsiIndicator: IndicatorResult = {
      name: 'RSI',
      value: currentRsi,
      timestamp: niftyData.timestamp
    };

    // Determine signal type based on RSI thresholds
    let signalType: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 0;

    // RSI crossed above oversold threshold (going up) - BUY signal
    if (previousRsi < this.oversoldThreshold && currentRsi >= this.oversoldThreshold) {
      signalType = 'BUY';
      // Calculate confidence based on how oversold the market was
      confidence = Math.min(100, Math.round(50 + (this.oversoldThreshold - previousRsi) * 2));
    }
    // RSI crossed below overbought threshold (going down) - SELL signal
    else if (previousRsi > this.overboughtThreshold && currentRsi <= this.overboughtThreshold) {
      signalType = 'SELL';
      // Calculate confidence based on how overbought the market was
      confidence = Math.min(100, Math.round(50 + (previousRsi - this.overboughtThreshold) * 2));
    }
    // Still in oversold territory - potential BUY
    else if (currentRsi < this.oversoldThreshold) {
      signalType = 'BUY';
      // Lower confidence the longer we stay oversold
      confidence = Math.max(30, Math.round(40 - (this.oversoldThreshold - currentRsi)));
    }
    // Still in overbought territory - potential SELL
    else if (currentRsi > this.overboughtThreshold) {
      signalType = 'SELL';
      // Lower confidence the longer we stay overbought
      confidence = Math.max(30, Math.round(40 - (currentRsi - this.overboughtThreshold)));
    }

    // If we have a meaningful signal, emit it
    if (signalType !== 'NEUTRAL' && confidence >= 50) {
      const result: StrategyResult = {
        strategyName: this.name,
        signalType,
        instrument: signalType === 'BUY' ? `NIFTY ${Math.round(niftyData.price / 100) * 100} CE` : `NIFTY ${Math.round(niftyData.price / 100) * 100} PE`,
        confidence,
        indicators: [rsiIndicator],
        timestamp: niftyData.timestamp
      };

      this.emitResult(result);
    }
  }

  protected analyzeOption(optionData: OptionData): void {
    // This strategy primarily uses index data, not option data
    // But we could enhance it to incorporate option IV or OI data
  }

  protected analyzeBatch(niftyData: NiftyData[], optionData: OptionData[]): void {
    // Process historical data to build price history
    if (niftyData.length > 0) {
      // Reset price history
      this.priceHistory = [];
      
      // Sort by timestamp ascending
      const sortedData = [...niftyData].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Add all prices to history
      sortedData.forEach(data => {
        this.priceHistory.push(data.price);
      });
      
      // Trim if needed
      if (this.priceHistory.length > this.maxHistorySize) {
        this.priceHistory = this.priceHistory.slice(-this.maxHistorySize);
      }
      
      // Analyze latest data point
      this.analyze(sortedData[sortedData.length - 1]);
    }
  }
}
