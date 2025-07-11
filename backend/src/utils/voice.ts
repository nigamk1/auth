import { SpeechClient } from '@google-cloud/speech';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

export interface TTSResult {
  audioBuffer: Buffer;
  duration: number;
  format: string;
}

export interface VoiceSettings {
  language: 'en' | 'hi' | 'hinglish';
  ttsVoice: string;
  sttLanguageCode: string;
}

// Voice configurations for different languages
export const VOICE_CONFIGS = {
  en: {
    ttsVoice: 'alloy',
    sttLanguageCode: 'en-US',
    openaiModel: 'tts-1'
  },
  hi: {
    ttsVoice: 'onyx', // Use a deeper voice for Hindi
    sttLanguageCode: 'hi-IN',
    openaiModel: 'tts-1'
  },
  hinglish: {
    ttsVoice: 'nova', // Use a more natural voice for Hinglish
    sttLanguageCode: 'en-IN', // Indian English for Hinglish
    openaiModel: 'tts-1'
  }
};

export class VoiceService {
  private speechClient: SpeechClient | null = null;
  private openai: OpenAI | null = null;

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    try {
      // Initialize Google Cloud Speech (if credentials are available)
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.speechClient = new SpeechClient();
        logger.info('Google Cloud Speech initialized');
      }

