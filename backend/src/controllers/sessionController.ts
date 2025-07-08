import { Request, Response } from 'express';
import { Session } from '../models/Session';
import { Message } from '../models/Message';
import { WhiteboardState } from '../models/WhiteboardState';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse, SessionRequest, SessionResponse } from '../types';
import { aiTeacherService } from '../services/aiTeacher';

// Create a new learning session
export const createSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const { title, subject, language, difficulty }: SessionRequest = req.body;

  const session = await Session.create({
    userId,
    title,
    subject,
    language,
    difficulty,
    status: 'active',
    startTime: new Date(),
    metadata: {
      totalMessages: 0,
      totalQuestions: 0,
      topicsDiscussed: [],
      whiteboard: {
        actions: 0,
        elements: 0
      }
    }
  });

  // Initialize whiteboard state
  await WhiteboardState.create({
    sessionId: session._id,
    userId,
    elements: [],
    version: 1,
    metadata: {
      totalElements: 0,
      canvasSize: { width: 1920, height: 1080 },
      backgroundColor: '#ffffff'
    }
  });

  const response: SessionResponse = {
    id: String(session._id),
    title: session.title,
    subject: session.subject,
    language: session.language,
    status: session.status,
    startTime: session.startTime,
    duration: session.duration,
    metadata: session.metadata
  };

  res.status(201).json({
    success: true,
    message: 'Learning session created successfully',
    data: response
  } as ApiResponse<SessionResponse>);
});

// Get user's sessions
export const getUserSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const { status, subject, limit = 20, page = 1 } = req.query;

  const filter: any = { userId };
  if (status) filter.status = status;
  if (subject) filter.subject = subject;

  const skip = (Number(page) - 1) * Number(limit);

  const sessions = await Session.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip(skip)
    .lean();

  const total = await Session.countDocuments(filter);

  const sessionResponses: SessionResponse[] = sessions.map(session => ({
    id: session._id.toString(),
    title: session.title,
    subject: session.subject,
    language: session.language,
    status: session.status,
    startTime: session.startTime,
    duration: session.duration,
    metadata: session.metadata
  }));

  res.status(200).json({
    success: true,
    message: 'Sessions retrieved successfully',
    data: {
      sessions: sessionResponses,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  } as ApiResponse);
});

// Get session details
export const getSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  const session = await Session.findOne({ _id: sessionId, userId });
  
  if (!session) {
    throw new AppError('Session not found', 404);
  }

  // Get session messages
  const messages = await Message.find({ sessionId })
    .sort({ createdAt: 1 })
    .lean();

  // Get whiteboard state
  const whiteboardState = await WhiteboardState.findOne({ sessionId });

  const response = {
    session: {
      id: String(session._id),
      title: session.title,
      subject: session.subject,
      language: session.language,
      status: session.status,
      startTime: session.startTime,
      duration: session.duration,
      metadata: session.metadata,
      summary: session.summary
    },
    messages: messages.map(msg => ({
      id: msg._id.toString(),
      type: msg.type,
      content: msg.content,
      aiResponse: msg.aiResponse,
      metadata: msg.metadata,
      createdAt: msg.createdAt
    })),
    whiteboard: whiteboardState ? {
      elements: whiteboardState.elements,
      version: whiteboardState.version,
      lastModified: whiteboardState.lastModified
    } : null
  };

  res.status(200).json({
    success: true,
    message: 'Session details retrieved successfully',
    data: response
  } as ApiResponse);
});

// Update session
export const updateSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const { sessionId } = req.params;
  const updateData = req.body;

  // Remove fields that shouldn't be updated directly
  delete updateData.userId;
  delete updateData.startTime;
  delete updateData.metadata;

  const session = await Session.findOneAndUpdate(
    { _id: sessionId, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  const response: SessionResponse = {
    id: String(session._id),
    title: session.title,
    subject: session.subject,
    language: session.language,
    status: session.status,
    startTime: session.startTime,
    duration: session.duration,
    metadata: session.metadata
  };

  res.status(200).json({
    success: true,
    message: 'Session updated successfully',
    data: response
  } as ApiResponse<SessionResponse>);
});

// End session
export const endSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  const session = await Session.findOne({ _id: sessionId, userId });
  
  if (!session) {
    throw new AppError('Session not found', 404);
  }

  if (session.status === 'completed') {
    throw new AppError('Session is already completed', 400);
  }

  // Calculate duration
  const duration = Math.floor((Date.now() - session.startTime.getTime()) / (1000 * 60));

  // Get session messages for summary
  const messages = await Message.find({ sessionId }).sort({ createdAt: 1 });
  const messageTexts = messages.map(msg => 
    msg.content.text || msg.content.transcription || ''
  ).filter(Boolean);

  let summary = '';
  if (messageTexts.length > 0) {
    try {
      summary = await aiTeacherService.generateSessionSummary(messageTexts, session.subject);
    } catch (error) {
      console.error('Error generating session summary:', error);
      summary = 'Unable to generate session summary';
    }
  }

  // Update session
  const updatedSession = await Session.findByIdAndUpdate(
    sessionId,
    {
      status: 'completed',
      endTime: new Date(),
      duration,
      summary
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Session ended successfully',
    data: {
      sessionId,
      duration,
      summary,
      totalMessages: updatedSession?.metadata.totalMessages || 0,
      totalQuestions: updatedSession?.metadata.totalQuestions || 0
    }
  } as ApiResponse);
});

// Delete session
export const deleteSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  const session = await Session.findOne({ _id: sessionId, userId });
  
  if (!session) {
    throw new AppError('Session not found', 404);
  }

  // Delete related data
  await Promise.all([
    Message.deleteMany({ sessionId }),
    WhiteboardState.deleteOne({ sessionId }),
    Session.findByIdAndDelete(sessionId)
  ]);

  res.status(200).json({
    success: true,
    message: 'Session deleted successfully'
  } as ApiResponse);
});

// Get session analytics
export const getSessionAnalytics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const { timeRange = '30d' } = req.query;

  let dateFilter: Date;
  const now = new Date();

  switch (timeRange) {
    case '7d':
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const analytics = await Session.aggregate([
    {
      $match: {
        userId: userId,
        createdAt: { $gte: dateFilter }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        averageDuration: { $avg: '$duration' },
        completedSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalMessages: { $sum: '$metadata.totalMessages' },
        totalQuestions: { $sum: '$metadata.totalQuestions' },
        subjects: { $addToSet: '$subject' },
        languages: { $addToSet: '$language' }
      }
    }
  ]);

  const subjectBreakdown = await Session.aggregate([
    {
      $match: {
        userId: userId,
        createdAt: { $gte: dateFilter }
      }
    },
    {
      $group: {
        _id: '$subject',
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        averageDuration: { $avg: '$duration' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const result = analytics[0] || {
    totalSessions: 0,
    totalDuration: 0,
    averageDuration: 0,
    completedSessions: 0,
    totalMessages: 0,
    totalQuestions: 0,
    subjects: [],
    languages: []
  };

  res.status(200).json({
    success: true,
    message: 'Session analytics retrieved successfully',
    data: {
      overview: result,
      subjectBreakdown,
      timeRange
    }
  } as ApiResponse);
});
