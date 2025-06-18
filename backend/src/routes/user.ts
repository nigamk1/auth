import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { authenticate } from '../middleware/auth';
import { validateUpdateProfile, validateChangePassword } from '../middleware/validation';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse, UpdateProfileRequest, ChangePasswordRequest } from '../types';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Update user profile
router.put('/profile', validateUpdateProfile, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const updateData: UpdateProfileRequest = req.body;

  // Remove undefined fields
  const cleanUpdateData = Object.fromEntries(
    Object.entries(updateData).filter(([_, value]) => value !== undefined)
  );

  const user = await User.findByIdAndUpdate(
    userId,
    cleanUpdateData,
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  } as ApiResponse);
}));

// Change password
router.put('/change-password', validateChangePassword, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

  // Get user with password
  const user = await User.findById(userId).select('+password +refreshTokens');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  
  // Clear all refresh tokens for security (force re-login on all devices)
  user.refreshTokens = [];
  
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please login again.'
  } as ApiResponse);
}));

// Upload avatar (placeholder - you'll need to implement file upload)
router.post('/avatar', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // This is a placeholder for avatar upload functionality
  // You would typically use multer or similar middleware for file uploads
  
  res.status(501).json({
    success: false,
    message: 'Avatar upload not implemented yet'
  } as ApiResponse);
}));

// Delete account
router.delete('/account', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;

  // Soft delete - deactivate account instead of hard delete
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false, refreshTokens: [] },
    { new: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Account deactivated successfully'
  } as ApiResponse);
}));

// Get user statistics
router.get('/stats', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const user = req.user;

  const stats = {
    accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)), // days
    lastLogin: user.lastLoginAt,
    isEmailVerified: user.isEmailVerified,
    activeTokens: user.refreshTokens?.length || 0
  };

  res.status(200).json({
    success: true,
    message: 'User statistics retrieved successfully',
    data: stats
  } as ApiResponse);
}));

export default router;
