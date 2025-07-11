import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import SessionMemory, { IChatMessage, IWhiteboardSnapshot } from '../models/SessionMemory';
import Session from '../models/Session';

interface SessionMemoryRequest extends Request {
  user?: any;
  socketHandler?: any;
}

export class SessionMemoryController {
  
  // Create or get session memory
  static async getOrCreateSessionMemory(req: SessionMemoryRequest, res: Response): Promise<Response | void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.userId;

      // Verify session ownership
      const session = await Session.findOne({ _id: sessionId, userId });
      if (!session) {
        return res.status(404).json({ 
          success: false, 
          message: 'Session not found or access denied' 
        });
      }

      let sessionMemory = await SessionMemory.findOne({ sessionId });
      
      if (!sessionMemory) {
        sessionMemory = new SessionMemory({
          sessionId,
          userId,
          chatLog: [],
          whiteboardSnapshots: [],
          currentWhiteboardState: null,
          summary: {
            totalMessages: 0,
            totalWhiteboardActions: 0,
            mainTopics: [],
            keyLearnings: [],
            questionsAsked: 0,
            questionsAnswered: 0,
            averageResponseTime: 0
          },
          analytics: {
            userEngagement: {
              messageCount: 0,
              whiteboardInteractions: 0,
              timeSpentActive: 0,
              lastActivity: new Date()
            },
            aiPerformance: {
              averageConfidence: 0
            },
            learningProgress: {
              conceptsCovered: [],
              masteryLevel: 'beginner',
              improvementAreas: []
            }
          },
          metadata: {
            sessionDuration: 0,
            errorCount: 0,
            reconnections: 0
          }
        });
        
        await sessionMemory.save();
      }

