import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Session from '../../models/Session';
import Transcript from '../../models/Transcript';
import WhiteboardState from '../../models/WhiteboardState';
import { aiTeacherService } from '../../utils/aiTeacher';
import { logger } from '../../utils/logger';
import mongoose from 'mongoose';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Create a new AI teaching session
 */
export const createSession = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const {
      title,
      subject,
      aiPersonality,
      metadata
    } = req.body;

    const userId = new mongoose.Types.ObjectId(req.user!.id);

    // Create new session
    const session = new Session({
      userId,
      title,
      subject,
      aiPersonality: {
        name: aiPersonality?.name || 'Assistant',
        voice: aiPersonality?.voice || 'en-US-Standard-A',
        teachingStyle: aiPersonality?.teachingStyle || 'patient',
        language: aiPersonality?.language || 'en'
      },
      metadata: {
        sessionType: metadata?.sessionType || 'lesson',
        difficulty: metadata?.difficulty || 'beginner',
        tags: metadata?.tags || [],
        language: metadata?.language || 'en'
      }
    });

    await session.save();

    // Initialize empty transcript and whiteboard
    const transcript = new Transcript({ sessionId: session._id });
    const whiteboard = new WhiteboardState({ sessionId: session._id });

    await Promise.all([transcript.save(), whiteboard.save()]);

    logger.info(`AI session created: ${session._id} by user: ${userId}`);

    res.status(201).json({
      message: 'Session created successfully',
      session: {
        id: session._id,
        title: session.title,
        subject: session.subject,
        status: session.status,
        aiPersonality: session.aiPersonality,
        metadata: session.metadata,
        startedAt: session.startedAt
      }
    });

  } catch (error) {
    logger.error('Error creating AI session:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get user's AI teaching sessions
 */
export const getUserSessions = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const filter: any = { userId };
    if (status && ['active', 'completed', 'paused'].includes(status)) {
      filter.status = status;
    }

    const sessions = await Session.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Session.countDocuments(filter);

    res.json({
      sessions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    logger.error('Error fetching user sessions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get specific session details
 */
export const getSession = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { sessionId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const session = await Session.findOne({
      _id: new mongoose.Types.ObjectId(sessionId),
      userId
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Get associated transcript and whiteboard
    const [transcript, whiteboard] = await Promise.all([
      Transcript.findOne({ sessionId: session._id }),
      WhiteboardState.findOne({ sessionId: session._id })
    ]);

    res.json({
      session,
      transcript,
      whiteboard
    });

  } catch (error) {
    logger.error('Error fetching session:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update session status
 */
export const updateSessionStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    if (!['active', 'completed', 'paused'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const session = await Session.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(sessionId),
        userId
      },
      {
        status,
        ...(status === 'completed' && { endedAt: new Date() })
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    logger.info(`Session ${sessionId} status updated to: ${status}`);

    res.json({
      message: 'Session status updated',
      session
    });

  } catch (error) {
    logger.error('Error updating session status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete session and all associated data
 */
export const deleteSession = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { sessionId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const session = await Session.findOne({
      _id: new mongoose.Types.ObjectId(sessionId),
      userId
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Delete session and associated data
    await Promise.all([
      Session.findByIdAndDelete(sessionId),
      Transcript.findOneAndDelete({ sessionId: session._id }),
      WhiteboardState.findOneAndDelete({ sessionId: session._id })
    ]);

    logger.info(`Session deleted: ${sessionId} by user: ${userId}`);

    res.json({ message: 'Session deleted successfully' });

  } catch (error) {
    logger.error('Error deleting session:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Ask AI a question and get response
 */
export const askAIQuestion = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const {
      question,
      language = 'en',
      context = '',
      conversationHistory = []
    } = req.body;

    const userId = req.user!.id;

    logger.info(`AI question from user ${userId}: ${question}`);

    // Prepare conversation context
    const conversationContext = {
      sessionId: 'standalone-chat', // This is a standalone question, not part of a session
      previousMessages: conversationHistory.slice(-10), // Keep last 10 messages for context
      currentTopic: context || 'General',
      studentLevel: 'intermediate'
    };

    // Generate AI response
    const aiResponse = await aiTeacherService.generateResponse(
      question,
      {
        voice: 'female',
        name: 'AI Assistant',
        teachingStyle: 'patient'
      },
      conversationContext
    );

    logger.info(`AI response generated for user ${userId}`);

    // Return the response
    res.json({
      answer: aiResponse.text,
      language,
      timestamp: new Date().toISOString(),
      metadata: {
        confidence: 0.9,
        responseTime: Date.now(),
        model: 'gpt-3.5-turbo'
      }
    });

  } catch (error) {
    logger.error('Error processing AI question:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};
