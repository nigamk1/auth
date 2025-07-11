import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  status: 'active' | 'completed' | 'paused';
  startedAt: Date;
  endedAt?: Date;
  totalDuration: number; // in seconds
  aiPersonality: {
    name: string;
    voice: string;
    teachingStyle: 'patient' | 'energetic' | 'formal' | 'casual';
    language?: string;
  };
  metadata: {
    sessionType: 'lesson' | 'tutoring' | 'practice' | 'review';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
    language?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active',
    index: true
  },
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  endedAt: {
    type: Date
  },
  totalDuration: {
    type: Number,
    default: 0,
    min: 0
  },
  aiPersonality: {
    name: {
      type: String,
      required: true,
      default: 'Assistant'
    },
    voice: {
      type: String,
      default: 'female'
    },
    teachingStyle: {
      type: String,
      enum: ['patient', 'energetic', 'formal', 'casual'],
      default: 'patient'
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'hinglish'],
      default: 'en'
    }
  },
  metadata: {
    sessionType: {
      type: String,
      enum: ['lesson', 'tutoring', 'practice', 'review'],
      default: 'lesson'
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    tags: [{
      type: String,
      trim: true
    }],
    language: {
      type: String,
      enum: ['en', 'hi', 'hinglish'],
      default: 'en'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for session duration in human readable format
SessionSchema.virtual('durationFormatted').get(function() {
  const hours = Math.floor(this.totalDuration / 3600);
  const minutes = Math.floor((this.totalDuration % 3600) / 60);
  const seconds = this.totalDuration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
});

// Index for efficient queries
SessionSchema.index({ userId: 1, createdAt: -1 });
SessionSchema.index({ userId: 1, status: 1 });
SessionSchema.index({ 'metadata.sessionType': 1, 'metadata.difficulty': 1 });

export default mongoose.model<ISession>('Session', SessionSchema);