      res.json({
        success: true,
        data: sessionMemory
      });

    } catch (error) {
      logger.error('Error getting/creating session memory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get session memory'
      });
    }
  }

  // Add chat message to session memory
  static async addChatMessage(req: SessionMemoryRequest, res: Response): Promise<Response | void> {
    try {
      const { sessionId } = req.params;
      const { message, type, metadata } = req.body;
      const userId = req.user!.userId;

      const sessionMemory = await SessionMemory.findOne({ sessionId, userId });
      if (!sessionMemory) {
        return res.status(404).json({
          success: false,
          message: 'Session memory not found'
        });
      }

      const chatMessage: IChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        content: message,
        userId: type === 'user' ? userId : undefined,
        userName: type === 'user' ? req.user!.name : 'AI Assistant',
        timestamp: new Date(),
        metadata
      };

      await sessionMemory.addChatMessage(chatMessage);

      // Emit real-time update if socket handler is available
      if (req.socketHandler) {
        req.socketHandler.emitChatMessage(sessionId, chatMessage);
      }

      res.json({
        success: true,
        data: chatMessage
      });

    } catch (error) {
      logger.error('Error adding chat message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add chat message'
      });
    }
  }

  // Save whiteboard snapshot
  static async saveWhiteboardSnapshot(req: SessionMemoryRequest, res: Response): Promise<Response | void> {
    try {
      const { sessionId } = req.params;
      const { elements, canvasState, createdBy } = req.body;
      const userId = req.user!.userId;

      const sessionMemory = await SessionMemory.findOne({ sessionId, userId });
      if (!sessionMemory) {
        return res.status(404).json({
          success: false,
          message: 'Session memory not found'
        });
      }

      const snapshot: Omit<IWhiteboardSnapshot, 'timestamp' | 'version'> = {
        elements,
        canvasState,
        createdBy
      };

      await sessionMemory.saveWhiteboardSnapshot(snapshot);

      // Update current whiteboard state
      sessionMemory.currentWhiteboardState = { elements, canvasState };
      await sessionMemory.save();

      res.json({
        success: true,
        data: {
          snapshotVersion: sessionMemory.whiteboardSnapshots.length,
          timestamp: new Date()
        }
      });

    } catch (error) {
      logger.error('Error saving whiteboard snapshot:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save whiteboard snapshot'
      });
    }
  }

  // Get session chat history
  static async getChatHistory(req: SessionMemoryRequest, res: Response): Promise<Response | void> {
    try {
      const { sessionId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const userId = req.user!.userId;

      const sessionMemory = await SessionMemory.findOne({ sessionId, userId });
      if (!sessionMemory) {
        return res.status(404).json({
          success: false,
          message: 'Session memory not found'
        });
      }

      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      
      const chatHistory = sessionMemory.chatLog
        .slice()
        .reverse()
        .slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          messages: chatHistory,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: sessionMemory.chatLog.length,
            hasMore: endIndex < sessionMemory.chatLog.length
          }
        }
      });

    } catch (error) {
      logger.error('Error getting chat history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get chat history'
      });
    }
  }

  // Get whiteboard history
  static async getWhiteboardHistory(req: SessionMemoryRequest, res: Response): Promise<Response | void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.userId;

      const sessionMemory = await SessionMemory.findOne({ sessionId, userId });
      if (!sessionMemory) {
        return res.status(404).json({
          success: false,
          message: 'Session memory not found'
        });
      }

      res.json({
        success: true,
        data: {
          snapshots: sessionMemory.whiteboardSnapshots,
          currentState: sessionMemory.currentWhiteboardState,
          totalSnapshots: sessionMemory.whiteboardSnapshots.length
        }
      });

    } catch (error) {
      logger.error('Error getting whiteboard history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get whiteboard history'
      });
    }
  }

  // Get all user sessions with memory
  static async getUserSessions(req: SessionMemoryRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user!.userId;
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      // Get sessions with their memory data
      const sessionMemories = await SessionMemory.find({ userId })
        .populate('sessionId', 'title subject status startedAt endedAt')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit));

      const total = await SessionMemory.countDocuments({ userId });

      const sessionsWithHighlights = sessionMemories.map(memory => ({
        sessionId: memory.sessionId,
        session: memory.sessionId,
        highlights: memory.getSessionHighlights(),
        summary: memory.summary,
        analytics: memory.analytics,
        createdAt: memory.createdAt,
        updatedAt: memory.updatedAt
      }));

      res.json({
        success: true,
        data: {
          sessions: sessionsWithHighlights,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: skip + Number(limit) < total,
            hasPrev: Number(page) > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error getting user sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user sessions'
      });
    }
  }

  // Get session summary and analytics
  static async getSessionSummary(req: SessionMemoryRequest, res: Response): Promise<Response | void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.userId;

      const sessionMemory = await SessionMemory.findOne({ sessionId, userId })
        .populate('sessionId', 'title subject status startedAt endedAt');

      if (!sessionMemory) {
        return res.status(404).json({
          success: false,
          message: 'Session memory not found'
        });
      }

      const highlights = sessionMemory.getSessionHighlights();

      res.json({
        success: true,
        data: {
          session: sessionMemory.sessionId,
          highlights,
          summary: sessionMemory.summary,
          analytics: sessionMemory.analytics,
          metadata: sessionMemory.metadata,
          chatSample: sessionMemory.chatLog.slice(-5), // Last 5 messages
          whiteboardInfo: {
            totalSnapshots: sessionMemory.whiteboardSnapshots.length,
            hasCurrentState: !!sessionMemory.currentWhiteboardState,
            lastSnapshot: sessionMemory.whiteboardSnapshots[sessionMemory.whiteboardSnapshots.length - 1]
          }
        }
      });

    } catch (error) {
      logger.error('Error getting session summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get session summary'
      });
    }
  }

  // Update session rating and feedback
  static async updateSessionFeedback(req: SessionMemoryRequest, res: Response): Promise<Response | void> {
    try {
      const { sessionId } = req.params;
      const { rating, feedback, keyLearnings } = req.body;
      const userId = req.user!.userId;

      const sessionMemory = await SessionMemory.findOne({ sessionId, userId });
      if (!sessionMemory) {
        return res.status(404).json({
          success: false,
          message: 'Session memory not found'
        });
      }

      await sessionMemory.updateSessionSummary({
        sessionRating: rating,
        feedback,
        keyLearnings: keyLearnings || sessionMemory.summary.keyLearnings
      });

      res.json({
        success: true,
        message: 'Session feedback updated successfully'
      });

    } catch (error) {
      logger.error('Error updating session feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update session feedback'
      });
    }
  }

  // Delete session memory (with confirmation)
  static async deleteSessionMemory(req: SessionMemoryRequest, res: Response): Promise<Response | void> {
    try {
      const { sessionId } = req.params;
      const { confirm } = req.body;
      const userId = req.user!.userId;

      if (!confirm) {
        return res.status(400).json({
          success: false,
          message: 'Deletion must be confirmed'
        });
      }

      const result = await SessionMemory.findOneAndDelete({ sessionId, userId });
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Session memory not found'
        });
      }

      res.json({
        success: true,
        message: 'Session memory deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting session memory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete session memory'
      });
    }
  }

  // Export session data
  static async exportSessionData(req: SessionMemoryRequest, res: Response): Promise<Response | void> {
    try {
      const { sessionId } = req.params;
      const { format = 'json' } = req.query;
      const userId = req.user!.userId;

      const sessionMemory = await SessionMemory.findOne({ sessionId, userId })
        .populate('sessionId', 'title subject status startedAt endedAt');

      if (!sessionMemory) {
        return res.status(404).json({
          success: false,
          message: 'Session memory not found'
        });
      }

      const exportData = {
        session: sessionMemory.sessionId,
        chatLog: sessionMemory.chatLog,
        whiteboardSnapshots: sessionMemory.whiteboardSnapshots,
        summary: sessionMemory.summary,
        analytics: sessionMemory.analytics,
        exportedAt: new Date()
      };

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="session-${sessionId}-export.json"`);
        res.json(exportData);
      } else {
        res.status(400).json({
          success: false,
          message: 'Unsupported export format'
        });
      }

    } catch (error) {
      logger.error('Error exporting session data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export session data'
      });
    }
  }
}
