import { logger } from './logger';

export interface AITeacherResponse {
  explanation: string;
  drawingInstructions: string[];
}

export class FreeAITeacher {
  
  /**
   * Generate AI teacher response using free methods
   */
  static async getTeacherResponse(studentMessage: string): Promise<AITeacherResponse> {
    try {
      logger.info(`[Free AI] Processing student message: "${studentMessage}"`);
      
      // Use advanced pattern matching and knowledge base
      const response = this.generateIntelligentResponse(studentMessage);
      
      logger.info(`[Free AI] Generated response with ${response.drawingInstructions.length} drawing instructions`);
      
      return response;
      
    } catch (error: any) {
      logger.error(`[Free AI] Error generating response: ${error.message}`);
      return this.getFallbackResponse();
    }
  }

  /**
   * Advanced pattern matching and knowledge base system
   */
  private static generateIntelligentResponse(message: string): AITeacherResponse {
    const lowerMessage = message.toLowerCase();
    
    // Mathematics topics - more specific pattern matching
    if (this.isAbout(lowerMessage, ['multiplication', 'multiply', 'times', '*']) || 
        (this.isAbout(lowerMessage, ['math']) && this.isAbout(lowerMessage, ['multiplication', 'multiply']))) {
      return this.getMathResponse(lowerMessage);
    }
    
    // General math topics
    if (this.isAbout(lowerMessage, ['math', 'mathematics', 'equation', 'algebra', 'geometry', 'calculus', 'arithmetic', 'addition', 'subtraction', 'division', 'fraction'])) {
      return this.getMathResponse(lowerMessage);
    }
    
    // Science topics - more specific checks
    if (this.isAbout(lowerMessage, ['gravity', 'fall', 'falling', 'newton']) ||
        (this.isAbout(lowerMessage, ['explain', 'what is']) && this.isAbout(lowerMessage, ['gravity']))) {
      return this.getScienceResponse(lowerMessage);
    }
    
    // General science topics
    if (this.isAbout(lowerMessage, ['science', 'physics', 'chemistry', 'biology', 'force', 'energy', 'atom', 'cell', 'photosynthesis', 'molecule'])) {
      return this.getScienceResponse(lowerMessage);
    }
    
    // Programming topics - more specific
    if (this.isAbout(lowerMessage, ['javascript', 'function']) && this.isAbout(lowerMessage, ['write', 'how', 'create'])) {
      return this.getProgrammingResponse(lowerMessage);
    }
    
    // General programming
    if (this.isAbout(lowerMessage, ['programming', 'code', 'javascript', 'python', 'html', 'css', 'function', 'variable', 'algorithm'])) {
      return this.getProgrammingResponse(lowerMessage);
    }
    
    // History topics - specific
    if (this.isAbout(lowerMessage, ['ancient egypt', 'egypt', 'pyramid', 'pharaoh']) ||
        (this.isAbout(lowerMessage, ['tell me about', 'about']) && this.isAbout(lowerMessage, ['ancient egypt', 'egypt']))) {
      return this.getHistoryResponse(lowerMessage);
    }
    
    // General history
    if (this.isAbout(lowerMessage, ['history', 'war', 'ancient', 'civilization', 'empire', 'revolution', 'historical'])) {
      return this.getHistoryResponse(lowerMessage);
    }
    
    // Language and literature
    if (this.isAbout(lowerMessage, ['language', 'english', 'grammar', 'literature', 'writing', 'essay', 'poem', 'story'])) {
      return this.getLanguageResponse(lowerMessage);
    }
    
    // Geography - specific
    if (this.isAbout(lowerMessage, ['seven continents', 'continents']) ||
        (this.isAbout(lowerMessage, ['what are']) && this.isAbout(lowerMessage, ['continents']))) {
      return this.getGeographyResponse(lowerMessage);
    }
    
    // General geography
    if (this.isAbout(lowerMessage, ['geography', 'country', 'capital', 'continent', 'ocean', 'mountain', 'river', 'climate'])) {
      return this.getGeographyResponse(lowerMessage);
    }
    
    // Learning and study questions - specific
    if (this.isAbout(lowerMessage, ['study better', 'how can i study', 'learning strategies']) ||
        (this.isAbout(lowerMessage, ['how']) && this.isAbout(lowerMessage, ['study', 'learn']))) {
      return this.getGeneralLearningResponse(lowerMessage);
    }
    
    // General learning questions
    if (this.isAbout(lowerMessage, ['learn', 'study', 'help', 'explain', 'understand', 'teach', 'how', 'what', 'why'])) {
      return this.getGeneralLearningResponse(lowerMessage);
    }
    
    // Greetings and general conversation
    if (this.isAbout(lowerMessage, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'thanks', 'thank you'])) {
      return this.getGreetingResponse(lowerMessage);
    }
    
