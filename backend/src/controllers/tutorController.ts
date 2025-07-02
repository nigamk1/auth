import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { Question } from '../models/Question';
import { Answer } from '../models/Answer';
import { Conversation } from '../models/Conversation';
import { Subscription } from '../models/Subscription';
import { User } from '../models/User';
import { openaiService } from '../services/openaiService';
import { ttsService } from '../services/ttsService';
import { imageProcessingService } from '../services/imageProcessingService';
import { videoGenerationService } from '../services/videoGenerationService';
import { fileUploadService } from '../services/fileUploadService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest, QuestionRequest, AnswerRequest } from '../types';
import { validationResult } from 'express-validator';

class TutorController {
  // Submit a new question (text, voice, or image)
  async askQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { content, type, subject, difficulty, language, conversationId }: QuestionRequest = req.body;
      const userId = req.user!._id;

      // Check user's subscription limits
      const subscription = await Subscription.findOne({ userId });
      if (subscription && !this.canAskQuestion(subscription)) {
        return res.status(429).json({
          success: false,
          message: 'Question limit reached for this month',
          data: {
            questionsUsed: subscription.usage.questionsThisMonth,
            questionsLimit: subscription.limits.questionsPerMonth
          }
        });
      }

      // Create question document
      const question = new Question({
        userId,
        content,
        type,
        subject: subject || 'General',
        difficulty: difficulty || 'intermediate',
        language: language || 'en',
        status: 'pending'
      });

