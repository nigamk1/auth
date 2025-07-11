// AI Teacher System Types

export interface AISession {
  id: string;
  userId: string;
  title: string;
  subject: string;
  status: 'active' | 'completed' | 'paused';
  startedAt: string;
  endedAt?: string;
  totalDuration: number;
  aiPersonality: {
    name: string;
    voice: 'male' | 'female';
    teachingStyle: 'patient' | 'energetic' | 'formal' | 'casual';
  };
  metadata: {
    sessionType: 'lesson' | 'tutoring' | 'practice' | 'review';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  speaker: 'user' | 'ai';
  content: string;
  timestamp: Date;
  audioData?: {
    duration: number;
    audioUrl?: string;
    waveform?: number[];
  };
  metadata?: {
    confidence?: number;
    language?: string;
    emotion?: 'neutral' | 'happy' | 'sad' | 'confused' | 'excited' | 'frustrated';
  };
}

export interface AITranscript {
  id: string;
  sessionId: string;
  messages: AIMessage[];
  summary?: {
    keyTopics: string[];
    mainConcepts: string[];
    questionsAsked: number;
    conceptsExplained: string[];
    difficulty: 'easy' | 'medium' | 'hard';
  };
  messageCount: number;
  conversationDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface WhiteboardElement {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'image' | 'formula';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
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
}

export interface WhiteboardState {
  id: string;
  sessionId: string;
  version: number;
  elements: WhiteboardElement[];
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
  createdAt: string;
  updatedAt: string;
}

// Socket.IO Event Types
export interface SocketEvents {
  // Client to Server
  'join-session': (sessionId: string) => void;
  'leave-session': (sessionId: string) => void;
  'voice-message': (data: {
    sessionId: string;
    content: string;
    audioData?: any;
    metadata?: any;
  }) => void;
  'ai-response': (data: {
    sessionId: string;
    content: string;
    audioData?: any;
  }) => void;
  'whiteboard-update': (data: {
    sessionId: string;
    element: WhiteboardElement;
    action: 'add' | 'update' | 'delete';
  }) => void;
  'whiteboard-clear': (sessionId: string) => void;

  // Server to Client
  'session-joined': (data: {
    session: AISession;
    transcript: AITranscript | null;
    whiteboard: WhiteboardState | null;
  }) => void;
  'new-message': (message: AIMessage) => void;
  'whiteboard-updated': (data: {
    action: 'add' | 'update' | 'delete';
    element: WhiteboardElement;
  }) => void;
  'whiteboard-cleared': () => void;
  'error': (error: { message: string }) => void;
}

// API Request/Response Types
export interface CreateSessionRequest {
  title: string;
  subject: string;
  aiPersonality?: {
    name?: string;
    voice?: 'male' | 'female';
    teachingStyle?: 'patient' | 'energetic' | 'formal' | 'casual';
  };
  metadata?: {
    sessionType?: 'lesson' | 'tutoring' | 'practice' | 'review';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
  };
}

export interface CreateSessionResponse {
  message: string;
  session: {
    id: string;
    title: string;
    subject: string;
    status: string;
    aiPersonality: AISession['aiPersonality'];
    metadata: AISession['metadata'];
    startedAt: string;
  };
}

export interface GetSessionsResponse {
  sessions: AISession[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface UpdateSessionStatusRequest {
  status: 'active' | 'completed' | 'paused';
}

// Speech Recognition Types
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface VoiceSettings {
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

// Whiteboard Drawing Types
export interface DrawingTool {
  type: 'pen' | 'eraser' | 'text' | 'shape' | 'formula';
  size: number;
  color: string;
}

export interface DrawingState {
  isDrawing: boolean;
  tool: DrawingTool;
  elements: WhiteboardElement[];
  history: WhiteboardElement[][];
  historyIndex: number;
}
