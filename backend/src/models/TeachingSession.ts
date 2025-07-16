import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for chat log messages
export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  drawingInstructions?: string[];
}

// Interface for drawing data
export interface IDrawingData {
  type: string;
  instructions: string[];
  timestamp: Date;
  metadata?: {
    topic?: string;
    step?: number;
  };
}

// Interface for topic progress
export interface ITopicProgress {
  step: number;
  content: string;
  completed: boolean;
  timestamp: Date;
}

// Interface for session analytics
export interface ISessionAnalytics {
  totalInteractions: number;
  sessionDurationMs: number;
  averageResponseTime?: number;
  topicsDiscussed: string[];
  conceptsLearned: string[];
  strugglingAreas: string[];
}

// Main Teaching Session interface
export interface ITeachingSession extends Document {
  sessionId: string;
  userId: Types.ObjectId;
  
  // Basic session information
  subject?: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  
  // Topic and flow management
  currentTopic?: string;
  currentStep: number;
  topicProgress: ITopicProgress[];
  
  // Chat and conversation data
  chatLog: IChatMessage[];
  lastStudentInput?: string;
  lastAIResponse?: string;
  
  // AI and user states (for session continuity)
  aiState: 'idle' | 'listening' | 'processing' | 'speaking' | 'drawing';
  userState: 'idle' | 'speaking' | 'waiting' | 'typing';
  expectingUserInput: boolean;
  
  // Drawing and visual data
  drawings: IDrawingData[];
  whiteboardState?: {
    elements: any[];
    lastModified: Date;
  };
  
  // Learning progress tracking
  learningGoals: string[];
  completedConcepts: string[];
  strugglingAreas: string[];
  
  // Session analytics and metadata
  analytics: ISessionAnalytics;
  sessionMetadata?: {
    deviceInfo?: string;
    browserInfo?: string;
    startLocation?: string;
  };
  
  // Timestamps
  updatedAt: Date;

  // Virtual properties
  messageCount: number;
  drawingCount: number;
  totalInteractions: number;
  sessionDurationHours: number;
  averageResponseTime?: number;
  durationFormatted: string;

  // Instance methods
  addMessage(role: 'user' | 'assistant', content: string, drawingInstructions?: string[]): Promise<ITeachingSession>;
  addDrawing(type: string, instructions: string[], metadata?: any): Promise<ITeachingSession>;
  updateState(updates: any): Promise<ITeachingSession>;
  endSession(): Promise<ITeachingSession>;
}

// Chat Message Schema
const ChatMessageSchema = new Schema<IChatMessage>({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  drawingInstructions: [{
    type: String,
    maxlength: 1000
  }]
}, { _id: false });

// Drawing Data Schema
const DrawingDataSchema = new Schema<IDrawingData>({
  type: {
    type: String,
    required: true,
    maxlength: 100
  },
  instructions: [{
    type: String,
    required: true,
    maxlength: 1000
  }],
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  metadata: {
    topic: { type: String, maxlength: 200 },
    step: { type: Number, min: 0 }
  }
}, { _id: false });

