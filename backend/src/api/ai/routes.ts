import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import {
  createSession,
  getUserSessions,
  getSession,
  updateSessionStatus,
  deleteSession,
  askAIQuestion
} from './sessionController';
import teachingRoutes from './teachingRoutes';

const router = express.Router();

// Mount teaching routes
router.use('/teaching', teachingRoutes);

/**
 * @route   POST /api/ai/sessions
 * @desc    Create a new AI teaching session
 * @access  Private
 */
router.post('/sessions', [
  authenticate,
  body('title')
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('subject')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Subject must be between 1 and 100 characters'),
  body('aiPersonality.name')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('AI name must be between 1 and 50 characters'),
  body('aiPersonality.voice')
    .optional()
    .isString()
    .withMessage('Voice must be a valid string'),
  body('aiPersonality.teachingStyle')
    .optional()
    .isIn(['patient', 'energetic', 'formal', 'casual'])
    .withMessage('Teaching style must be one of: patient, energetic, formal, casual'),
  body('aiPersonality.language')
    .optional()
    .isIn(['en', 'hi', 'hinglish'])
    .withMessage('Language must be one of: en, hi, hinglish'),
  body('metadata.sessionType')
    .optional()
    .isIn(['lesson', 'tutoring', 'practice', 'review'])
    .withMessage('Session type must be one of: lesson, tutoring, practice, review'),
  body('metadata.difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be one of: beginner, intermediate, advanced'),
  body('metadata.tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array of strings'),
  body('metadata.language')
    .optional()
    .isIn(['en', 'hi', 'hinglish'])
    .withMessage('Language must be one of: en, hi, hinglish')
], createSession);

/**
 * @route   GET /api/ai/sessions
 * @desc    Get user's AI teaching sessions
 * @access  Private
 */
router.get('/sessions', authenticate, getUserSessions);

/**
 * @route   GET /api/ai/sessions/:sessionId
 * @desc    Get specific session details
 * @access  Private
 */
router.get('/sessions/:sessionId', authenticate, getSession);

/**
 * @route   PATCH /api/ai/sessions/:sessionId/status
 * @desc    Update session status
 * @access  Private
 */
router.patch('/sessions/:sessionId/status', [
  authenticate,
  body('status')
    .isIn(['active', 'completed', 'paused'])
    .withMessage('Status must be one of: active, completed, paused')
], updateSessionStatus);

/**
 * @route   DELETE /api/ai/sessions/:sessionId
 * @desc    Delete session and all associated data
 * @access  Private
 */
router.delete('/sessions/:sessionId', authenticate, deleteSession);

/**
 * @route   POST /api/ai/ask
 * @desc    Ask AI a question and get response
 * @access  Private
 */
router.post('/ask', [
  authenticate,
  body('question')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Question must be between 1 and 1000 characters'),
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'])
    .withMessage('Language must be a supported language code'),
  body('context')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Context must not exceed 2000 characters'),
  body('conversationHistory')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Conversation history must be an array with max 20 items')
], askAIQuestion);

export default router;
