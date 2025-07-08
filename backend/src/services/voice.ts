import OpenAI from 'openai';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import { VoiceToTextRequest, TextToVoiceRequest, VoiceProcessingOptions, TTSOptions } from '../types';

class VoiceService {
  private openai: OpenAI | null = null;
  private uploadsDir: string;

  constructor() {
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder-openai-api-key-for-development') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else {
      console.warn('⚠️  OpenAI API key not configured. Voice features will be disabled.');
    }

    this.uploadsDir = path.join(process.cwd(), 'uploads', 'audio');
    this.ensureUploadsDirectory();
  }

  private checkOpenAI(): void {
    if (!this.openai) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.');
    }
  }

  private async ensureUploadsDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  private generateUniqueId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async speechToText(request: VoiceToTextRequest, options?: VoiceProcessingOptions): Promise<string> {
    try {
      return await this.whisperSpeechToText(request, options);
    } catch (error) {
      console.error('Error in speech to text:', error);
      throw new Error('Failed to convert speech to text');
    }
  }

  private async whisperSpeechToText(request: VoiceToTextRequest, options?: VoiceProcessingOptions): Promise<string> {
    this.checkOpenAI();
    
    // Save audio file temporarily
    const fileName = `${this.generateUniqueId()}.${request.format || 'webm'}`;
    const filePath = path.join(this.uploadsDir, fileName);
    
    try {
      await fs.writeFile(filePath, request.audioFile);

      const transcription = await this.openai!.audio.transcriptions.create({
        file: fsSync.createReadStream(filePath) as any,
        model: 'whisper-1',
        language: request.language || 'en',
        response_format: 'text'
      });

      return transcription as string || '';
    } finally {
      // Clean up temporary file
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn('Failed to clean up temporary audio file:', filePath);
      }
    }
  }

  async textToSpeech(request: TextToVoiceRequest, options?: TTSOptions): Promise<string> {
    try {
      // Use OpenAI TTS
      return await this.openAITextToSpeech(request, options);
    } catch (error) {
      console.error('Error in text to speech:', error);
      throw new Error('Failed to convert text to speech');
    }
  }

  private async openAITextToSpeech(request: TextToVoiceRequest, options?: TTSOptions): Promise<string> {
    this.checkOpenAI();
    
    const voice = options?.voice === 'male' ? 'onyx' : 'nova';
    
    const response = await this.openai!.audio.speech.create({
      model: 'tts-1',
      voice: voice as any,
      input: request.text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Save audio file
    const fileName = `${this.generateUniqueId()}.mp3`;
    const filePath = path.join(this.uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);

    return `/api/audio/${fileName}`;
  }

  async processAudioFile(filePath: string, options?: VoiceProcessingOptions): Promise<Buffer> {
    // Placeholder for audio processing (noise reduction, normalization, etc.)
    // You can implement this using ffmpeg or similar tools
    const audioBuffer = await fs.readFile(filePath);
    return audioBuffer;
  }

  async getAudioFile(fileName: string): Promise<Buffer> {
    const filePath = path.join(this.uploadsDir, fileName);
    return await fs.readFile(filePath);
  }

  async cleanupOldAudioFiles(maxAgeHours: number = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.uploadsDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.uploadsDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old audio file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up audio files:', error);
    }
  }
}

export const voiceService = new VoiceService();
