import nodemailer from 'nodemailer';
import { logger } from './logger';

// Email transporter configuration
const createTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  
  // Gmail configuration with App Password support
  if (emailService === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD
      },
      // Additional Gmail configuration
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 20000,
      rateLimit: 5
    });
  }
  
  // Generic SMTP configuration for other providers
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD
    },
    // Additional configuration for better reliability
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 20000,
    rateLimit: 5,
    // Timeout settings
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000
  });
};

// Email templates
const getWelcomeEmailTemplate = (firstName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Auth System</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Auth System!</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName}!</h2>
          <p>Welcome to our authentication system! Your account has been successfully created.</p>
          <p>You can now start using all the features of our platform.</p>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The Auth System Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Auth System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getPasswordResetEmailTemplate = (firstName: string, resetToken: string): string => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName}!</h2>
          <p>We received a request to reset your password for your Auth System account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 5px;">${resetUrl}</p>
          <div class="warning">
            <strong>Important:</strong> This link will expire in 10 minutes for security reasons.
            If you didn't request this password reset, please ignore this email.
          </div>
          <p>Best regards,<br>The Auth System Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Auth System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send welcome email
export const sendWelcomeEmail = async (email: string, firstName: string): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Auth System!',
      html: getWelcomeEmailTemplate(firstName)
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent successfully to ${email}`, { messageId: result.messageId });
  } catch (error: any) {
    // Enhanced error logging for Gmail authentication issues
    if (error.code === 'EAUTH') {
      logger.error(`Gmail authentication failed for ${email}. Please check EMAIL_APP_PASSWORD configuration.`, {
        code: error.code,
        response: error.response,
        command: error.command
      });
      throw new Error('Email authentication failed. Please check your Gmail App Password configuration.');
    }
    
    logger.error(`Failed to send welcome email to ${email}:`, error);
    throw error;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string, 
  resetToken: string, 
  firstName: string
): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - Auth System',
      html: getPasswordResetEmailTemplate(firstName, resetToken)
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent successfully to ${email}`, { messageId: result.messageId });
  } catch (error: any) {
    // Enhanced error logging for Gmail authentication issues
    if (error.code === 'EAUTH') {
      logger.error(`Gmail authentication failed for ${email}. Please check EMAIL_APP_PASSWORD configuration.`, {
        code: error.code,
        response: error.response,
        command: error.command
      });
      throw new Error('Email authentication failed. Please check your Gmail App Password configuration.');
    }
    
    logger.error(`Failed to send password reset email to ${email}:`, error);
    throw error;
  }
};

// Test email configuration
export const testEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('Email configuration is valid');
    return true;
  } catch (error: any) {
    if (error.code === 'EAUTH') {
      logger.error('Gmail authentication failed. Please check EMAIL_APP_PASSWORD configuration.', {
        code: error.code,
        response: error.response,
        command: error.command
      });
    } else {
      logger.error('Email configuration test failed:', error);
    }
    return false;
  }
};
