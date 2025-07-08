import mongoose, { Schema, Document } from 'mongoose';

export interface IWhiteboardState extends Document {
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  elements: any[];
  version: number;
  lastModified: Date;
  metadata: {
    totalElements: number;
    canvasSize: {
      width: number;
      height: number;
    };
    backgroundColor: string;
  };
}

const whiteboardStateSchema = new Schema<IWhiteboardState>({
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
  elements: [{
    type: Schema.Types.Mixed
  }],
  version: {
    type: Number,
    default: 1
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  metadata: {
    totalElements: {
      type: Number,
      default: 0
    },
    canvasSize: {
      width: {
        type: Number,
        default: 1920
      },
      height: {
        type: Number,
        default: 1080
      }
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
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
whiteboardStateSchema.index({ sessionId: 1 }, { unique: true });
whiteboardStateSchema.index({ userId: 1, lastModified: -1 });

export const WhiteboardState = mongoose.model<IWhiteboardState>('WhiteboardState', whiteboardStateSchema);
