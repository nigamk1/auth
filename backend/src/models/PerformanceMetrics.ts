import mongoose, { Schema } from 'mongoose';
import { PerformanceMetrics } from '../types/trading';

const performanceMetricsSchema = new Schema<PerformanceMetrics>({
  strategyName: { type: String, required: true },
  totalSignals: { type: Number, default: 0 },
  successfulSignals: { type: Number, default: 0 },
  failedSignals: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 },
  averageProfit: { type: Number, default: 0 },
  averageLoss: { type: Number, default: 0 },
  profitFactor: { type: Number, default: 0 },
  period: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  }
}, { timestamps: true });

// Create index for efficient lookup
performanceMetricsSchema.index({ strategyName: 1, 'period.start': 1, 'period.end': 1 });

export default mongoose.model<PerformanceMetrics>('PerformanceMetrics', performanceMetricsSchema);
