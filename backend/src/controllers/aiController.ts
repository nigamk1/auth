import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { aiTeacherService } from '../services/aiTeacher';
import { voiceService } from '../services/voice';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse, AITeacherRequest, MessageRequest } from '../types';
import { Session } from '../models/Session';
import { Message } from '../models/Message';
import { WhiteboardState } from '../models/WhiteboardState';

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/webm',
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/ogg',
      'audio/m4a'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'));
    }
  }
});

export const uploadAudio = upload.single('audio');

// Process text message with AI teacher
export const processTextMessage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const { sessionId, text, language = 'en' } = req.body;

  // Validate session ownership
  const session = await Session.findOne({ _id: sessionId, userId });
  if (!session) {
    throw new AppError('Session not found or unauthorized', 404);
  }

  if (session.status !== 'active') {
    throw new AppError('Session is not active', 400);
  }

  // Save user message
  const userMessage = await Message.create({
    sessionId,
    userId,
    type: 'user_text',
    content: { text },
    metadata: {
      timestamp: new Date(),
      language
    }
  });

  // Get conversation context
  const recentMessages = await Message.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const sessionHistory = recentMessages
    .reverse()
    .map(msg => msg.content.text || msg.content.transcription)
    .filter((text): text is string => Boolean(text));

  // Get whiteboard state
  const whiteboardState = await WhiteboardState.findOne({ sessionId });

  // Generate AI response
  const aiResponse = await aiTeacherService.generateTeacherResponse({
    message: text,
    context: {
      subject: session.subject,
      language,
      difficulty: session.difficulty,
      sessionHistory
    },
    whiteboardState: whiteboardState?.elements || []
  });

  // Convert to speech
  const audioUrl = await voiceService.textToSpeech({
    text: aiResponse.spokenText,
    language
  });

  // Save AI response
  const aiMessage = await Message.create({
    sessionId,
    userId,
    type: 'ai_response',
    content: { text: aiResponse.spokenText },
    aiResponse: {
      spokenText: aiResponse.spokenText,
      audioUrl,
      whiteboardCommands: aiResponse.whiteboardCommands,
      emotion: aiResponse.emotion,
      confidence: aiResponse.confidence
    },
    metadata: {
      timestamp: new Date(),
      language,
      processingTime: aiResponse.metadata.processingTime,
      tokens: aiResponse.metadata.tokens
    }
  });

  // Apply whiteboard commands if any
  if (aiResponse.whiteboardCommands && aiResponse.whiteboardCommands.length > 0) {
    await applyWhiteboardCommands(sessionId, aiResponse.whiteboardCommands);
  }

  // Update session metadata
  await Session.findByIdAndUpdate(sessionId, {
    $inc: {
      'metadata.totalMessages': 1,
      'metadata.totalQuestions': text.includes('?') ? 1 : 0
    },
    $addToSet: {
      'metadata.topicsDiscussed': {
        $each: await aiTeacherService.extractTopics(text, session.subject)
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Message processed successfully',
    data: {
      userMessage: {
        id: userMessage._id,
        text,
        timestamp: new Date()
      },
      aiResponse: {
        id: aiMessage._id,
        text: aiResponse.spokenText,
        audioUrl,
        emotion: aiResponse.emotion,
        confidence: aiResponse.confidence,
        whiteboardCommands: aiResponse.whiteboardCommands,
        timestamp: new Date()
      }
    }
  } as ApiResponse);
});

