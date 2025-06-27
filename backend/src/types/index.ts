import { Document, Model } from 'mongoose';

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

// User model interface with static methods
export interface IUserModel extends Model<IUser> {
  findByPasswordResetToken(token: string): Promise<IUser | null>;
  findByEmailVerificationToken(token: string): Promise<IUser | null>;
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
