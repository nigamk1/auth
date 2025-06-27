import mongoose, { Schema } from 'mongoose';
import { NiftyData } from '../types/trading';

const niftyDataSchema = new Schema<NiftyData>({
  symbol: { type: String, required: true },
  price: { type: Number, required: true },
  change: { type: Number, required: true },
  changePercent: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  open: { type: Number, required: true },
  close: { type: Number, required: true },
  volume: { type: Number, required: true },
  timestamp: { type: Date, required: true, index: true }
}, { timestamps: true });

// Create a time-based index for efficient queries
niftyDataSchema.index({ timestamp: -1 });

export default mongoose.model<NiftyData>('NiftyData', niftyDataSchema);
