/**
 * AI Teaching Engine - Core Logic and Prompt Templates
 * Handles AI teaching interactions with context-aware responses
 */

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface TeachingContext {
  topic: string;
  level: DifficultyLevel;
  previousQA: QAPair[];
  sessionId: string;
  userPreferences?: {
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    pace?: 'slow' | 'normal' | 'fast';
    examples?: boolean;
  };
}

export interface QAPair {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  topic: string;
  level: DifficultyLevel;
}

export interface TeachingResponse {
  text: string;
  whiteboardActions?: WhiteboardAction[];
  followUpQuestions?: string[];
  difficulty?: DifficultyLevel;
  resources?: TeachingResource[];
}

export interface WhiteboardAction {
  type: 'text' | 'diagram' | 'arrow' | 'highlight' | 'formula';
  content: string;
  position: { x: number; y: number };
  properties?: {
    color?: string;
    fontSize?: number;
    style?: string;
  };
}

export interface TeachingResource {
  type: 'link' | 'video' | 'exercise' | 'reading';
  title: string;
  description: string;
  url?: string;
  content?: string;
}

/**
 * AI Teaching Prompt Templates
 */
export class TeachingPrompts {
  /**
   * Generate explanation prompt based on topic and level
   */
  static generateExplanationPrompt(topic: string, level: DifficultyLevel, context?: TeachingContext): string {
    const levelInstructions = {
      beginner: 'Explain in simple terms with basic examples. Use everyday analogies and avoid technical jargon.',
      intermediate: 'Provide a balanced explanation with some technical details and practical examples.',
      advanced: 'Give a comprehensive explanation with technical depth, complex examples, and related concepts.'
    };

    const contextualInfo = context?.previousQA?.length 
      ? `\n\nPrevious conversation context:\n${context.previousQA.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n')}`
      : '';

    return `You are an expert teacher. Explain "${topic}" like a school teacher to a ${level} student.

${levelInstructions[level]}

Instructions:
- Start with a clear, engaging introduction
- Break down complex concepts into digestible parts  
- Use relevant examples and analogies
- End with a summary and check for understanding
- Suggest visual aids or diagrams when helpful
- Keep the tone encouraging and supportive

${contextualInfo}

Please provide a comprehensive teaching response:`;
  }

  /**
   * Generate diagram prompt for visual learning
   */
  static generateDiagramPrompt(concept: string, level: DifficultyLevel): string {
    return `Create a labeled diagram to illustrate "${concept}" for a ${level} student.

Instructions:
- Design a clear, educational diagram
- Include appropriate labels and annotations
- Use simple shapes and arrows to show relationships
- Add brief explanations for each component
- Make it visually appealing and easy to understand

Provide the diagram description and whiteboard actions needed to create it:`;
  }

  /**
   * Generate follow-up questions based on topic
   */
  static generateFollowUpPrompt(topic: string, level: DifficultyLevel, previousAnswer: string): string {
    return `Based on the explanation of "${topic}" for a ${level} student, generate 3 thoughtful follow-up questions that:

1. Test understanding of key concepts
2. Encourage deeper thinking
3. Connect to related topics or real-world applications

Previous explanation: "${previousAnswer}"

Provide questions that match the ${level} difficulty level:`;
  }

  /**
   * Generate assessment prompt to gauge understanding
   */
  static generateAssessmentPrompt(topic: string, level: DifficultyLevel, studentResponse: string): string {
    return `Assess the student's understanding of "${topic}" based on their response.

Student Response: "${studentResponse}"
Level: ${level}

Please:
1. Identify what they understood correctly
2. Point out any misconceptions gently
3. Suggest areas for improvement
4. Recommend next learning steps
5. Provide encouraging feedback

Response should be constructive and supportive:`;
  }

  /**
   * Generate mathematical explanation prompt
   */
  static generateMathPrompt(concept: string, level: DifficultyLevel): string {
    const levelGuidance = {
      beginner: 'Use basic arithmetic and simple visual representations',
      intermediate: 'Include algebraic concepts and moderate complexity',
      advanced: 'Use advanced mathematical notation and complex problem-solving'
    };

    return `Explain the mathematical concept "${concept}" for a ${level} student.

${levelGuidance[level]}

Include:
- Mathematical notation and formulas (use LaTeX format)
- Step-by-step worked examples
- Visual representations or graphs when helpful
- Common mistakes to avoid
- Practice problems appropriate for the level

Provide both textual explanation and any mathematical formulas:`;
  }
}

/**
 * AI Teaching Engine Class
 */
export class AITeachingEngine {
  private sessionMemory: Map<string, QAPair[]> = new Map();
  private readonly maxMemorySize = 5;

