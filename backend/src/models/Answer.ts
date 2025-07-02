import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswer extends Document {
  questionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'video';
  script?: string;
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  metadata: {
    tokens?: number;
    processingTime?: number;
    videoDuration?: number;
    videoSize?: number;
    voiceProvider?: 'google' | 'elevenlabs' | 'azure';
    voiceId?: string;
    renderingTime?: number;
    cost?: number;
  };
  status: 'generating' | 'completed' | 'failed';
  quality: {
    accuracy: number;
    clarity: number;
    completeness: number;
    userRating?: number;
    userFeedback?: string;
  };
  isShared: boolean;
  shareUrl?: string;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<IAnswer>({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 20000
  },
  type: {
    type: String,
    enum: ['text', 'video'],
    required: true
  },
  script: {
    type: String,
    maxlength: 50000
  },
  videoUrl: {
    type: String,
    sparse: true
  },
  audioUrl: {
    type: String,
    sparse: true
  },
  thumbnailUrl: {
    type: String,
    sparse: true
  },
  metadata: {
    tokens: Number,
    processingTime: Number,
    videoDuration: Number,
    videoSize: Number,
    voiceProvider: {
      type: String,
      enum: ['google', 'elevenlabs', 'azure']
    },
    voiceId: String,
    renderingTime: Number,
    cost: Number
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating',
    index: true
  },
  quality: {
    accuracy: {
      type: Number,
      min: 0,
      max: 10,
      default: 8
    },
    clarity: {
      type: Number,
      min: 0,
      max: 10,
      default: 8
    },
    completeness: {
      type: Number,
      min: 0,
      max: 10,
      default: 8
    },
    userRating: {
      type: Number,
      min: 1,
      max: 5
    },
    userFeedback: {
      type: String,
      maxlength: 1000
    }
  },
  isShared: {
    type: Boolean,
    default: false,
    index: true
  },
  shareUrl: {
    type: String,
    sparse: true
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
answerSchema.index({ questionId: 1, type: 1 });
answerSchema.index({ userId: 1, createdAt: -1 });
answerSchema.index({ status: 1, createdAt: 1 });
answerSchema.index({ isShared: 1, 'quality.userRating': -1 });

// Compound index for user's answer history
answerSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const Answer = mongoose.model<IAnswer>('Answer', answerSchema);
