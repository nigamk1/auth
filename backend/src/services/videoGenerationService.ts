import { logger } from '../utils/logger';
import { ttsService } from './ttsService';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';

interface VideoSegment {
  id: number;
  text: string;
  audioFile: string;
  duration: number;
  visualCues: Array<{
    type: string;
    timestamp: number;
    content: string;
  }>;
}

interface VideoGenerationOptions {
  script: {
    fullScript: string;
    segments: Array<{
      id: number;
      text: string;
      markers: string[];
      estimatedDuration: number;
    }>;
    totalEstimatedDuration: number;
    visualCues: Array<{
      type: string;
      timestamp: number;
      content: string;
    }>;
  };
  voiceSettings: {
    provider: 'google' | 'elevenlabs' | 'azure';
    voiceId: string;
    speed: number;
    pitch: number;
  };
  videoSettings: {
    quality: '720p' | '1080p';
    animationStyle: 'minimal' | 'detailed' | 'interactive';
  };
  subject: string;
  language: string;
}

class VideoGenerationService {
  private readonly tempDir: string;
  private readonly outputDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'videos');
    this.outputDir = path.join(process.cwd(), 'uploads', 'videos');
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    await fs.mkdir(this.tempDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async generateVideo(
    questionId: string,
    options: VideoGenerationOptions
  ): Promise<{
    videoPath: string;
    thumbnailPath: string;
    duration: number;
    size: number;
    metadata: {
      segments: VideoSegment[];
      totalAudioDuration: number;
      renderingTime: number;
      quality: string;
    };
  }> {
    const startTime = Date.now();
    logger.info(`Starting video generation for question ${questionId}`);

    try {
      // Step 1: Generate audio for each segment
      const audioSegments = await this.generateAudioSegments(
        options.script.segments,
        options.voiceSettings
      );

      // Step 2: Create video composition
      const videoPath = await this.createVideoComposition(
        questionId,
        audioSegments,
        options
      );

      // Step 3: Generate thumbnail
      const thumbnailPath = await this.generateThumbnail(videoPath);

      // Step 4: Get video metadata
      const videoStats = await fs.stat(videoPath);
      const totalAudioDuration = audioSegments.reduce((sum, seg) => sum + seg.duration, 0);

      const renderingTime = Date.now() - startTime;
      
      logger.info(`Video generation completed in ${renderingTime}ms`);

      return {
        videoPath,
        thumbnailPath,
        duration: totalAudioDuration,
        size: videoStats.size,
        metadata: {
          segments: audioSegments,
          totalAudioDuration,
          renderingTime,
          quality: options.videoSettings.quality
        }
      };
    } catch (error) {
      logger.error('Error generating video:', error);
      throw new Error('Failed to generate video');
    }
  }

  private async generateAudioSegments(
    scriptSegments: VideoGenerationOptions['script']['segments'],
    voiceSettings: VideoGenerationOptions['voiceSettings']
  ): Promise<VideoSegment[]> {
    const audioSegments: VideoSegment[] = [];

    for (const segment of scriptSegments) {
      try {
        logger.info(`Generating audio for segment ${segment.id}`);
        
        const audioResult = await ttsService.generateSpeech(segment.text, {
          provider: voiceSettings.provider,
          voiceId: voiceSettings.voiceId,
          speed: voiceSettings.speed,
          pitch: voiceSettings.pitch
        });

        // Save audio file
        const audioFileName = `segment_${segment.id}_${Date.now()}.mp3`;
        const audioFilePath = path.join(this.tempDir, audioFileName);
        await fs.writeFile(audioFilePath, audioResult.audioBuffer);

        audioSegments.push({
          id: segment.id,
          text: segment.text,
          audioFile: audioFilePath,
          duration: audioResult.duration,
          visualCues: [] // Will be populated from script
        });

        logger.info(`Audio segment ${segment.id} generated successfully`);
      } catch (error) {
        logger.error(`Error generating audio for segment ${segment.id}:`, error);
        throw error;
      }
    }

    return audioSegments;
  }

  private async createVideoComposition(
    questionId: string,
    audioSegments: VideoSegment[],
    options: VideoGenerationOptions
  ): Promise<string> {
    // Create a simple video composition using FFmpeg
    // In a production environment, you'd use Remotion for more sophisticated animations
    
    const outputFileName = `video_${questionId}_${Date.now()}.mp4`;
    const outputPath = path.join(this.outputDir, outputFileName);

    try {
      // Concatenate all audio files
      const audioListPath = path.join(this.tempDir, `audio_list_${questionId}.txt`);
      const audioList = audioSegments.map(seg => `file '${seg.audioFile}'`).join('\n');
      await fs.writeFile(audioListPath, audioList);

      // Create video using FFmpeg
      await this.runFFmpegCommand([
        '-f', 'concat',
        '-safe', '0',
        '-i', audioListPath,
        '-f', 'lavfi',
        '-i', this.generateVideoFilter(options),
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        outputPath
      ]);

      // Clean up temporary files
      await this.cleanupTempFiles([audioListPath, ...audioSegments.map(seg => seg.audioFile)]);

      return outputPath;
    } catch (error) {
      logger.error('Error creating video composition:', error);
      throw new Error('Failed to create video composition');
    }
  }

  private generateVideoFilter(options: VideoGenerationOptions): string {
    // Generate video filter based on settings
    const resolution = options.videoSettings.quality === '1080p' ? '1920x1080' : '1280x720';
    const backgroundColor = this.getBackgroundColor(options.subject);
    
    // Create animated background with text overlay capabilities
    return `color=c=${backgroundColor}:size=${resolution}:duration=300[bg];` +
           `[bg]drawtext=fontfile=/Windows/Fonts/arial.ttf:text='Educational Video':` +
           `fontsize=48:fontcolor=white:x=(w-text_w)/2:y=50[video]`;
  }

  private getBackgroundColor(subject: string): string {
    const subjectColors: { [key: string]: string } = {
      'mathematics': '#1e3a8a',
      'physics': '#7c2d12',
      'chemistry': '#059669',
      'biology': '#166534',
      'computer science': '#581c87',
      'history': '#92400e',
      'literature': '#7c2d12',
      'default': '#1f2937'
    };

    return subjectColors[subject.toLowerCase()] || subjectColors.default;
  }

  private async runFFmpegCommand(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ['-y', ...args], {
        stdio: 'pipe'
      });

      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          logger.error('FFmpeg stderr:', stderr);
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async generateThumbnail(videoPath: string): Promise<string> {
    const thumbnailFileName = path.basename(videoPath, '.mp4') + '_thumb.jpg';
    const thumbnailPath = path.join(path.dirname(videoPath), thumbnailFileName);

    try {
      await this.runFFmpegCommand([
        '-i', videoPath,
        '-ss', '00:00:01',
        '-vframes', '1',
        '-q:v', '2',
        thumbnailPath
      ]);

      return thumbnailPath;
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  private async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        logger.warn(`Failed to cleanup temp file ${filePath}:`, error);
      }
    }
  }

  // Advanced Remotion-based video generation (future implementation)
  private async generateRemotionVideo(
    questionId: string,
    options: VideoGenerationOptions
  ): Promise<string> {
    // This would use @remotion/renderer to create sophisticated animations
    // For now, we'll use the simpler FFmpeg approach above
    throw new Error('Remotion video generation not implemented yet');
  }

  async getVideoInfo(videoPath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
    bitrate: number;
  }> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoPath
      ]);

      let stdout = '';
      
      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            const info = JSON.parse(stdout);
            const videoStream = info.streams.find((stream: any) => stream.codec_type === 'video');
            
            resolve({
              duration: parseFloat(info.format.duration),
              width: videoStream.width,
              height: videoStream.height,
              fps: eval(videoStream.r_frame_rate), // Safe eval for fraction
              codec: videoStream.codec_name,
              bitrate: parseInt(info.format.bit_rate)
            });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`ffprobe exited with code ${code}`));
        }
      });
    });
  }
}

export const videoGenerationService = new VideoGenerationService();
