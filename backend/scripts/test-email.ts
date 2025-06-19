import dotenv from 'dotenv';
import path from 'path';
import { testEmailConfig, sendPasswordResetEmail } from '../src/utils/email';
import { logger } from '../src/utils/logger';

// Load environment variables
dotenv.config();

async function testEmail() {
  console.log('🔧 Testing Email Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'gmail (default)'}`);
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
  console.log(`EMAIL_APP_PASSWORD: ${process.env.EMAIL_APP_PASSWORD ? '***SET***' : 'NOT SET'}`);
  console.log(`EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET'}`);
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'NOT SET'}`);
  console.log('');
  
  // Validate required variables
  if (!process.env.EMAIL_USER) {
    console.error('❌ ERROR: EMAIL_USER is not set');
    process.exit(1);
  }
  
  if (!process.env.EMAIL_APP_PASSWORD && !process.env.EMAIL_PASSWORD) {
    console.error('❌ ERROR: EMAIL_APP_PASSWORD or EMAIL_PASSWORD is not set');
    console.log('💡 For Gmail, use EMAIL_APP_PASSWORD (16-character app password)');
    process.exit(1);
  }
  
  // Test email configuration
  console.log('🔍 Testing Email Connection...');
  const isValid = await testEmailConfig();
  
  if (isValid) {
    console.log('✅ Email configuration is valid!\n');
    
    // Optionally test sending an actual email
    const testEmail = process.argv[2];
    if (testEmail) {
      console.log(`📧 Sending test password reset email to ${testEmail}...`);
      try {
        await sendPasswordResetEmail(testEmail, 'test-token-123', 'Test User');
        console.log('✅ Test email sent successfully!');
      } catch (error) {
        console.error('❌ Failed to send test email:', error.message);
        process.exit(1);
      }
    } else {
      console.log('💡 To test sending an actual email, run:');
      console.log('   npm run test:email your-email@example.com');
    }
  } else {
    console.error('❌ Email configuration is invalid');
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. For Gmail, make sure you\'re using an App Password (not your regular password)');
    console.log('2. Ensure 2-Factor Authentication is enabled on your Google account');
    console.log('3. Check that EMAIL_USER contains your full email address');
    console.log('4. Verify EMAIL_APP_PASSWORD is the 16-character app password from Google');
    console.log('5. See GMAIL_SETUP.md for detailed setup instructions');
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the test
testEmail().catch((error) => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
