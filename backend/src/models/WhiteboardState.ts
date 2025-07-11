import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IWhiteboardState extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  version: number; // for optimistic locking and history
  elements: {
    id: string;
    type: 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'image' | 'formula';
    x: number;
    y: number;
    width?: number;
    height?: number;
    points?: number[]; // for lines and complex shapes
    properties: {
      stroke?: string;
      fill?: string;
      strokeWidth?: number;
      fontSize?: number;
      fontFamily?: string;
      text?: string;
      formula?: string; // LaTeX formula
      imageUrl?: string;
      opacity?: number;
    };
    zIndex: number;
    timestamp: Date;
    author: 'user' | 'ai';
  }[];
  canvasState: {
    backgroundColor: string;
    gridEnabled: boolean;
    zoom: number;
    viewBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  snapshots: {
    id: string;
    timestamp: Date;
    description?: string;
    thumbnailUrl?: string;
    elementCount: number;
  }[];
  metadata: {
    totalElements: number;
    lastModifiedBy: 'user' | 'ai';
    collaborationMode: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface IWhiteboardStateModel extends Model<IWhiteboardState> {
  addElement(
    sessionId: mongoose.Types.ObjectId,
    element: any,
    author: 'user' | 'ai'
  ): Promise<IWhiteboardState>;
  createSnapshot(
    sessionId: mongoose.Types.ObjectId,
    description?: string
  ): Promise<IWhiteboardState | null>;
}

const WhiteboardStateSchema = new Schema<IWhiteboardState>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    unique: true
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  elements: [{
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['line', 'rectangle', 'circle', 'arrow', 'text', 'image', 'formula'],
      required: true
    },
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    points: [{
      type: Number
    }],
    properties: {
      stroke: {
        type: String,
        default: '#000000'
      },
      fill: {
        type: String,
        default: 'transparent'
      },
      strokeWidth: {
        type: Number,
        default: 2,
        min: 1
      },
      fontSize: {
        type: Number,
        default: 16,
        min: 8
      },
      fontFamily: {
        type: String,
        default: 'Arial'
      },
      text: {
        type: String,
        maxLength: 1000
      },
      formula: {
        type: String,
        maxLength: 500
      },
      imageUrl: {
        type: String,
        trim: true
      },
      opacity: {
        type: Number,
        default: 1,
        min: 0,
        max: 1
      }
    },
    zIndex: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    author: {
      type: String,
      enum: ['user', 'ai'],
      required: true
    }
  }],
  canvasState: {
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    gridEnabled: {
      type: Boolean,
      default: true
    },
    zoom: {
      type: Number,
      default: 1,
      min: 0.1,
      max: 5
    },
    viewBox: {
      x: {
        type: Number,
        default: 0
      },
      y: {
        type: Number,
        default: 0
      },
      width: {
        type: Number,
        default: 1200
      },
      height: {
        type: Number,
        default: 800
      }
    }
  },
  snapshots: [{
    id: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      maxLength: 200
    },
    thumbnailUrl: {
      type: String,
      trim: true
    },
    elementCount: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  metadata: {
    totalElements: {
      type: Number,
      default: 0,
      min: 0
    },
    lastModifiedBy: {
      type: String,
      enum: ['user', 'ai'],
      default: 'user'
    },
    collaborationMode: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for latest snapshot
WhiteboardStateSchema.virtual('latestSnapshot').get(function() {
  if (this.snapshots.length === 0) return null;
  return this.snapshots[this.snapshots.length - 1];
});

// Middleware to update metadata before saving
WhiteboardStateSchema.pre('save', function(next) {
  this.metadata.totalElements = this.elements.length;
  this.version += 1;
  next();
});

// Index for efficient queries (sessionId already has unique index)
WhiteboardStateSchema.index({ version: 1 });
WhiteboardStateSchema.index({ 'elements.timestamp': 1 });

// Static method to add element
WhiteboardStateSchema.statics.addElement = async function(
  sessionId: mongoose.Types.ObjectId,
  element: any,
  author: 'user' | 'ai'
) {
  const elementWithMeta = {
    ...element,
    id: element.id || new mongoose.Types.ObjectId().toString(),
    timestamp: new Date(),
    author,
    zIndex: element.zIndex || 0
  };

  return this.findOneAndUpdate(
    { sessionId },
    {
      $push: { elements: elementWithMeta },
      $set: { 'metadata.lastModifiedBy': author }
    },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

// Static method to create snapshot
WhiteboardStateSchema.statics.createSnapshot = async function(
  sessionId: mongoose.Types.ObjectId,
  description?: string
) {
  const snapshot = {
    id: new mongoose.Types.ObjectId().toString(),
    timestamp: new Date(),
    description,
    elementCount: 0 // Will be updated by the pre-save middleware
  };

  const whiteboard = await this.findOne({ sessionId });
  if (whiteboard) {
    snapshot.elementCount = whiteboard.elements.length;
  }

  return this.findOneAndUpdate(
    { sessionId },
    { $push: { snapshots: snapshot } },
    { new: true }
  );
};

export default mongoose.model<IWhiteboardState, IWhiteboardStateModel>('WhiteboardState', WhiteboardStateSchema);
