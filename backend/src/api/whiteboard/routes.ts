import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import { handleValidationErrors } from '../../middleware/validation';
import {
  getWhiteboardState,
  saveWhiteboardState,
  addElement,
  updateElement,
  deleteElement,
  clearWhiteboard,
  createSnapshot,
  getSnapshots,
  restoreSnapshot
} from './whiteboardController';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/whiteboard/:sessionId
 * @desc    Get whiteboard state for a session
 * @access  Private
 */
router.get(
  '/:sessionId',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID')
  ],
  handleValidationErrors,
  getWhiteboardState
);

/**
 * @route   POST /api/whiteboard/:sessionId
 * @desc    Save/update whiteboard state
 * @access  Private
 */
router.post(
  '/:sessionId',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID'),
    body('elements').isArray().withMessage('Elements must be an array'),
    body('canvasState').isObject().withMessage('Canvas state must be an object'),
    body('version').optional().isInt({ min: 1 }).withMessage('Version must be a positive integer')
  ],
  handleValidationErrors,
  saveWhiteboardState
);

/**
 * @route   POST /api/whiteboard/:sessionId/elements
 * @desc    Add a single element to the whiteboard
 * @access  Private
 */
router.post(
  '/:sessionId/elements',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID'),
    body('type').isIn(['line', 'rectangle', 'circle', 'arrow', 'text', 'image', 'formula'])
      .withMessage('Invalid element type'),
    body('x').isNumeric().withMessage('X coordinate must be a number'),
    body('y').isNumeric().withMessage('Y coordinate must be a number'),
    body('properties').isObject().withMessage('Properties must be an object')
  ],
  handleValidationErrors,
  addElement
);

/**
 * @route   PUT /api/whiteboard/:sessionId/elements/:elementId
 * @desc    Update a whiteboard element
 * @access  Private
 */
router.put(
  '/:sessionId/elements/:elementId',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID'),
    param('elementId').notEmpty().withMessage('Element ID is required'),
    body('type').optional().isIn(['line', 'rectangle', 'circle', 'arrow', 'text', 'image', 'formula'])
      .withMessage('Invalid element type'),
    body('x').optional().isNumeric().withMessage('X coordinate must be a number'),
    body('y').optional().isNumeric().withMessage('Y coordinate must be a number'),
    body('properties').optional().isObject().withMessage('Properties must be an object')
  ],
  handleValidationErrors,
  updateElement
);

/**
 * @route   DELETE /api/whiteboard/:sessionId/elements/:elementId
 * @desc    Delete a whiteboard element
 * @access  Private
 */
router.delete(
  '/:sessionId/elements/:elementId',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID'),
    param('elementId').notEmpty().withMessage('Element ID is required')
  ],
  handleValidationErrors,
  deleteElement
);

/**
 * @route   DELETE /api/whiteboard/:sessionId/clear
 * @desc    Clear all elements from whiteboard
 * @access  Private
 */
router.delete(
  '/:sessionId/clear',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID')
  ],
  handleValidationErrors,
  clearWhiteboard
);

/**
 * @route   POST /api/whiteboard/:sessionId/snapshots
 * @desc    Create a whiteboard snapshot
 * @access  Private
 */
router.post(
  '/:sessionId/snapshots',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID'),
    body('description').optional().isString().isLength({ max: 200 })
      .withMessage('Description must be a string with maximum 200 characters')
  ],
  handleValidationErrors,
  createSnapshot
);

/**
 * @route   GET /api/whiteboard/:sessionId/snapshots
 * @desc    Get all snapshots for a session
 * @access  Private
 */
router.get(
  '/:sessionId/snapshots',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID')
  ],
  handleValidationErrors,
  getSnapshots
);

/**
 * @route   POST /api/whiteboard/:sessionId/snapshots/:snapshotId/restore
 * @desc    Restore a whiteboard from snapshot
 * @access  Private
 */
router.post(
  '/:sessionId/snapshots/:snapshotId/restore',
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID'),
    param('snapshotId').notEmpty().withMessage('Snapshot ID is required')
  ],
  handleValidationErrors,
  restoreSnapshot
);

export default router;