      // Initialize OpenAI (if API key is available)
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        logger.info('OpenAI API initialized');
      }
    } catch (error) {
      logger.error('Error initializing voice services:', error);
    }
  }

  /**
   * Convert speech to text using Google Cloud Speech or OpenAI Whisper
   */
  async speechToText(audioBuffer: Buffer, options: {
    language?: 'en' | 'hi' | 'hinglish';
    sampleRate?: number;
    encoding?: string;
  } = {}): Promise<TranscriptionResult> {
    const { language = 'en', sampleRate = 16000, encoding = 'WEBM_OPUS' } = options;
    
    // Get language-specific configuration
    const voiceConfig = VOICE_CONFIGS[language];
    const sttLanguageCode = voiceConfig.sttLanguageCode;

    try {
      // Try OpenAI Whisper first (more reliable for web audio)
      if (this.openai) {
        return await this.transcribeWithWhisper(audioBuffer, language, sttLanguageCode);
      }

      // Fallback to Google Cloud Speech
      if (this.speechClient) {
        return await this.transcribeWithGoogleSpeech(audioBuffer, {
          language: sttLanguageCode,
          sampleRate,
          encoding
        });
      }

      // Fallback: return empty transcription
      logger.warn('No speech recognition service available');
      return {
        text: '',
        confidence: 0,
        language: sttLanguageCode,
        duration: 0
      };

    } catch (error) {
      logger.error('Speech to text error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Transcribe using OpenAI Whisper
   */
  private async transcribeWithWhisper(
    audioBuffer: Buffer, 
    language: 'en' | 'hi' | 'hinglish', 
    sttLanguageCode: string
  ): Promise<TranscriptionResult> {
    try {
      // Save buffer to temporary file for Whisper API
      const tempFilePath = path.join(__dirname, '../../temp/audio', `temp_${Date.now()}.webm`);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      fs.writeFileSync(tempFilePath, audioBuffer);

      // Whisper language codes mapping
      const whisperLanguageCodes = {
        'en': 'en',
        'hi': 'hi',
        'hinglish': 'en' // Use English for Hinglish as Whisper handles code-switching well
      };

      const transcription = await this.openai!.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: whisperLanguageCodes[language],
        response_format: 'verbose_json',
      });

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      return {
        text: transcription.text,
        confidence: 0.95, // Whisper doesn't provide confidence, assume high
        language: sttLanguageCode,
        duration: transcription.duration || 0
      };

    } catch (error) {
      logger.error('Whisper transcription error:', error);
      throw error;
    }
  }

  /**
   * Transcribe using Google Cloud Speech
   */
  private async transcribeWithGoogleSpeech(
    audioBuffer: Buffer,
    options: { language: string; sampleRate: number; encoding: string }
  ): Promise<TranscriptionResult> {
    try {
      const request = {
        audio: { content: audioBuffer.toString('base64') },
        config: {
          encoding: options.encoding as any,
          sampleRateHertz: options.sampleRate,
          languageCode: options.language,
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
        },
      };

      const [response] = await this.speechClient!.recognize(request);
      const transcription = response.results?.[0];

      if (!transcription?.alternatives?.[0]) {
        return {
          text: '',
          confidence: 0,
          language: options.language,
          duration: 0
        };
      }

      const alternative = transcription.alternatives[0];
      
      return {
        text: alternative.transcript || '',
        confidence: alternative.confidence || 0,
        language: options.language,
        duration: this.calculateDuration(transcription.alternatives[0].words || [])
      };

    } catch (error) {
      logger.error('Google Speech transcription error:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech using OpenAI TTS with language-specific voices
   */
  async textToSpeech(text: string, options: {
    language?: 'en' | 'hi' | 'hinglish';
    voice?: string;
    speed?: number;
  } = {}): Promise<TTSResult> {
    const { language = 'en', speed = 1.0 } = options;
    
    // Get language-specific voice configuration
    const voiceConfig = VOICE_CONFIGS[language];
    const selectedVoice = options.voice || voiceConfig.ttsVoice;

    try {
      // Use OpenAI TTS (preferred for quality)
      if (this.openai) {
        return await this.synthesizeWithOpenAI(text, { 
          voice: selectedVoice, 
          speed,
          language 
        });
      }

      // Fallback: use browser TTS (will be handled on frontend)
      throw new Error('No TTS service available');

    } catch (error) {
      logger.error('Text to speech error:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  /**
   * Synthesize speech using OpenAI TTS with language support
   */
  private async synthesizeWithOpenAI(
    text: string,
    options: { voice: string; speed: number; language: 'en' | 'hi' | 'hinglish' }
  ): Promise<TTSResult> {
    try {
      const voiceConfig = VOICE_CONFIGS[options.language];
      
      // Map old Google Cloud voices to OpenAI voices
      const voiceMapping: { [key: string]: string } = {
        'en-US-Standard-A': 'alloy',
        'en-US-Standard-B': 'echo',
        'en-US-Standard-C': 'fable',
        'en-US-Standard-D': 'onyx',
        'en-US-Standard-E': 'nova',
        'en-US-Standard-F': 'shimmer',
        'hi-IN-Standard-A': 'onyx',
        'hi-IN-Standard-B': 'nova',
        'hi-IN-Standard-C': 'alloy',
      };
      
      // Use mapped voice or default to config voice
      const mappedVoice = voiceMapping[options.voice] || voiceConfig.ttsVoice;
      
      // Validate voice is one of OpenAI's supported voices
      const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
      const finalVoice = validVoices.includes(mappedVoice) ? mappedVoice : voiceConfig.ttsVoice;
      
      logger.info(`Using OpenAI TTS voice: ${finalVoice} for language: ${options.language}`);
      
      const mp3 = await this.openai!.audio.speech.create({
        model: voiceConfig.openaiModel,
        voice: finalVoice as any,
        input: text,
        speed: options.speed,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      
      return {
        audioBuffer: buffer,
        duration: this.estimateAudioDuration(text, options.speed),
        format: 'mp3'
      };

    } catch (error) {
      logger.error('OpenAI TTS error:', error);
      throw error;
    }
  }

  /**
   * Calculate audio duration from word timing information
   */
  private calculateDuration(words: any[]): number {
    if (words.length === 0) return 0;
    
    const lastWord = words[words.length - 1];
    if (lastWord.endTime) {
      return parseFloat(lastWord.endTime.seconds || '0') + 
             (lastWord.endTime.nanos || 0) / 1e9;
    }
    
    return 0;
  }

  /**
   * Estimate audio duration based on text length and speed
   */
  private estimateAudioDuration(text: string, speed: number): number {
    // Average speaking rate: ~150 words per minute
    const wordsPerMinute = 150 * speed;
    const wordCount = text.split(' ').length;
    return (wordCount / wordsPerMinute) * 60;
  }

  /**
   * Validate audio format and convert if necessary
   */
  async validateAndConvertAudio(audioBuffer: Buffer, originalFormat: string): Promise<{
    buffer: Buffer;
    format: string;
    sampleRate: number;
  }> {
    // For now, assume the audio is already in the correct format
    // In production, you might want to use FFmpeg to convert formats
    
    return {
      buffer: audioBuffer,
      format: originalFormat,
      sampleRate: 16000 // Default sample rate
    };
  }

  /**
   * Get available voices for TTS
   */
  getAvailableVoices(): Array<{ id: string; name: string; gender: string; language: string }> {
    return [
      { id: 'alloy', name: 'Alloy', gender: 'neutral', language: 'en' },
      { id: 'echo', name: 'Echo', gender: 'male', language: 'en' },
      { id: 'fable', name: 'Fable', gender: 'male', language: 'en' },
      { id: 'onyx', name: 'Onyx', gender: 'male', language: 'en' },
      { id: 'nova', name: 'Nova', gender: 'female', language: 'en' },
      { id: 'shimmer', name: 'Shimmer', gender: 'female', language: 'en' },
    ];
  }

  /**
   * Health check for voice services
   */
  async healthCheck(): Promise<{
    speechToText: boolean;
    textToSpeech: boolean;
    services: string[];
  }> {
    const services: string[] = [];
    
    if (this.speechClient) services.push('Google Cloud Speech');
    if (this.openai) services.push('OpenAI Whisper/TTS');

    return {
      speechToText: services.length > 0,
      textToSpeech: this.openai !== null,
      services
    };
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
