import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'voice' | 'image';
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  imageUrl?: string;
  audioUrl?: string;
  transcription?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: {
    originalFileName?: string;
    fileSize?: number;
    mimeType?: string;
    processingTime?: number;
    confidence?: number;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  type: {
    type: String,
    enum: ['text', 'voice', 'image'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  language: {
    type: String,
    default: 'en',
    index: true
  },
  imageUrl: {
    type: String,
    sparse: true
  },
  audioUrl: {
    type: String,
    sparse: true
  },
  transcription: {
    type: String,
    maxlength: 10000
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  metadata: {
    originalFileName: String,
    fileSize: Number,
    mimeType: String,
    processingTime: Number,
    confidence: Number
  },
  tags: [{
    type: String,
    maxlength: 50
  }]
}, {
  timestamps: true
});

// Indexes for performance
questionSchema.index({ userId: 1, createdAt: -1 });
questionSchema.index({ subject: 1, difficulty: 1 });
questionSchema.index({ status: 1, createdAt: 1 });
questionSchema.index({ tags: 1 });

// Text search index
questionSchema.index({
  content: 'text',
  transcription: 'text',
  subject: 'text',
  tags: 'text'
});

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
