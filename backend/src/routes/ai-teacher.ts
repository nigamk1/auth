import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { OpenAIService } from '../utils/openai';
import { logger } from '../utils/logger';
import { TeachingSession, ITeachingSession } from '../models/TeachingSession';
import { Types } from 'mongoose';

const router = Router();

// Types for AI teacher requests  
interface AITeacherRequest extends Request {
  body: {
    studentMessage: string;
    sessionId: string;
    context?: {
      subject?: string;
      studentLevel?: string;
      deviceInfo?: string;
      browserInfo?: string;
    };
  };
}

// POST /api/ai-teacher - Get AI teacher response with MongoDB storage
router.post('/', authenticate, async (req: AITeacherRequest, res: Response) => {
  try {
    const { studentMessage, sessionId, context } = req.body;
    const userId = req.user?.id;

    // Validation
    if (!studentMessage || typeof studentMessage !== 'string') {
      res.status(400).json({
        success: false,
        message: 'studentMessage is required and must be a string'
      });
      return;
    }

    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'sessionId is required and must be a string'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    logger.info(`[AI Teacher] Processing message for session ${sessionId}: "${studentMessage}"`);

    // Get or create session from MongoDB
    let session = await TeachingSession.findOne({ 
      sessionId, 
      userId: new Types.ObjectId(userId) 
    });
    
    if (!session) {
      // Create new session in MongoDB
      session = new TeachingSession({
        sessionId,
        userId: new Types.ObjectId(userId),
        subject: context?.subject || 'General',
        sessionMetadata: {
          deviceInfo: context?.deviceInfo,
          browserInfo: context?.browserInfo
        }
      });
      
      await session.save();
      logger.info(`[AI Teacher] Created new MongoDB session ${sessionId} for user ${userId}`);
    }

    // Update session state for incoming message
    session.lastStudentInput = studentMessage;
    session.userState = 'waiting';
    session.aiState = 'processing';
    session.expectingUserInput = false;

    // Add student message to chat log
    await session.addMessage('user', studentMessage);

    // Get AI teacher response
    const aiResponse = await OpenAIService.getTeacherResponse(studentMessage);

    // Extract drawing instructions if present
    const drawingInstructions = aiResponse.drawingInstructions || [];

    // Update session state for AI response
    session.lastAIResponse = aiResponse.explanation;
    session.aiState = drawingInstructions.length > 0 ? 'drawing' : 'speaking';
    session.userState = 'idle';
    session.expectingUserInput = true;

    // Add AI response to chat log
    await session.addMessage('assistant', aiResponse.explanation, drawingInstructions);

    // Save drawing data if present
    if (drawingInstructions.length > 0) {
      await session.addDrawing('ai-generated', drawingInstructions, {
        topic: session.currentTopic,
        step: session.currentStep
      });
    }

    // Update analytics and save session
    await session.save();

    // Log successful interaction
    logger.info(`[AI Teacher] Generated response for session ${sessionId}: ${aiResponse.explanation.substring(0, 100)}...`);
    logger.info(`[AI Teacher] Drawing instructions: ${drawingInstructions.length} commands`);
    logger.info(`[AI Teacher] Session saved to MongoDB with ${session.chatLog.length} total messages`);

    // Return response to frontend - EXACT Day 3 format
    res.json({
      explanation: aiResponse.explanation,
      drawingInstructions: aiResponse.drawingInstructions
    });

  } catch (error: any) {
    logger.error(`[AI Teacher] Error processing request: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI teacher response',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/ai-teacher/session/:sessionId - Get session history from MongoDB
router.get('/session/:sessionId', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const session = await TeachingSession.findOne({ 
      sessionId, 
      userId: new Types.ObjectId(userId) 
    });
    
    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        subject: session.subject,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        
        // Topic and flow information
        currentTopic: session.currentTopic,
        currentStep: session.currentStep,
        topicProgress: session.topicProgress,
        
        // Conversation state
        lastStudentInput: session.lastStudentInput,
        lastAIResponse: session.lastAIResponse,
        
        // AI and user states
        aiState: session.aiState,
        userState: session.userState,
        expectingUserInput: session.expectingUserInput,
        
        // Learning progress
        learningGoals: session.learningGoals,
        completedConcepts: session.completedConcepts,
        strugglingAreas: session.strugglingAreas,
        
        // Session metrics from MongoDB virtuals
        totalInteractions: session.totalInteractions,
        sessionDurationHours: session.sessionDurationHours,
        messageCount: session.messageCount,
        drawingCount: session.drawingCount,
        averageResponseTime: session.averageResponseTime,
        
        // Messages from MongoDB chat log
        messages: session.chatLog.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          drawingInstructions: msg.drawingInstructions
        })),
        
        // Additional MongoDB analytics
        analytics: session.analytics
      }
    });

  } catch (error: any) {
    logger.error(`[AI Teacher] Error getting session: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session data'
    });
  }
});

