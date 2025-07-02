import dotenv from 'dotenv';
import OpenAI from 'openai';
import { logger } from '../utils/logger';

// Load environment variables first
dotenv.config();

class OpenAIService {
  private client: OpenAI;
  
  constructor() {
    logger.info('Initializing OpenAI service...');
    logger.info(`OpenAI API key present: ${!!process.env.OPENAI_API_KEY}`);
    logger.info(`OpenAI API key length: ${process.env.OPENAI_API_KEY?.length || 0}`);
    logger.info(`OpenAI API key starts with sk-: ${process.env.OPENAI_API_KEY?.startsWith('sk-')}`);
    logger.info(`OpenAI API key first 20 chars: ${process.env.OPENAI_API_KEY?.substring(0, 20)}...`);
    
    if (!process.env.OPENAI_API_KEY) {
      logger.error('OpenAI API key is missing from environment variables');
      throw new Error('OpenAI API key is required');
    }
    
    if (process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      logger.error('OpenAI API key is still set to placeholder value');
      throw new Error('Please set a valid OpenAI API key in your .env file');
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    logger.info('OpenAI service initialized successfully');
  }

  async generateAnswer(question: string, subject: string, difficulty: string, language: string = 'en') {
    try {
      const systemPrompt = this.getSystemPrompt(subject, difficulty, language);
      
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const answer = response.choices[0]?.message?.content;
      const tokensUsed = response.usage?.total_tokens || 0;

      if (!answer) {
        throw new Error('No answer generated from OpenAI');
      }

      return {
        answer,
        tokensUsed,
        model: response.model
      };
    } catch (error) {
      logger.error('Error generating answer with OpenAI:', error);
      throw new Error('Failed to generate answer');
    }
  }

  async generateVideoScript(question: string, answer: string, subject: string, difficulty: string, language: string = 'en') {
    try {
      const scriptPrompt = this.getVideoScriptPrompt(subject, difficulty, language);
      
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: scriptPrompt
          },
          {
            role: 'user',
            content: `Question: ${question}\n\nAnswer: ${answer}\n\nPlease create a detailed teaching script for a video explanation.`
          }
        ],
        max_tokens: 3000,
        temperature: 0.8,
        presence_penalty: 0.2,
        frequency_penalty: 0.1
      });

      const script = response.choices[0]?.message?.content;
      const tokensUsed = response.usage?.total_tokens || 0;

      if (!script) {
        throw new Error('No script generated from OpenAI');
      }

      return {
        script: this.parseVideoScript(script),
        tokensUsed,
        model: response.model
      };
    } catch (error) {
      logger.error('Error generating video script with OpenAI:', error);
      throw new Error('Failed to generate video script');
    }
  }

  async analyzeImage(imageBuffer: Buffer, mimeType: string) {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this image and extract any text, mathematical equations, diagrams, or other educational content. Describe what you see and formulate a clear question or problem that a student might have about this content.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      const analysis = response.choices[0]?.message?.content;
      const tokensUsed = response.usage?.total_tokens || 0;

      if (!analysis) {
        throw new Error('No analysis generated from image');
      }

      return {
        analysis,
        tokensUsed,
        extractedText: this.extractTextFromAnalysis(analysis),
        suggestedQuestion: this.extractQuestionFromAnalysis(analysis)
      };
    } catch (error) {
      logger.error('Error analyzing image with OpenAI:', error);
      throw new Error('Failed to analyze image');
    }
  }

  async categorizeQuestion(question: string) {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an educational content categorizer. Analyze the given question and return a JSON response with:
            {
              "subject": "subject name (e.g., Mathematics, Physics, Chemistry, Biology, Computer Science, History, Literature, etc.)",
              "difficulty": "beginner|intermediate|advanced",
              "topics": ["topic1", "topic2", "topic3"],
              "confidence": 0.0-1.0
            }`
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No categorization result');
      }

      return JSON.parse(result);
    } catch (error) {
      logger.error('Error categorizing question:', error);
      // Return default categorization
      return {
        subject: 'General',
        difficulty: 'intermediate',
        topics: [],
        confidence: 0.5
      };
    }
  }

  private getSystemPrompt(subject: string, difficulty: string, language: string): string {
    const languageInstructions = language === 'hi' ? 
      'Respond in Hindi (Devanagari script) with clear explanations.' :
      'Respond in clear, educational English.';

    return `You are an expert ${subject} tutor. Your task is to provide clear, comprehensive, and educational explanations for ${difficulty} level questions.

Guidelines:
- ${languageInstructions}
- Break down complex concepts into simple steps
- Use analogies and real-world examples when helpful
- Include relevant formulas, equations, or code when applicable
- Provide step-by-step solutions for problems
- Be encouraging and supportive in your tone
- If the question is unclear, ask for clarification
- Structure your response with clear headings and bullet points
- Include practice tips or related concepts when relevant

Subject: ${subject}
Difficulty Level: ${difficulty}
Target Audience: Students seeking to understand the concept thoroughly`;
  }

  private getVideoScriptPrompt(subject: string, difficulty: string, language: string): string {
    const languageInstructions = language === 'hi' ? 
      'Write the script in Hindi (Devanagari script).' :
      'Write the script in clear, conversational English.';

    return `You are creating a script for an educational video explanation. The script should be natural, engaging, and perfect for text-to-speech conversion.

Requirements:
- ${languageInstructions}
- Write in a conversational, teaching style
- Include natural pauses with [PAUSE] markers
- Add emphasis markers like [EMPHASIS] for important points
- Include visual cues like [SHOW_EQUATION], [HIGHLIGHT], [DIAGRAM] where visual elements should appear
- Break content into logical segments
- Use simple, clear language appropriate for the difficulty level
- Include transitions between concepts
- End with a summary or key takeaways
- Target 2-5 minutes of speaking time
- Make it sound like a friendly, knowledgeable teacher

Subject: ${subject}
Difficulty Level: ${difficulty}

Format the script with clear sections and timing cues for video production.`;
  }

  private parseVideoScript(script: string) {
    // Parse the script to extract timing, emphasis, and visual cues
    const segments = script.split('\n').filter(line => line.trim());
    
    return {
      fullScript: script,
      segments: segments.map((segment, index) => ({
        id: index,
        text: segment.replace(/\[.*?\]/g, '').trim(),
        markers: this.extractMarkers(segment),
        estimatedDuration: this.estimateDuration(segment)
      })),
      totalEstimatedDuration: this.estimateScriptDuration(script),
      visualCues: this.extractVisualCues(script)
    };
  }

  private extractMarkers(text: string): string[] {
    const markers = text.match(/\[(.*?)\]/g) || [];
    return markers.map(marker => marker.slice(1, -1));
  }

  private estimateDuration(text: string): number {
    // Estimate reading time: ~150 words per minute
    const words = text.replace(/\[.*?\]/g, '').split(' ').length;
    return (words / 150) * 60; // seconds
  }

  private estimateScriptDuration(script: string): number {
    const words = script.replace(/\[.*?\]/g, '').split(' ').length;
    return Math.ceil((words / 150) * 60); // seconds
  }

  private extractVisualCues(script: string): Array<{type: string, timestamp: number, content: string}> {
    const cues: Array<{type: string, timestamp: number, content: string}> = [];
    const lines = script.split('\n');
    let currentTime = 0;

    lines.forEach(line => {
      const visualMarkers = line.match(/\[(SHOW_EQUATION|HIGHLIGHT|DIAGRAM|CHART|GRAPH|CODE)\]/g);
      if (visualMarkers) {
        visualMarkers.forEach(marker => {
          cues.push({
            type: marker.slice(1, -1),
            timestamp: currentTime,
            content: line.replace(/\[.*?\]/g, '').trim()
          });
        });
      }
      currentTime += this.estimateDuration(line);
    });

    return cues;
  }

  private extractTextFromAnalysis(analysis: string): string {
    // Extract any quoted text or mathematical expressions
    const textMatches = analysis.match(/"([^"]*)"/g);
    return textMatches ? textMatches.join(' ').replace(/"/g, '') : '';
  }

  private extractQuestionFromAnalysis(analysis: string): string {
    // Look for question patterns in the analysis
    const questionPatterns = [
      /What is[^?]*\?/gi,
      /How do[^?]*\?/gi,
      /Why[^?]*\?/gi,
      /Solve[^?]*\?/gi,
      /Calculate[^?]*\?/gi,
      /Find[^?]*\?/gi
    ];

    for (const pattern of questionPatterns) {
      const match = analysis.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return 'Please explain the content in this image.';
  }
}

export const openaiService = new OpenAIService();
