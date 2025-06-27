import mongoose, { Schema } from 'mongoose';
import { TradeSignal } from '../types/trading';

const tradeSignalSchema = new Schema<TradeSignal>({
  id: { type: String, required: true, unique: true },
  strategyName: { type: String, required: true },
  signalType: { type: String, enum: ['BUY', 'SELL'], required: true },
  instrument: { type: String, required: true },
  entryPrice: { type: Number, required: true },
  targetPrice: { type: Number, required: true },
  stopLossPrice: { type: Number, required: true },
  confidence: { type: Number, required: true, min: 0, max: 100 },
  reasoning: { type: String, required: true },
  indicators: [{
    name: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, required: true }
  }],
  timestamp: { type: Date, required: true, index: true },
  expiryDate: { type: String, required: true },
  strikePrice: { type: Number, required: true },
  optionType: { type: String, enum: ['CE', 'PE'], required: true },
  underlyingValue: { type: Number, required: true }
}, { timestamps: true });

// Create indexes for efficient queries
tradeSignalSchema.index({ timestamp: -1 });
tradeSignalSchema.index({ strategyName: 1 });
tradeSignalSchema.index({ optionType: 1 });
tradeSignalSchema.index({ confidence: 1 });

export default mongoose.model<TradeSignal>('TradeSignal', tradeSignalSchema);
