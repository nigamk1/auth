import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITranscript extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  messages: {
    id: string;
    speaker: 'user' | 'ai';
    content: string;
    timestamp: Date;
    audioData?: {
      duration: number; // in seconds
      audioUrl?: string; // for storing audio files
      waveform?: number[]; // for audio visualization
    };
    metadata?: {
      confidence?: number; // speech recognition confidence
      language?: string;
      emotion?: string; // detected emotion in speech
    };
  }[];
  summary?: {
    keyTopics: string[];
    mainConcepts: string[];
    questionsAsked: number;
    conceptsExplained: string[];
    difficulty: 'easy' | 'medium' | 'hard';
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ITranscriptModel extends Model<ITranscript> {
  addMessage(
    sessionId: mongoose.Types.ObjectId,
    speaker: 'user' | 'ai',
    content: string,
    audioData?: any,
    metadata?: any
  ): Promise<ITranscript>;
}

const TranscriptSchema = new Schema<ITranscript>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  messages: [{
    id: {
      type: String,
      required: true
    },
    speaker: {
      type: String,
      enum: ['user', 'ai'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxLength: 5000
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    audioData: {
      duration: {
        type: Number,
        min: 0
      },
      audioUrl: {
        type: String,
        trim: true
      },
      waveform: [{
        type: Number
      }]
    },
    metadata: {
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      language: {
        type: String,
        default: 'en'
      },
      emotion: {
        type: String,
        enum: ['neutral', 'happy', 'sad', 'confused', 'excited', 'frustrated']
      }
    }
  }],
  summary: {
    keyTopics: [{
      type: String,
      trim: true
    }],
    mainConcepts: [{
      type: String,
      trim: true
    }],
    questionsAsked: {
      type: Number,
      default: 0,
      min: 0
    },
    conceptsExplained: [{
      type: String,
      trim: true
    }],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for message count
TranscriptSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Virtual for conversation duration
TranscriptSchema.virtual('conversationDuration').get(function() {
  if (this.messages.length < 2) return 0;
  
  const firstMessage = this.messages[0];
  const lastMessage = this.messages[this.messages.length - 1];
  
  return (lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime()) / 1000;
});

// Index for efficient queries
TranscriptSchema.index({ sessionId: 1 });
TranscriptSchema.index({ 'messages.timestamp': 1 });
TranscriptSchema.index({ 'summary.keyTopics': 1 });

// Static method to add message to transcript
TranscriptSchema.statics.addMessage = async function(
  sessionId: mongoose.Types.ObjectId,
  speaker: 'user' | 'ai',
  content: string,
  audioData?: any,
  metadata?: any
) {
  const messageId = new mongoose.Types.ObjectId().toString();
  
  return this.findOneAndUpdate(
    { sessionId },
    {
      $push: {
        messages: {
          id: messageId,
          speaker,
          content,
          timestamp: new Date(),
          audioData,
          metadata
        }
      }
    },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

export default mongoose.model<ITranscript, ITranscriptModel>('Transcript', TranscriptSchema);
