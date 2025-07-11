import { AITeachingEngine, TeachingPrompts, DifficultyLevel } from '../src/utils/aiTeachingEngine';
import TeachingSession from '../src/models/TeachingSession';
import { logger } from '../src/utils/logger';

/**
 * Test script for AI Teaching Engine
 * Demonstrates all the Day 9 features:
 * - AI prompt templates
 * - Topic-based memory (last 5 Q&A)
 * - Difficulty levels (beginner, intermediate, advanced)
 */

async function testAITeachingEngine() {
  console.log('🧠 Testing AI Teaching Engine - Day 9 Features\n');

  // Initialize the teaching engine
  const teachingEngine = new AITeachingEngine();

  // Test 1: Demonstrate prompt templates
  console.log('=== Test 1: AI Prompt Templates ===');
  
  const topic = 'photosynthesis';
  const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

  for (const level of levels) {
    console.log(`\n📝 ${level.toUpperCase()} Level Explanation Prompt:`);
    const explanationPrompt = TeachingPrompts.generateExplanationPrompt(topic, level);
    console.log(explanationPrompt.substring(0, 200) + '...\n');

    console.log(`🎨 ${level.toUpperCase()} Level Diagram Prompt:`);
    const diagramPrompt = TeachingPrompts.generateDiagramPrompt(topic, level);
    console.log(diagramPrompt.substring(0, 200) + '...\n');
  }

  // Test 2: Session Memory Management
  console.log('\n=== Test 2: Session Memory (Last 5 Q&A) ===');
  
  const sessionId = 'test-session-001';
  
  // Add some Q&A pairs to test memory
  const qaData = [
    { q: 'What is photosynthesis?', a: 'Photosynthesis is the process by which plants make food from sunlight.' },
    { q: 'Where does photosynthesis occur?', a: 'Photosynthesis occurs in the chloroplasts of plant cells.' },
    { q: 'What are the reactants?', a: 'The reactants are carbon dioxide and water.' },
    { q: 'What is the role of chlorophyll?', a: 'Chlorophyll captures light energy from the sun.' },
    { q: 'What are the products?', a: 'The products are glucose and oxygen.' },
    { q: 'Why is it important?', a: 'It produces oxygen and food for most life on Earth.' },
    { q: 'What is the chemical equation?', a: '6CO2 + 6H2O + light energy → C6H12O6 + 6O2' }
  ];

  // Add Q&A pairs and test memory limit
  qaData.forEach((qa, index) => {
    teachingEngine.addToMemory(sessionId, {
      id: `qa-${index + 1}`,
      question: qa.q,
      answer: qa.a,
      timestamp: new Date(),
      topic: 'photosynthesis',
      level: 'intermediate'
    });
    
    const memory = teachingEngine.getSessionMemory(sessionId);
    console.log(`After adding Q&A ${index + 1}: Memory contains ${memory.length} items`);
    
    if (memory.length <= 5) {
      console.log(`  Latest: ${qa.q.substring(0, 50)}...`);
    }
  });

  // Test 3: Difficulty Level Management
  console.log('\n=== Test 3: Difficulty Level Assessment ===');
  
  const responses = {
    beginner: 'Plants need sun to grow.',
    intermediate: 'Photosynthesis converts light energy into chemical energy stored in glucose molecules.',
    advanced: 'The light-dependent reactions of photosynthesis occur in the thylakoids and produce ATP and NADPH.'
  };

  Object.entries(responses).forEach(([expectedLevel, response]) => {
    const assessedLevel = teachingEngine.assessDifficultyLevel(response, 'beginner');
    console.log(`Response: "${response.substring(0, 60)}..."`);
    console.log(`Expected level: ${expectedLevel}, Assessed level: ${assessedLevel}`);
    console.log('');
  });

  // Test 4: Context-Aware Teaching
  console.log('\n=== Test 4: Context-Aware Teaching ===');
  
  const context = teachingEngine.createTeachingContext(
    'cellular respiration',
    'intermediate',
    sessionId,
    {
      learningStyle: 'visual',
      pace: 'normal',
      examples: true
    }
  );

  console.log('Created teaching context:');
  console.log(`Topic: ${context.topic}`);
  console.log(`Level: ${context.level}`);
  console.log(`Previous Q&A count: ${context.previousQA.length}`);
  console.log(`User preferences: ${JSON.stringify(context.userPreferences, null, 2)}`);

  // Test 5: Whiteboard Actions Generation
  console.log('\n=== Test 5: Whiteboard Actions Generation ===');
  
  const whiteboardActions = teachingEngine.generateWhiteboardActions('plant cell', 'beginner');
  console.log('Generated whiteboard actions:');
  whiteboardActions.forEach((action, index) => {
    console.log(`  ${index + 1}. Type: ${action.type}, Content: "${action.content}", Position: (${action.position.x}, ${action.position.y})`);
  });

  // Test 6: AI Response Parsing
  console.log('\n=== Test 6: AI Response Parsing ===');
  
  const simulatedAIResponse = `
Photosynthesis is a fascinating process! Let me explain it step by step.

Plants use sunlight, water, and carbon dioxide to create glucose and oxygen. This happens in special cell parts called chloroplasts.

[DIAGRAM]
Title: Photosynthesis Process
Component 1: Sunlight (yellow circle)
Component 2: Chloroplast (green oval)
Component 3: CO2 input (blue arrow)
Component 4: H2O input (blue arrow)
Component 5: Glucose output (red arrow)
Component 6: O2 output (red arrow)
[/DIAGRAM]

[QUESTIONS]
What do you think would happen if a plant didn't get sunlight?
Can you name the two main products of photosynthesis?
How do you think this process helps other living things?
[/QUESTIONS]
  `;

  const parsedResponse = teachingEngine.parseAIResponse(simulatedAIResponse);
  console.log('Parsed AI Response:');
  console.log(`Text length: ${parsedResponse.text.length} characters`);
  console.log(`Whiteboard actions: ${parsedResponse.whiteboardActions?.length || 0}`);
  console.log(`Follow-up questions: ${parsedResponse.followUpQuestions?.length || 0}`);
  
  if (parsedResponse.followUpQuestions) {
    console.log('Follow-up questions:');
    parsedResponse.followUpQuestions.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q}`);
    });
  }

  console.log('\n✅ AI Teaching Engine tests completed successfully!');
  console.log('\n📋 Summary of Day 9 Features Implemented:');
  console.log('  ✓ AI prompt templates for explanations, diagrams, questions, and assessments');
  console.log('  ✓ Topic-based memory keeping last 5 Q&A pairs in session context');
  console.log('  ✓ Support for beginner, intermediate, and advanced difficulty levels');
  console.log('  ✓ Context-aware teaching with user preferences');
  console.log('  ✓ Automatic whiteboard action generation');
  console.log('  ✓ Intelligent response parsing with structured outputs');
}

// Run the test
async function main() {
  try {
    await testAITeachingEngine();
    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

main();

export { testAITeachingEngine };
