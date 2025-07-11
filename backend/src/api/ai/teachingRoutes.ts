import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import { handleValidationErrors } from '../../middleware/validation';
import {
  startTeachingSession,
  askQuestion,
  requestDiagram,
  updateDifficultyLevel,
  getSessionHistory
} from './teachingController';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   POST /api/ai/teaching/:sessionId/start
 * @desc    Start or resume a teaching session
 * @access  Private
 */
router.post(
  '/:sessionId/start',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID'),
    body('topic').isLength({ min: 1, max: 200 }).withMessage('Topic must be 1-200 characters'),
    body('level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
    body('userPreferences').optional().isObject().withMessage('User preferences must be an object'),
    body('userPreferences.learningStyle').optional().isIn(['visual', 'auditory', 'kinesthetic', 'reading']).withMessage('Invalid learning style'),
    body('userPreferences.pace').optional().isIn(['slow', 'normal', 'fast']).withMessage('Invalid pace'),
    body('userPreferences.examples').optional().isBoolean().withMessage('Examples preference must be boolean')
  ],
  handleValidationErrors,
  startTeachingSession
);

/**
 * @route   POST /api/ai/teaching/:sessionId/question
 * @desc    Ask a question in the teaching session
 * @access  Private
 */
router.post(
  '/:sessionId/question',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID'),
    body('question').isLength({ min: 1, max: 1000 }).withMessage('Question must be 1-1000 characters'),
    body('responseTime').optional().isNumeric().withMessage('Response time must be numeric')
  ],
  handleValidationErrors,
  askQuestion
);

/**
 * @route   POST /api/ai/teaching/:sessionId/diagram
 * @desc    Request a diagram explanation
 * @access  Private
 */
router.post(
  '/:sessionId/diagram',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID'),
    body('concept').isLength({ min: 1, max: 200 }).withMessage('Concept must be 1-200 characters')
  ],
  handleValidationErrors,
  requestDiagram
);

/**
 * @route   PUT /api/ai/teaching/:sessionId/level
 * @desc    Update difficulty level
 * @access  Private
 */
router.put(
  '/:sessionId/level',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID'),
    body('level').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level')
  ],
  handleValidationErrors,
  updateDifficultyLevel
);

/**
 * @route   GET /api/ai/teaching/:sessionId/history
 * @desc    Get teaching session history and statistics
 * @access  Private
 */
router.get(
  '/:sessionId/history',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID')
  ],
  handleValidationErrors,
  getSessionHistory
);

/**
 * @route   GET /api/ai/teaching/sessions
 * @desc    Get user's teaching sessions
 * @access  Private
 */
router.get(
  '/sessions',
  [
    query('status').optional().isIn(['active', 'completed', 'paused', 'abandoned']).withMessage('Invalid status'),
    query('topic').optional().isLength({ max: 200 }).withMessage('Topic filter too long'),
    query('level').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level filter'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { 
        status, 
        topic, 
        level, 
        limit = 10, 
        offset = 0 
      } = req.query;
      const userId = (req as any).userId;

      const TeachingSession = (await import('../../models/TeachingSession')).default;

      // Build query
      const query: any = { userId };
      
      if (status) {
        query['metadata.completionStatus'] = status;
      }
      
      if (topic) {
        query.topic = new RegExp(topic as string, 'i');
      }
      
      if (level) {
        query.currentLevel = level;
      }

      // Execute query
      const sessions = await TeachingSession.find(query)
        .sort({ 'metadata.lastActiveAt': -1 })
        .limit(Number(limit))
        .skip(Number(offset))
        .select('topic currentLevel sessionState metadata createdAt updatedAt');

      const total = await TeachingSession.countDocuments(query);

      res.json({
        success: true,
        data: {
          sessions,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + Number(limit) < total
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/ai/teaching/prompts/templates
 * @desc    Get available prompt templates
 * @access  Private
 */
router.get(
  '/prompts/templates',
  async (req: Request, res: Response) => {
    try {
      const templates = {
        explanation: {
          name: 'Explanation Template',
          description: 'Explain topics like a school teacher',
          template: 'Explain "{topic}" like a school teacher to a {level} student.',
          variables: ['topic', 'level'],
          examples: [
            'Explain "photosynthesis" like a school teacher to a beginner student.',
            'Explain "quantum mechanics" like a school teacher to an advanced student.'
          ]
        },
        diagram: {
          name: 'Diagram Template',
          description: 'Request labeled diagrams of concepts',
          template: 'Draw a labeled diagram of "{concept}" for a {level} student.',
          variables: ['concept', 'level'],
          examples: [
            'Draw a labeled diagram of "the water cycle" for a beginner student.',
            'Draw a labeled diagram of "neural network architecture" for an advanced student.'
          ]
        },
        assessment: {
          name: 'Assessment Template',
          description: 'Assess student understanding',
          template: 'Assess the student\'s understanding of "{topic}" based on their response: "{response}"',
          variables: ['topic', 'response'],
          examples: [
            'Assess the student\'s understanding of "algebra" based on their response: "Variables are letters that represent numbers"'
          ]
        },
        followUp: {
          name: 'Follow-up Questions Template',
          description: 'Generate follow-up questions',
          template: 'Generate 3 follow-up questions about "{topic}" for a {level} student.',
          variables: ['topic', 'level'],
          examples: [
            'Generate 3 follow-up questions about "cellular respiration" for an intermediate student.'
          ]
        },
        math: {
          name: 'Mathematical Explanation Template',
          description: 'Explain mathematical concepts with formulas',
          template: 'Explain the mathematical concept "{concept}" for a {level} student. Include formulas and examples.',
          variables: ['concept', 'level'],
          examples: [
            'Explain the mathematical concept "quadratic equations" for an intermediate student. Include formulas and examples.'
          ]
        }
      };

      res.json({
        success: true,
        data: { templates }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

export default router;
