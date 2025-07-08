import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  language: string;
  status: 'active' | 'completed' | 'paused';
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  summary?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  metadata: {
    totalMessages: number;
    totalQuestions: number;
    topicsDiscussed: string[];
    whiteboard: {
      actions: number;
      elements: number;
    };
  };
}

const sessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  language: {
    type: String,
    required: true,
    default: 'en',
    enum: ['en', 'hi', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  },
  summary: {
    type: String,
    maxlength: 1000
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
  metadata: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    topicsDiscussed: [{
      type: String
    }],
    whiteboard: {
      actions: {
        type: Number,
        default: 0
      },
      elements: {
        type: Number,
        default: 0
      }
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ subject: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ language: 1 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);
