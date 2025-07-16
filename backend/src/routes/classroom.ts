import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Types for classroom requests
interface MessageRequest extends Request {
  body: {
    message: string;
    sessionId?: string;
  };
}

interface SessionRequest extends Request {
  body: {
    subject?: string;
    sessionId?: string;
  };
}

// In-memory session storage (should be replaced with database in production)
const activeSessions = new Map<string, {
  userId: string;
  sessionId: string;
  subject?: string;
  messages: Array<{
    sender: 'student' | 'ai';
    message: string;
    timestamp: Date;
  }>;
  createdAt: Date;
}>();

// Generate simple AI responses based on keywords
const generateAIResponse = (message: string): { response: string; shouldDrawOnBoard?: boolean; boardContent?: any } => {
  const lowerMessage = message.toLowerCase();
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return {
      response: "Hello! I'm your AI teacher. I'm excited to help you learn today! What subject would you like to explore?",
      shouldDrawOnBoard: true,
      boardContent: {
        type: 'text',
        content: 'Welcome to AI Virtual Classroom! 🎓',
        x: 50,
        y: 50
      }
    };
  }
  
  // Math responses
  if (lowerMessage.includes('math') || lowerMessage.includes('mathematics') || lowerMessage.includes('algebra')) {
    return {
      response: "Mathematics is wonderful! Let's start with some fundamentals. What specific math topic interests you? Algebra, geometry, calculus, or something else?",
      shouldDrawOnBoard: true,
      boardContent: {
        type: 'text',
        content: 'Mathematics Topics:\n• Algebra\n• Geometry\n• Calculus\n• Statistics',
        x: 50,
        y: 100
      }
    };
  }
  
  // Science responses
  if (lowerMessage.includes('science') || lowerMessage.includes('physics') || lowerMessage.includes('chemistry') || lowerMessage.includes('biology')) {
    return {
      response: "Science is fascinating! There's so much to discover. Are you interested in physics (motion and forces), chemistry (atoms and molecules), or biology (living organisms)?",
      shouldDrawOnBoard: true,
      boardContent: {
        type: 'text',
        content: 'Science Branches:\n🔬 Physics - Motion & Forces\n⚗️ Chemistry - Atoms & Molecules\n🧬 Biology - Living Organisms',
        x: 50,
        y: 100
      }
    };
  }
  
  // Help responses
  if (lowerMessage.includes('help') || lowerMessage.includes('confused') || lowerMessage.includes('don\'t understand')) {
    return {
      response: "No worries! I'm here to help you understand. Learning takes time and practice. What specific part would you like me to explain differently?",
      shouldDrawOnBoard: false
    };
  }
  
  // Question responses
  if (lowerMessage.includes('what is') || lowerMessage.includes('how do') || lowerMessage.includes('why')) {
    return {
      response: `That's a great question! Let me break down "${message}" for you step by step. Understanding the fundamentals is key to mastering any subject.`,
      shouldDrawOnBoard: true,
      boardContent: {
        type: 'text',
        content: `Question: ${message}\n\nLet's explore this together!`,
        x: 50,
        y: 100
      }
    };
  }
  
  // Default response
  return {
    response: `Interesting topic about "${message}"! I'd love to teach you more about this. Let me explain the key concepts and we'll work through it together.`,
    shouldDrawOnBoard: false
  };
};

// POST /api/classroom/message - Send a message to AI teacher
router.post('/message', authenticate, async (req: MessageRequest, res: Response) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id;

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Message is required and must be a string'
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

    // Generate AI response
    const aiResponse = generateAIResponse(message);

    // Log the interaction (in production, save to database)
    console.log(`[Classroom] User ${userId}: ${message}`);
    console.log(`[Classroom] AI Response: ${aiResponse.response}`);

    res.json({
      success: true,
      data: aiResponse
    });

  } catch (error) {
    console.error('Error in classroom message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/classroom/session/start - Start a new teaching session
router.post('/session/start', authenticate, async (req: SessionRequest, res: Response) => {
  try {
    const { subject } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const sessionId = `session_${userId}_${Date.now()}`;
    
    // Create session
    activeSessions.set(sessionId, {
      userId,
      sessionId,
      subject,
      messages: [],
      createdAt: new Date()
    });

    // Generate greeting based on subject
    let greeting = "Hello! I'm your AI teacher and I'm excited to help you learn today!";
    if (subject) {
      greeting = `Hello! I'm your AI teacher and I'm ready to help you with ${subject}. What would you like to learn first?`;
    }

    console.log(`[Classroom] Started session ${sessionId} for user ${userId}`);

    res.json({
      success: true,
      data: {
        sessionId,
        greeting
      }
    });

  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/classroom/session/end - End a teaching session
router.post('/session/end', authenticate, async (req: SessionRequest, res: Response) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.id;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: 'Session ID is required'
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

    const session = activeSessions.get(sessionId);
    if (session && session.userId === userId) {
      activeSessions.delete(sessionId);
      console.log(`[Classroom] Ended session ${sessionId} for user ${userId}`);
    }

    res.json({
      success: true,
      message: 'Session ended successfully'
    });

  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/classroom/sessions - Get user's session history
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

    // In production, this would query the database
    // For now, return empty array since we're using in-memory storage
    const sessions: any[] = [];

    res.json({
      success: true,
      data: sessions
    });

  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
