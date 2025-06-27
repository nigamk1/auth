import mongoose, { Schema } from 'mongoose';
import { StrategySettings } from '../types/trading';

const strategySettingsSchema = new Schema<StrategySettings>({
  userId: { type: String, required: true, ref: 'User' },
  strategyName: { type: String, required: true },
  isEnabled: { type: Boolean, default: true },
  parameters: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

// Create compound index for efficient lookup
strategySettingsSchema.index({ userId: 1, strategyName: 1 }, { unique: true });

export default mongoose.model<StrategySettings>('StrategySettings', strategySettingsSchema);
