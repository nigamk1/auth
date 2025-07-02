import { Router, Request, Response, NextFunction } from 'express';
import { tutorController } from '../controllers/tutorController';
import { auth } from '../middleware/auth';
import { fileUploadService } from '../services/fileUploadService';
import { body, param, query } from 'express-validator';
import { Question } from '../models/Question';
import { Answer } from '../models/Answer';
import { Conversation } from '../models/Conversation';
import { AuthenticatedRequest } from '../types';

const router = Router();

// File upload middleware
const upload = fileUploadService.getMulterConfig();

// Question validation
const questionValidation = [
  body('content').notEmpty().withMessage('Content is required').isLength({ max: 5000 }).withMessage('Content too long'),
  body('type').isIn(['text', 'voice', 'image']).withMessage('Invalid question type'),
  body('subject').optional().isLength({ max: 100 }).withMessage('Subject too long'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
  body('language').optional().isLength({ max: 10 }).withMessage('Invalid language code'),
  body('conversationId').optional().isMongoId().withMessage('Invalid conversation ID')
];

// Answer validation
const answerValidation = [
  body('questionId').isMongoId().withMessage('Invalid question ID'),
  body('type').isIn(['text', 'video']).withMessage('Invalid answer type'),
  body('voiceSettings').optional().isObject().withMessage('Invalid voice settings'),
  body('voiceSettings.provider').optional().isIn(['google', 'elevenlabs', 'azure']).withMessage('Invalid voice provider'),
  body('voiceSettings.voiceId').optional().isString().withMessage('Invalid voice ID'),
  body('voiceSettings.speed').optional().isFloat({ min: 0.5, max: 2.0 }).withMessage('Invalid speed'),
  body('voiceSettings.pitch').optional().isFloat({ min: -20, max: 20 }).withMessage('Invalid pitch')
];

// Rating validation
const ratingValidation = [
  param('answerId').isMongoId().withMessage('Invalid answer ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isLength({ max: 1000 }).withMessage('Feedback too long')
];

// Pagination validation
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Invalid page number'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit'),
  query('subject').optional().isString().withMessage('Invalid subject'),
  query('language').optional().isString().withMessage('Invalid language')
];

// Routes

// @route   POST /api/tutor/ask
// @desc    Submit a new question (text, voice, or image)
// @access  Private
router.post('/ask', 
  auth, 
  upload.array('files', 5), 
  questionValidation, 
  tutorController.askQuestion as any
);

// @route   POST /api/tutor/answer
// @desc    Generate an answer for a question
// @access  Private
router.post('/answer', 
  auth, 
  answerValidation, 
  tutorController.generateAnswer as any
);

// @route   GET /api/tutor/conversations
// @desc    Get user's conversation history
// @access  Private
router.get('/conversations', 
  auth, 
  paginationValidation, 
  tutorController.getConversations as any
);

// @route   GET /api/tutor/conversations/:conversationId
// @desc    Get specific conversation with all messages
// @access  Private
router.get('/conversations/:conversationId', 
  auth, 
  param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
  tutorController.getConversation as any
);

// @route   GET /api/tutor/usage
// @desc    Get user's usage statistics and limits
// @access  Private
router.get('/usage', 
  auth, 
  tutorController.getUsageStats as any
);

// @route   POST /api/tutor/answers/:answerId/rate
// @desc    Rate an answer
// @access  Private
router.post('/answers/:answerId/rate', 
  auth, 
  ratingValidation, 
  tutorController.rateAnswer as any
);

