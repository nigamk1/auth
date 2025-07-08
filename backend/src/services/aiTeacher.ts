import OpenAI from 'openai';
import { AITeacherRequest, AITeacherResponse, WhiteboardCommand } from '../types';

class AITeacherService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder-openai-api-key-for-development') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else {
      console.warn('⚠️  OpenAI API key not configured. AI features will be disabled.');
    }
  }

  private checkOpenAI(): void {
    if (!this.openai) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.');
    }
  }

  async generateTeacherResponse(request: AITeacherRequest): Promise<AITeacherResponse> {
    this.checkOpenAI();
    const startTime = Date.now();

    try {
      const systemPrompt = this.buildSystemPrompt(request.context);
      const userMessage = this.buildUserMessage(request);

      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        functions: [
          {
            name: 'create_whiteboard_commands',
            description: 'Generate whiteboard drawing commands to visualize concepts',
            parameters: {
              type: 'object',
              properties: {
                commands: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['draw', 'text', 'shape', 'equation', 'diagram', 'clear', 'highlight']
                      },
                      action: {
                        type: 'string',
                        enum: ['add', 'update', 'delete', 'move']
                      },
                      element: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          type: { type: 'string' },
                          position: {
                            type: 'object',
                            properties: {
                              x: { type: 'number' },
                              y: { type: 'number' }
                            }
                          },
                          properties: { type: 'object' },
                          content: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        ],
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 1500
      });

      const processingTime = Date.now() - startTime;
      const message = completion.choices[0]?.message;

      if (!message?.content) {
        throw new Error('No response generated from AI');
      }

      // Parse whiteboard commands if function was called
      let whiteboardCommands: WhiteboardCommand[] = [];
      if (message.function_call?.name === 'create_whiteboard_commands') {
        try {
          const functionArgs = JSON.parse(message.function_call.arguments || '{}');
          whiteboardCommands = functionArgs.commands || [];
        } catch (error) {
          console.warn('Failed to parse whiteboard commands:', error);
        }
      }

      // Determine appropriate emotion based on content and context
      const emotion = this.determineEmotion(message.content, request.context);

      return {
        spokenText: message.content,
        whiteboardCommands,
        emotion,
        confidence: 0.95, // You can implement confidence scoring logic
        metadata: {
          tokens: {
            input: completion.usage?.prompt_tokens || 0,
            output: completion.usage?.completion_tokens || 0
          },
          processingTime
        }
      };

    } catch (error) {
      console.error('Error generating AI teacher response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  private buildSystemPrompt(context: AITeacherRequest['context']): string {
    const { subject, language, difficulty } = context;
    
    return `You are an AI teacher with expertise in ${subject}. You are teaching a ${difficulty} level student in ${language}.

Your role:
1. Be encouraging, patient, and adaptive to the student's learning pace
2. Explain concepts clearly with examples and analogies
3. Use visual aids through whiteboard commands when helpful
4. Ask follow-up questions to check understanding
5. Break down complex topics into manageable parts
6. Provide real-world applications and context

Teaching guidelines:
- Use simple, clear language appropriate for ${difficulty} level
- Be encouraging and supportive
- Use examples and analogies to explain difficult concepts
- Create visual representations when beneficial
- Encourage questions and curiosity
- Adapt explanations based on student responses

When creating whiteboard content:
- Use diagrams, charts, and visual representations
- Write key formulas and equations
- Draw illustrations to support explanations
- Highlight important points
- Use colors and shapes effectively

Language: Respond in ${language}. If the student asks in a different language, acknowledge it and respond in ${language} unless they specifically request otherwise.

Remember: You are not just providing information - you are teaching and guiding the student's learning journey.`;
  }

  private buildUserMessage(request: AITeacherRequest): string {
    let message = `Student question/message: "${request.message}"`;
    
    if (request.context.sessionHistory && request.context.sessionHistory.length > 0) {
      message += `\n\nRecent conversation context:\n${request.context.sessionHistory.slice(-3).join('\n')}`;
    }

    if (request.whiteboardState && request.whiteboardState.length > 0) {
      message += `\n\nCurrent whiteboard has ${request.whiteboardState.length} elements. Consider building upon or referencing existing content.`;
    }

    return message;
  }

  private determineEmotion(responseText: string, context: AITeacherRequest['context']): string {
    // Simple emotion detection based on content analysis
    const text = responseText.toLowerCase();
    
    if (text.includes('great job') || text.includes('excellent') || text.includes('well done')) {
      return 'encouraging';
    }
    
    if (text.includes('don\'t worry') || text.includes('it\'s okay') || text.includes('let me help')) {
      return 'empathetic';
    }
    
    if (text.includes('exciting') || text.includes('amazing') || text.includes('wonderful')) {
      return 'enthusiastic';
    }
    
    if (text.includes('step by step') || text.includes('slowly') || text.includes('take your time')) {
      return 'patient';
    }
    
    return 'neutral';
  }

  async generateSessionSummary(messages: string[], subject: string): Promise<string> {
    this.checkOpenAI();
    
    try {
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Create a concise summary of this ${subject} learning session. Include key topics covered, concepts learned, and areas for future focus.`
          },
          {
            role: 'user',
            content: `Session messages:\n${messages.join('\n\n')}`
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      });

      return completion.choices[0]?.message?.content || 'Unable to generate summary';
    } catch (error) {
      console.error('Error generating session summary:', error);
      return 'Unable to generate summary';
    }
  }

  async extractTopics(message: string, subject: string): Promise<string[]> {
    this.checkOpenAI();
    
    try {
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Extract the main topics or concepts discussed in this ${subject} message. Return as a comma-separated list.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      });

      const response = completion.choices[0]?.message?.content || '';
      return response.split(',').map(topic => topic.trim()).filter(topic => topic.length > 0);
    } catch (error) {
      console.error('Error extracting topics:', error);
      return [];
    }
  }
}

export const aiTeacherService = new AITeacherService();
