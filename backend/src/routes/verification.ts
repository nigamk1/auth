import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import { authenticate } from '../middleware/auth';
import { sendEmailVerification } from '../utils/email';

const router = Router();

// Send verification email
router.post('/send-verification-email', authenticate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;

  // Check if email is already verified
  if (user.isEmailVerified) {
    throw new AppError('Email is already verified', 400);
  }

  // Generate verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  try {
    // Send verification email
    await sendEmailVerification(user.email, verificationToken, user.firstName);
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    } as ApiResponse);
  } catch (error: any) {
    // Clear verification token if email fails
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    throw new AppError('Failed to send verification email. Please try again later.', 500);
  }
}));

// Verify email
router.get('/verify-email/:token', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  // Find user by verification token
  const user = await User.findByEmailVerificationToken(token);

  if (!user) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  // Update user and clear verification token
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  } as ApiResponse);
}));

// Resend verification email
router.post('/resend-verification', authenticate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;

  // Check if email is already verified
  if (user.isEmailVerified) {
    throw new AppError('Email is already verified', 400);
  }

  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  try {
    // Send verification email
    await sendEmailVerification(user.email, verificationToken, user.firstName);
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    } as ApiResponse);
  } catch (error: any) {
    // Clear verification token if email fails
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    throw new AppError('Failed to send verification email. Please try again later.', 500);
  }
}));

export default router;
