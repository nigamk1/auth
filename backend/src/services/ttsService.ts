// Fixed TTS Service - Updated for TypeScript compatibility
// import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

// Define interfaces for Google Cloud TTS types (to avoid dependency)
interface GoogleTTSClient {
  listVoices(options: any): Promise<any>;
  synthesizeSpeech(request: any): Promise<any>;
}

interface GoogleVoice {
  name?: string;
  languageCodes?: string[];
  ssmlGender?: string;
}

class TextToSpeechService {
  private googleClient?: GoogleTTSClient;
  
  constructor() {
    this.initializeGoogleTTS();
  }

  private initializeGoogleTTS() {
    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Dynamic import to avoid dependency error
        const googleTTS = require('@google-cloud/text-to-speech');
        this.googleClient = new googleTTS.TextToSpeechClient();
        logger.info('Google Text-to-Speech client initialized');
      }
    } catch (error) {
      logger.warn('Google TTS client not available (package not installed):', error);
    }
  }

  async generateSpeech(
    text: string, 
    options: {
      provider?: 'google' | 'elevenlabs' | 'azure';
      voiceId?: string;
      language?: string;
      speed?: number;
      pitch?: number;
    } = {}
  ): Promise<{
    audioBuffer: Buffer;
    duration: number;
    provider: string;
    metadata: any;
  }> {
    const {
      provider = 'google',
      voiceId = 'en-US-Wavenet-A',
      language = 'en-US',
      speed = 1.0,
      pitch = 0
    } = options;

    switch (provider) {
      case 'google':
        return this.generateGoogleSpeech(text, { voiceId, language, speed, pitch });
      case 'elevenlabs':
        return this.generateElevenLabsSpeech(text, { voiceId, speed });
      case 'azure':
        return this.generateAzureSpeech(text, { voiceId, language, speed, pitch });
      default:
        throw new Error(`Unsupported TTS provider: ${provider}`);
    }
  }

  private async generateGoogleSpeech(
    text: string,
    options: { voiceId: string; language: string; speed: number; pitch: number }
  ) {
    if (!this.googleClient) {
      throw new Error('Google TTS client not initialized');
    }

    try {
      const request = {
        input: { text },
        voice: {
          languageCode: options.language,
          name: options.voiceId,
          ssmlGender: 'NEUTRAL' as const
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: options.speed,
          pitch: options.pitch,
          volumeGainDb: 0.0,
          sampleRateHertz: 24000
        }
      };

      const [response] = await this.googleClient.synthesizeSpeech(request);
      
      if (!response.audioContent) {
        throw new Error('No audio content received from Google TTS');
      }

      const audioBuffer = Buffer.from(response.audioContent as string, 'binary');
      const duration = this.estimateAudioDuration(text, options.speed);

      return {
        audioBuffer,
        duration,
        provider: 'google',
        metadata: {
          voiceId: options.voiceId,
          language: options.language,
          speed: options.speed,
          pitch: options.pitch,
          sampleRate: 24000,
          encoding: 'MP3'
        }
      };
    } catch (error) {
      logger.error('Error generating Google TTS:', error);
      throw new Error('Failed to generate speech with Google TTS');
    }
  }

  private async generateElevenLabsSpeech(
    text: string,
    options: { voiceId: string; speed: number }
  ) {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${options.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      const duration = this.estimateAudioDuration(text, options.speed);

      return {
        audioBuffer,
        duration,
        provider: 'elevenlabs',
        metadata: {
          voiceId: options.voiceId,
          model: 'eleven_monolingual_v1',
          speed: options.speed,
          encoding: 'MP3'
        }
      };
    } catch (error) {
      logger.error('Error generating ElevenLabs TTS:', error);
      throw new Error('Failed to generate speech with ElevenLabs');
    }
  }

  private async generateAzureSpeech(
    text: string,
    options: { voiceId: string; language: string; speed: number; pitch: number }
  ): Promise<{
    audioBuffer: Buffer;
    duration: number;
    provider: string;
    metadata: any;
  }> {
    // Placeholder for Azure Speech Services implementation
    // Would require Azure Cognitive Services Speech SDK
    throw new Error('Azure TTS not implemented yet');
  }

  private estimateAudioDuration(text: string, speed: number): number {
    // Estimate based on average speaking rate of 150 words per minute
    const words = text.split(' ').length;
    const baseMinutes = words / 150;
    const adjustedMinutes = baseMinutes / speed;
    return Math.ceil(adjustedMinutes * 60); // Convert to seconds
  }

  async getAvailableVoices(provider: string = 'google'): Promise<Array<{
    id: string;
    name: string;
    language: string;
    gender: string;
    preview?: string;
  }>> {
    switch (provider) {
      case 'google':
        return this.getGoogleVoices();
      case 'elevenlabs':
        return this.getElevenLabsVoices();
      case 'azure':
        return this.getAzureVoices();
      default:
        return [];
    }
  }

  private async getGoogleVoices() {
    if (!this.googleClient) {
      return [];
    }

    try {
      const [result] = await this.googleClient.listVoices({});
      
      return (result.voices || []).map((voice: GoogleVoice) => ({
        id: voice.name || '',
        name: voice.name || '',
        language: voice.languageCodes?.[0] || '',
        gender: voice.ssmlGender?.toLowerCase() || 'neutral',
        provider: 'google'
      }));
    } catch (error) {
      logger.error('Error fetching Google voices:', error);
      return [];
    }
  }

  private async getElevenLabsVoices() {
    if (!process.env.ELEVENLABS_API_KEY) {
      return [];
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ElevenLabs voices');
      }

      const data = await response.json();
      
      return (data.voices || []).map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        language: 'en-US', // ElevenLabs primarily English
        gender: voice.labels?.gender || 'neutral',
        preview: voice.preview_url,
        provider: 'elevenlabs'
      }));
    } catch (error) {
      logger.error('Error fetching ElevenLabs voices:', error);
      return [];
    }
  }

  private async getAzureVoices() {
    // Placeholder for Azure voices
    return [];
  }

  async saveAudioFile(audioBuffer: Buffer, filename: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'audio');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, audioBuffer);
    
    return filePath;
  }
}

export const ttsService = new TextToSpeechService();
