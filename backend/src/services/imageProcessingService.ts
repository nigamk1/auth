// Optional image processing dependencies
// import sharp from 'sharp';
// import Tesseract from 'tesseract.js';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

// Define types to avoid dependency issues
interface TesseractWord {
  text: string;
  confidence: number;
}

interface TesseractBlock {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

interface TesseractData {
  text: string;
  confidence: number;
  words: TesseractWord[];
  blocks?: TesseractBlock[];
}

class ImageProcessingService {
  private sharpAvailable: boolean = false;
  private tesseractAvailable: boolean = false;
  
  constructor() {
    this.checkDependencies();
  }
  
  private async checkDependencies() {
    try {
      require('sharp');
      this.sharpAvailable = true;
      logger.info('Sharp image processing library available');
    } catch (error) {
      logger.warn('Sharp library not available - image processing will be limited');
    }
    
    try {
      require('tesseract.js');
      this.tesseractAvailable = true;
      logger.info('Tesseract OCR library available');
    } catch (error) {
      logger.warn('Tesseract.js library not available - OCR will be limited');
    }
  }
  
  async processImage(imageBuffer: Buffer, originalName: string): Promise<{
    processedBuffer: Buffer;
    metadata: {
      width: number;
      height: number;
      format: string;
      size: number;
      quality: number;
    };
    extractedText?: string;
    confidence?: number;
  }> {
    if (!this.sharpAvailable) {
      // Return basic metadata if sharp is not available
      return {
        processedBuffer: imageBuffer,
        metadata: {
          width: 0,
          height: 0,
          format: 'unknown',
          size: imageBuffer.length,
          quality: 100
        },
        extractedText: 'Image processing not available - missing dependencies',
        confidence: 0
      };
    }

    try {
      const sharp = require('sharp');
      // Get image metadata
      const imageInfo = await sharp(imageBuffer).metadata();
      
      // Process and optimize the image
      let processedBuffer = imageBuffer;
      
      // Convert to JPEG if not already, and optimize
      if (imageInfo.format !== 'jpeg') {
        processedBuffer = await sharp(imageBuffer)
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
      }

      // Resize if too large (max 2048px on longest side)
      if (imageInfo.width && imageInfo.height) {
        const maxDimension = Math.max(imageInfo.width, imageInfo.height);
        if (maxDimension > 2048) {
          const scaleFactor = 2048 / maxDimension;
          processedBuffer = await sharp(processedBuffer)
            .resize({
              width: Math.round(imageInfo.width * scaleFactor),
              height: Math.round(imageInfo.height * scaleFactor),
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toBuffer();
        }
      }

      // Get final metadata
      const finalInfo = await sharp(processedBuffer).metadata();

      const result = {
        processedBuffer,
        metadata: {
          width: finalInfo.width || 0,
          height: finalInfo.height || 0,
          format: finalInfo.format || 'jpeg',
          size: processedBuffer.length,
          quality: 85
        }
      };

      // Extract text using OCR if it looks like a document/text image
      if (this.shouldPerformOCR(originalName, imageInfo)) {
        const ocrResult = await this.extractTextFromImage(processedBuffer);
        return {
          ...result,
          extractedText: ocrResult.text,
          confidence: ocrResult.confidence
        };
      }

      return result;
    } catch (error) {
      logger.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  async extractTextFromImage(imageBuffer: Buffer): Promise<{
    text: string;
    confidence: number;
    blocks?: Array<{
      text: string;
      confidence: number;
      bbox: { x0: number; y0: number; x1: number; y1: number };
    }>;
  }> {
    if (!this.tesseractAvailable) {
      return {
        text: 'OCR not available - missing Tesseract.js dependency',
        confidence: 0,
        blocks: []
      };
    }

    try {
      const Tesseract = require('tesseract.js');
      logger.info('Starting OCR text extraction...');
      
      const { data } = await Tesseract.recognize(imageBuffer, 'eng+hin', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      // Filter out low-confidence text
      const minConfidence = 60;
      const filteredText = data.words
        .filter((word: TesseractWord) => word.confidence > minConfidence)
        .map((word: TesseractWord) => word.text)
        .join(' ');

      // Extract text blocks with positioning
      const blocks = data.blocks?.map((block: TesseractBlock) => ({
        text: block.text,
        confidence: block.confidence,
        bbox: block.bbox
      }));

      const averageConfidence = data.words.length > 0 
        ? data.words.reduce((sum: number, word: TesseractWord) => sum + word.confidence, 0) / data.words.length
        : 0;

      logger.info(`OCR completed. Confidence: ${averageConfidence}%`);

      return {
        text: filteredText || data.text,
        confidence: averageConfidence,
        blocks: blocks?.filter((block: any) => block.confidence > minConfidence)
      };
    } catch (error) {
      logger.error('Error in OCR text extraction:', error);
      return {
        text: '',
        confidence: 0
      };
    }
  }

  async generateThumbnail(imageBuffer: Buffer, size: number = 200): Promise<Buffer> {
    if (!this.sharpAvailable) {
      throw new Error('Sharp library not available - cannot generate thumbnail');
    }

    try {
      const sharp = require('sharp');
      return await sharp(imageBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  async optimizeForWeb(imageBuffer: Buffer): Promise<{
    webp: Buffer;
    jpeg: Buffer;
    metadata: {
      originalSize: number;
      webpSize: number;
      jpegSize: number;
      compressionRatio: number;
    };
  }> {
    if (!this.sharpAvailable) {
      throw new Error('Sharp library not available - cannot optimize image');
    }

    try {
      const sharp = require('sharp');
      const originalSize = imageBuffer.length;

      // Generate WebP version (best compression)
      const webpBuffer = await sharp(imageBuffer)
        .webp({ quality: 85, effort: 6 })
        .toBuffer();

      // Generate optimized JPEG version (better compatibility)
      const jpegBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 85, progressive: true, mozjpeg: true })
        .toBuffer();

      return {
        webp: webpBuffer,
        jpeg: jpegBuffer,
        metadata: {
          originalSize,
          webpSize: webpBuffer.length,
          jpegSize: jpegBuffer.length,
          compressionRatio: Math.round((1 - (webpBuffer.length / originalSize)) * 100)
        }
      };
    } catch (error) {
      logger.error('Error optimizing image for web:', error);
      throw new Error('Failed to optimize image');
    }
  }

  async detectImageType(imageBuffer: Buffer): Promise<{
    type: 'document' | 'diagram' | 'photo' | 'screenshot' | 'handwriting' | 'math' | 'unknown';
    confidence: number;
    characteristics: string[];
  }> {
    if (!this.sharpAvailable) {
      return {
        type: 'unknown',
        confidence: 0,
        characteristics: ['sharp-not-available']
      };
    }

    try {
      const sharp = require('sharp');
      const metadata = await sharp(imageBuffer).metadata();
      const stats = await sharp(imageBuffer).stats();
      
      const characteristics: string[] = [];
      let type: 'document' | 'diagram' | 'photo' | 'screenshot' | 'handwriting' | 'math' | 'unknown' = 'unknown';
      let confidence = 0.5;

      // Analyze image characteristics
      const aspectRatio = (metadata.width || 1) / (metadata.height || 1);
      const isSquareish = aspectRatio > 0.7 && aspectRatio < 1.3;
      const isLandscape = aspectRatio > 1.5;
      const isPortrait = aspectRatio < 0.7;

      // Check if it's likely a document/screenshot
      if (metadata.width && metadata.height) {
        if (metadata.width > 1000 && metadata.height > 1000) {
          characteristics.push('high-resolution');
        }
        
        if (isLandscape) {
          characteristics.push('landscape');
          confidence += 0.1;
        }
        
        if (isPortrait) {
          characteristics.push('portrait');
          type = 'document';
          confidence += 0.2;
        }
      }

      // Analyze color distribution
      const channels = stats.channels;
      if (channels && channels.length >= 3) {
        const [red, green, blue] = channels;
        const colorVariance = Math.sqrt(
          Math.pow(red.mean - green.mean, 2) + 
          Math.pow(green.mean - blue.mean, 2) + 
          Math.pow(blue.mean - red.mean, 2)
        );

        if (colorVariance < 50) {
          characteristics.push('low-color-variance');
          type = type === 'unknown' ? 'document' : type;
          confidence += 0.2;
        } else {
          characteristics.push('high-color-variance');
          type = type === 'unknown' ? 'photo' : type;
          confidence += 0.1;
        }
      }

      // Quick OCR check for text presence (only if Tesseract is available)
      if (this.tesseractAvailable) {
        try {
          const Tesseract = require('tesseract.js');
          const quickOCR = await Tesseract.recognize(imageBuffer, 'eng', {
            logger: () => {} // Silent
          });

          if (quickOCR.data.text.length > 10) {
            characteristics.push('contains-text');
            
            // Check for mathematical symbols
            const mathSymbols = /[+\-=×÷∫∑√πθαβγδελμνρσφχψω]/g;
            if (mathSymbols.test(quickOCR.data.text)) {
              characteristics.push('mathematical-content');
              type = 'math';
              confidence += 0.3;
            } else {
              type = type === 'unknown' ? 'document' : type;
              confidence += 0.2;
            }
          }
        } catch (ocrError) {
          // OCR failed, might be a photo or diagram
          type = type === 'unknown' ? 'photo' : type;
        }
      }

      return {
        type,
        confidence: Math.min(confidence, 1.0),
        characteristics
      };
    } catch (error) {
      logger.error('Error detecting image type:', error);
      return {
        type: 'unknown',
        confidence: 0,
        characteristics: []
      };
    }
  }

  private shouldPerformOCR(filename: string, metadata: any): boolean {
    // Skip OCR for very small images
    if (metadata.width && metadata.height && 
        (metadata.width < 100 || metadata.height < 100)) {
      return false;
    }

    // Check file extension hints
    const lowerFilename = filename.toLowerCase();
    const documentExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'];
    
    // If it's clearly a document format, perform OCR
    if (documentExtensions.some(ext => lowerFilename.includes(ext))) {
      return true;
    }

    // For image files, perform OCR by default (we can optimize this later)
    if (imageExtensions.some(ext => lowerFilename.includes(ext))) {
      return true;
    }

    return true; // Default to performing OCR
  }

  async saveImage(imageBuffer: Buffer, filename: string, subdirectory: string = 'images'): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', subdirectory);
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, imageBuffer);
    
    return filePath;
  }

  generateFilename(originalName: string, suffix: string = ''): string {
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${cleanName}_${timestamp}${suffix}${ext}`;
  }
}

export const imageProcessingService = new ImageProcessingService();