// DELETE /api/ai-teacher/session/:sessionId - Delete session from MongoDB
router.delete('/session/:sessionId', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const result = await TeachingSession.findOneAndDelete({ 
      sessionId, 
      userId: new Types.ObjectId(userId) 
    });
    
    if (!result) {
      res.status(404).json({
        success: false,
        message: 'Session not found'
      });
      return;
    }

    logger.info(`[AI Teacher] Deleted MongoDB session ${sessionId} for user ${userId}`);

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error: any) {
    logger.error(`[AI Teacher] Error deleting session: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/ai-teacher/sessions - Get all user sessions from MongoDB
router.get('/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const userSessions = await TeachingSession.find({ 
      userId: new Types.ObjectId(userId) 
    })
    .sort({ lastActivity: -1 })
    .select('sessionId subject createdAt lastActivity chatLog analytics')
    .lean();

    const sessionsWithCounts = userSessions.map(session => ({
      sessionId: session.sessionId,
      subject: session.subject,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      messageCount: session.chatLog?.length || 0,
      totalInteractions: session.analytics?.totalInteractions || 0,
      sessionDurationHours: session.analytics?.sessionDurationMs ? 
        session.analytics.sessionDurationMs / (1000 * 60 * 60) : 0
    }));

    logger.info(`[AI Teacher] Retrieved ${userSessions.length} sessions for user ${userId}`);

    res.json({
      success: true,
      data: sessionsWithCounts
    });

  } catch (error: any) {
    logger.error(`[AI Teacher] Error getting user sessions: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sessions'
    });
  }
});

// PUT /api/ai-teacher/session/:sessionId/state - Update session state in MongoDB
router.put('/session/:sessionId/state', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    const {
      currentTopic,
      currentStep,
      aiState,
      userState,
      expectingUserInput,
      learningGoals,
      completedConcepts,
      strugglingAreas
    } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const session = await TeachingSession.findOne({ 
      sessionId, 
      userId: new Types.ObjectId(userId) 
    });
    
    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session not found'
      });
      return;
    }

    // Update session state fields that are provided
    if (currentTopic !== undefined) session.currentTopic = currentTopic;
    if (currentStep !== undefined) session.currentStep = currentStep;
    if (aiState !== undefined) session.aiState = aiState;
    if (userState !== undefined) session.userState = userState;
    if (expectingUserInput !== undefined) session.expectingUserInput = expectingUserInput;
    if (learningGoals !== undefined) session.learningGoals = learningGoals;
    if (completedConcepts !== undefined) session.completedConcepts = completedConcepts;
    if (strugglingAreas !== undefined) session.strugglingAreas = strugglingAreas;

    session.lastActivity = new Date();
    await session.save();

    logger.info(`[AI Teacher] Updated MongoDB session state for ${sessionId}`);

    res.json({
      success: true,
      message: 'Session state updated successfully',
      data: {
        currentTopic: session.currentTopic,
        currentStep: session.currentStep,
        aiState: session.aiState,
        userState: session.userState,
        expectingUserInput: session.expectingUserInput
      }
    });

  } catch (error: any) {
    logger.error(`[AI Teacher] Error updating session state: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session state'
    });
  }
});

// POST /api/ai-teacher/session/:sessionId/topic-progress - Add topic progress to MongoDB
router.post('/session/:sessionId/topic-progress', authenticate, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    const { content, completed = true } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const session = await TeachingSession.findOne({ 
      sessionId, 
      userId: new Types.ObjectId(userId) 
    });
    
    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session not found'
      });
      return;
    }

    const progressEntry = {
      step: session.currentStep,
      content: content || '',
      completed,
      timestamp: new Date()
    };

    session.topicProgress.push(progressEntry);
    if (completed) {
      session.currentStep += 1;
    }
    session.lastActivity = new Date();
    await session.save();

    logger.info(`[AI Teacher] Added topic progress for MongoDB session ${sessionId}, step ${progressEntry.step}`);

    res.json({
      success: true,
      message: 'Topic progress added successfully',
      data: progressEntry
    });

  } catch (error: any) {
    logger.error(`[AI Teacher] Error adding topic progress: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to add topic progress'
    });
  }
});

