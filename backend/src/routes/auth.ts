import { Router } from 'express';
import { 
  register, 
  login, 
  refreshToken, 
  logout, 
  logoutAll,
  forgotPassword, 
  resetPassword,
  getProfile
} from '../controllers/authController';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} from '../middleware/validation';
import { authenticate, validateRefreshToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.post('/refresh-token', validateRefreshToken, refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/profile', authenticate, getProfile);

export default router;
