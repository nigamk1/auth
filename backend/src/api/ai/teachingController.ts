import { Request, Response } from 'express';
import mongoose from 'mongoose';
import TeachingSession from '../../models/TeachingSession';
import Session from '../../models/Session';
import WhiteboardState from '../../models/WhiteboardState';
import { AITeachingEngine, TeachingPrompts, DifficultyLevel, TeachingContext } from '../../utils/aiTeachingEngine';
import { logger } from '../../utils/logger';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Initialize AI Teaching Engine
const teachingEngine = new AITeachingEngine();

/**
 * Start or resume a teaching session
 */
export const startTeachingSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { topic, level = 'beginner', userPreferences } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify session belongs to user
    const session = await Session.findOne({
      _id: sessionId,
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    // Find or create teaching session
    let teachingSession = await TeachingSession.findOne({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!teachingSession) {
      teachingSession = new TeachingSession({
        sessionId: new mongoose.Types.ObjectId(sessionId),
        userId: new mongoose.Types.ObjectId(userId),
        topic,
        currentLevel: level as DifficultyLevel,
        userPreferences: userPreferences || {},
        qaPairs: [],
        sessionState: {
          totalQuestions: 0,
          correctAnswers: 0,
          averageResponseTime: 0,
          topicsDiscussed: [topic],
          currentSubtopic: topic,
          progressLevel: 0
        },
        metadata: {
          startedAt: new Date(),
          lastActiveAt: new Date(),
          totalDuration: 0,
          isActive: true,
          completionStatus: 'active'
        }
      });
    } else {
      // Resume existing session
      teachingSession.resumeSession();
      if (topic && topic !== teachingSession.topic) {
        teachingSession.topic = topic;
        teachingSession.sessionState.currentSubtopic = topic;
      }
      if (level && level !== teachingSession.currentLevel) {
        teachingSession.currentLevel = level as DifficultyLevel;
      }
    }

    await teachingSession.save();

    // Generate welcome message
    const context = teachingEngine.createTeachingContext(
      topic,
      level as DifficultyLevel,
      sessionId,
      userPreferences
    );

    const welcomePrompt = `Welcome a student to a teaching session about "${topic}" at ${level} level. 
    Introduce yourself as their AI teacher and briefly outline what you'll cover. 
    Ask an engaging opening question to assess their current knowledge.`;

    // For now, we'll simulate AI response. In production, integrate with OpenAI/Claude
    const aiResponse = await simulateAIResponse(welcomePrompt, context);

    logger.info(`Teaching session started for user ${userId}, topic: ${topic}, level: ${level}`);

    return res.json({
      success: true,
      data: {
        teachingSession: {
          id: teachingSession._id,
          sessionId: teachingSession.sessionId,
          topic: teachingSession.topic,
          currentLevel: teachingSession.currentLevel,
          progress: teachingSession.sessionState.progressLevel,
          totalQuestions: teachingSession.sessionState.totalQuestions
        },
        aiResponse: aiResponse.text,
        whiteboardActions: aiResponse.whiteboardActions,
        followUpQuestions: aiResponse.followUpQuestions
      }
    });

  } catch (error) {
    logger.error('Error starting teaching session:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Ask a question in the teaching session
 */
export const askQuestion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { question, responseTime } = req.body;
    const userId = req.userId;

    if (!question?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    // Emit AI thinking indicator via Socket.IO
    if (req.socketHandler) {
      req.socketHandler.getSocketIO().to(sessionId).emit('ai-thinking', {
        sessionId,
        isThinking: true,
        question,
        timestamp: new Date()
      });
    }

    // Find teaching session
    const teachingSession = await TeachingSession.findOne({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!teachingSession) {
      return res.status(404).json({
        success: false,
        message: 'Teaching session not found'
      });
    }

    // Create teaching context with memory
    const context = teachingEngine.createTeachingContext(
      teachingSession.topic,
      teachingSession.currentLevel,
      sessionId,
      teachingSession.userPreferences
    );

    // Add recent Q&A pairs to context
    context.previousQA = teachingSession.getRecentQAPairs().map(qa => ({
      id: qa.id,
      question: qa.question,
      answer: qa.answer,
      timestamp: qa.timestamp,
      topic: qa.subtopic,
      level: qa.level
    }));

    // Generate teaching prompt
    const prompt = TeachingPrompts.generateExplanationPrompt(
      question,
      teachingSession.currentLevel,
      context
    );

    // Get AI response
    const aiResponse = await simulateAIResponse(prompt, context);

    // Add to session memory
    const qaPair = teachingSession.addQAPair({
      question,
      answer: question, // Student's question
      aiResponse: aiResponse.text,
      subtopic: teachingSession.sessionState.currentSubtopic,
      level: teachingSession.currentLevel,
      responseTime: responseTime || 0,
      whiteboardActions: aiResponse.whiteboardActions,
      followUpQuestions: aiResponse.followUpQuestions
    });

    // Update progress
    teachingSession.updateProgress(5);

    // Update whiteboard if actions provided
    if (aiResponse.whiteboardActions && aiResponse.whiteboardActions.length > 0) {
      await updateWhiteboardWithActions(sessionId, aiResponse.whiteboardActions);
      
      // Emit whiteboard update via Socket.IO
      if (req.socketHandler) {
        req.socketHandler.emitWhiteboardUpdate(sessionId, {
          sessionId,
          elements: aiResponse.whiteboardActions,
          action: 'add',
          userId: 'ai-teacher',
          timestamp: new Date()
        });
      }
    }

    await teachingSession.save();

    // Emit AI answer via Socket.IO
    if (req.socketHandler) {
      req.socketHandler.emitAIAnswer(sessionId, {
        sessionId,
        response: aiResponse.text,
        type: 'answer',
        whiteboardActions: aiResponse.whiteboardActions,
        followUpQuestions: aiResponse.followUpQuestions,
        confidence: 0.95
      });
    }

    logger.info(`Question asked in teaching session ${sessionId}: ${question.substring(0, 50)}...`);

    return res.json({
      success: true,
      data: {
        qaId: qaPair.id,
        aiResponse: aiResponse.text,
        whiteboardActions: aiResponse.whiteboardActions,
        followUpQuestions: aiResponse.followUpQuestions,
        currentLevel: teachingSession.currentLevel,
        progress: teachingSession.sessionState.progressLevel,
        sessionStats: {
          totalQuestions: teachingSession.sessionState.totalQuestions,
          averageResponseTime: teachingSession.sessionState.averageResponseTime,
          topicsDiscussed: teachingSession.sessionState.topicsDiscussed
        }
      }
    });

  } catch (error) {
    logger.error('Error processing question:', error);
    
    // Stop AI thinking indicator on error
    if (req.socketHandler) {
      req.socketHandler.getSocketIO().to(req.params.sessionId).emit('ai-thinking', {
        sessionId: req.params.sessionId,
        isThinking: false,
        timestamp: new Date()
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Request a diagram explanation
 */
export const requestDiagram = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { concept } = req.body;
    const userId = req.userId;

    if (!concept?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Concept is required'
      });
    }

    // Find teaching session
    const teachingSession = await TeachingSession.findOne({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!teachingSession) {
      return res.status(404).json({
        success: false,
        message: 'Teaching session not found'
      });
    }

    // Generate diagram prompt
    const prompt = TeachingPrompts.generateDiagramPrompt(concept, teachingSession.currentLevel);

    // Get AI response with diagram instructions
    const aiResponse = await simulateAIResponse(prompt, {
      topic: concept,
      level: teachingSession.currentLevel,
      previousQA: teachingSession.getRecentQAPairs().map(qa => ({
        id: qa.id,
        question: qa.question,
        answer: qa.answer,
        timestamp: qa.timestamp,
        topic: qa.subtopic,
        level: qa.level
      })),
      sessionId
    });

    // Create diagram elements for whiteboard
    const diagramActions = teachingEngine.generateWhiteboardActions(concept, teachingSession.currentLevel);

    // Update whiteboard with diagram
    if (diagramActions.length > 0) {
      await updateWhiteboardWithActions(sessionId, diagramActions);
    }

    // Add to session memory
    teachingSession.addQAPair({
      question: `Draw a diagram of ${concept}`,
      answer: 'Diagram requested',
      aiResponse: aiResponse.text,
      subtopic: concept,
      level: teachingSession.currentLevel,
      responseTime: 0,
      whiteboardActions: diagramActions
    });

    teachingSession.updateProgress(10);
    await teachingSession.save();

    logger.info(`Diagram requested for concept: ${concept} in session ${sessionId}`);

    return res.json({
      success: true,
      data: {
        explanation: aiResponse.text,
        whiteboardActions: diagramActions,
        progress: teachingSession.sessionState.progressLevel
      }
    });

  } catch (error) {
    logger.error('Error generating diagram:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Update difficulty level
 */
export const updateDifficultyLevel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { level } = req.body;
    const userId = req.userId;

    if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid difficulty level. Must be beginner, intermediate, or advanced.'
      });
    }

    // Find and update teaching session
    const teachingSession = await TeachingSession.findOneAndUpdate(
      {
        sessionId: new mongoose.Types.ObjectId(sessionId),
        userId: new mongoose.Types.ObjectId(userId)
      },
      {
        currentLevel: level,
        'metadata.lastActiveAt': new Date()
      },
      { new: true }
    );

    if (!teachingSession) {
      return res.status(404).json({
        success: false,
        message: 'Teaching session not found'
      });
    }

    logger.info(`Difficulty level updated to ${level} for session ${sessionId}`);

    return res.json({
      success: true,
      data: {
        currentLevel: teachingSession.currentLevel,
        message: `Difficulty level updated to ${level}`
      }
    });

  } catch (error) {
    logger.error('Error updating difficulty level:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Get teaching session history
 */
export const getSessionHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    // Find teaching session
    const teachingSession = await TeachingSession.findOne({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!teachingSession) {
      return res.status(404).json({
        success: false,
        message: 'Teaching session not found'
      });
    }

    logger.info(`Session history retrieved for session ${sessionId}`);

    return res.json({
      success: true,
      data: {
        sessionInfo: {
          topic: teachingSession.topic,
          currentLevel: teachingSession.currentLevel,
          progress: teachingSession.sessionState.progressLevel,
          duration: teachingSession.metadata.totalDuration,
          isActive: teachingSession.metadata.isActive
        },
        statistics: {
          totalQuestions: teachingSession.sessionState.totalQuestions,
          correctAnswers: teachingSession.sessionState.correctAnswers,
          averageResponseTime: teachingSession.sessionState.averageResponseTime,
          topicsDiscussed: teachingSession.sessionState.topicsDiscussed
        },
        recentQA: teachingSession.getRecentQAPairs(),
        userPreferences: teachingSession.userPreferences
      }
    });

  } catch (error) {
    logger.error('Error getting session history:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Helper function to simulate AI response (replace with actual AI service)
 */
async function simulateAIResponse(prompt: string, context: TeachingContext) {
  // This is a simulation - replace with actual OpenAI/Claude API call
  const responses = {
    beginner: `Let me explain this in simple terms! ${context.topic} is like... [detailed beginner explanation]

[DIAGRAM]
Title: ${context.topic}
Key Point 1: Basic concept
Key Point 2: Simple example
[/DIAGRAM]

[QUESTIONS]
What do you think is the most important part?
Can you give me an example from your own experience?
[/QUESTIONS]`,

    intermediate: `Great question! Let's dive deeper into ${context.topic}. Here's what you need to know... [detailed intermediate explanation]

[DIAGRAM]
Title: ${context.topic} - Detailed View
Component 1: Advanced concept
Component 2: Practical application
Connection: How they relate
[/DIAGRAM]

[QUESTIONS]
How do you think this applies to real-world scenarios?
What challenges might arise when implementing this?
Can you explain the relationship between these components?
[/QUESTIONS]`,

    advanced: `Excellent question! ${context.topic} involves complex relationships and advanced concepts... [detailed advanced explanation]

[DIAGRAM]
Title: Comprehensive ${context.topic} Framework
System 1: Core architecture
System 2: Advanced mechanisms
Integration: Complex interactions
[/DIAGRAM]

[QUESTIONS]
How would you optimize this for different use cases?
What are the theoretical implications?
Can you propose an alternative approach?
[/QUESTIONS]`
  };

  // Simple AI response based on level
  const responseText = responses[context.level] || responses.beginner;

  // Parse the simulated response
  return teachingEngine.parseAIResponse(responseText);
}

/**
 * Helper function to update whiteboard with AI actions
 */
async function updateWhiteboardWithActions(sessionId: string, actions: any[]) {
  try {
    // Convert actions to whiteboard elements
    const elements = actions.map((action, index) => ({
      id: `ai-${Date.now()}-${index}`,
      type: action.type === 'text' ? 'text' : 'rectangle',
      x: action.position.x,
      y: action.position.y,
      width: action.type === 'text' ? 200 : 100,
      height: action.type === 'text' ? 30 : 50,
      properties: {
        text: action.content,
        fontSize: action.properties?.fontSize || 14,
        fontFamily: 'Arial',
        fill: action.properties?.color || '#000000',
        stroke: action.properties?.color || '#000000',
        strokeWidth: 1,
        opacity: 1
      },
      author: {
        type: 'ai',
        name: 'AI Teacher'
      },
      zIndex: index,
      isComplete: true,
      timestamp: new Date()
    }));

    // Add elements to whiteboard
    await WhiteboardState.findOneAndUpdate(
      { sessionId: new mongoose.Types.ObjectId(sessionId) },
      {
        $push: { elements: { $each: elements } },
        $set: {
          'metadata.lastModifiedBy': 'ai',
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    logger.info(`Added ${elements.length} AI-generated elements to whiteboard for session ${sessionId}`);
  } catch (error) {
    logger.error('Error updating whiteboard with AI actions:', error);
  }
}

export {
  teachingEngine
};
