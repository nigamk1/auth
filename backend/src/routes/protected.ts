import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Public protected route (any authenticated user)
router.get('/dashboard', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;

  res.status(200).json({
    success: true,
    message: 'Welcome to your dashboard!',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      stats: {
        lastLogin: user.lastLoginAt,
        memberSince: user.createdAt
      }
    }
  } as ApiResponse);
}));

// Admin only route
router.get('/admin', authorize('admin'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the admin panel!',
    data: {
      message: 'This is admin-only content'
    }
  } as ApiResponse);
}));

// User settings route
router.get('/settings', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;

  res.status(200).json({
    success: true,
    message: 'User settings retrieved successfully',
    data: {
      preferences: {
        emailNotifications: true,
        darkMode: false,
        language: 'en'
      },
      security: {
        twoFactorEnabled: false,
        activeTokens: user.refreshTokens?.length || 0
      }
    }
  } as ApiResponse);
}));

export default router;
