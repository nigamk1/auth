import { FreeAITeacher } from './src/utils/freeAI';

async function testFreeAI() {
  console.log('🧪 Testing Free AI Teacher...\n');

  const testQuestions = [
    "What is multiplication?",
    "Explain gravity to me",
    "How do I write a function in JavaScript?",
    "Tell me about Ancient Egypt",
    "What are the seven continents?",
    "Hello! I want to learn!",
    "How can I study better?"
  ];

  for (const question of testQuestions) {
    console.log(`\n🔵 Question: "${question}"`);
    console.log('─'.repeat(50));
    
    try {
      const response = await FreeAITeacher.getTeacherResponse(question);
      
      console.log(`📝 Explanation: ${response.explanation.substring(0, 150)}...`);
      console.log(`🎨 Drawing Instructions: ${response.drawingInstructions.length} commands`);
      
      if (response.drawingInstructions.length > 0) {
        console.log(`   First command: ${response.drawingInstructions[0]}`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error}`);
    }
  }
  
  console.log('\n✅ Free AI Teacher test completed!');
}

testFreeAI();
