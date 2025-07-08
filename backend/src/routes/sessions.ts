import { Router } from 'express';
import {
  createSession,
  getUserSessions,
  getSession,
  updateSession,
  endSession,
  deleteSession,
  getSessionAnalytics
} from '../controllers/sessionController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

// All session routes require authentication
router.use(authenticate);

// Validation middleware
const validateCreateSession = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Session title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 100 })
    .withMessage('Subject cannot exceed 100 characters'),
  
  body('language')
    .optional()
    .isIn(['en', 'hi', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'])
    .withMessage('Invalid language code'),
  
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  
  handleValidationErrors
];

const validateUpdateSession = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subject cannot exceed 100 characters'),
  
  body('language')
    .optional()
    .isIn(['en', 'hi', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'])
    .withMessage('Invalid language code'),
  
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level'),
  
  handleValidationErrors
];

// Routes
router.post('/', validateCreateSession, createSession);
router.get('/', getUserSessions);
router.get('/analytics', getSessionAnalytics);
router.get('/:sessionId', getSession);
router.put('/:sessionId', validateUpdateSession, updateSession);
router.post('/:sessionId/end', endSession);
router.delete('/:sessionId', deleteSession);

export default router;
