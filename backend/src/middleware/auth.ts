import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { JWTUtils } from '../utils/jwt';
import { ApiResponse, AuthenticatedRequest } from '../types';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      } as ApiResponse);
      return;
    }

    // Verify the token
    const decoded = JWTUtils.verifyAccessToken(token);
    
    // Find the user
    const user = await User.findById(decoded.userId).select('+refreshTokens');
    
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User not found or account is inactive'
      } as ApiResponse);
      return;
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid or expired token'
    } as ApiResponse);
  }
};

// Authorization middleware (check for specific roles)
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      } as ApiResponse);
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      } as ApiResponse);
      return;
    }

    next();
  };
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = JWTUtils.verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

// Refresh token middleware
export const validateRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.headers['x-refresh-token'] as string || req.body.refreshToken;
    
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      } as ApiResponse);
      return;
    }

    // Verify the refresh token
    const decoded = JWTUtils.verifyRefreshToken(refreshToken);
    
    // Find the user and check if refresh token exists
    const user = await User.findById(decoded.userId).select('+refreshTokens');
    
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      } as ApiResponse);
      return;
    }

    req.user = user;
    req.body.refreshToken = refreshToken;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid refresh token'
    } as ApiResponse);
  }
};

// Export auth as alias for authenticate
export const auth = authenticate;
