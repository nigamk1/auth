/**
 * Alert System for sending trading signals via various channels
 */
import { EventEmitter } from 'events';
import axios from 'axios';
import { TradeSignal, AlertConfig } from '../types/trading';
import AlertConfigModel from '../models/AlertConfig';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/trading-email';

class AlertSystem extends EventEmitter {
  private telegramBotToken: string;
  private telegramApiUrl: string = 'https://api.telegram.org/bot';
  private whatsappAccountSid: string;
  private whatsappAuthToken: string;
  private whatsappFromNumber: string;
  
  constructor(config: {
    telegramBotToken?: string;
    whatsappAccountSid?: string;
    whatsappAuthToken?: string;
    whatsappFromNumber?: string;
  } = {}) {
    super();
    this.telegramBotToken = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '';
    this.whatsappAccountSid = config.whatsappAccountSid || process.env.TWILIO_ACCOUNT_SID || '';
    this.whatsappAuthToken = config.whatsappAuthToken || process.env.TWILIO_AUTH_TOKEN || '';
    this.whatsappFromNumber = config.whatsappFromNumber || process.env.TWILIO_FROM_NUMBER || '';
    
    if (!this.telegramBotToken) {
      logger.warn('Telegram bot token not provided. Telegram alerts will be disabled.');
    }
    
    if (!this.whatsappAccountSid || !this.whatsappAuthToken || !this.whatsappFromNumber) {
      logger.warn('Twilio/WhatsApp credentials not provided. WhatsApp alerts will be disabled.');
    }
  }

  /**
   * Process a trade signal and send alerts
   */
  public async processSignal(signal: TradeSignal): Promise<void> {
    try {
      logger.debug(`Processing signal for alerts: ${signal.id}`);

      // Get all user alert configurations
      const alertConfigs = await AlertConfigModel.find();
      
      for (const config of alertConfigs) {
        // Check minimum confidence threshold
        if (signal.confidence < config.minConfidence) {
          logger.debug(`Signal confidence ${signal.confidence} below user threshold ${config.minConfidence}`);
          continue;
        }
        
        // Check strategy filter
        if (config.strategyFilters && config.strategyFilters.length > 0 &&
            !config.strategyFilters.includes(signal.strategyName)) {
          logger.debug(`Strategy ${signal.strategyName} filtered out by user`);
          continue;
        }
        
        // Check option type filter
        if (config.optionTypeFilters && config.optionTypeFilters.length > 0 &&
            !config.optionTypeFilters.includes(signal.optionType)) {
          logger.debug(`Option type ${signal.optionType} filtered out by user`);
          continue;
        }

        // Send alerts based on user preferences
        await this.sendAlerts(signal, config);
      }

      // Emit event that alerts were sent
      this.emit('alertSent', signal);
    } catch (error) {
      logger.error('Error processing signal for alerts:', error);
    }
  }

  /**
   * Send alerts via configured channels
   */
  private async sendAlerts(signal: TradeSignal, config: AlertConfig): Promise<void> {
    try {
      // Format the alert message
      const message = this.formatAlertMessage(signal);
      
      // Send via Telegram if enabled
      if (config.telegramEnabled && config.telegramChatId && this.telegramBotToken) {
        await this.sendTelegramAlert(config.telegramChatId, message, signal);
      }
      
      // Send via WhatsApp if enabled
      if (config.whatsappEnabled && config.whatsappNumber &&
          this.whatsappAccountSid && this.whatsappAuthToken && this.whatsappFromNumber) {
        await this.sendWhatsappAlert(config.whatsappNumber, message, signal);
      }
      
      // Send via Email if enabled
      if (config.emailEnabled && config.emailAddress) {
        await this.sendEmailAlert(config.emailAddress, message, signal);
      }
    } catch (error) {
      logger.error(`Error sending alerts:`, error);
    }
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(signal: TradeSignal): string {
    const timestamp = new Date(signal.timestamp).toLocaleString();
    const riskReward = ((signal.targetPrice - signal.entryPrice) / (signal.entryPrice - signal.stopLossPrice)).toFixed(1);
    
    let message = `🔔 TRADE ALERT! 🔔\n\n`;
    message += `${signal.signalType === 'BUY' ? '🟢 BUY' : '🔴 SELL'} ${signal.instrument}\n\n`;
    message += `Entry: ${signal.entryPrice}\n`;
    message += `Target: ${signal.targetPrice}\n`;
    message += `Stop Loss: ${signal.stopLossPrice}\n`;
    message += `Risk:Reward: 1:${riskReward}\n\n`;
    message += `Confidence: ${signal.confidence}%\n`;
    message += `Strategy: ${signal.strategyName}\n`;
    message += `Time: ${timestamp}\n\n`;
    message += `Reasoning:\n${signal.reasoning}\n\n`;
    
    return message;
  }

  /**
   * Send Telegram alert
   */
  private async sendTelegramAlert(chatId: string, message: string, signal: TradeSignal): Promise<void> {
    try {
      const url = `${this.telegramApiUrl}${this.telegramBotToken}/sendMessage`;
      await axios.post(url, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      });
      logger.info(`Telegram alert sent for signal ${signal.id} to ${chatId}`);
    } catch (error) {
      logger.error(`Error sending Telegram alert:`, error);
    }
  }

  /**
   * Send WhatsApp alert
   */
  private async sendWhatsappAlert(phoneNumber: string, message: string, signal: TradeSignal): Promise<void> {
    try {
      // Note: This is a simplified implementation. In a real app, you'd use the Twilio SDK
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.whatsappAccountSid}/Messages.json`;
      const auth = Buffer.from(`${this.whatsappAccountSid}:${this.whatsappAuthToken}`).toString('base64');
      
      await axios.post(url, 
        new URLSearchParams({
          To: `whatsapp:${phoneNumber}`,
          From: `whatsapp:${this.whatsappFromNumber}`,
          Body: message
        }).toString(),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      logger.info(`WhatsApp alert sent for signal ${signal.id} to ${phoneNumber}`);
    } catch (error) {
      logger.error(`Error sending WhatsApp alert:`, error);
    }
  }

  /**
   * Send Email alert
   */
  private async sendEmailAlert(email: string, message: string, signal: TradeSignal): Promise<void> {
    try {
      const subject = `${signal.signalType} Alert: ${signal.instrument}`;
      const htmlMessage = message.replace(/\n/g, '<br>');
      
      await sendEmail({
        to: email,
        subject,
        text: message,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.5;">${htmlMessage}</div>`
      });
      
      logger.info(`Email alert sent for signal ${signal.id} to ${email}`);
    } catch (error) {
      logger.error(`Error sending email alert:`, error);
    }
  }
}

export default AlertSystem;
