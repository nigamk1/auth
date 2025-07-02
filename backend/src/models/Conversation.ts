import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  language: string;
  questions: mongoose.Types.ObjectId[];
  isActive: boolean;
  lastActivity: Date;
  metadata: {
    totalQuestions: number;
    totalVideos: number;
    averageRating?: number;
    totalCost?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  language: {
    type: String,
    default: 'en',
    index: true
  },
  questions: [{
    type: Schema.Types.ObjectId,
    ref: 'Question'
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    totalQuestions: {
      type: Number,
      default: 0
    },
    totalVideos: {
      type: Number,
      default: 0
    },
    averageRating: Number,
    totalCost: Number
  }
}, {
  timestamps: true
});

// Indexes for performance
conversationSchema.index({ userId: 1, isActive: 1, lastActivity: -1 });
conversationSchema.index({ subject: 1, language: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
