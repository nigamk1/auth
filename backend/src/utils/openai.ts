import OpenAI from 'openai';
import { logger } from './logger';

// Initialize OpenAI client with error handling
let openaiClient: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    logger.info('[OpenAI] Client initialized successfully');
  } else {
    logger.warn('[OpenAI] API key not configured, using fallback responses');
  }
} catch (error) {
  logger.error('[OpenAI] Failed to initialize client:', error);
}

export interface AITeacherResponse {
  explanation: string;
  drawingInstructions: string[];
}

export class OpenAIService {
  private static systemPrompt = `You are a virtual AI teacher with excellent teaching skills. Your mission is to:

1. TEACH CLEARLY: Explain concepts step-by-step in simple, engaging language
2. BE INTERACTIVE: Ask follow-up questions to check understanding
3. USE VISUALS: When explaining concepts, provide drawing instructions using DRAW commands
4. BE ENCOURAGING: Always be supportive and patient
5. ADAPT LEVEL: Adjust explanations based on student responses

DRAWING COMMANDS you can use:
- DRAW_TEXT('text', x=100, y=50) - Write text at coordinates
- DRAW_LINE(x1=50, y1=100, x2=200, y2=100) - Draw a line
- DRAW_CIRCLE(x=150, y=150, radius=50) - Draw a circle
- DRAW_RECTANGLE(x=100, y=100, width=200, height=100) - Draw a rectangle
- DRAW_ARROW(x1=50, y1=100, x2=200, y2=100) - Draw an arrow
- CLEAR_BOARD() - Clear the whiteboard

FORMAT YOUR RESPONSE AS:
Explanation: [Your teaching explanation here]

Drawing Instructions:
[List of DRAW commands, one per line]

EXAMPLE:
Explanation: Let me explain Ohm's Law! Ohm's Law states that voltage equals current times resistance. It's like water flowing through a pipe - the voltage is the pressure, current is the flow rate, and resistance is how narrow the pipe is.

Drawing Instructions:
DRAW_TEXT('Ohm\\'s Law: V = I × R', x=50, y=50)
DRAW_RECTANGLE(x=100, y=100, width=150, height=80)
DRAW_TEXT('V (Voltage)', x=110, y=130)
DRAW_ARROW(x1=180, y1=140, x2=220, y2=140)
DRAW_TEXT('I (Current)', x=230, y=130)
DRAW_TEXT('R (Resistance)', x=120, y=200)`;

  /**
   * Get AI teacher response for a student message
   */
  static async getTeacherResponse(
    studentMessage: string
  ): Promise<AITeacherResponse> {
    try {
      // Check if OpenAI client is available
      if (!openaiClient) {
        logger.warn('[OpenAI] Client not available, using fallback response');
        return this.getFallbackResponse(studentMessage);
      }
      // Build conversation history
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.systemPrompt
        }
      ];

      // Add current student message
      messages.push({
        role: 'user',
        content: studentMessage
      });

      logger.info(`[OpenAI] Sending request for student message: "${studentMessage}"`);

      // Make API call to GPT-4
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4', // Use GPT-4 for best teaching quality
        messages,
        max_tokens: 1000,
        temperature: 0.7, // Balanced creativity and consistency
        top_p: 0.9,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the response
      const parsed = this.parseTeacherResponse(response);
      
      logger.info(`[OpenAI] Generated response with ${parsed.drawingInstructions.length} drawing instructions`);
      
      return parsed;

    } catch (error: any) {
      logger.error(`[OpenAI] Error getting teacher response: ${error.message}`);
      
      // Return fallback response
      return this.getFallbackResponse(studentMessage);
    }
  }

  /**
   * Parse the AI response into explanation and drawing instructions
   */
  private static parseTeacherResponse(response: string): AITeacherResponse {
    const lines = response.split('\n');
    let explanation = '';
    let drawingInstructions: string[] = [];
    let inDrawingSection = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.toLowerCase().startsWith('explanation:')) {
        explanation = trimmedLine.substring(12).trim();
        inDrawingSection = false;
      } else if (trimmedLine.toLowerCase().includes('drawing instructions:')) {
        inDrawingSection = true;
      } else if (inDrawingSection && trimmedLine) {
        // Only add lines that look like drawing commands
        if (trimmedLine.toUpperCase().includes('DRAW_') || trimmedLine.toUpperCase().includes('CLEAR_')) {
          drawingInstructions.push(trimmedLine);
        }
      } else if (!inDrawingSection && trimmedLine && !explanation) {
        // If no "Explanation:" prefix found, treat first non-empty line as explanation
        explanation = trimmedLine;
      } else if (!inDrawingSection && explanation) {
        // Continue building explanation if we haven't hit drawing section
        explanation += ' ' + trimmedLine;
      }
    }

    // If we didn't find a proper explanation, use the whole response
    if (!explanation) {
      explanation = response.trim();
    }

    return {
      explanation: explanation.trim(),
      drawingInstructions
    };
  }

  /**
   * Fallback response when OpenAI API fails
   */
  private static getFallbackResponse(studentMessage: string): AITeacherResponse {
    const lowerMessage = studentMessage.toLowerCase();
    
    let explanation = "I'd love to help you learn about that topic! ";
    let drawingInstructions: string[] = [];

    if (lowerMessage.includes('math') || lowerMessage.includes('equation')) {
      explanation += "Mathematics is all about understanding patterns and relationships. Let me show you a basic example.";
      drawingInstructions = [
        "DRAW_TEXT('Math Example: 2 + 2 = 4', x=50, y=50)",
        "DRAW_CIRCLE(x=100, y=120, radius=20)",
        "DRAW_TEXT('2', x=95, y=125)",
        "DRAW_TEXT('+', x=130, y=125)",
        "DRAW_CIRCLE(x=160, y=120, radius=20)",
        "DRAW_TEXT('2', x=155, y=125)",
        "DRAW_TEXT('=', x=190, y=125)",
        "DRAW_TEXT('4', x=210, y=125)"
      ];
    } else if (lowerMessage.includes('science') || lowerMessage.includes('physics')) {
      explanation += "Science helps us understand how the world works. Let me draw a simple concept for you.";
      drawingInstructions = [
        "DRAW_TEXT('Science: Force = Mass × Acceleration', x=50, y=50)",
        "DRAW_RECTANGLE(x=100, y=100, width=80, height=60)",
        "DRAW_TEXT('Object', x=125, y=135)",
        "DRAW_ARROW(x1=200, y1=130, x2=280, y2=130)",
        "DRAW_TEXT('Force', x=285, y=135)"
      ];
    } else {
      explanation += "Can you tell me more about what specific aspect you'd like to explore? I'm here to help you understand!";
      drawingInstructions = [
        "DRAW_TEXT('Let\\'s Learn Together! 🎓', x=50, y=50)",
        "DRAW_TEXT('Ask me anything and I\\'ll explain step by step', x=50, y=100)"
      ];
    }

    return { explanation, drawingInstructions };
  }

  /**
   * Validate drawing instruction format
   */
  static validateDrawingInstruction(instruction: string): boolean {
    const validCommands = ['DRAW_TEXT', 'DRAW_LINE', 'DRAW_CIRCLE', 'DRAW_RECTANGLE', 'DRAW_ARROW', 'CLEAR_BOARD'];
    return validCommands.some(cmd => instruction.toUpperCase().includes(cmd));
  }
}

export default OpenAIService;