// Topic Progress Schema
const TopicProgressSchema = new Schema<ITopicProgress>({
  step: {
    type: Number,
    required: true,
    min: 0
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  completed: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, { _id: false });

// Session Analytics Schema
const SessionAnalyticsSchema = new Schema<ISessionAnalytics>({
  totalInteractions: {
    type: Number,
    default: 0,
    min: 0
  },
  sessionDurationMs: {
    type: Number,
    default: 0,
    min: 0
  },
  averageResponseTime: {
    type: Number,
    min: 0
  },
  topicsDiscussed: [{
    type: String,
    maxlength: 200
  }],
  conceptsLearned: [{
    type: String,
    maxlength: 200
  }],
  strugglingAreas: [{
    type: String,
    maxlength: 200
  }]
}, { _id: false });

// Main Teaching Session Schema
const TeachingSessionSchema = new Schema<ITeachingSession>({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    maxlength: 100
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Basic session information
  subject: {
    type: String,
    maxlength: 100,
    default: 'General'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Topic and flow management
  currentTopic: {
    type: String,
    maxlength: 200
  },
  currentStep: {
    type: Number,
    default: 0,
    min: 0
  },
  topicProgress: [TopicProgressSchema],
  
  // Chat and conversation data
  chatLog: [ChatMessageSchema],
  lastStudentInput: {
    type: String,
    maxlength: 5000
  },
  lastAIResponse: {
    type: String,
    maxlength: 10000
  },
  
  // AI and user states
  aiState: {
    type: String,
    enum: ['idle', 'listening', 'processing', 'speaking', 'drawing'],
    default: 'idle'
  },
  userState: {
    type: String,
    enum: ['idle', 'speaking', 'waiting', 'typing'],
    default: 'idle'
  },
  expectingUserInput: {
    type: Boolean,
    default: true
  },
  
  // Drawing and visual data
  drawings: [DrawingDataSchema],
  whiteboardState: {
    elements: [Schema.Types.Mixed],
    lastModified: Date
  },
  
  // Learning progress tracking
  learningGoals: [{
    type: String,
    maxlength: 300
  }],
  completedConcepts: [{
    type: String,
    maxlength: 200
  }],
  strugglingAreas: [{
    type: String,
    maxlength: 200
  }],
  
  // Session analytics
  analytics: {
    type: SessionAnalyticsSchema,
    default: () => ({
      totalInteractions: 0,
      sessionDurationMs: 0,
      topicsDiscussed: [],
      conceptsLearned: [],
      strugglingAreas: []
    })
  },
  
  // Session metadata
  sessionMetadata: {
    deviceInfo: { type: String, maxlength: 200 },
    browserInfo: { type: String, maxlength: 200 },
    startLocation: { type: String, maxlength: 100 }
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false, // We're managing timestamps manually
  collection: 'teachingSessions',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
TeachingSessionSchema.index({ userId: 1, createdAt: -1 });
TeachingSessionSchema.index({ sessionId: 1, userId: 1 });
TeachingSessionSchema.index({ isActive: 1, lastActivity: -1 });
TeachingSessionSchema.index({ 'analytics.totalInteractions': -1 });

// Virtual for session duration in human-readable format
TeachingSessionSchema.virtual('durationFormatted').get(function() {
  const ms = this.analytics.sessionDurationMs;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for session duration in hours
TeachingSessionSchema.virtual('sessionDurationHours').get(function() {
  return this.analytics.sessionDurationMs / (1000 * 60 * 60);
});

// Virtual for total interactions
TeachingSessionSchema.virtual('totalInteractions').get(function() {
  return this.analytics.totalInteractions;
});

// Virtual for average response time
TeachingSessionSchema.virtual('averageResponseTime').get(function() {
  return this.analytics.averageResponseTime;
});

// Virtual for message count
TeachingSessionSchema.virtual('messageCount').get(function() {
  return this.chatLog.length;
});

// Virtual for drawing count
TeachingSessionSchema.virtual('drawingCount').get(function() {
  return this.drawings.length;
});

// Pre-save middleware to update timestamps and analytics
TeachingSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastActivity = new Date();
  
  // Update analytics
  if (this.chatLog) {
    this.analytics.totalInteractions = this.chatLog.filter(msg => msg.role === 'user').length;
  }
  
  // Calculate session duration
  if (this.createdAt) {
    this.analytics.sessionDurationMs = Date.now() - this.createdAt.getTime();
  }
  
  next();
});

// Static method to find active sessions for a user
TeachingSessionSchema.statics.findActiveForUser = function(userId: string) {
  return this.find({ 
    userId: new Types.ObjectId(userId), 
    isActive: true 
  }).sort({ lastActivity: -1 });
};

// Static method to find recent sessions for a user
TeachingSessionSchema.statics.findRecentForUser = function(userId: string, limit = 10) {
  return this.find({ 
    userId: new Types.ObjectId(userId) 
  })
  .sort({ lastActivity: -1 })
  .limit(limit)
  .select('sessionId subject createdAt lastActivity analytics.totalInteractions analytics.sessionDurationMs');
};

// Instance method to add a message to chat log
TeachingSessionSchema.methods.addMessage = function(role: 'user' | 'assistant', content: string, drawingInstructions?: string[]) {
  const message: IChatMessage = {
    role,
    content,
    timestamp: new Date(),
    drawingInstructions
  };
  
  this.chatLog.push(message);
  
  if (role === 'user') {
    this.lastStudentInput = content;
  } else {
    this.lastAIResponse = content;
  }
  
  return this.save();
};

// Instance method to add drawing data
TeachingSessionSchema.methods.addDrawing = function(type: string, instructions: string[], metadata?: any) {
  const drawing: IDrawingData = {
    type,
    instructions,
    timestamp: new Date(),
    metadata
  };
  
  this.drawings.push(drawing);
  return this.save();
};

// Instance method to update session state
TeachingSessionSchema.methods.updateState = function(updates: any) {
  Object.assign(this, updates);
  return this.save();
};

// Instance method to end session
TeachingSessionSchema.methods.endSession = function() {
  this.isActive = false;
  this.aiState = 'idle';
  this.userState = 'idle';
  this.expectingUserInput = false;
  return this.save();
};

// Export the model
export const TeachingSession = mongoose.model<ITeachingSession>('TeachingSession', TeachingSessionSchema);
