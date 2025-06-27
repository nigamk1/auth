import mongoose, { Schema } from 'mongoose';
import { OptionData } from '../types/trading';

const optionDataSchema = new Schema<OptionData>({
  symbol: { type: String, required: true },
  strikePrice: { type: Number, required: true },
  expiryDate: { type: String, required: true },
  optionType: { type: String, enum: ['CE', 'PE'], required: true },
  lastPrice: { type: Number, required: true },
  change: { type: Number, required: true },
  changePercent: { type: Number, required: true },
  volume: { type: Number, required: true },
  openInterest: { type: Number, required: true },
  openInterestChange: { type: Number, required: true },
  impliedVolatility: { type: Number, required: true },
  bidPrice: { type: Number, required: true },
  askPrice: { type: Number, required: true },
  underlyingValue: { type: Number, required: true },
  timestamp: { type: Date, required: true, index: true }
}, { timestamps: true });

// Create compound indexes for efficient queries
optionDataSchema.index({ symbol: 1, strikePrice: 1, expiryDate: 1, optionType: 1 });
optionDataSchema.index({ timestamp: -1 });

export default mongoose.model<OptionData>('OptionData', optionDataSchema);
