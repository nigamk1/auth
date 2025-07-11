import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  userId?: string;
  userName?: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    aiModel?: string;
    processingTime?: number;
    sentiment?: 'positive' | 'negative' | 'neutral';
    language?: 'en' | 'hi' | 'hinglish';
    whiteboardActions?: any[];
    followUpQuestions?: string[];
  };
}

export interface IWhiteboardSnapshot {
  elements: any[];
  canvasState: {
    zoom: number;
    viewBox: { x: number; y: number; width: number; height: number };
    backgroundColor: string;
  };
  timestamp: Date;
  createdBy: string;
  version: number;
}

export interface ISessionMemory extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  // Chat history
  chatLog: IChatMessage[];
  
  // Whiteboard snapshots
  whiteboardSnapshots: IWhiteboardSnapshot[];
  currentWhiteboardState: any;
  
  // Session summary
  summary: {
    totalMessages: number;
    totalWhiteboardActions: number;
    mainTopics: string[];
    keyLearnings: string[];
    questionsAsked: number;
    questionsAnswered: number;
    averageResponseTime: number;
    sessionRating?: number;
    feedback?: string;
  };
  
  // Session analytics
  analytics: {
    userEngagement: {
      messageCount: number;
      whiteboardInteractions: number;
      timeSpentActive: number; // in seconds
      lastActivity: Date;
    };
    aiPerformance: {
      averageConfidence: number;
      responseAccuracy?: number;
      helpfulnessRating?: number;
    };
    learningProgress: {
      conceptsCovered: string[];
      masteryLevel: 'beginner' | 'intermediate' | 'advanced';
      improvementAreas: string[];
    };
  };
  
  // Metadata
  metadata: {
    sessionDuration: number; // in seconds
    deviceInfo?: string;
    browserInfo?: string;
    networkQuality?: 'good' | 'fair' | 'poor';
    errorCount: number;
    reconnections: number;
  };
  
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  addChatMessage(message: IChatMessage): Promise<ISessionMemory>;
  saveWhiteboardSnapshot(snapshot: Omit<IWhiteboardSnapshot, 'timestamp' | 'version'>): Promise<ISessionMemory>;
  updateSessionSummary(updates: Partial<ISessionMemory['summary']>): Promise<ISessionMemory>;
  getSessionHighlights(): any;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['user', 'ai', 'system'], 
    required: true 
  },
  content: { 
    type: String, 
    required: true,
    maxLength: 10000 
  },
  userId: { type: String },
  userName: { type: String },
  timestamp: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  metadata: {
    confidence: { type: Number, min: 0, max: 1 },
    aiModel: { type: String },
    processingTime: { type: Number },
    sentiment: { 
      type: String, 
      enum: ['positive', 'negative', 'neutral'] 
    }
  }
}, { _id: false });

const WhiteboardSnapshotSchema = new Schema<IWhiteboardSnapshot>({
  elements: [{ type: Schema.Types.Mixed }],
  canvasState: {
    zoom: { type: Number, default: 1 },
    viewBox: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      width: { type: Number, default: 800 },
      height: { type: Number, default: 600 }
    },
    backgroundColor: { type: String, default: '#ffffff' }
  },
  timestamp: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  createdBy: { type: String, required: true },
  version: { type: Number, required: true, default: 1 }
}, { _id: false });

const SessionMemorySchema = new Schema<ISessionMemory>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  chatLog: [ChatMessageSchema],
  
  whiteboardSnapshots: [WhiteboardSnapshotSchema],
  currentWhiteboardState: { type: Schema.Types.Mixed },
  
  summary: {
    totalMessages: { type: Number, default: 0 },
    totalWhiteboardActions: { type: Number, default: 0 },
    mainTopics: [{ type: String }],
    keyLearnings: [{ type: String }],
    questionsAsked: { type: Number, default: 0 },
    questionsAnswered: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    sessionRating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, maxLength: 1000 }
  },
  
  analytics: {
    userEngagement: {
      messageCount: { type: Number, default: 0 },
      whiteboardInteractions: { type: Number, default: 0 },
      timeSpentActive: { type: Number, default: 0 },
      lastActivity: { type: Date, default: Date.now }
    },
    aiPerformance: {
      averageConfidence: { type: Number, default: 0 },
      responseAccuracy: { type: Number, min: 0, max: 1 },
      helpfulnessRating: { type: Number, min: 1, max: 5 }
    },
    learningProgress: {
      conceptsCovered: [{ type: String }],
      masteryLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
      },
      improvementAreas: [{ type: String }]
    }
  },
  
  metadata: {
    sessionDuration: { type: Number, default: 0 },
    deviceInfo: { type: String },
    browserInfo: { type: String },
    networkQuality: {
      type: String,
      enum: ['good', 'fair', 'poor'],
      default: 'good'
    },
    errorCount: { type: Number, default: 0 },
    reconnections: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  collection: 'sessionmemories'
});

// Indexes for efficient querying
SessionMemorySchema.index({ userId: 1, createdAt: -1 });
SessionMemorySchema.index({ sessionId: 1 });
SessionMemorySchema.index({ 'chatLog.timestamp': -1 });
SessionMemorySchema.index({ 'summary.sessionRating': -1 });

// Methods
SessionMemorySchema.methods.addChatMessage = function(message: IChatMessage) {
  this.chatLog.push(message);
  this.summary.totalMessages = this.chatLog.length;
  this.analytics.userEngagement.messageCount = this.chatLog.filter((m: IChatMessage) => m.type === 'user').length;
  this.analytics.userEngagement.lastActivity = new Date();
  
  if (message.type === 'user' && message.content.includes('?')) {
    this.summary.questionsAsked++;
  }
  if (message.type === 'ai') {
    this.summary.questionsAnswered++;
  }
  
  return this.save();
};

SessionMemorySchema.methods.saveWhiteboardSnapshot = function(snapshot: Omit<IWhiteboardSnapshot, 'timestamp' | 'version'>) {
  const newSnapshot: IWhiteboardSnapshot = {
    ...snapshot,
    timestamp: new Date(),
    version: this.whiteboardSnapshots.length + 1
  };
  
  this.whiteboardSnapshots.push(newSnapshot);
  this.summary.totalWhiteboardActions++;
  this.analytics.userEngagement.whiteboardInteractions++;
  this.analytics.userEngagement.lastActivity = new Date();
  
  return this.save();
};

SessionMemorySchema.methods.updateSessionSummary = function(updates: Partial<ISessionMemory['summary']>) {
  Object.assign(this.summary, updates);
  return this.save();
};

SessionMemorySchema.methods.getSessionHighlights = function() {
  return {
    totalDuration: this.metadata.sessionDuration,
    messageCount: this.summary.totalMessages,
    whiteboardActions: this.summary.totalWhiteboardActions,
    topicsDiscussed: this.summary.mainTopics,
    rating: this.summary.sessionRating,
    keyMoments: this.chatLog
      .filter((msg: IChatMessage) => msg.type === 'ai' && msg.metadata?.confidence && msg.metadata.confidence > 0.9)
      .slice(0, 3)
      .map((msg: IChatMessage) => ({
        content: msg.content.substring(0, 100) + '...',
        timestamp: msg.timestamp,
        confidence: msg.metadata?.confidence
      }))
  };
};

export default mongoose.model<ISessionMemory>('SessionMemory', SessionMemorySchema);
