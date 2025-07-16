import dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('Testing OpenAI API...');
console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
console.log('API Key length:', process.env.OPENAI_API_KEY?.length || 0);

async function testOpenAI() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not found');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('Making test request to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello! I am working correctly!" in a friendly way.'
        }
      ],
      max_tokens: 50,
    });

    const response = completion.choices[0]?.message?.content;
    console.log('✅ SUCCESS! OpenAI Response:', response);
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error('Full error:', error);
  }
}

testOpenAI();
