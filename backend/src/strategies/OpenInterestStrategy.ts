/**
 * Open Interest Analysis Strategy
 * Analyzes changes in open interest to identify institutional positioning
 */
import { Strategy } from './Strategy';
import { NiftyData, OptionData, IndicatorResult, StrategyResult } from '../types/trading';
import { logger } from '../utils/logger';

export class OpenInterestStrategy extends Strategy {
  private oiChangeThreshold: number;
  private optionDataMap: Map<string, OptionData[]> = new Map();
  private maxHistoryPerOption: number;

  constructor(parameters: Record<string, any> = {}) {
    super(
      'Open Interest Strategy',
      'Identifies significant open interest changes in options to detect institutional positioning',
      {
        oiChangeThreshold: 20, // Percentage change in OI to trigger signal
        lookbackPeriod: 3, // Number of previous data points to compare
        volumeConfirmationThreshold: 1.5, // Volume multiplier for confirmation
        maxHistoryPerOption: 50, // Max history to keep per option
        ...parameters
      }
    );

    this.oiChangeThreshold = this.parameters.oiChangeThreshold;
    this.maxHistoryPerOption = this.parameters.maxHistoryPerOption;
  }

  protected analyze(niftyData: NiftyData): void {
    // This strategy primarily uses option data, not index data
    // But we can use nifty data to calculate ATM strikes, etc.
  }

  protected analyzeOption(optionData: OptionData): void {
    // Create unique key for this option
    const optionKey = `${optionData.symbol}_${optionData.strikePrice}_${optionData.optionType}`;
    
    // Get or initialize history for this option
    if (!this.optionDataMap.has(optionKey)) {
      this.optionDataMap.set(optionKey, []);
    }

    const history = this.optionDataMap.get(optionKey)!;
    
    // Add current data to history
    history.push(optionData);
    
    // Trim history if needed
    if (history.length > this.maxHistoryPerOption) {
      history.splice(0, history.length - this.maxHistoryPerOption);
    }

    // Need at least two data points to detect change
    if (history.length < 2) {
      return;
    }

    // Calculate OI change percentage
    const current = history[history.length - 1];
    const previous = history[history.length - 2];

    if (previous.openInterest === 0) {
      return; // Avoid division by zero
    }

    const oiChangePercent = ((current.openInterest - previous.openInterest) / previous.openInterest) * 100;
    const volumeIncreased = current.volume > previous.volume * this.parameters.volumeConfirmationThreshold;

    // Create indicator result
    const oiIndicator: IndicatorResult = {
      name: 'OI_Change',
      value: oiChangePercent,
      timestamp: current.timestamp
    };

    const volumeIndicator: IndicatorResult = {
      name: 'Volume_Confirmation',
      value: volumeIncreased,
      timestamp: current.timestamp
    };

    // Determine signal type based on OI change
    let signalType: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 0;

    // For CE (Call) options:
    // - If OI increases significantly + price rises = Bullish (buy)
    // - If OI increases significantly + price falls = Bearish (sell)
    
    // For PE (Put) options:
    // - If OI increases significantly + price rises = Bearish (sell)
    // - If OI increases significantly + price falls = Bullish (buy)

    if (Math.abs(oiChangePercent) > this.oiChangeThreshold) {
      const priceRising = current.lastPrice > previous.lastPrice;
      
      if (optionData.optionType === 'CE') {
        // Call option analysis
        if (oiChangePercent > 0) { // OI increasing
          if (priceRising) {
            signalType = 'BUY';  // Bullish - more calls being bought
            confidence = Math.min(95, Math.round(60 + Math.abs(oiChangePercent) / 2));
          } else {
            signalType = 'SELL'; // Bearish - more calls being written/sold
            confidence = Math.min(90, Math.round(55 + Math.abs(oiChangePercent) / 2));
          }
        } else { // OI decreasing
          if (priceRising) {
            signalType = 'SELL'; // Bearish - call writers covering positions
            confidence = Math.min(85, Math.round(50 + Math.abs(oiChangePercent) / 2));
          } else {
            signalType = 'BUY';  // Bullish - call buyers taking profits
            confidence = Math.min(80, Math.round(45 + Math.abs(oiChangePercent) / 2));
          }
        }
      } else { // Put option analysis
        if (oiChangePercent > 0) { // OI increasing
          if (priceRising) {
            signalType = 'SELL'; // Bearish - more puts being bought
            confidence = Math.min(95, Math.round(60 + Math.abs(oiChangePercent) / 2));
          } else {
            signalType = 'BUY';  // Bullish - more puts being written/sold
            confidence = Math.min(90, Math.round(55 + Math.abs(oiChangePercent) / 2));
          }
        } else { // OI decreasing
          if (priceRising) {
            signalType = 'BUY';  // Bullish - put writers covering positions
            confidence = Math.min(85, Math.round(50 + Math.abs(oiChangePercent) / 2));
          } else {
            signalType = 'SELL'; // Bearish - put buyers taking profits
            confidence = Math.min(80, Math.round(45 + Math.abs(oiChangePercent) / 2));
          }
        }
      }
      
      // Adjust confidence based on volume confirmation
      if (volumeIncreased) {
        confidence = Math.min(100, confidence + 10);
      } else {
        confidence = Math.max(30, confidence - 10);
      }
    }

    // If we have a meaningful signal with good confidence, emit it
    if (signalType !== 'NEUTRAL' && confidence >= 70) {
      const result: StrategyResult = {
        strategyName: this.name,
        signalType,
        instrument: `${optionData.symbol}`,
        confidence,
        indicators: [oiIndicator, volumeIndicator],
        timestamp: optionData.timestamp
      };

      this.emitResult(result);
    }
  }

  protected analyzeBatch(niftyData: NiftyData[], optionData: OptionData[]): void {
    // Process historical option data
    if (optionData.length > 0) {
      // Clear existing data
      this.optionDataMap.clear();
      
      // Group option data by symbol
      const optionsByKey: Record<string, OptionData[]> = {};
      
      optionData.forEach(data => {
        const key = `${data.symbol}_${data.strikePrice}_${data.optionType}`;
        if (!optionsByKey[key]) {
          optionsByKey[key] = [];
        }
        optionsByKey[key].push(data);
      });
      
      // Sort each group by timestamp and store in map
      Object.entries(optionsByKey).forEach(([key, dataArray]) => {
        const sortedData = dataArray.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        // Keep only the most recent data points
        const trimmedData = sortedData.slice(-this.maxHistoryPerOption);
        this.optionDataMap.set(key, trimmedData);
        
        // Analyze the most recent data point if we have history
        if (trimmedData.length >= 2) {
          this.analyzeOption(trimmedData[trimmedData.length - 1]);
        }
      });
    }
  }
}