// @route   GET /api/tutor/subjects
// @desc    Get available subjects and their metadata
// @access  Private
router.get('/subjects', auth, async (req, res) => {
  try {
    const subjects = [
      {
        name: 'Mathematics',
        category: 'STEM',
        icon: '🔢',
        description: 'Algebra, Calculus, Geometry, Statistics, and more',
        difficulty: ['beginner', 'intermediate', 'advanced'],
        topics: ['Algebra', 'Calculus', 'Geometry', 'Statistics', 'Trigonometry', 'Linear Algebra']
      },
      {
        name: 'Physics',
        category: 'STEM',
        icon: '⚡',
        description: 'Mechanics, Thermodynamics, Electromagnetism, Quantum Physics',
        difficulty: ['beginner', 'intermediate', 'advanced'],
        topics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Quantum Physics']
      },
      {
        name: 'Chemistry',
        category: 'STEM',
        icon: '🧪',
        description: 'Organic, Inorganic, Physical Chemistry, Biochemistry',
        difficulty: ['beginner', 'intermediate', 'advanced'],
        topics: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Biochemistry']
      },
      {
        name: 'Biology',
        category: 'STEM',
        icon: '🧬',
        description: 'Cell Biology, Genetics, Ecology, Human Biology',
        difficulty: ['beginner', 'intermediate', 'advanced'],
        topics: ['Cell Biology', 'Genetics', 'Ecology', 'Human Biology', 'Microbiology']
      },
      {
        name: 'Computer Science',
        category: 'STEM',
        icon: '💻',
        description: 'Programming, Algorithms, Data Structures, Software Engineering',
        difficulty: ['beginner', 'intermediate', 'advanced'],
        topics: ['Programming', 'Algorithms', 'Data Structures', 'Software Engineering', 'Machine Learning']
      },
      {
        name: 'History',
        category: 'Humanities',
        icon: '📜',
        description: 'World History, Ancient Civilizations, Modern History',
        difficulty: ['beginner', 'intermediate', 'advanced'],
        topics: ['World History', 'Ancient History', 'Modern History', 'Regional History']
      },
      {
        name: 'Literature',
        category: 'Humanities',
        icon: '📚',
        description: 'Literary Analysis, Poetry, Prose, World Literature',
        difficulty: ['beginner', 'intermediate', 'advanced'],
        topics: ['Literary Analysis', 'Poetry', 'Prose', 'World Literature', 'Creative Writing']
      },
      {
        name: 'Economics',
        category: 'Social Sciences',
        icon: '📈',
        description: 'Microeconomics, Macroeconomics, International Economics',
        difficulty: ['beginner', 'intermediate', 'advanced'],
        topics: ['Microeconomics', 'Macroeconomics', 'International Economics', 'Economic Theory']
      }
    ];

    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects'
    });
  }
});

// @route   GET /api/tutor/voices
// @desc    Get available voice options for TTS
// @access  Private
router.get('/voices', auth, async (req, res) => {
  try {
    const { provider = 'google' } = req.query;
    
    // This would typically call the TTS service to get available voices
    // For now, return static data
    const voices = [
      {
        id: 'en-US-Wavenet-A',
        name: 'Wavenet A (Female)',
        provider: 'google',
        language: 'en-US',
        gender: 'female',
        preview: null
      },
      {
        id: 'en-US-Wavenet-B',
        name: 'Wavenet B (Male)',
        provider: 'google',
        language: 'en-US',
        gender: 'male',
        preview: null
      },
      {
        id: 'en-US-Wavenet-C',
        name: 'Wavenet C (Female)',
        provider: 'google',
        language: 'en-US',
        gender: 'female',
        preview: null
      }
    ];

    res.json({
      success: true,
      data: voices.filter(voice => voice.provider === provider)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching voices'
    });
  }
});

// @route   GET /api/tutor/status/:questionId
// @desc    Get processing status of a question
// @access  Private
router.get('/status/:questionId', 
  auth, 
  param('questionId').isMongoId().withMessage('Invalid question ID'),
  (async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { questionId } = req.params;
      const userId = req.user!._id;

      const question = await Question.findOne({ _id: questionId, userId });
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      const answers = await Answer.find({ questionId }).sort({ createdAt: -1 });

      return res.json({
        success: true,
        data: {
          questionId,
          questionStatus: question.status,
          answers: answers.map(answer => ({
            id: answer._id,
            type: answer.type,
            status: answer.status,
            createdAt: answer.createdAt,
            videoUrl: answer.videoUrl,
            content: answer.status === 'completed' ? answer.content : null
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }) as any
);

// @route   POST /api/tutor/conversations/:conversationId/archive
// @desc    Archive a conversation
// @access  Private
router.post('/conversations/:conversationId/archive', 
  auth, 
  param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
  (async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { conversationId } = req.params;
      const userId = req.user!._id;

      const conversation = await Conversation.findOneAndUpdate(
        { _id: conversationId, userId },
        { isActive: false },
        { new: true }
      );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      return res.json({
        success: true,
        message: 'Conversation archived successfully'
      });
    } catch (error) {
      next(error);
    }
  }) as any
);

export default router;