// Process voice message with AI teacher
export const processVoiceMessage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user._id;
  const { sessionId, language = 'en' } = req.body;
  
  if (!req.file) {
    throw new AppError('Audio file is required', 400);
  }

  // Validate session ownership
  const session = await Session.findOne({ _id: sessionId, userId });
  if (!session) {
    throw new AppError('Session not found or unauthorized', 404);
  }

  if (session.status !== 'active') {
    throw new AppError('Session is not active', 400);
  }

  // Convert speech to text
  const transcription = await voiceService.speechToText({
    audioFile: req.file.buffer,
    language,
    format: path.extname(req.file.originalname).substring(1)
  });

  if (!transcription.trim()) {
    throw new AppError('Could not understand the audio. Please try again.', 400);
  }

  // Save user message
  const userMessage = await Message.create({
    sessionId,
    userId,
    type: 'user_audio',
    content: {
      transcription,
      audioData: {
        duration: 0, // Could be calculated with audio analysis
        fileSize: req.file.size,
        format: req.file.mimetype
      }
    },
    metadata: {
      timestamp: new Date(),
      language
    }
  });

  // Process the transcription with AI teacher (same logic as text message)
  const recentMessages = await Message.find({ sessionId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const sessionHistory = recentMessages
    .reverse()
    .map(msg => msg.content.text || msg.content.transcription)
    .filter((text): text is string => Boolean(text));

  const whiteboardState = await WhiteboardState.findOne({ sessionId });

  const aiResponse = await aiTeacherService.generateTeacherResponse({
    message: transcription,
    context: {
      subject: session.subject,
      language,
      difficulty: session.difficulty,
      sessionHistory
    },
    whiteboardState: whiteboardState?.elements || []
  });

  const audioUrl = await voiceService.textToSpeech({
    text: aiResponse.spokenText,
    language
  });

  const aiMessage = await Message.create({
    sessionId,
    userId,
    type: 'ai_response',
    content: { text: aiResponse.spokenText },
    aiResponse: {
      spokenText: aiResponse.spokenText,
      audioUrl,
      whiteboardCommands: aiResponse.whiteboardCommands,
      emotion: aiResponse.emotion,
      confidence: aiResponse.confidence
    },
    metadata: {
      timestamp: new Date(),
      language,
      processingTime: aiResponse.metadata.processingTime,
      tokens: aiResponse.metadata.tokens
    }
  });

  if (aiResponse.whiteboardCommands && aiResponse.whiteboardCommands.length > 0) {
    await applyWhiteboardCommands(sessionId, aiResponse.whiteboardCommands);
  }

  await Session.findByIdAndUpdate(sessionId, {
    $inc: {
      'metadata.totalMessages': 1,
      'metadata.totalQuestions': transcription.includes('?') ? 1 : 0
    },
    $addToSet: {
      'metadata.topicsDiscussed': {
        $each: await aiTeacherService.extractTopics(transcription, session.subject)
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Voice message processed successfully',
    data: {
      transcription,
      userMessage: {
        id: userMessage._id,
        transcription,
        timestamp: new Date()
      },
      aiResponse: {
        id: aiMessage._id,
        text: aiResponse.spokenText,
        audioUrl,
        emotion: aiResponse.emotion,
        confidence: aiResponse.confidence,
        whiteboardCommands: aiResponse.whiteboardCommands,
        timestamp: new Date()
      }
    }
  } as ApiResponse);
});

// Get audio file
export const getAudioFile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { fileName } = req.params;
  
  try {
    const audioBuffer = await voiceService.getAudioFile(fileName);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    res.send(audioBuffer);
  } catch (error) {
    throw new AppError('Audio file not found', 404);
  }
});

// Apply whiteboard commands to session
async function applyWhiteboardCommands(sessionId: string, commands: any[]): Promise<void> {
  let whiteboardState = await WhiteboardState.findOne({ sessionId });
  
  if (!whiteboardState) {
    throw new Error('Whiteboard state not found');
  }

  let elements = [...whiteboardState.elements];
  
  for (const command of commands) {
    switch (command.action) {
      case 'add':
        elements.push(command.element);
        break;
      case 'update':
        const updateIndex = elements.findIndex((el: any) => el.id === command.element.id);
        if (updateIndex !== -1) {
          elements[updateIndex] = { ...elements[updateIndex], ...command.element };
        }
        break;
      case 'delete':
        elements = elements.filter((el: any) => el.id !== command.element.id);
        break;
      case 'move':
        const moveIndex = elements.findIndex((el: any) => el.id === command.element.id);
        if (moveIndex !== -1) {
          elements[moveIndex].position = command.element.position;
        }
        break;
    }
  }

  await WhiteboardState.findByIdAndUpdate(whiteboardState._id, {
    elements,
    lastModified: new Date(),
    'metadata.totalElements': elements.length,
    version: whiteboardState.version + 1,
    $inc: {
      'metadata.actions': commands.length
    }
  });
}
