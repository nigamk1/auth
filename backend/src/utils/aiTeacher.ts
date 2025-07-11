import OpenAI from 'openai';
import { logger } from './logger';

export interface AIPersonality {
  name: string;
  voice: string;
  teachingStyle: 'patient' | 'energetic' | 'formal' | 'casual';
  subject?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  language?: 'en' | 'hi' | 'hinglish';
}

export interface ConversationContext {
  sessionId: string;
  previousMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  currentTopic?: string;
  learningObjectives?: string[];
  studentLevel?: string;
  language?: 'en' | 'hi' | 'hinglish';
}

export interface AIResponse {
  text: string;
  shouldDrawOnWhiteboard: boolean;
  whiteboardActions?: Array<{
    type: 'draw' | 'write' | 'formula' | 'diagram';
    content: string;
    position?: { x: number; y: number };
  }>;
  followUpQuestions?: string[];
  relatedTopics?: string[];
}

export class AITeacherService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      logger.info('OpenAI AI Teacher service initialized');
    } else {
      logger.warn('OpenAI API key not found - AI responses will be simulated');
    }
  }

  /**
   * Generate AI teacher response based on user input and context
   */
  async generateResponse(
    userInput: string,
    personality: AIPersonality,
    context: ConversationContext
  ): Promise<AIResponse> {
    try {
      if (this.openai) {
        return await this.generateOpenAIResponse(userInput, personality, context);
      } else {
        return this.generateMockResponse(userInput, personality);
      }
    } catch (error) {
      logger.error('Error generating AI response:', error);
      return this.generateErrorResponse(personality);
    }
  }

  /**
   * Generate response using OpenAI GPT
   */
  private async generateOpenAIResponse(
    userInput: string,
    personality: AIPersonality,
    context: ConversationContext
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(personality, context);
    const messages = this.buildMessageHistory(context, userInput);

    try {
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      
      return this.parseAIResponse(responseText, personality);

    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw error;
    }
  }

  /**
   * Build system prompt based on personality and context
   */
  private buildSystemPrompt(personality: AIPersonality, context: ConversationContext): string {
    const styleDescriptions = {
      patient: 'Take your time to explain concepts thoroughly, encourage questions, and provide positive reinforcement.',
      energetic: 'Be enthusiastic and engaging, use exclamations, and keep the energy high throughout the conversation.',
      formal: 'Maintain a professional tone, use proper academic language, and structure explanations systematically.',
      casual: 'Be friendly and approachable, use conversational language, and make learning feel relaxed and fun.'
    };

    // Language-specific instructions
    const languageInstructions = {
      en: 'Respond in clear, simple English. Use everyday words and explain complex concepts step by step.',
      hi: 'हिंदी में जवाब दें। सरल शब्दों का इस्तेमाल करें और कठिन विषयों को आसान भाषा में समझाएं। अगर जरूरत हो तो अंग्रेजी के तकनीकी शब्दों का भी उपयोग कर सकते हैं।',
      hinglish: 'Respond in Hinglish (mix of Hindi and English). Use simple words that Indian students commonly understand. Mix both languages naturally like "Aap ye concept samjh gaye? This is very important topic hai." Use English for technical terms but explain in mixed language.'
    };

    const currentLanguage = context.language || personality.language || 'en';
    const languageInstruction = languageInstructions[currentLanguage];

    return `You are ${personality.name}, an AI virtual teacher with a ${personality.teachingStyle} teaching style.

LANGUAGE INSTRUCTION:
${languageInstruction}

PERSONALITY TRAITS:
- Teaching Style: ${styleDescriptions[personality.teachingStyle]}
- Voice: ${personality.voice}
- Subject Focus: ${personality.subject || 'General Education'}
- Student Level: ${context.studentLevel || personality.difficulty || 'beginner'}
- Response Language: ${currentLanguage.toUpperCase()}

TEACHING GUIDELINES:
1. Always be encouraging and supportive
2. Break down complex concepts into simple, digestible parts
3. Use analogies and real-world examples when appropriate
4. Ask follow-up questions to check understanding
5. Suggest visual aids when concepts would benefit from diagrams or formulas
6. Adapt your language to the student's level
7. Maintain the specified language throughout your response

WHITEBOARD INTEGRATION:
When you want to draw something on the whiteboard, include specific instructions like:
- [DRAW: mathematical formula] for equations
- [DRAW: diagram] for visual representations
- [DRAW: text] for important notes or keywords

RESPONSE FORMAT:
Provide clear, educational responses that help the student learn. If the topic would benefit from visual representation, mention what should be drawn on the whiteboard. Always respond in the specified language (${currentLanguage}).

Current session context: ${context.currentTopic ? `Discussing ${context.currentTopic}` : 'General conversation'}
Learning objectives: ${context.learningObjectives?.join(', ') || 'Flexible learning based on student interests'}`;
  }

  /**
   * Build message history for context
   */
  private buildMessageHistory(context: ConversationContext, currentInput: string): Array<{
    role: 'user' | 'assistant';
    content: string;
  }> {
    const messages = context.previousMessages
      .slice(-10) // Keep last 10 messages for context
      .map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

    messages.push({ role: 'user', content: currentInput });
    return messages;
  }

  /**
   * Parse AI response and extract whiteboard actions
   */
  private parseAIResponse(responseText: string, personality: AIPersonality): AIResponse {
    const whiteboardActions: AIResponse['whiteboardActions'] = [];
    let cleanedText = responseText;

    // Extract whiteboard instructions
    const drawMatches = responseText.match(/\[DRAW:\s*([^\]]+)\]/g);
    if (drawMatches) {
      drawMatches.forEach(match => {
        const content = match.replace(/\[DRAW:\s*([^\]]+)\]/, '$1').trim();
        const action = this.determineDrawingAction(content);
        whiteboardActions.push(action);
        cleanedText = cleanedText.replace(match, '').trim();
      });
    }

    // Extract follow-up questions
    const followUpQuestions = this.extractFollowUpQuestions(responseText);
    
    // Extract related topics
    const relatedTopics = this.extractRelatedTopics(responseText);

    return {
      text: cleanedText,
      shouldDrawOnWhiteboard: whiteboardActions.length > 0,
      whiteboardActions: whiteboardActions.length > 0 ? whiteboardActions : undefined,
      followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : undefined,
      relatedTopics: relatedTopics.length > 0 ? relatedTopics : undefined,
    };
  }

  /**
   * Determine what type of drawing action to perform
   */
  private determineDrawingAction(content: string): NonNullable<AIResponse['whiteboardActions']>[0] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('formula') || lowerContent.includes('equation') || /[=+\-*/^]/.test(content)) {
      return { type: 'formula', content };
    } else if (lowerContent.includes('diagram') || lowerContent.includes('chart') || lowerContent.includes('graph')) {
      return { type: 'diagram', content };
    } else if (lowerContent.includes('write') || lowerContent.includes('text') || lowerContent.includes('note')) {
      return { type: 'write', content };
    } else {
      return { type: 'draw', content };
    }
  }

  /**
   * Extract potential follow-up questions from response
   */
  private extractFollowUpQuestions(text: string): string[] {
    const questions: string[] = [];
    const questionPattern = /(?:Can you|Could you|Do you|Have you|What|How|Why|When|Where)[^?]*\?/g;
    const matches = text.match(questionPattern);
    
    if (matches) {
      questions.push(...matches.slice(0, 3)); // Limit to 3 questions
    }
    
    return questions;
  }

  /**
   * Extract related topics mentioned in the response
   */
  private extractRelatedTopics(text: string): string[] {
    // This is a simplified implementation
    // In a real system, you might use NLP to extract topics
    const commonTopics = [
      'mathematics', 'algebra', 'geometry', 'calculus', 'statistics',
      'physics', 'chemistry', 'biology', 'history', 'literature',
      'programming', 'computer science', 'data structures', 'algorithms'
    ];
    
    const foundTopics = commonTopics.filter(topic =>
      text.toLowerCase().includes(topic)
    );
    
    return foundTopics.slice(0, 5); // Limit to 5 topics
  }

  /**
   * Generate mock response when OpenAI is not available
   */
  private generateMockResponse(userInput: string, personality: AIPersonality): AIResponse {
    const responses = {
      patient: `I understand you're asking about "${userInput}". Let me explain this step by step in a way that's easy to follow. [DRAW: diagram] This concept is fundamental, and I want to make sure you grasp it completely before we move on.`,
      energetic: `Great question about "${userInput}"! I'm excited to dive into this topic with you! [DRAW: formula] This is such an interesting area, and I think you'll find it really engaging once we break it down!`,
      formal: `Your inquiry regarding "${userInput}" requires a systematic approach to ensure comprehensive understanding. [DRAW: text] Let us examine the fundamental principles that govern this concept.`,
      casual: `Oh, you're curious about "${userInput}"! That's awesome - it's actually pretty cool once you get the hang of it. [DRAW: diagram] Let me show you how this works in a way that'll make sense.`
    };

    return {
      text: responses[personality.teachingStyle],
      shouldDrawOnWhiteboard: true,
      whiteboardActions: [
        { type: 'write', content: `Topic: ${userInput}` },
        { type: 'diagram', content: 'Basic concept illustration' }
      ],
      followUpQuestions: [
        'Does this make sense so far?',
        'Would you like me to explain any part in more detail?'
      ],
      relatedTopics: ['fundamentals', 'applications', 'examples']
    };
  }

  /**
   * Generate error response
   */
  private generateErrorResponse(personality: AIPersonality): AIResponse {
    const errorResponses = {
      patient: "I'm having a little trouble processing that right now, but don't worry - let's try a different approach. Can you rephrase your question?",
      energetic: "Oops! Something went wrong on my end, but hey, that's okay! Let's keep the momentum going - try asking me again!",
      formal: "I apologize, but I encountered a technical difficulty. Please reformulate your inquiry, and I shall address it appropriately.",
      casual: "Hmm, looks like I hit a snag there. No biggie though - just ask me again and we'll get back on track!"
    };

    return {
      text: errorResponses[personality.teachingStyle],
      shouldDrawOnWhiteboard: false,
      followUpQuestions: ['Could you try asking that in a different way?']
    };
  }

  /**
   * Analyze conversation for learning insights
   */
  async analyzeConversation(context: ConversationContext): Promise<{
    topicsDiscussed: string[];
    difficultyLevel: string;
    engagementScore: number;
    suggestions: string[];
  }> {
    // Simplified analysis - in production, this could use more sophisticated NLP
    const messages = context.previousMessages;
    const userMessages = messages.filter(m => m.role === 'user');
    
    return {
      topicsDiscussed: [context.currentTopic || 'General discussion'],
      difficultyLevel: context.studentLevel || 'beginner',
      engagementScore: Math.min(userMessages.length * 10, 100), // Simple engagement metric
      suggestions: [
        'Continue practicing with similar examples',
        'Try applying these concepts to real-world scenarios',
        'Review the fundamentals if needed'
      ]
    };
  }

  /**
   * Get suggested learning path based on current progress
   */
  getSuggestedLearningPath(currentTopic: string, difficulty: string): string[] {
    // Simplified learning path suggestions
    const paths: Record<string, string[]> = {
      'mathematics': ['Basic arithmetic', 'Algebra', 'Geometry', 'Calculus'],
      'programming': ['Variables and data types', 'Control structures', 'Functions', 'Object-oriented programming'],
      'science': ['Scientific method', 'Basic concepts', 'Experiments', 'Advanced topics']
    };

    const category = Object.keys(paths).find(key => 
      currentTopic.toLowerCase().includes(key)
    ) || 'general';

    return paths[category] || ['Explore fundamentals', 'Practice exercises', 'Apply knowledge'];
  }
}

// Export singleton instance
export const aiTeacherService = new AITeacherService();
