import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

async function testOpenAI() {
  console.log('🔧 Testing OpenAI API setup...\n');
  
  // Check if API key is present
  console.log(`✅ API key present: ${!!process.env.OPENAI_API_KEY}`);
  console.log(`✅ API key length: ${process.env.OPENAI_API_KEY?.length || 0}`);
  console.log(`✅ API key starts with 'sk-': ${process.env.OPENAI_API_KEY?.startsWith('sk-') || false}`);
  console.log(`✅ Model: ${process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'}\n`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OpenAI API key is missing from environment variables');
    console.log('\n📝 To fix this:');
    console.log('1. Get your API key from https://platform.openai.com/api-keys');
    console.log('2. Replace "your-openai-api-key-here" in your .env file with your actual key');
    console.log('3. Make sure your key starts with "sk-"');
    return;
  }
  
  if (process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    console.error('❌ OpenAI API key is still set to placeholder value');
    console.log('\n📝 To fix this:');
    console.log('1. Get your API key from https://platform.openai.com/api-keys');
    console.log('2. Replace "your-openai-api-key-here" in your .env file with your actual key');
    return;
  }
  
  try {
    console.log('🚀 Testing API connection...');
    
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello, the OpenAI API is working!" in a friendly way.'
        }
      ],
      max_tokens: 50
    });
    
    console.log('✅ OpenAI API test successful!');
    console.log(`🤖 Response: ${response.choices[0]?.message?.content}`);
    console.log(`📊 Tokens used: ${response.usage?.total_tokens}`);
    console.log(`🔧 Model used: ${response.model}`);
    
  } catch (error: any) {
    console.error('❌ OpenAI API test failed:');
    
    if (error.code === 'invalid_api_key') {
      console.error('   Invalid API key. Please check your OpenAI API key.');
    } else if (error.code === 'insufficient_quota') {
      console.error('   Insufficient quota. Please check your OpenAI billing.');
    } else if (error.code === 'rate_limit_exceeded') {
      console.error('   Rate limit exceeded. Please try again later.');
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    console.log('\n📝 Troubleshooting:');
    console.log('1. Verify your API key at https://platform.openai.com/api-keys');
    console.log('2. Check your billing at https://platform.openai.com/account/billing');
    console.log('3. Ensure you have sufficient credits');
    console.log('4. Try using gpt-3.5-turbo instead of gpt-4 if you don\'t have access');
  }
}

// Run the test
testOpenAI().catch(console.error);
