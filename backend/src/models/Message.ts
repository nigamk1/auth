import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'user_audio' | 'user_text' | 'ai_response' | 'system';
  content: {
    text?: string;
    audioUrl?: string;
    transcription?: string;
    audioData?: {
      duration: number;
      fileSize: number;
      format: string;
    };
  };
  aiResponse?: {
    spokenText: string;
    audioUrl?: string;
    whiteboardCommands?: any[];
    emotion?: string;
    confidence: number;
  };
  metadata: {
    timestamp: Date;
    language: string;
    processingTime?: number;
    tokens?: {
      input: number;
      output: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['user_audio', 'user_text', 'ai_response', 'system'],
    required: true
  },
  content: {
    text: {
      type: String,
      maxlength: 5000
    },
    audioUrl: {
      type: String
    },
    transcription: {
      type: String
    },
    audioData: {
      duration: Number,
      fileSize: Number,
      format: String
    }
  },
  aiResponse: {
    spokenText: {
      type: String,
      maxlength: 5000
    },
    audioUrl: {
      type: String
    },
    whiteboardCommands: [{
      type: Schema.Types.Mixed
    }],
    emotion: {
      type: String,
      enum: ['neutral', 'encouraging', 'empathetic', 'enthusiastic', 'patient']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  metadata: {
    timestamp: {
      type: Date,
      default: Date.now
    },
    language: {
      type: String,
      required: true
    },
    processingTime: {
      type: Number
    },
    tokens: {
      input: Number,
      output: Number
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
messageSchema.index({ sessionId: 1, createdAt: 1 });
messageSchema.index({ userId: 1, createdAt: -1 });
messageSchema.index({ type: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