    // Default intelligent response
    return this.getAdaptiveResponse(lowerMessage);
  }

  /**
   * Mathematics responses with visual examples
   */
  private static getMathResponse(message: string): AITeacherResponse {
    if (this.isAbout(message, ['addition', 'add', 'plus', '+'])) {
      return {
        explanation: "Addition is one of the fundamental operations in mathematics! When we add numbers, we're combining quantities together. For example, 5 + 3 = 8 means we start with 5 and add 3 more to get 8. Think of it like combining groups of objects - if you have 5 apples and someone gives you 3 more, you'll have 8 apples total!",
        drawingInstructions: [
          "DRAW_TEXT('Addition Example: 5 + 3 = 8', x=50, y=30)",
          "DRAW_CIRCLE(x=80, y=80, radius=15)",
          "DRAW_CIRCLE(x=110, y=80, radius=15)",
          "DRAW_CIRCLE(x=140, y=80, radius=15)",
          "DRAW_CIRCLE(x=170, y=80, radius=15)",
          "DRAW_CIRCLE(x=200, y=80, radius=15)",
          "DRAW_TEXT('5 apples', x=60, y=120)",
          "DRAW_TEXT('+', x=230, y=85)",
          "DRAW_CIRCLE(x=260, y=80, radius=15)",
          "DRAW_CIRCLE(x=290, y=80, radius=15)",
          "DRAW_CIRCLE(x=320, y=80, radius=15)",
          "DRAW_TEXT('3 apples', x=240, y=120)",
          "DRAW_TEXT('=', x=350, y=85)",
          "DRAW_TEXT('8 apples total', x=380, y=85)"
        ]
      };
    }
    
    if (this.isAbout(message, ['multiplication', 'multiply', 'times', '*', 'x'])) {
      return {
        explanation: "Multiplication is like repeated addition! When we multiply 4 × 3, it means adding 4 three times: 4 + 4 + 4 = 12. You can think of it as making groups or arrays. Imagine having 3 rows with 4 items in each row - that gives you 12 items total!",
        drawingInstructions: [
          "DRAW_TEXT('Multiplication: 4 × 3 = 12', x=50, y=30)",
          "DRAW_TEXT('4 + 4 + 4 = 12', x=50, y=60)",
          "DRAW_RECTANGLE(x=50, y=100, width=20, height=20)",
          "DRAW_RECTANGLE(x=80, y=100, width=20, height=20)",
          "DRAW_RECTANGLE(x=110, y=100, width=20, height=20)",
          "DRAW_RECTANGLE(x=140, y=100, width=20, height=20)",
          "DRAW_RECTANGLE(x=50, y=130, width=20, height=20)",
          "DRAW_RECTANGLE(x=80, y=130, width=20, height=20)",
          "DRAW_RECTANGLE(x=110, y=130, width=20, height=20)",
          "DRAW_RECTANGLE(x=140, y=130, width=20, height=20)",
          "DRAW_RECTANGLE(x=50, y=160, width=20, height=20)",
          "DRAW_RECTANGLE(x=80, y=160, width=20, height=20)",
          "DRAW_RECTANGLE(x=110, y=160, width=20, height=20)",
          "DRAW_RECTANGLE(x=140, y=160, width=20, height=20)",
          "DRAW_TEXT('3 rows × 4 columns = 12 squares', x=50, y=200)"
        ]
      };
    }
    
    if (this.isAbout(message, ['fraction', 'fractions', 'half', 'quarter', 'third'])) {
      return {
        explanation: "Fractions represent parts of a whole! A fraction like 1/2 means one part out of two equal parts. Think of a pizza cut into slices - if you eat 1 slice out of 4 total slices, you've eaten 1/4 of the pizza. The top number (numerator) tells us how many parts we have, and the bottom number (denominator) tells us how many total parts the whole was divided into.",
        drawingInstructions: [
          "DRAW_TEXT('Understanding Fractions', x=50, y=30)",
          "DRAW_CIRCLE(x=150, y=120, radius=50)",
          "DRAW_LINE(x1=150, y1=70, x2=150, y2=170)",
          "DRAW_LINE(x1=100, y1=120, x2=200, y2=120)",
          "DRAW_TEXT('1/4', x=120, y=100)",
          "DRAW_TEXT('1/4', x=170, y=100)",
          "DRAW_TEXT('1/4', x=120, y=150)",
          "DRAW_TEXT('1/4', x=170, y=150)",
          "DRAW_TEXT('Pizza divided into 4 equal parts', x=50, y=200)",
          "DRAW_TEXT('Each slice = 1/4 of the whole pizza', x=50, y=220)"
        ]
      };
    }
    
    // Default math response
    return {
      explanation: "Mathematics is all about patterns, logic, and problem-solving! Every math concept builds on previous ones, like climbing stairs. Whether it's basic arithmetic, algebra, geometry, or calculus, math helps us understand and describe the world around us. What specific math topic would you like to explore? I can help with addition, subtraction, multiplication, division, fractions, geometry, and much more!",
      drawingInstructions: [
        "DRAW_TEXT('Mathematics - The Language of the Universe', x=50, y=30)",
        "DRAW_TEXT('Numbers → Arithmetic → Algebra → Calculus', x=50, y=70)",
        "DRAW_RECTANGLE(x=50, y=100, width=80, height=40)",
        "DRAW_TEXT('Arithmetic', x=60, y=125)",
        "DRAW_RECTANGLE(x=150, y=100, width=80, height=40)",
        "DRAW_TEXT('Geometry', x=165, y=125)",
        "DRAW_RECTANGLE(x=250, y=100, width=80, height=40)",
        "DRAW_TEXT('Algebra', x=270, y=125)",
        "DRAW_TEXT('What math topic interests you?', x=50, y=180)"
      ]
    };
  }

  /**
   * Science responses with experiments and examples
   */
  private static getScienceResponse(message: string): AITeacherResponse {
    if (this.isAbout(message, ['gravity', 'fall', 'falling', 'weight', 'newton'])) {
      return {
        explanation: "Gravity is the force that pulls objects toward each other! On Earth, gravity pulls everything toward the center of our planet. That's why when you drop a ball, it falls down instead of floating away. Sir Isaac Newton discovered that the same force that makes apples fall from trees also keeps the Moon orbiting around Earth! The strength of gravity depends on the mass of objects and the distance between them.",
        drawingInstructions: [
          "DRAW_TEXT('Gravity - The Force That Pulls Us Down', x=50, y=30)",
          "DRAW_CIRCLE(x=150, y=200, radius=80)",
          "DRAW_TEXT('Earth', x=135, y=205)",
          "DRAW_CIRCLE(x=150, y=100, radius=10)",
          "DRAW_TEXT('Apple', x=120, y=95)",
          "DRAW_ARROW(x1=150, y1=110, x2=150, y2=170)",
          "DRAW_TEXT('Gravity pulls apple down', x=180, y=135)",
          "DRAW_TEXT('F = mg (Force = mass × gravity)', x=50, y=320)",
          "DRAW_TEXT('On Earth: g = 9.8 m/s²', x=50, y=350)"
        ]
      };
    }
    
    if (this.isAbout(message, ['atom', 'atoms', 'molecule', 'electrons', 'protons', 'neutrons'])) {
      return {
        explanation: "Atoms are the tiny building blocks of everything around us! An atom is so small that millions could fit on the period at the end of this sentence. Every atom has a nucleus (center) containing protons and neutrons, with electrons spinning around it. It's like a tiny solar system! Different combinations of protons, neutrons, and electrons create different elements like hydrogen, oxygen, and carbon.",
        drawingInstructions: [
          "DRAW_TEXT('The Amazing Atom', x=50, y=30)",
          "DRAW_CIRCLE(x=200, y=150, radius=8)",
          "DRAW_TEXT('Nucleus', x=170, y=170)",
          "DRAW_TEXT('(Protons + Neutrons)', x=140, y=185)",
          "DRAW_CIRCLE(x=200, y=150, radius=40)",
          "DRAW_CIRCLE(x=200, y=150, radius=60)",
          "DRAW_CIRCLE(x=200, y=150, radius=80)",
          "DRAW_CIRCLE(x=240, y=150, radius=3)",
          "DRAW_CIRCLE(x=160, y=150, radius=3)",
          "DRAW_CIRCLE(x=200, y=110, radius=3)",
          "DRAW_CIRCLE(x=200, y=190, radius=3)",
          "DRAW_TEXT('Electrons orbit around nucleus', x=50, y=250)",
          "DRAW_TEXT('99.9% of atom is empty space!', x=50, y=280)"
        ]
      };
    }
    
    if (this.isAbout(message, ['photosynthesis', 'plants', 'chlorophyll', 'oxygen', 'carbon dioxide'])) {
      return {
        explanation: "Photosynthesis is how plants make their own food using sunlight! Plants take in carbon dioxide from the air and water from their roots, then use energy from sunlight to convert these into glucose (sugar) and oxygen. The green chemical chlorophyll in leaves captures the sunlight. This amazing process not only feeds the plant but also produces the oxygen we breathe! It's like nature's solar panels.",
        drawingInstructions: [
          "DRAW_TEXT('Photosynthesis - Nature\\'s Solar Power', x=50, y=30)",
          "DRAW_CIRCLE(x=100, y=80, radius=30)",
          "DRAW_TEXT('Sun', x=85, y=85)",
          "DRAW_ARROW(x1=130, y1=100, x2=180, y2=120)",
          "DRAW_TEXT('Sunlight', x=140, y=95)",
          "DRAW_RECTANGLE(x=180, y=120, width=100, height=80)",
          "DRAW_TEXT('Leaf', x=215, y=165)",
          "DRAW_TEXT('CO₂ + H₂O + Sunlight', x=50, y=220)",
          "DRAW_ARROW(x1=200, y1=225, x2=250, y2=225)",
          "DRAW_TEXT('→ Glucose + O₂', x=260, y=230)",
          "DRAW_TEXT('Plants feed themselves & give us oxygen!', x=50, y=260)"
        ]
      };
    }
    
    // Default science response
    return {
      explanation: "Science is the amazing study of how our world works! From the tiniest atoms to the largest galaxies, science helps us understand everything around us. Physics explains forces and energy, chemistry shows us how substances interact, biology reveals the secrets of life, and earth science teaches us about our planet. Science is all about asking questions, making observations, and discovering the incredible patterns in nature!",
      drawingInstructions: [
        "DRAW_TEXT('Science - Understanding Our World', x=50, y=30)",
        "DRAW_CIRCLE(x=100, y=100, radius=30)",
        "DRAW_TEXT('Physics', x=85, y=105)",
        "DRAW_CIRCLE(x=200, y=100, radius=30)",
        "DRAW_TEXT('Chemistry', x=175, y=105)",
        "DRAW_CIRCLE(x=300, y=100, radius=30)",
        "DRAW_TEXT('Biology', x=285, y=105)",
        "DRAW_CIRCLE(x=150, y=180, radius=30)",
        "DRAW_TEXT('Earth', x=135, y=185)",
        "DRAW_CIRCLE(x=250, y=180, radius=30)",
        "DRAW_TEXT('Space', x=235, y=185)",
        "DRAW_TEXT('Ask questions → Observe → Discover!', x=50, y=250)"
      ]
    };
  }

  /**
   * Programming responses with code examples
   */
  private static getProgrammingResponse(message: string): AITeacherResponse {
    if (this.isAbout(message, ['javascript', 'js', 'function', 'variable', 'web development'])) {
      return {
        explanation: "JavaScript is an awesome programming language that brings websites to life! It's like giving instructions to a computer in a language it understands. Variables are like labeled boxes where you store information, and functions are like recipes that tell the computer what steps to follow. JavaScript runs in web browsers and can make websites interactive, responsive, and dynamic!",
        drawingInstructions: [
          "DRAW_TEXT('JavaScript - The Language of the Web', x=50, y=30)",
          "DRAW_RECTANGLE(x=50, y=60, width=300, height=40)",
          "DRAW_TEXT('let message = \"Hello, World!\";', x=60, y=85)",
          "DRAW_RECTANGLE(x=50, y=120, width=300, height=60)",
          "DRAW_TEXT('function greet(name) {', x=60, y=140)",
          "DRAW_TEXT('  return \"Hello, \" + name + \"!\";', x=60, y=160)",
          "DRAW_TEXT('}', x=60, y=180)",
          "DRAW_TEXT('Variables store data', x=50, y=210)",
          "DRAW_TEXT('Functions perform actions', x=50, y=230)",
          "DRAW_TEXT('JavaScript makes websites interactive!', x=50, y=260)"
        ]
      };
    }
    
    if (this.isAbout(message, ['python', 'programming', 'code', 'algorithm'])) {
      return {
        explanation: "Python is a fantastic programming language that's perfect for beginners! It reads almost like English, making it easy to understand. Python can do everything from building websites to analyzing data, creating games, and even controlling robots! An algorithm is like a recipe - it's a step-by-step set of instructions that tells the computer exactly what to do to solve a problem.",
        drawingInstructions: [
          "DRAW_TEXT('Python - Programming Made Simple', x=50, y=30)",
          "DRAW_RECTANGLE(x=50, y=60, width=280, height=80)",
          "DRAW_TEXT('# Simple Python program', x=60, y=80)",
          "DRAW_TEXT('name = input(\"What\\'s your name?\")', x=60, y=100)",
          "DRAW_TEXT('print(f\"Hello, {name}!\")', x=60, y=120)",
          "DRAW_TEXT('Easy to read and write!', x=50, y=160)",
          "DRAW_TEXT('Algorithm: Step-by-step instructions', x=50, y=190)",
          "DRAW_TEXT('1. Get input  2. Process  3. Output', x=50, y=210)"
        ]
      };
    }
    
    if (this.isAbout(message, ['html', 'css', 'website', 'web page'])) {
      return {
        explanation: "HTML and CSS are the building blocks of websites! HTML (HyperText Markup Language) creates the structure and content of web pages - like the skeleton of a house. CSS (Cascading Style Sheets) makes websites look beautiful by adding colors, fonts, layouts, and animations - like decorating and painting the house. Together, they create the amazing websites you see every day!",
        drawingInstructions: [
          "DRAW_TEXT('HTML + CSS = Beautiful Websites', x=50, y=30)",
          "DRAW_RECTANGLE(x=50, y=60, width=120, height=100)",
          "DRAW_TEXT('HTML', x=90, y=85)",
          "DRAW_TEXT('Structure', x=80, y=105)",
          "DRAW_TEXT('Content', x=85, y=125)",
          "DRAW_TEXT('Text, Images', x=70, y=145)",
          "DRAW_TEXT('+', x=190, y=110)",
          "DRAW_RECTANGLE(x=220, y=60, width=120, height=100)",
          "DRAW_TEXT('CSS', x=265, y=85)",
          "DRAW_TEXT('Styling', x=255, y=105)",
          "DRAW_TEXT('Colors', x=255, y=125)",
          "DRAW_TEXT('Layout', x=255, y=145)",
          "DRAW_TEXT('= Amazing Websites!', x=130, y=190)"
        ]
      };
    }
    
    // Default programming response
    return {
      explanation: "Programming is like learning a superpower! You can create apps, websites, games, and solve real-world problems by writing code. Programming languages are tools that let you communicate with computers. Start with basics like variables (storing data), functions (reusable code blocks), and loops (repeating actions). The key is practice and breaking big problems into smaller, manageable steps!",
      drawingInstructions: [
        "DRAW_TEXT('Programming - Your Digital Superpower', x=50, y=30)",
        "DRAW_TEXT('Problem → Algorithm → Code → Solution', x=50, y=60)",
        "DRAW_RECTANGLE(x=50, y=90, width=80, height=50)",
        "DRAW_TEXT('Variables', x=70, y=120)",
        "DRAW_RECTANGLE(x=150, y=90, width=80, height=50)",
        "DRAW_TEXT('Functions', x=170, y=120)",
        "DRAW_RECTANGLE(x=250, y=90, width=80, height=50)",
        "DRAW_TEXT('Loops', x=275, y=120)",
        "DRAW_TEXT('Start simple, think big, practice daily!', x=50, y=180)"
      ]
    };
  }

  /**
   * History responses with timelines and context
   */
  private static getHistoryResponse(message: string): AITeacherResponse {
    if (this.isAbout(message, ['ancient egypt', 'pyramid', 'pharaoh', 'mummy', 'nile'])) {
      return {
        explanation: "Ancient Egypt was one of the most fascinating civilizations in history! The Egyptians built incredible pyramids that still stand today, over 4,000 years later. They developed hieroglyphics (picture writing), created mummies to preserve bodies for the afterlife, and built their civilization along the Nile River. The pharaohs were their kings and queens, considered to be gods on Earth. Egypt gave us so many innovations including paper (papyrus), medicine, and mathematics!",
        drawingInstructions: [
          "DRAW_TEXT('Ancient Egypt - Land of Wonders', x=50, y=30)",
          "DRAW_TRIANGLE(x1=150, y1=60, x2=120, y2=120, x3=180, y3=120)",
          "DRAW_TRIANGLE(x1=200, y1=70, x2=180, y2=120, x3=220, y3=120)",
          "DRAW_TRIANGLE(x1=240, y1=80, x2=220, y2=120, x3=260, y3=120)",
          "DRAW_TEXT('Pyramids of Giza', x=130, y=140)",
          "DRAW_LINE(x1=50, y1=180, x2=350, y2=180)",
          "DRAW_TEXT('Nile River', x=180, y=200)",
          "DRAW_TEXT('3100 BCE - 30 BCE (3000+ years!)', x=50, y=230)",
          "DRAW_TEXT('Hieroglyphs, Mummies, Mathematics', x=50, y=260)"
        ]
      };
    }
    
    if (this.isAbout(message, ['world war', 'wwii', 'ww2', 'hitler', 'allies'])) {
      return {
        explanation: "World War II (1939-1945) was a global conflict that changed the world forever. It began when Nazi Germany, led by Adolf Hitler, invaded Poland. The war involved most countries, with the main Allied powers (Britain, Soviet Union, USA, and others) fighting against the Axis powers (Germany, Japan, Italy). The war ended when the Allies defeated the Axis powers, but not before millions of lives were lost. It led to the creation of the United Nations and reshaped global politics.",
        drawingInstructions: [
          "DRAW_TEXT('World War II (1939-1945)', x=50, y=30)",
          "DRAW_TEXT('Timeline:', x=50, y=60)",
          "DRAW_LINE(x1=50, y1=80, x2=350, y2=80)",
          "DRAW_TEXT('1939', x=50, y=100)",
          "DRAW_TEXT('War begins', x=45, y=115)",
          "DRAW_TEXT('1941', x=150, y=100)",
          "DRAW_TEXT('US enters', x=145, y=115)",
          "DRAW_TEXT('1945', x=250, y=100)",
          "DRAW_TEXT('War ends', x=245, y=115)",
          "DRAW_TEXT('Allies vs Axis Powers', x=50, y=150)",
          "DRAW_TEXT('Led to UN formation & modern world', x=50, y=180)"
        ]
      };
    }
    
    // Default history response
    return {
      explanation: "History is the incredible story of humanity! Every event, every person, and every civilization has contributed to shaping our world today. From ancient civilizations like Egypt and Rome, to great explorations, revolutions, and wars - history teaches us how societies developed, what mistakes to avoid, and how progress happens. Understanding history helps us make better decisions for the future!",
      drawingInstructions: [
        "DRAW_TEXT('History - The Story of Humanity', x=50, y=30)",
        "DRAW_TEXT('Ancient → Medieval → Modern → Today', x=50, y=60)",
        "DRAW_CIRCLE(x=80, y=120, radius=25)",
        "DRAW_TEXT('Ancient', x=65, y=125)",
        "DRAW_CIRCLE(x=160, y=120, radius=25)",
        "DRAW_TEXT('Medieval', x=140, y=125)",
        "DRAW_CIRCLE(x=240, y=120, radius=25)",
        "DRAW_TEXT('Modern', x=220, y=125)",
        "DRAW_CIRCLE(x=320, y=120, radius=25)",
        "DRAW_TEXT('Today', x=305, y=125)",
        "DRAW_TEXT('Learn from the past to build the future!', x=50, y=180)"
      ]
    };
  }

  /**
   * Language and literature responses
   */
  private static getLanguageResponse(message: string): AITeacherResponse {
    if (this.isAbout(message, ['grammar', 'sentence', 'noun', 'verb', 'adjective'])) {
      return {
        explanation: "Grammar is the set of rules that helps us communicate clearly! Think of it as the blueprint for building sentences. Nouns are people, places, or things (like 'dog', 'school', 'happiness'). Verbs are action words or states of being (like 'run', 'think', 'is'). Adjectives describe nouns (like 'big', 'red', 'funny'). When we put these together following grammar rules, we create clear, meaningful sentences that others can understand!",
        drawingInstructions: [
          "DRAW_TEXT('Grammar - The Building Blocks of Language', x=50, y=30)",
          "DRAW_RECTANGLE(x=50, y=60, width=80, height=40)",
          "DRAW_TEXT('NOUN', x=75, y=85)",
          "DRAW_TEXT('(person, place,', x=55, y=110)",
          "DRAW_TEXT('thing)', x=75, y=125)",
          "DRAW_RECTANGLE(x=150, y=60, width=80, height=40)",
          "DRAW_TEXT('VERB', x=175, y=85)",
          "DRAW_TEXT('(action or', x=160, y=110)",
          "DRAW_TEXT('being)', x=175, y=125)",
          "DRAW_RECTANGLE(x=250, y=60, width=80, height=40)",
          "DRAW_TEXT('ADJECTIVE', x=265, y=85)",
          "DRAW_TEXT('(describes', x=260, y=110)",
          "DRAW_TEXT('nouns)', x=275, y=125)",
          "DRAW_TEXT('Example: The big dog runs quickly.', x=50, y=160)",
          "DRAW_TEXT('adj + noun + verb + adverb', x=50, y=180)"
        ]
      };
    }
    
    if (this.isAbout(message, ['writing', 'essay', 'paragraph', 'story', 'creative writing'])) {
      return {
        explanation: "Writing is a powerful way to express your thoughts and tell stories! Good writing has a clear structure: introduction (hook your reader), body (develop your ideas), and conclusion (wrap it up). Whether you're writing a story, essay, or report, start with brainstorming ideas, then organize them logically. Use descriptive words to paint pictures in readers' minds, and always remember - the best writing comes from rewriting and editing!",
        drawingInstructions: [
          "DRAW_TEXT('The Writing Process', x=50, y=30)",
          "DRAW_CIRCLE(x=100, y=80, radius=30)",
          "DRAW_TEXT('1. Brainstorm', x=75, y=85)",
          "DRAW_ARROW(x1=130, y1=80, x2=170, y2=80)",
          "DRAW_CIRCLE(x=200, y=80, radius=30)",
          "DRAW_TEXT('2. Organize', x=175, y=85)",
          "DRAW_ARROW(x1=230, y1=80, x2=270, y2=80)",
          "DRAW_CIRCLE(x=300, y=80, radius=30)",
          "DRAW_TEXT('3. Write', x=285, y=85)",
          "DRAW_ARROW(x1=300, y1=110, x2=200, y2=140)",
          "DRAW_CIRCLE(x=170, y=150, radius=30)",
          "DRAW_TEXT('4. Edit', x=155, y=155)",
          "DRAW_TEXT('Great writing = Clear thinking!', x=50, y=200)"
        ]
      };
    }
    
    // Default language response
    return {
      explanation: "Language is humanity's greatest invention! It allows us to share ideas, tell stories, and connect with others across time and space. Every language has its own beauty and way of seeing the world. Learning about language - whether it's grammar, vocabulary, literature, or creative writing - helps us communicate more effectively and appreciate the rich diversity of human expression!",
      drawingInstructions: [
        "DRAW_TEXT('Language - Connecting Hearts and Minds', x=50, y=30)",
        "DRAW_CIRCLE(x=120, y=100, radius=40)",
        "DRAW_TEXT('Speaking', x=100, y=105)",
        "DRAW_CIRCLE(x=220, y=100, radius=40)",
        "DRAW_TEXT('Writing', x=205, y=105)",
        "DRAW_CIRCLE(x=170, y=180, radius=40)",
        "DRAW_TEXT('Reading', x=150, y=185)",
        "DRAW_LINE(x1=140, y1=120, x2=200, y2=160)",
        "DRAW_LINE(x1=200, y1=120, x2=150, y2=160)",
        "DRAW_TEXT('All forms work together!', x=50, y=250)"
      ]
    };
  }

  /**
   * Geography responses with maps and locations
   */
  private static getGeographyResponse(message: string): AITeacherResponse {
    if (this.isAbout(message, ['continent', 'continents', 'world', 'map'])) {
      return {
        explanation: "Our Earth has seven amazing continents, each with unique features! Asia is the largest and most populated. Africa is known for its incredible wildlife and the Sahara Desert. North America includes countries like USA, Canada, and Mexico. South America has the Amazon rainforest. Europe has rich history and culture. Australia is both a country and continent. Antarctica is the icy continent at the South Pole. Each continent has different climates, cultures, and landscapes!",
        drawingInstructions: [
          "DRAW_TEXT('Seven Continents of Earth', x=50, y=30)",
          "DRAW_CIRCLE(x=200, y=150, radius=100)",
          "DRAW_TEXT('Earth', x=185, y=155)",
          "DRAW_TEXT('Asia (largest)', x=220, y=80)",
          "DRAW_TEXT('Africa', x=160, y=120)",
          "DRAW_TEXT('N. America', x=120, y=140)",
          "DRAW_TEXT('S. America', x=130, y=180)",
          "DRAW_TEXT('Europe', x=210, y=110)",
          "DRAW_TEXT('Australia', x=260, y=200)",
          "DRAW_TEXT('Antarctica', x=180, y=220)",
          "DRAW_TEXT('7 continents, 195+ countries!', x=50, y=280)"
        ]
      };
    }
    
    // Default geography response
    return {
      explanation: "Geography is the study of our amazing planet Earth! It covers everything from mountains and rivers to countries and cities, weather patterns and ecosystems. Geography helps us understand where things are located, why they're there, and how places connect to each other. From the tallest mountain (Mount Everest) to the deepest ocean (Pacific), our planet is full of incredible features waiting to be explored!",
      drawingInstructions: [
        "DRAW_TEXT('Geography - Exploring Our Planet', x=50, y=30)",
        "DRAW_TRIANGLE(x1=100, y1=60, x2=80, y2=100, x3=120, y3=100)",
        "DRAW_TEXT('Mountains', x=70, y=120)",
        "DRAW_LINE(x1=150, y1=60, x2=250, y2=100)",
        "DRAW_LINE(x1=150, y1=65, x2=250, y2=105)",
        "DRAW_TEXT('Rivers', x=180, y=120)",
        "DRAW_CIRCLE(x=300, y=80, radius=30)",
        "DRAW_TEXT('Cities', x=285, y=85)",
        "DRAW_TEXT('Physical + Human Geography', x=50, y=150)",
        "DRAW_TEXT('Where? Why there? How connected?', x=50, y=180)"
      ]
    };
  }

  /**
   * General learning and educational responses
   */
  private static getGeneralLearningResponse(message: string): AITeacherResponse {
    if (this.isAbout(message, ['study', 'studying', 'learn', 'learning', 'tips', 'how to learn'])) {
      return {
        explanation: "Great question! Learning effectively is a skill you can develop. Here are proven strategies: 1) Break big topics into smaller chunks, 2) Practice actively (don't just read - write, draw, explain), 3) Space out your studying over time, 4) Test yourself regularly, 5) Connect new information to what you already know, 6) Get enough sleep and exercise, and 7) Find what interests you about each subject. Remember, everyone learns differently - experiment to find your best methods!",
        drawingInstructions: [
          "DRAW_TEXT('Effective Learning Strategies', x=50, y=30)",
          "DRAW_TEXT('1. Break into chunks', x=50, y=60)",
          "DRAW_TEXT('2. Practice actively', x=50, y=80)",
          "DRAW_TEXT('3. Space out studying', x=50, y=100)",
          "DRAW_TEXT('4. Test yourself', x=50, y=120)",
          "DRAW_TEXT('5. Make connections', x=50, y=140)",
          "DRAW_TEXT('6. Sleep & exercise', x=50, y=160)",
          "DRAW_TEXT('7. Find your interest', x=50, y=180)",
          "DRAW_CIRCLE(x=300, y=115, radius=50)",
          "DRAW_TEXT('Your', x=290, y=110)",
          "DRAW_TEXT('Learning', x=280, y=125)",
          "DRAW_TEXT('Journey', x=285, y=140)"
        ]
      };
    }
    
    // Default general learning response
    return {
      explanation: "Learning is one of life's greatest adventures! Every question you ask, every concept you explore, and every skill you develop makes you more capable and confident. The beautiful thing about learning is that it never ends - there's always something new to discover. Whether you're curious about science, fascinated by history, love solving math problems, or enjoy creative writing, remember that every expert was once a beginner. Keep asking questions and stay curious!",
      drawingInstructions: [
        "DRAW_TEXT('Learning - Your Greatest Adventure!', x=50, y=30)",
        "DRAW_TEXT('Curiosity → Questions → Discovery → Growth', x=50, y=60)",
        "DRAW_CIRCLE(x=120, y=120, radius=30)",
        "DRAW_TEXT('Ask', x=110, y=125)",
        "DRAW_ARROW(x1=150, y1=120, x2=190, y2=120)",
        "DRAW_CIRCLE(x=220, y=120, radius=30)",
        "DRAW_TEXT('Explore', x=205, y=125)",
        "DRAW_ARROW(x1=250, y1=120, x2=290, y2=120)",
        "DRAW_CIRCLE(x=320, y=120, radius=30)",
        "DRAW_TEXT('Grow', x=310, y=125)",
        "DRAW_TEXT('Every expert was once a beginner!', x=50, y=180)",
        "DRAW_TEXT('What sparks your curiosity today?', x=50, y=210)"
      ]
    };
  }

  /**
   * Greeting and conversational responses
   */
  private static getGreetingResponse(message: string): AITeacherResponse {
    if (this.isAbout(message, ['hello', 'hi', 'hey', 'good morning', 'good afternoon'])) {
      return {
        explanation: "Hello there! I'm so excited to be your AI teacher today! 🎓 I'm here to help you learn about any topic that interests you. Whether you want to explore mathematics, dive into science, learn about history, understand programming, or discuss literature - I'm ready to make learning fun and engaging. What subject or topic would you like to explore together? Remember, there are no silly questions - only curious minds ready to discover amazing things!",
        drawingInstructions: [
          "DRAW_TEXT('Welcome to Your Learning Adventure!', x=50, y=30)",
          "DRAW_CIRCLE(x=200, y=100, radius=60)",
          "DRAW_TEXT('AI Teacher', x=170, y=105)",
          "DRAW_TEXT('Ready to Help!', x=160, y=125)",
          "DRAW_TEXT('Math • Science • History • Programming', x=50, y=180)",
          "DRAW_TEXT('Language • Geography • and more!', x=50, y=200)",
          "DRAW_TEXT('What interests you today?', x=50, y=230)",
          "DRAW_CIRCLE(x=100, y=250, radius=5)",
          "DRAW_CIRCLE(x=200, y=250, radius=5)",
          "DRAW_CIRCLE(x=300, y=250, radius=5)"
        ]
      };
    }
    
    if (this.isAbout(message, ['thank', 'thanks', 'thank you'])) {
      return {
        explanation: "You're very welcome! It's my pleasure to help you learn and explore new ideas. Seeing students curious and engaged makes teaching so rewarding! Remember, learning is a journey, not a destination. Every question you ask and every concept you explore makes you smarter and more capable. Keep that wonderful curiosity alive, and never hesitate to ask for help when you need it. Is there anything else you'd like to learn about today?",
        drawingInstructions: [
          "DRAW_TEXT('You\\'re Welcome! Keep Learning!', x=50, y=30)",
          "DRAW_CIRCLE(x=150, y=100, radius=40)",
          "DRAW_TEXT('😊', x=140, y=105)",
          "DRAW_TEXT('Happy to Help!', x=105, y=150)",
          "DRAW_TEXT('Questions → Learning → Growth', x=50, y=180)",
          "DRAW_TEXT('Your curiosity is your superpower!', x=50, y=210)",
          "DRAW_TEXT('What\\'s next on your learning journey?', x=50, y=240)"
        ]
      };
    }
    
    // Default greeting response
    return {
      explanation: "Hello! I'm your friendly AI teacher, and I'm thrilled to meet you! Learning should be exciting, engaging, and fun. I'm here to help you understand any topic, answer your questions, and guide you through your educational journey. Whether you're struggling with a concept or just curious about the world, I'm ready to help. Let's make learning an adventure together!",
      drawingInstructions: [
        "DRAW_TEXT('Hello! Let\\'s Learn Together!', x=50, y=30)",
        "DRAW_CIRCLE(x=200, y=120, radius=50)",
        "DRAW_TEXT('🎓', x=190, y=125)",
        "DRAW_TEXT('AI Teacher at Your Service!', x=120, y=180)",
        "DRAW_TEXT('Ready for questions and curiosity!', x=50, y=210)",
        "DRAW_TEXT('What would you like to explore?', x=50, y=240)"
      ]
    };
  }

  /**
   * Adaptive response for unmatched queries
   */
  private static getAdaptiveResponse(message: string): AITeacherResponse {
    // Extract key words to provide contextual help
    const words = message.toLowerCase().split(' ');
    const importantWords = words.filter(word => 
      word.length > 3 && !['what', 'how', 'why', 'when', 'where', 'the', 'and', 'but', 'for'].includes(word)
    );
    
    const topic = importantWords[0] || 'learning';
    
    return {
      explanation: `That's an interesting question about ${topic}! I'd love to help you explore this topic further. Learning is all about asking good questions, and you're doing exactly that! While I may not have specific information about every topic, I can help you think through problems, break down complex ideas, and guide you toward understanding. Could you tell me more about what specifically you'd like to know about ${topic}? The more details you share, the better I can help!`,
      drawingInstructions: [
        "DRAW_TEXT('Great Question! Let\\'s Explore Together', x=50, y=30)",
        "DRAW_CIRCLE(x=150, y=100, radius=40)",
        "DRAW_TEXT('?', x=145, y=105)",
        "DRAW_TEXT('Your Question', x=110, y=150)",
        "DRAW_ARROW(x1=190, y1=100, x2=250, y2=100)",
        "DRAW_CIRCLE(x=280, y=100, radius=40)",
        "DRAW_TEXT('💡', x=270, y=105)",
        "DRAW_TEXT('Discovery', x=250, y=150)",
        "DRAW_TEXT('Questions lead to understanding!', x=50, y=200)",
        "DRAW_TEXT('Tell me more about what you\\'d like to know...', x=50, y=230)"
      ]
    };
  }

  /**
   * Fallback response for errors
   */
  private static getFallbackResponse(): AITeacherResponse {
    return {
      explanation: "I'm here and ready to help you learn! Sometimes I might have technical hiccups, but my enthusiasm for teaching never wavers. I'm knowledgeable about many subjects including mathematics, science, history, programming, language arts, and geography. What would you like to explore today? Ask me anything - I love curious minds and thoughtful questions!",
      drawingInstructions: [
        "DRAW_TEXT('I\\'m Here to Help You Learn!', x=50, y=30)",
        "DRAW_CIRCLE(x=200, y=120, radius=60)",
        "DRAW_TEXT('AI Teacher', x=170, y=125)",
        "DRAW_TEXT('Always Ready!', x=165, y=145)",
        "DRAW_TEXT('Math • Science • History • More!', x=50, y=200)",
        "DRAW_TEXT('What sparks your curiosity?', x=50, y=230)"
      ]
    };
  }

  /**
   * Helper method to check if message is about specific topics
   */
  private static isAbout(message: string, keywords: string[]): boolean {
    return keywords.some(keyword => message.includes(keyword));
  }
}

export default FreeAITeacher;
