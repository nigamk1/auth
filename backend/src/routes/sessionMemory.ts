import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { SessionMemoryController } from '../controllers/sessionMemoryController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get or create session memory
router.get('/session/:sessionId', SessionMemoryController.getOrCreateSessionMemory);

// Chat history management
router.get('/session/:sessionId/chat', SessionMemoryController.getChatHistory);
router.post('/session/:sessionId/chat', SessionMemoryController.addChatMessage);

// Whiteboard history management
router.get('/session/:sessionId/whiteboard', SessionMemoryController.getWhiteboardHistory);
router.post('/session/:sessionId/whiteboard', SessionMemoryController.saveWhiteboardSnapshot);

// Session summary and analytics
router.get('/session/:sessionId/summary', SessionMemoryController.getSessionSummary);

// User sessions overview
router.get('/sessions', SessionMemoryController.getUserSessions);

// Session feedback and rating
router.post('/session/:sessionId/feedback', SessionMemoryController.updateSessionFeedback);

// Export session data
router.get('/session/:sessionId/export', SessionMemoryController.exportSessionData);

// Delete session memory
router.delete('/session/:sessionId', SessionMemoryController.deleteSessionMemory);

export default router;
