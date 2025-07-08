import { Router, Request, Response } from 'express';
import { WhiteboardState } from '../models/WhiteboardState';
import { Session } from '../models/Session';
import { authenticate } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

// All whiteboard routes require authentication
router.use(authenticate);

// Validation middleware
const validateWhiteboardUpdate = [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isMongoId()
    .withMessage('Invalid session ID format'),
  
  body('elements')
    .isArray()
    .withMessage('Elements must be an array'),
  
  handleValidationErrors
];

// Get whiteboard state for a session
router.get('/:sessionId', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  // Verify session ownership
  const session = await Session.findOne({ _id: sessionId, userId });
  if (!session) {
    throw new AppError('Session not found or unauthorized', 404);
  }

  const whiteboardState = await WhiteboardState.findOne({ sessionId });
  
  if (!whiteboardState) {
    // Create default whiteboard state
    const newWhiteboardState = await WhiteboardState.create({
      sessionId,
      userId,
      elements: [],
      version: 1,
      metadata: {
        totalElements: 0,
        canvasSize: { width: 1920, height: 1080 },
        backgroundColor: '#ffffff'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Whiteboard state retrieved successfully',
      data: {
        elements: newWhiteboardState.elements,
        version: newWhiteboardState.version,
        lastModified: newWhiteboardState.lastModified,
        metadata: newWhiteboardState.metadata
      }
    } as ApiResponse);
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Whiteboard state retrieved successfully',
    data: {
      elements: whiteboardState.elements,
      version: whiteboardState.version,
      lastModified: whiteboardState.lastModified,
      metadata: whiteboardState.metadata
    }
  } as ApiResponse);
}));

// Update whiteboard state
router.put('/:sessionId', validateWhiteboardUpdate, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const { sessionId } = req.params;
  const { elements } = req.body;

  // Verify session ownership
  const session = await Session.findOne({ _id: sessionId, userId });
  if (!session) {
    throw new AppError('Session not found or unauthorized', 404);
  }

  // Update whiteboard state
  const whiteboardState = await WhiteboardState.findOneAndUpdate(
    { sessionId },
    {
      elements,
      lastModified: new Date(),
      'metadata.totalElements': elements.length,
      $inc: { version: 1 }
    },
    { 
      new: true, 
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  // Update session metadata
  await Session.findByIdAndUpdate(sessionId, {
    'metadata.whiteboard.elements': elements.length,
    $inc: {
      'metadata.whiteboard.actions': 1
    }
  });

  res.status(200).json({
    success: true,
    message: 'Whiteboard updated successfully',
    data: {
      elements: whiteboardState.elements,
      version: whiteboardState.version,
      lastModified: whiteboardState.lastModified,
      metadata: whiteboardState.metadata
    }
  } as ApiResponse);
}));

// Clear whiteboard
router.delete('/:sessionId', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  // Verify session ownership
  const session = await Session.findOne({ _id: sessionId, userId });
  if (!session) {
    throw new AppError('Session not found or unauthorized', 404);
  }

  // Clear whiteboard state
  const whiteboardState = await WhiteboardState.findOneAndUpdate(
    { sessionId },
    {
      elements: [],
      lastModified: new Date(),
      'metadata.totalElements': 0,
      $inc: { version: 1 }
    },
    { new: true }
  );

  if (!whiteboardState) {
    throw new AppError('Whiteboard not found', 404);
  }

  // Update session metadata
  await Session.findByIdAndUpdate(sessionId, {
    'metadata.whiteboard.elements': 0,
    $inc: {
      'metadata.whiteboard.actions': 1
    }
  });

  res.status(200).json({
    success: true,
    message: 'Whiteboard cleared successfully',
    data: {
      elements: [],
      version: whiteboardState.version,
      lastModified: whiteboardState.lastModified
    }
  } as ApiResponse);
}));

// Save whiteboard as image/PDF (placeholder)
router.post('/:sessionId/export', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const { sessionId } = req.params;
  const { format = 'png' } = req.body;

  // Verify session ownership
  const session = await Session.findOne({ _id: sessionId, userId });
  if (!session) {
    throw new AppError('Session not found or unauthorized', 404);
  }

  // This is a placeholder for whiteboard export functionality
  // In a real implementation, you would generate an image or PDF from the whiteboard elements
  
  res.status(200).json({
    success: true,
    message: 'Whiteboard export feature coming soon',
    data: {
      format,
      status: 'not_implemented'
    }
  } as ApiResponse);
}));

export default router;
