import { Document } from 'mongoose';

// User interfaces
export interface IUser extends Document {
  _id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: string[];
  
  // OAuth fields
  googleId?: string;
  githubId?: string;
  
  // Profile fields
  bio?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  
  // System fields
  role: 'user' | 'admin';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
}

// Auth request interfaces
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
}

// JWT Payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
    isEmailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

// Request with user (for authenticated routes)
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
}

// OAuth profile interfaces
export interface GoogleProfile {
  id: string;
  emails: Array<{ value: string; verified: boolean }>;
  name: { givenName: string; familyName: string };
  photos?: Array<{ value: string }>;
}

export interface GitHubProfile {
  id: string;
  username: string;
  emails?: Array<{ value: string; primary: boolean; verified: boolean }>;
  name?: { givenName: string; familyName: string };
  photos?: Array<{ value: string }>;
}

// AI Teacher Platform Types
export interface VoiceToTextRequest {
  audioFile: Buffer;
  language?: string;
  format?: string;
}

export interface TextToVoiceRequest {
  text: string;
  language?: string;
  voice?: string;
  emotion?: string;
}

export interface AITeacherRequest {
  message: string;
  context: {
    subject: string;
    language: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    sessionHistory?: string[];
  };
  whiteboardState?: any[];
}

export interface AITeacherResponse {
  spokenText: string;
  audioUrl?: string;
  whiteboardCommands?: WhiteboardCommand[];
  emotion: string;
  confidence: number;
  metadata: {
    tokens: {
      input: number;
      output: number;
    };
    processingTime: number;
  };
}

export interface WhiteboardCommand {
  type: 'draw' | 'text' | 'shape' | 'equation' | 'diagram' | 'clear' | 'highlight';
  action: 'add' | 'update' | 'delete' | 'move';
  element: {
    id: string;
    type: string;
    position: { x: number; y: number };
    properties: any;
    content?: string;
  };
}

export interface SessionRequest {
  title: string;
  subject: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface SessionResponse {
  id: string;
  title: string;
  subject: string;
  language: string;
  status: string;
  startTime: Date;
  duration: number;
  metadata: any;
}

export interface MessageRequest {
  sessionId: string;
  type: 'user_audio' | 'user_text';
  content: {
    text?: string;
    audioFile?: Buffer;
  };
}

export interface RealtimeMessage {
  type: 'ai_response' | 'whiteboard_update' | 'session_update' | 'error';
  data: any;
  timestamp: Date;
}

// WebSocket Types
export interface SocketUser {
  userId: string;
  sessionId?: string;
  socketId: string;
}

export interface VoiceProcessingOptions {
  language: string;
  enhanceAudio: boolean;
  removeSilence: boolean;
  normalizeVolume: boolean;
}

export interface TTSOptions {
  voice: 'male' | 'female';
  speed: number;
  pitch: number;
  emotion: 'neutral' | 'encouraging' | 'empathetic' | 'enthusiastic' | 'patient';
}

// Learning Analytics
export interface LearningProgress {
  userId: string;
  subject: string;
  totalSessions: number;
  totalTime: number; // in minutes
  averageSessionDuration: number;
  topics: {
    name: string;
    sessionsCount: number;
    masteryLevel: number; // 0-100
  }[];
  weakAreas: string[];
  strongAreas: string[];
  lastActivity: Date;
}
