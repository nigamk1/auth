import { Document } from 'mongoose';
import { Request } from 'express';

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
  
  // Tutor Platform specific fields
  preferences: {
    language: string;
    subjects: string[];
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    voiceSettings: {
      provider: 'google' | 'elevenlabs' | 'azure';
      voiceId: string;
      speed: number;
      pitch: number;
    };
    videoSettings: {
      quality: '720p' | '1080p';
      animationStyle: 'minimal' | 'detailed' | 'interactive';
    };
  };
  statistics: {
    totalQuestions: number;
    totalVideos: number;
    averageRating?: number;
    totalStudyTime: number;
    streakDays: number;
    lastActivity: Date;
    subjectProgress: Array<{
      subject: string;
      questionsAnswered: number;
      videosWatched: number;
      averageRating?: number;
    }>;
  };
  
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
  files?: Express.Multer.File[];
  query: any;
  params: any;
  body: any;
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

// Tutor Platform interfaces
export interface QuestionRequest {
  content: string;
  type: 'text' | 'voice' | 'image';
  subject: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  language?: string;
  conversationId?: string;
}

export interface AnswerRequest {
  questionId: string;
  type: 'text' | 'video';
  voiceSettings?: {
    provider?: 'google' | 'elevenlabs' | 'azure';
    voiceId?: string;
    speed?: number;
    pitch?: number;
  };
}

export interface VideoGenerationJob {
  id: string;
  questionId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  script: string;
  audioUrl?: string;
  videoUrl?: string;
  progress: number;
  error?: string;
  metadata: {
    duration?: number;
    size?: number;
    quality: string;
    renderingTime?: number;
  };
}

export interface ChatMessage {
  id: string;
  type: 'question' | 'answer';
  content: string;
  timestamp: Date;
  questionId?: string;
  answerId?: string;
  metadata?: {
    subject?: string;
    difficulty?: string;
    hasVideo?: boolean;
    videoUrl?: string;
    isProcessing?: boolean;
  };
}

export interface ConversationSummary {
  id: string;
  title: string;
  subject: string;
  messageCount: number;
  lastActivity: Date;
  previewMessage?: string;
}

export interface UsageStats {
  questionsThisMonth: number;
  videosThisMonth: number;
  questionsLimit: number;
  videosLimit: number;
  canAskMore: boolean;
  canCreateVideo: boolean;
  daysUntilReset: number;
}

export interface SubjectData {
  name: string;
  category: string;
  icon: string;
  description: string;
  difficulty: Array<'beginner' | 'intermediate' | 'advanced'>;
  topics: string[];
}

export interface VoiceOption {
  id: string;
  name: string;
  provider: 'google' | 'elevenlabs' | 'azure';
  language: string;
  gender: 'male' | 'female' | 'neutral';
  preview?: string;
  premium?: boolean;
}

export interface ShareableContent {
  id: string;
  type: 'answer' | 'video';
  title: string;
  content: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  shareUrl: string;
  downloadUrl?: string;
  metadata: {
    subject: string;
    difficulty: string;
    duration?: number;
    rating?: number;
    downloadCount: number;
    createdAt: Date;
  };
}
