/**
 * Email service for trading alerts
 */
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

// Email interface
export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASSWORD || ''
    }
  });
};

/**
 * Send an email
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@tradealerts.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${options.to}`, { messageId: result.messageId });
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
};
