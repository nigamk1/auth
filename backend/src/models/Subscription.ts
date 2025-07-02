import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: 'free' | 'premium' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  usage: {
    questionsThisMonth: number;
    videosThisMonth: number;
    tokensUsed: number;
    lastResetDate: Date;
  };
  limits: {
    questionsPerMonth: number;
    videosPerMonth: number;
    maxTokensPerQuestion: number;
    maxVideoDuration: number;
    canShareVideos: boolean;
    canDownloadVideos: boolean;
    prioritySupport: boolean;
  };
  billing: {
    amount: number;
    currency: string;
    interval: 'month' | 'year';
    nextBillingDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  plan: {
    type: String,
    enum: ['free', 'premium', 'pro', 'enterprise'],
    default: 'free',
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'suspended'],
    default: 'active',
    index: true
  },
  stripeCustomerId: {
    type: String,
    sparse: true
  },
  stripeSubscriptionId: {
    type: String,
    sparse: true
  },
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  usage: {
    questionsThisMonth: {
      type: Number,
      default: 0
    },
    videosThisMonth: {
      type: Number,
      default: 0
    },
    tokensUsed: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  limits: {
    questionsPerMonth: {
      type: Number,
      required: true
    },
    videosPerMonth: {
      type: Number,
      required: true
    },
    maxTokensPerQuestion: {
      type: Number,
      required: true
    },
    maxVideoDuration: {
      type: Number,
      required: true
    },
    canShareVideos: {
      type: Boolean,
      default: false
    },
    canDownloadVideos: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    }
  },
  billing: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    interval: {
      type: String,
      enum: ['month', 'year'],
      required: true
    },
    nextBillingDate: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
subscriptionSchema.index({ plan: 1, status: 1 });

// Static method to get default limits based on plan
subscriptionSchema.statics.getDefaultLimits = function(plan: string) {
  const limits = {
    free: {
      questionsPerMonth: 10,
      videosPerMonth: 3,
      maxTokensPerQuestion: 1000,
      maxVideoDuration: 120, // 2 minutes
      canShareVideos: false,
      canDownloadVideos: false,
      prioritySupport: false
    },
    premium: {
      questionsPerMonth: 100,
      videosPerMonth: 25,
      maxTokensPerQuestion: 2000,
      maxVideoDuration: 300, // 5 minutes
      canShareVideos: true,
      canDownloadVideos: true,
      prioritySupport: false
    },
    pro: {
      questionsPerMonth: 500,
      videosPerMonth: 100,
      maxTokensPerQuestion: 4000,
      maxVideoDuration: 600, // 10 minutes
      canShareVideos: true,
      canDownloadVideos: true,
      prioritySupport: true
    },
    enterprise: {
      questionsPerMonth: -1, // unlimited
      videosPerMonth: -1, // unlimited
      maxTokensPerQuestion: 8000,
      maxVideoDuration: 1200, // 20 minutes
      canShareVideos: true,
      canDownloadVideos: true,
      prioritySupport: true
    }
  };
  
  return limits[plan as keyof typeof limits] || limits.free;
};

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
