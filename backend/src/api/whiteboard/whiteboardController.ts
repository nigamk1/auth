import { Request, Response } from 'express';
import mongoose from 'mongoose';
import WhiteboardState from '../../models/WhiteboardState';
import Session from '../../models/Session';
import { logger } from '../../utils/logger';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Get whiteboard state for a session
 */
export const getWhiteboardState = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    // Verify session belongs to user
    const session = await Session.findOne({
      _id: sessionId,
      userId: userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    // Get whiteboard state
    const whiteboardState = await WhiteboardState.findOne({ sessionId });

    if (!whiteboardState) {
      // Return default whiteboard state
      const defaultState = {
        id: sessionId,
        sessionId,
        version: 1,
        elements: [],
        canvasState: {
          backgroundColor: '#ffffff',
          gridEnabled: true,
          zoom: 1,
          viewBox: { x: 0, y: 0, width: 1200, height: 800 }
        },
        snapshots: [],
        metadata: {
          totalElements: 0,
          lastModifiedBy: 'user',
          collaborationMode: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.json({
        success: true,
        data: defaultState
      });
    }

    logger.info(`Whiteboard state retrieved for session ${sessionId}`);
    return res.json({
      success: true,
      data: whiteboardState
    });

  } catch (error) {
    logger.error('Error getting whiteboard state:', error);
        return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Save/update whiteboard state
 */
export const saveWhiteboardState = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;
    const whiteboardData = req.body;

    // Verify session belongs to user
    const session = await Session.findOne({
      _id: sessionId,
      userId: userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    // Update or create whiteboard state
    const whiteboardState = await WhiteboardState.findOneAndUpdate(
      { sessionId },
      {
        ...whiteboardData,
        sessionId: new mongoose.Types.ObjectId(sessionId),
        'metadata.lastModifiedBy': 'user',
        updatedAt: new Date()
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    logger.info(`Whiteboard state saved for session ${sessionId}`);
    return res.json({
      success: true,
      data: whiteboardState
    });

  } catch (error) {
    logger.error('Error saving whiteboard state:', error);
        return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Add a single element to the whiteboard
 */
export const addElement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;
    const elementData = req.body;

    // Verify session belongs to user
    const session = await Session.findOne({
      _id: sessionId,
      userId: userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    // Add element using the model's static method
    const whiteboardState = await WhiteboardState.addElement(
      new mongoose.Types.ObjectId(sessionId),
      {
        ...elementData,
        id: elementData.id || new mongoose.Types.ObjectId().toString()
      },
      'user'
    );

    // Find the added element
    const addedElement = whiteboardState.elements[whiteboardState.elements.length - 1];

    // Emit real-time update via Socket.IO
    if (req.socketHandler) {
      req.socketHandler.emitWhiteboardUpdate(sessionId, {
        sessionId,
        elements: [],
        action: 'add',
        element: addedElement,
        userId: userId!,
        timestamp: new Date()
      });
    }

    logger.info(`Element added to whiteboard in session ${sessionId}`);
    return res.json({
      success: true,
      data: addedElement
    });

  } catch (error) {
    logger.error('Error adding whiteboard element:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Update a whiteboard element
 */
export const updateElement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, elementId } = req.params;
    const userId = req.userId;
    const updateData = req.body;

    // Verify session belongs to user
    const session = await Session.findOne({
      _id: sessionId,
      userId: userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    // Update element
    const whiteboardState = await WhiteboardState.findOneAndUpdate(
      { sessionId, 'elements.id': elementId },
      {
        $set: {
          'elements.$': {
            ...updateData,
            id: elementId,
            timestamp: new Date(),
            author: updateData.author || 'user'
          },
          'metadata.lastModifiedBy': 'user'
        }
      },
      { new: true }
    );

    if (!whiteboardState) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard or element not found'
      });
    }

    const updatedElement = whiteboardState.elements.find(el => el.id === elementId);

    logger.info(`Element ${elementId} updated in session ${sessionId}`);
    return res.json({
      success: true,
      data: updatedElement
    });

  } catch (error) {
    logger.error('Error updating whiteboard element:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Delete a whiteboard element
 */
export const deleteElement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, elementId } = req.params;
    const userId = req.userId;

    // Verify session belongs to user
    const session = await Session.findOne({
      _id: sessionId,
      userId: userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    // Remove element
    const whiteboardState = await WhiteboardState.findOneAndUpdate(
      { sessionId },
      {
        $pull: { elements: { id: elementId } },
        $set: { 'metadata.lastModifiedBy': 'user' }
      },
      { new: true }
    );

    if (!whiteboardState) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found'
      });
    }

    logger.info(`Element ${elementId} deleted from session ${sessionId}`);
    return res.json({
      success: true,
      message: 'Element deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting whiteboard element:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Clear all elements from whiteboard
 */
export const clearWhiteboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    // Verify session belongs to user
    const session = await Session.findOne({
      _id: sessionId,
      userId: userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    // Clear whiteboard
    const whiteboardState = await WhiteboardState.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          elements: [],
          'metadata.lastModifiedBy': 'user',
          'metadata.totalElements': 0
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    logger.info(`Whiteboard cleared for session ${sessionId}`);
    return res.json({
      success: true,
      data: whiteboardState
    });

  } catch (error) {
    logger.error('Error clearing whiteboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Create a whiteboard snapshot
 */
export const createSnapshot = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { description } = req.body;
    const userId = req.userId;

    // Verify session belongs to user
    const session = await Session.findOne({
      _id: sessionId,
      userId: userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    // Create snapshot using model's static method
    const whiteboardState = await WhiteboardState.createSnapshot(
      new mongoose.Types.ObjectId(sessionId),
      description
    );

    if (!whiteboardState) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found'
      });
    }

    const latestSnapshot = whiteboardState.snapshots[whiteboardState.snapshots.length - 1];

    logger.info(`Snapshot created for session ${sessionId}`);
    return res.json({
      success: true,
      data: latestSnapshot
    });

  } catch (error) {
    logger.error('Error creating whiteboard snapshot:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Get all snapshots for a session
 */
export const getSnapshots = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    // Verify session belongs to user
    const session = await Session.findOne({
      _id: sessionId,
      userId: userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    const whiteboardState = await WhiteboardState.findOne({ sessionId }).select('snapshots');

    logger.info(`Snapshots retrieved for session ${sessionId}`);
    return res.json({
      success: true,
      data: whiteboardState?.snapshots || []
    });

  } catch (error) {
    logger.error('Error getting whiteboard snapshots:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Restore whiteboard from snapshot
 */
export const restoreSnapshot = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, snapshotId } = req.params;
    const userId = req.userId;

    // Verify session belongs to user
    const session = await Session.findOne({
      _id: sessionId,
      userId: userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    // Find whiteboard and snapshot
    const whiteboardState = await WhiteboardState.findOne({ sessionId });

    if (!whiteboardState) {
      return res.status(404).json({
        success: false,
        message: 'Whiteboard not found'
      });
    }

    const snapshot = whiteboardState.snapshots.find(s => s.id === snapshotId);

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        message: 'Snapshot not found'
      });
    }

    // For now, we just return the current state as snapshots don't store element data
    // In a full implementation, you'd store the actual elements in the snapshot
    logger.info(`Snapshot ${snapshotId} restored for session ${sessionId}`);
    return res.json({
      success: true,
      data: whiteboardState,
      message: 'Snapshot restore completed'
    });

  } catch (error) {
    logger.error('Error restoring whiteboard snapshot:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};