      // Handle file uploads if present
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        if (files.length > 0) {
          const file = files[0];
          
          if (type === 'image' && file.mimetype.startsWith('image/')) {
            await this.processImageQuestion(question, file);
          } else if (type === 'voice' && file.mimetype.startsWith('audio/')) {
            await this.processVoiceQuestion(question, file);
          }
        }
      }

      await question.save();

      // Update or create conversation
      let conversation;
      if (conversationId) {
        conversation = await Conversation.findOne({ _id: conversationId, userId });
        if (conversation) {
          conversation.questions.push(question._id as any);
          conversation.lastActivity = new Date();
          conversation.metadata.totalQuestions += 1;
          await conversation.save();
        }
      }

      if (!conversation) {
        conversation = new Conversation({
          userId,
          title: this.generateConversationTitle(content, subject),
          subject: subject || 'General',
          language: language || 'en',
          questions: [question._id],
          metadata: { totalQuestions: 1, totalVideos: 0 }
        });
        await conversation.save();
      }

      // Update user statistics
      await this.updateUserStats(userId, 'question');

      // Update subscription usage
      if (subscription) {
        subscription.usage.questionsThisMonth += 1;
        await subscription.save();
      }

      // Start processing the question asynchronously
      this.processQuestionAsync((question._id as any).toString()).catch((error: any) => {
        logger.error(`Error processing question ${question._id}:`, error);
      });

      return res.status(201).json({
        success: true,
        message: 'Question submitted successfully',
        data: {
          questionId: question._id,
          conversationId: conversation._id,
          status: question.status
        }
      });
    } catch (error) {
      logger.error('Error submitting question:', error);
      next(error);
    }
  }

  // Generate an answer for a question
  async generateAnswer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { questionId, type, voiceSettings }: AnswerRequest = req.body;
      const userId = req.user!._id;

      // Verify question ownership
      const question = await Question.findOne({ _id: questionId, userId });
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      if (question.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Question is still being processed'
        });
      }

      // Check if answer already exists
      const existingAnswer = await Answer.findOne({ questionId, type });
      if (existingAnswer && existingAnswer.status === 'completed') {
        return res.status(200).json({
          success: true,
          message: 'Answer already exists',
          data: {
            answerId: existingAnswer._id,
            content: existingAnswer.content,
            videoUrl: existingAnswer.videoUrl,
            status: existingAnswer.status
          }
        });
      }

      // Check video generation limits
      if (type === 'video') {
        const subscription = await Subscription.findOne({ userId });
        if (subscription && !this.canGenerateVideo(subscription)) {
          return res.status(429).json({
            success: false,
            message: 'Video generation limit reached for this month',
            data: {
              videosUsed: subscription.usage.videosThisMonth,
              videosLimit: subscription.limits.videosPerMonth
            }
          });
        }
      }

      // Create answer document
      const answer = new Answer({
        questionId,
        userId,
        content: '', // Will be filled during processing
        type,
        status: 'generating'
      });

      await answer.save();

      // Start answer generation asynchronously
      this.generateAnswerAsync((answer._id as any).toString(), question, type, voiceSettings).catch((error: any) => {
        logger.error(`Error generating answer ${answer._id}:`, error);
      });

      return res.status(201).json({
        success: true,
        message: 'Answer generation started',
        data: {
          answerId: answer._id,
          status: answer.status,
          estimatedTime: type === 'video' ? 120 : 30 // seconds
        }
      });
    } catch (error) {
      logger.error('Error generating answer:', error);
      next(error);
    }
  }

  // Get conversation history
  async getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user!._id;
      const { page = 1, limit = 10, subject, language } = req.query;

      const filter: any = { userId, isActive: true };
      if (subject) filter.subject = subject;
      if (language) filter.language = language;

      const conversations = await Conversation.find(filter)
        .sort({ lastActivity: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate({
          path: 'questions',
          select: 'content type subject status createdAt',
          options: { limit: 3, sort: { createdAt: -1 } }
        });

      const total = await Conversation.countDocuments(filter);

      return res.json({
        success: true,
        data: {
          conversations,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching conversations:', error);
      next(error);
    }
  }

  // Get specific conversation with all messages
  async getConversation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { conversationId } = req.params;
      const userId = req.user!._id;

      const conversation = await Conversation.findOne({ _id: conversationId, userId })
        .populate({
          path: 'questions',
          populate: {
            path: 'answers',
            model: 'Answer'
          }
        });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      // Get answers for all questions
      const questions = await Question.find({ _id: { $in: conversation.questions } })
        .sort({ createdAt: 1 });

      const questionsWithAnswers = await Promise.all(
        questions.map(async (question) => {
          const answers = await Answer.find({ questionId: question._id })
            .sort({ createdAt: 1 });
          
          return {
            ...question.toJSON(),
            answers
          };
        })
      );

      return res.json({
        success: true,
        data: {
          ...conversation.toJSON(),
          questions: questionsWithAnswers
        }
      });
    } catch (error) {
      logger.error('Error fetching conversation:', error);
      next(error);
    }
  }

  // Get user's usage statistics
  async getUsageStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user!._id;

      const subscription = await Subscription.findOne({ userId });
      const user = await User.findById(userId);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }

      const daysUntilReset = Math.ceil(
        (subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      return res.json({
        success: true,
        data: {
          plan: subscription.plan,
          usage: {
            questionsThisMonth: subscription.usage.questionsThisMonth,
            videosThisMonth: subscription.usage.videosThisMonth,
            questionsLimit: subscription.limits.questionsPerMonth,
            videosLimit: subscription.limits.videosPerMonth
          },
          limits: subscription.limits,
          daysUntilReset,
          canAskMore: this.canAskQuestion(subscription),
          canCreateVideo: this.canGenerateVideo(subscription),
          statistics: user?.statistics
        }
      });
    } catch (error) {
      logger.error('Error fetching usage stats:', error);
      next(error);
    }
  }

  // Rate an answer
  async rateAnswer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { answerId } = req.params;
      const { rating, feedback } = req.body;
      const userId = req.user!._id;

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      const answer = await Answer.findOne({ _id: answerId, userId });
      if (!answer) {
        return res.status(404).json({
          success: false,
          message: 'Answer not found'
        });
      }

      answer.quality.userRating = rating;
      if (feedback) {
        answer.quality.userFeedback = feedback;
      }

      await answer.save();

      // Update user's average rating
      await this.updateUserAverageRating(userId);

      return res.json({
        success: true,
        message: 'Rating submitted successfully',
        data: {
          rating: answer.quality.userRating,
          feedback: answer.quality.userFeedback
        }
      });
    } catch (error) {
      logger.error('Error rating answer:', error);
      next(error);
    }
  }

  // Private helper methods
  private async processImageQuestion(question: any, file: Express.Multer.File) {
    try {
      // Upload image
      const uploadResult = await fileUploadService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        'images',
        question.userId.toString()
      );

      question.imageUrl = uploadResult.url;
      question.metadata.originalFileName = file.originalname;
      question.metadata.fileSize = file.size;
      question.metadata.mimeType = file.mimetype;

      // Process image and extract text
      const imageResult = await imageProcessingService.processImage(file.buffer, file.originalname);
      
      if (imageResult.extractedText) {
        question.transcription = imageResult.extractedText;
        question.metadata.confidence = imageResult.confidence;
        
        // Use extracted text as content if original content is minimal
        if (question.content.length < 10) {
          question.content = imageResult.extractedText;
        }
      }
    } catch (error) {
      logger.error('Error processing image question:', error);
      throw error;
    }
  }

  private async processVoiceQuestion(question: any, file: Express.Multer.File) {
    try {
      // Upload audio file
      const uploadResult = await fileUploadService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        'audio',
        question.userId.toString()
      );

      question.audioUrl = uploadResult.url;
      question.metadata.originalFileName = file.originalname;
      question.metadata.fileSize = file.size;
      question.metadata.mimeType = file.mimetype;

      // TODO: Implement speech-to-text transcription
      // For now, use the provided content
      question.transcription = question.content || 'Voice question uploaded';
    } catch (error) {
      logger.error('Error processing voice question:', error);
      throw error;
    }
  }

  private async processQuestionAsync(questionId: string) {
    try {
      const question = await Question.findById(questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      question.status = 'processing';
      await question.save();

      const startTime = Date.now();

      // Categorize the question if not already done
      if (question.subject === 'General') {
        const categorization = await openaiService.categorizeQuestion(question.content);
        question.subject = categorization.subject;
        question.difficulty = categorization.difficulty;
        question.tags = categorization.topics;
      }

      // Generate answer
      const answerResult = await openaiService.generateAnswer(
        question.content,
        question.subject,
        question.difficulty,
        question.language
      );

      // Create text answer
      const textAnswer = new Answer({
        questionId: question._id,
        userId: question.userId,
        content: answerResult.answer,
        type: 'text',
        status: 'completed',
        metadata: {
          tokens: answerResult.tokensUsed,
          processingTime: Date.now() - startTime
        }
      });

      await textAnswer.save();

      question.status = 'completed';
      question.metadata.processingTime = Date.now() - startTime;
      await question.save();

      logger.info(`Question ${questionId} processed successfully`);
    } catch (error) {
      logger.error(`Error processing question ${questionId}:`, error);
      
      // Update question status to failed
      await Question.findByIdAndUpdate(questionId, { 
        status: 'failed',
        metadata: { error: (error as Error).message }
      });
    }
  }

  private async generateAnswerAsync(
    answerId: string,
    question: any,
    type: string,
    voiceSettings?: any
  ) {
    try {
      const answer = await Answer.findById(answerId);
      if (!answer) {
        throw new Error('Answer not found');
      }

      const startTime = Date.now();

      if (type === 'text') {
        // Generate text answer
        const answerResult = await openaiService.generateAnswer(
          question.content,
          question.subject,
          question.difficulty,
          question.language
        );

        answer.content = answerResult.answer;
        answer.metadata.tokens = answerResult.tokensUsed;
        answer.metadata.processingTime = Date.now() - startTime;
        answer.status = 'completed';
      } else if (type === 'video') {
        // Generate video answer
        await this.generateVideoAnswer(answer, question, voiceSettings);
      }

      await answer.save();

      // Update user statistics
      await this.updateUserStats(question.userId, 'answer', type);

      logger.info(`Answer ${answerId} generated successfully`);
    } catch (error) {
      logger.error(`Error generating answer ${answerId}:`, error);
      
      // Update answer status to failed
      await Answer.findByIdAndUpdate(answerId, { 
        status: 'failed',
        metadata: { error: (error as Error).message }
      });
    }
  }

  private async generateVideoAnswer(answer: any, question: any, voiceSettings: any) {
    const startTime = Date.now();

    // First get text answer if not already available
    let textAnswer = answer.content;
    if (!textAnswer) {
      const answerResult = await openaiService.generateAnswer(
        question.content,
        question.subject,
        question.difficulty,
        question.language
      );
      textAnswer = answerResult.answer;
      answer.content = textAnswer;
    }

    // Generate video script
    const scriptResult = await openaiService.generateVideoScript(
      question.content,
      textAnswer,
      question.subject,
      question.difficulty,
      question.language
    );

    answer.script = scriptResult.script.fullScript;

    // Generate video
    const videoResult = await videoGenerationService.generateVideo(question._id, {
      script: scriptResult.script,
      voiceSettings: voiceSettings || {
        provider: 'google',
        voiceId: 'en-US-Wavenet-A',
        speed: 1.0,
        pitch: 0
      },
      videoSettings: {
        quality: '720p',
        animationStyle: 'detailed'
      },
      subject: question.subject,
      language: question.language
    });

    // Upload video to storage
    const videoBuffer = await require('fs').promises.readFile(videoResult.videoPath);
    const videoUpload = await fileUploadService.uploadFile(
      videoBuffer,
      `video_${question._id}.mp4`,
      'video/mp4',
      'videos',
      question.userId.toString()
    );

    answer.videoUrl = videoUpload.url;
    answer.metadata = {
      ...answer.metadata,
      videoDuration: videoResult.duration,
      videoSize: videoResult.size,
      renderingTime: videoResult.metadata.renderingTime,
      processingTime: Date.now() - startTime
    };

    answer.status = 'completed';
  }

  private canAskQuestion(subscription: any): boolean {
    if (subscription.limits.questionsPerMonth === -1) return true; // Unlimited
    return subscription.usage.questionsThisMonth < subscription.limits.questionsPerMonth;
  }

  private canGenerateVideo(subscription: any): boolean {
    if (subscription.limits.videosPerMonth === -1) return true; // Unlimited
    return subscription.usage.videosThisMonth < subscription.limits.videosPerMonth;
  }

  private generateConversationTitle(content: string, subject: string): string {
    const words = content.split(' ').slice(0, 6).join(' ');
    return `${subject}: ${words}...`;
  }

  private async updateUserStats(userId: string, type: 'question' | 'answer', answerType?: string) {
    const user = await User.findById(userId);
    if (!user) return;

    if (type === 'question') {
      user.statistics.totalQuestions += 1;
    } else if (type === 'answer' && answerType === 'video') {
      user.statistics.totalVideos += 1;
    }

    user.statistics.lastActivity = new Date();
    await user.save();
  }

  private async updateUserAverageRating(userId: string) {
    const answers = await Answer.find({ 
      userId, 
      'quality.userRating': { $exists: true } 
    });

    if (answers.length === 0) return;

    const averageRating = answers.reduce((sum, answer) => 
      sum + (answer.quality.userRating || 0), 0) / answers.length;

    await User.findByIdAndUpdate(userId, {
      'statistics.averageRating': averageRating
    });
  }
}

export const tutorController = new TutorController();
