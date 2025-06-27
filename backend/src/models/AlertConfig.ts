import mongoose, { Schema } from 'mongoose';
import { AlertConfig } from '../types/trading';

const alertConfigSchema = new Schema<AlertConfig>({
  userId: { type: String, required: true, ref: 'User' },
  telegramEnabled: { type: Boolean, default: false },
  telegramChatId: { type: String },
  whatsappEnabled: { type: Boolean, default: false },
  whatsappNumber: { type: String },
  emailEnabled: { type: Boolean, default: true },
  emailAddress: { type: String },
  minConfidence: { type: Number, default: 70, min: 0, max: 100 },
  strategyFilters: [{ type: String }],
  optionTypeFilters: [{ type: String, enum: ['CE', 'PE'] }]
}, { timestamps: true });

// Create index for efficient lookup by userId
alertConfigSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model<AlertConfig>('AlertConfig', alertConfigSchema);
