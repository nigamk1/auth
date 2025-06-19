import { Request, Response } from 'express';
import crypto from 'crypto';
import { User } from '../models/User';
import { JWTUtils } from '../utils/jwt';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { ApiResponse, AuthResponse, RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest } from '../types';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email';

// Register new user
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName }: RegisterRequest = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists with this email', 400);
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName
  });

  // Generate tokens
  const tokenPayload = {
    userId: user._id,
    email: user.email,
    role: user.role
  };

  const { accessToken, refreshToken } = JWTUtils.generateTokens(tokenPayload);

  // Save refresh token to user
  user.refreshTokens.push(refreshToken);
  await user.save();

  // Send welcome email (optional)
  try {
    await sendWelcomeEmail(user.email, user.firstName);
  } catch (error) {
    // Don't fail registration if email fails
    console.log('Failed to send welcome email:', error);
  }

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  const response: AuthResponse = {
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    },
    accessToken,
    refreshToken
  };

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: response
  } as ApiResponse<AuthResponse>);
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password }: LoginRequest = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password +refreshTokens');
  
  if (!user || !await user.comparePassword(password)) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 401);
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Generate tokens
  const tokenPayload = {
    userId: user._id,
    email: user.email,
    role: user.role
  };

  const { accessToken, refreshToken } = JWTUtils.generateTokens(tokenPayload);

  // Save refresh token to user (limit to 5 active tokens)
  user.refreshTokens.push(refreshToken);
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  await user.save();

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  const response: AuthResponse = {
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    },
    accessToken,
    refreshToken
  };

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: response
  } as ApiResponse<AuthResponse>);
});

// Refresh access token
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 401);
  }

  // Verify refresh token
  const decoded = JWTUtils.verifyRefreshToken(refreshToken);
  
  // Find user and check if refresh token exists
  const user = await User.findById(decoded.userId).select('+refreshTokens');
  
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 401);
  }

  // Generate new tokens
  const tokenPayload = {
    userId: user._id,
    email: user.email,
    role: user.role
  };

  const { accessToken, refreshToken: newRefreshToken } = JWTUtils.generateTokens(tokenPayload);

  // Replace old refresh token with new one
  const tokenIndex = user.refreshTokens.indexOf(refreshToken);
  user.refreshTokens[tokenIndex] = newRefreshToken;
  await user.save();

  // Set new refresh token in httpOnly cookie
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken,
      refreshToken: newRefreshToken
    }
  } as ApiResponse);
});

// Logout user
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const user = req.user;

  if (refreshToken && user) {
    // Remove refresh token from user's token list
    user.refreshTokens = user.refreshTokens.filter((token: string) => token !== refreshToken);
    await user.save();
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  } as ApiResponse);
});

// Logout from all devices
export const logoutAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;

  if (user) {
    // Clear all refresh tokens
    user.refreshTokens = [];
    await user.save();
  }

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully'
  } as ApiResponse);
});

// Forgot password
export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email }: ForgotPasswordRequest = req.body;

  const user = await User.findOne({ email });
  
  if (!user) {
    // Don't reveal if email exists or not for security
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset email has been sent'
    } as ApiResponse);
    return;
  }

  // Generate password reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();
  try {
    // Send password reset email
    await sendPasswordResetEmail(user.email, resetToken, user.firstName);
    
    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    } as ApiResponse);
  } catch (error: any) {
    // Clear reset token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Provide more specific error messages for email configuration issues
    if (error.message && error.message.includes('Email authentication failed')) {
      throw new AppError('Email service configuration error. Please contact support.', 500);
    } else if (error.code === 'EAUTH') {
      throw new AppError('Email service authentication failed. Please contact support.', 500);
    } else {
      throw new AppError('Failed to send password reset email. Please try again later.', 500);
    }
  }
});

// Reset password
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token, password }: ResetPasswordRequest = req.body;

  // Hash the token to match stored version
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user by reset token and check expiration
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new AppError('Invalid or expired password reset token', 400);
  }

  // Update password and clear reset token
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  
  // Clear all refresh tokens for security
  user.refreshTokens = [];
  
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully. Please login with your new password.'
  } as ApiResponse);
});

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      bio: user.bio,
      dateOfBirth: user.dateOfBirth,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    }
  } as ApiResponse);
});