// GET /api/ai-teacher/sessions/analytics - Get comprehensive session analytics
router.get('/sessions/analytics', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Get all sessions for the user
    const sessions = await TeachingSession.find({ 
      userId: new Types.ObjectId(userId) 
    }).lean();

    // Calculate comprehensive analytics
    const totalSessions = sessions.length;
    const totalMessages = sessions.reduce((sum, session) => sum + (session.chatLog?.length || 0), 0);
    const totalDrawings = sessions.reduce((sum, session) => sum + (session.drawings?.length || 0), 0);
    const totalInteractions = sessions.reduce((sum, session) => sum + (session.analytics?.totalInteractions || 0), 0);
    
    const totalDurationMs = sessions.reduce((sum, session) => 
      sum + (session.analytics?.sessionDurationMs || 0), 0);
    const totalDurationHours = totalDurationMs / (1000 * 60 * 60);

    // Subject distribution
    const subjectCounts = sessions.reduce((acc: Record<string, number>, session) => {
      const subject = session.subject || 'General';
      acc[subject] = (acc[subject] || 0) + 1;
      return acc;
    }, {});

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = sessions.filter(session => 
      session.lastActivity && new Date(session.lastActivity) > sevenDaysAgo
    );

    // Most active session
    const mostActiveSession = sessions.reduce((max, session) => {
      const sessionInteractions = session.analytics?.totalInteractions || 0;
      const maxInteractions = max?.analytics?.totalInteractions || 0;
      return sessionInteractions > maxInteractions ? session : max;
    }, sessions[0]);

    logger.info(`[AI Teacher] Generated analytics for user ${userId}: ${totalSessions} sessions, ${totalMessages} messages`);

    res.json({
      success: true,
      data: {
        overview: {
          totalSessions,
          totalMessages,
          totalDrawings,
          totalInteractions,
          totalDurationHours: Math.round(totalDurationHours * 100) / 100,
          averageSessionDuration: totalSessions > 0 ? 
            Math.round((totalDurationHours / totalSessions) * 100) / 100 : 0
        },
        subjectDistribution: subjectCounts,
        recentActivity: {
          sessionsLast7Days: recentSessions.length,
          messagesLast7Days: recentSessions.reduce((sum, session) => 
            sum + (session.chatLog?.length || 0), 0)
        },
        mostActiveSession: mostActiveSession ? {
          sessionId: mostActiveSession.sessionId,
          subject: mostActiveSession.subject,
          interactions: mostActiveSession.analytics?.totalInteractions || 0,
          durationHours: mostActiveSession.analytics?.sessionDurationMs ? 
            Math.round((mostActiveSession.analytics.sessionDurationMs / (1000 * 60 * 60)) * 100) / 100 : 0
        } : null,
        recentSessions: sessions
          .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
          .slice(0, 5)
          .map(session => ({
            sessionId: session.sessionId,
            subject: session.subject,
            lastActivity: session.lastActivity,
            messageCount: session.chatLog?.length || 0,
            interactions: session.analytics?.totalInteractions || 0
          }))
      }
    });

  } catch (error: any) {
    logger.error(`[AI Teacher] Error generating analytics: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics'
    });
  }
});

export default router;
