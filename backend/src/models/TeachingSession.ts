import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeachingSession extends Document {
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  topic: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  qaPairs: IQAPair[];
  userPreferences: {
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    pace?: 'slow' | 'normal' | 'fast';
    examples?: boolean;
  };
  sessionState: {
    totalQuestions: number;
    correctAnswers: number;
    averageResponseTime: number;
    topicsDiscussed: string[];
    currentSubtopic?: string;
    progressLevel: number; // 0-100
  };
  metadata: {
    startedAt: Date;
    lastActiveAt: Date;
    totalDuration: number; // in minutes
    isActive: boolean;
    completionStatus: 'active' | 'completed' | 'paused' | 'abandoned';
  };
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  addQAPair(qaPair: Partial<IQAPair>): IQAPair;
  getRecentQAPairs(count?: number): IQAPair[];
  updateProgress(progressDelta?: number): void;
  pauseSession(): void;
  resumeSession(): void;
  completeSession(): void;
}

export interface ITeachingSessionModel extends Model<ITeachingSession> {
  findActiveByUser(userId: string): Promise<ITeachingSession[]>;
  findByTopicAndLevel(topic: string, level: string): Promise<ITeachingSession[]>;
}

export interface IQAPair {
  id: string;
  question: string;
  answer: string;
  aiResponse: string;
  timestamp: Date;
  subtopic: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  responseTime: number; // in seconds
  accuracy?: number; // 0-1 score if assessable
  whiteboardActions?: Array<{
    type: string;
    content: string;
    position: { x: number; y: number };
    properties?: Record<string, any>;
  }>;
  followUpQuestions?: string[];
}

const QAPairSchema = new Schema<IQAPair>({
  id: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  answer: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  aiResponse: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  subtopic: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  responseTime: {
    type: Number,
    required: true,
    min: 0
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 1
  },
  whiteboardActions: [{
    type: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    },
    properties: {
      type: Schema.Types.Mixed
    }
  }],
  followUpQuestions: [{
    type: String,
    maxlength: 500
  }]
});

const TeachingSessionSchema = new Schema<ITeachingSession>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  currentLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
    required: true
  },
  qaPairs: [QAPairSchema],
  userPreferences: {
    learningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'kinesthetic', 'reading']
    },
    pace: {
      type: String,
      enum: ['slow', 'normal', 'fast'],
      default: 'normal'
    },
    examples: {
      type: Boolean,
      default: true
    }
  },
  sessionState: {
    totalQuestions: {
      type: Number,
      default: 0,
      min: 0
    },
    correctAnswers: {
      type: Number,
      default: 0,
      min: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0,
      min: 0
    },
    topicsDiscussed: [{
      type: String,
      trim: true,
      maxlength: 100
    }],
    currentSubtopic: {
      type: String,
      trim: true,
      maxlength: 200
    },
    progressLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  metadata: {
    startedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    totalDuration: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    completionStatus: {
      type: String,
      enum: ['active', 'completed', 'paused', 'abandoned'],
      default: 'active'
    }
  }
}, {
  timestamps: true,
  collection: 'teachingSessions'
});

// Indexes for better query performance
TeachingSessionSchema.index({ sessionId: 1, userId: 1 });
TeachingSessionSchema.index({ topic: 1, currentLevel: 1 });
TeachingSessionSchema.index({ 'metadata.isActive': 1, 'metadata.lastActiveAt': -1 });
TeachingSessionSchema.index({ userId: 1, 'metadata.lastActiveAt': -1 });

// Middleware to update lastActiveAt and calculate duration
TeachingSessionSchema.pre('save', function(next) {
  if (this.isModified() && this.metadata.isActive) {
    const now = new Date();
    const lastActive = this.metadata.lastActiveAt || this.metadata.startedAt;
    const sessionDuration = Math.round((now.getTime() - lastActive.getTime()) / 60000); // minutes
    
    this.metadata.lastActiveAt = now;
    if (sessionDuration > 0 && sessionDuration < 60) { // Only add reasonable durations
      this.metadata.totalDuration += sessionDuration;
    }
  }
  next();
});

// Instance methods
TeachingSessionSchema.methods.addQAPair = function(qaPair: Partial<IQAPair>) {
  const qaId = new mongoose.Types.ObjectId().toString();
  const newQA: IQAPair = {
    id: qaId,
    question: qaPair.question || '',
    answer: qaPair.answer || '',
    aiResponse: qaPair.aiResponse || '',
    timestamp: new Date(),
    subtopic: qaPair.subtopic || this.topic,
    level: qaPair.level || this.currentLevel,
    responseTime: qaPair.responseTime || 0,
    accuracy: qaPair.accuracy,
    whiteboardActions: qaPair.whiteboardActions,
    followUpQuestions: qaPair.followUpQuestions
  };

  this.qaPairs.push(newQA);
  
  // Keep only last 5 Q&A pairs
  if (this.qaPairs.length > 5) {
    this.qaPairs = this.qaPairs.slice(-5);
  }

  // Update session state
  this.sessionState.totalQuestions += 1;
  if (qaPair.accuracy && qaPair.accuracy > 0.7) {
    this.sessionState.correctAnswers += 1;
  }
  
  // Update average response time
  const totalTime = this.sessionState.averageResponseTime * (this.sessionState.totalQuestions - 1) + (qaPair.responseTime || 0);
  this.sessionState.averageResponseTime = totalTime / this.sessionState.totalQuestions;

  // Add subtopic to discussed topics
  if (qaPair.subtopic && !this.sessionState.topicsDiscussed.includes(qaPair.subtopic)) {
    this.sessionState.topicsDiscussed.push(qaPair.subtopic);
  }

  return newQA;
};

TeachingSessionSchema.methods.getRecentQAPairs = function(count: number = 5): IQAPair[] {
  return this.qaPairs.slice(-count);
};

TeachingSessionSchema.methods.updateProgress = function(progressDelta: number = 10) {
  this.sessionState.progressLevel = Math.min(100, this.sessionState.progressLevel + progressDelta);
};

TeachingSessionSchema.methods.pauseSession = function() {
  this.metadata.isActive = false;
  this.metadata.completionStatus = 'paused';
};

TeachingSessionSchema.methods.resumeSession = function() {
  this.metadata.isActive = true;
  this.metadata.completionStatus = 'active';
  this.metadata.lastActiveAt = new Date();
};

TeachingSessionSchema.methods.completeSession = function() {
  this.metadata.isActive = false;
  this.metadata.completionStatus = 'completed';
  this.sessionState.progressLevel = 100;
};

// Static methods
TeachingSessionSchema.statics.findActiveByUser = function(userId: string) {
  return this.find({
    userId: new mongoose.Types.ObjectId(userId),
    'metadata.isActive': true
  }).sort({ 'metadata.lastActiveAt': -1 });
};

TeachingSessionSchema.statics.findByTopicAndLevel = function(topic: string, level: string) {
  return this.find({
    topic: new RegExp(topic, 'i'),
    currentLevel: level,
    'metadata.isActive': true
  });
};

const TeachingSession = mongoose.model<ITeachingSession, ITeachingSessionModel>('TeachingSession', TeachingSessionSchema);

export default TeachingSession;