  /**
   * Add Q&A pair to session memory
   */
  addToMemory(sessionId: string, qa: QAPair): void {
    if (!this.sessionMemory.has(sessionId)) {
      this.sessionMemory.set(sessionId, []);
    }

    const memory = this.sessionMemory.get(sessionId)!;
    memory.push(qa);

    // Keep only last 5 Q&A pairs
    if (memory.length > this.maxMemorySize) {
      memory.shift();
    }
  }

  /**
   * Get session memory for context
   */
  getSessionMemory(sessionId: string): QAPair[] {
    return this.sessionMemory.get(sessionId) || [];
  }

  /**
   * Clear session memory
   */
  clearSessionMemory(sessionId: string): void {
    this.sessionMemory.delete(sessionId);
  }

  /**
   * Generate teaching context
   */
  createTeachingContext(
    topic: string,
    level: DifficultyLevel,
    sessionId: string,
    userPreferences?: TeachingContext['userPreferences']
  ): TeachingContext {
    return {
      topic,
      level,
      previousQA: this.getSessionMemory(sessionId),
      sessionId,
      userPreferences
    };
  }

  /**
   * Determine appropriate difficulty level based on student response
   */
  assessDifficultyLevel(response: string, currentLevel: DifficultyLevel): DifficultyLevel {
    const responseLength = response.length;
    const complexity = this.analyzeComplexity(response);
    
    // Simple heuristic for level adjustment
    if (complexity.score > 0.7 && responseLength > 100) {
      return currentLevel === 'beginner' ? 'intermediate' : 'advanced';
    } else if (complexity.score < 0.3 || responseLength < 30) {
      return currentLevel === 'advanced' ? 'intermediate' : 'beginner';
    }
    
    return currentLevel;
  }

  /**
   * Analyze response complexity (simplified)
   */
  private analyzeComplexity(text: string): { score: number; indicators: string[] } {
    const complexWords = ['therefore', 'however', 'furthermore', 'consequently', 'demonstrate'];
    const technicalTerms = ['algorithm', 'function', 'variable', 'parameter', 'implementation'];
    
    const words = text.toLowerCase().split(/\s+/);
    const complexCount = words.filter(word => complexWords.includes(word)).length;
    const technicalCount = words.filter(word => technicalTerms.includes(word)).length;
    
    const score = Math.min(1, (complexCount + technicalCount) / words.length * 10);
    
    return {
      score,
      indicators: [
        `Complex words: ${complexCount}`,
        `Technical terms: ${technicalCount}`,
        `Total words: ${words.length}`
      ]
    };
  }

  /**
   * Generate whiteboard actions for teaching
   */
  generateWhiteboardActions(topic: string, level: DifficultyLevel): WhiteboardAction[] {
    // This would be enhanced with actual AI logic
    const actions: WhiteboardAction[] = [];

    // Add title
    actions.push({
      type: 'text',
      content: topic.toUpperCase(),
      position: { x: 100, y: 50 },
      properties: { fontSize: 24, color: '#2563eb' }
    });

    // Add level-appropriate content
    if (level === 'beginner') {
      actions.push({
        type: 'text',
        content: 'Key Points:',
        position: { x: 100, y: 120 },
        properties: { fontSize: 18, color: '#dc2626' }
      });
    }

    return actions;
  }

  /**
   * Parse AI response and extract whiteboard actions
   */
  parseAIResponse(aiResponse: string): TeachingResponse {
    // This is a simplified parser - in production, you'd use more sophisticated NLP
    const lines = aiResponse.split('\n');
    let text = '';
    const whiteboardActions: WhiteboardAction[] = [];
    const followUpQuestions: string[] = [];

    let currentSection = 'text';
    
    for (const line of lines) {
      if (line.includes('[DIAGRAM]')) {
        currentSection = 'diagram';
        continue;
      } else if (line.includes('[QUESTIONS]')) {
        currentSection = 'questions';
        continue;
      } else if (line.includes('[/DIAGRAM]') || line.includes('[/QUESTIONS]')) {
        currentSection = 'text';
        continue;
      }

      switch (currentSection) {
        case 'text':
          text += line + '\n';
          break;
        case 'diagram':
          // Parse diagram instructions
          if (line.trim()) {
            whiteboardActions.push({
              type: 'text',
              content: line.trim(),
              position: { x: 100, y: whiteboardActions.length * 30 + 100 }
            });
          }
          break;
        case 'questions':
          if (line.trim()) {
            followUpQuestions.push(line.trim());
          }
          break;
      }
    }

    return {
      text: text.trim(),
      whiteboardActions: whiteboardActions.length > 0 ? whiteboardActions : undefined,
      followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : undefined
    };
  }
}

export default AITeachingEngine;
