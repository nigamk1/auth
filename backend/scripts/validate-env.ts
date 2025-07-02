import dotenv from 'dotenv';
import { logger } from '../src/utils/logger';

// Load environment variables
dotenv.config();

interface EnvValidation {
  name: string;
  value: string | undefined;
  required: boolean;
  description: string;
  validation?: (value: string) => boolean;
  validationMessage?: string;
}

function validateEnvironment() {
  console.log('🔧 Validating environment configuration...\n');
  
  const envVars: EnvValidation[] = [
    // Core application
    {
      name: 'NODE_ENV',
      value: process.env.NODE_ENV,
      required: false,
      description: 'Application environment (development/production)'
    },
    {
      name: 'PORT',
      value: process.env.PORT,
      required: false,
      description: 'Server port (default: 5000)'
    },
    
    // Database
    {
      name: 'MONGODB_URI',
      value: process.env.MONGODB_URI,
      required: true,
      description: 'MongoDB connection string',
      validation: (value) => value.includes('mongodb'),
      validationMessage: 'Must be a valid MongoDB URI'
    },
    
    // JWT
    {
      name: 'JWT_ACCESS_SECRET',
      value: process.env.JWT_ACCESS_SECRET,
      required: true,
      description: 'JWT access token secret',
      validation: (value) => value.length >= 32,
      validationMessage: 'Should be at least 32 characters long'
    },
    {
      name: 'JWT_REFRESH_SECRET',
      value: process.env.JWT_REFRESH_SECRET,
      required: true,
      description: 'JWT refresh token secret',
      validation: (value) => value.length >= 32,
      validationMessage: 'Should be at least 32 characters long'
    },
    
    // OpenAI (Critical for AI tutor)
    {
      name: 'OPENAI_API_KEY',
      value: process.env.OPENAI_API_KEY,
      required: true,
      description: 'OpenAI API key for AI tutor functionality',
      validation: (value) => value.startsWith('sk-') && value !== 'your-openai-api-key-here',
      validationMessage: 'Must be a valid OpenAI API key starting with "sk-"'
    },
    {
      name: 'OPENAI_MODEL',
      value: process.env.OPENAI_MODEL,
      required: false,
      description: 'OpenAI model to use (default: gpt-4-turbo-preview)'
    },
    
    // Email (for auth)
    {
      name: 'EMAIL_HOST',
      value: process.env.EMAIL_HOST,
      required: true,
      description: 'SMTP host for sending emails'
    },
    {
      name: 'EMAIL_USER',
      value: process.env.EMAIL_USER,
      required: true,
      description: 'Email account for sending emails'
    },
    {
      name: 'EMAIL_PASSWORD',
      value: process.env.EMAIL_PASSWORD,
      required: true,
      description: 'Email password/app password'
    },
    
    // Frontend URL
    {
      name: 'FRONTEND_URL',
      value: process.env.FRONTEND_URL,
      required: true,
      description: 'Frontend application URL'
    },
    
    // Optional AI services
    {
      name: 'ELEVENLABS_API_KEY',
      value: process.env.ELEVENLABS_API_KEY,
      required: false,
      description: 'ElevenLabs API key for text-to-speech (optional)'
    },
    {
      name: 'DID_API_KEY',
      value: process.env.DID_API_KEY,
      required: false,
      description: 'D-ID API key for video generation (optional)'
    }
  ];
  
  let hasErrors = false;
  let hasWarnings = false;
  
  for (const envVar of envVars) {
    const { name, value, required, description, validation, validationMessage } = envVar;
    
    if (required && !value) {
      console.log(`❌ ${name}: MISSING (Required)`);
      console.log(`   Description: ${description}`);
      console.log('');
      hasErrors = true;
      continue;
    }
    
    if (!value) {
      console.log(`⚠️  ${name}: Not set (Optional)`);
      console.log(`   Description: ${description}`);
      console.log('');
      hasWarnings = true;
      continue;
    }
    
    if (validation && !validation(value)) {
      console.log(`❌ ${name}: INVALID`);
      console.log(`   Value: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
      console.log(`   Issue: ${validationMessage}`);
      console.log('');
      hasErrors = true;
      continue;
    }
    
    console.log(`✅ ${name}: OK`);
    if (name.includes('SECRET') || name.includes('KEY') || name.includes('PASSWORD')) {
      console.log(`   Value: ${value.substring(0, 10)}...`);
    } else {
      console.log(`   Value: ${value}`);
    }
    console.log('');
  }
  
  console.log('📊 Summary:');
  
  if (hasErrors) {
    console.log('❌ Environment validation FAILED');
    console.log('   Please fix the missing/invalid environment variables above.');
    console.log('   See OPENAI_SETUP.md for detailed setup instructions.');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Environment validation PASSED with warnings');
    console.log('   Some optional features may not work without the missing variables.');
  } else {
    console.log('✅ Environment validation PASSED');
    console.log('   All required environment variables are properly configured.');
  }
}

// Run validation
validateEnvironment();
