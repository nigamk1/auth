import { Router } from 'express';
import {
  processTextMessage,
  processVoiceMessage,
  uploadAudio,
  getAudioFile
} from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// Validation middleware
const validateTextMessage = [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isMongoId()
    .withMessage('Invalid session ID format'),
  
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Message text is required')
    .isLength({ max: 5000 })
    .withMessage('Message cannot exceed 5000 characters'),
  
  body('language')
    .optional()
    .isIn(['en', 'hi', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'])
    .withMessage('Invalid language code'),
  
  handleValidationErrors
];

const validateVoiceMessage = [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isMongoId()
    .withMessage('Invalid session ID format'),
  
  body('language')
    .optional()
    .isIn(['en', 'hi', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'])
    .withMessage('Invalid language code'),
  
  handleValidationErrors
];

// Routes
router.post('/text', validateTextMessage, processTextMessage);
router.post('/voice', uploadAudio, validateVoiceMessage, processVoiceMessage);
router.get('/audio/:fileName', getAudioFile);

export default router;
