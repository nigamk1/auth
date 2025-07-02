import multer from 'multer';
// import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// Define AWS types to avoid dependency
interface S3ClientType {
  send(command: any): Promise<any>;
}

interface S3Command {
  input: any;
}

class FileUploadService {
  private s3Client?: S3ClientType;
  private bucketName: string;
  private useLocalStorage: boolean;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || 'tutor-platform-uploads';
    this.useLocalStorage = !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY;
    
    if (!this.useLocalStorage) {
      this.initializeS3();
    } else {
      logger.warn('AWS credentials not found, using local file storage');
    }
  }

  private async initializeS3() {
    try {
      const AWS = require('@aws-sdk/client-s3');
      this.s3Client = new AWS.S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        }
      });
      logger.info('S3 client initialized successfully');
    } catch (error) {
      logger.warn('AWS S3 client not available (package not installed):', error);
      this.useLocalStorage = true;
    }
  }

  getMulterConfig() {
    const storage = multer.memoryStorage();
    
    return multer({
      storage,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 5 // Max 5 files at once
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          // Images
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/bmp',
          'image/tiff',
          // Audio
          'audio/mpeg',
          'audio/wav',
          'audio/ogg',
          'audio/m4a',
          'audio/webm',
          // Video (for future use)
          'video/mp4',
          'video/webm',
          'video/ogg',
          // Documents (for OCR)
          'application/pdf'
        ];

        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} not allowed`));
        }
      }
    });
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    category: 'images' | 'audio' | 'videos' | 'documents' = 'images',
    userId?: string
  ): Promise<{
    url: string;
    key: string;
    size: number;
  }> {
    const fileKey = this.generateFileKey(originalName, category, userId);
    
    if (this.useLocalStorage) {
      return this.uploadToLocal(buffer, fileKey, mimeType);
    } else {
      return this.uploadToS3(buffer, fileKey, mimeType);
    }
  }

  private async uploadToS3(buffer: Buffer, key: string, mimeType: string) {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    try {
      const AWS = require('@aws-sdk/client-s3');
      const command = new AWS.PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'max-age=31536000', // 1 year
        Metadata: {
          uploadedAt: new Date().toISOString()
        }
      });

      await this.s3Client.send(command);
      
      const url = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
      
      logger.info(`File uploaded to S3: ${key}`);
      
      return {
        url,
        key,
        size: buffer.length
      };
    } catch (error) {
      logger.error('Error uploading to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  private async uploadToLocal(buffer: Buffer, key: string, mimeType: string) {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const filePath = path.join(uploadsDir, key);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Write file
      await fs.writeFile(filePath, buffer);
      
      const url = `/uploads/${key}`;
      
      logger.info(`File uploaded locally: ${key}`);
      
      return {
        url,
        key,
        size: buffer.length
      };
    } catch (error) {
      logger.error('Error uploading locally:', error);
      throw new Error('Failed to upload file locally');
    }
  }

  async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.useLocalStorage) {
      // For local storage, return the direct path
      return `/uploads/${key}`;
    }

    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    try {
      const AWS = require('@aws-sdk/client-s3');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      
      const command = new AWS.GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn
      });

      return signedUrl;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (this.useLocalStorage) {
      await this.deleteFromLocal(key);
    } else {
      await this.deleteFromS3(key);
    }
  }

  private async deleteFromS3(key: string) {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    try {
      const AWS = require('@aws-sdk/client-s3');
      const command = new AWS.DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error('Error deleting from S3:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  private async deleteFromLocal(key: string) {
    try {
      const filePath = path.join(process.cwd(), 'uploads', key);
      await fs.unlink(filePath);
      logger.info(`File deleted locally: ${key}`);
    } catch (error) {
      logger.error('Error deleting local file:', error);
      throw new Error('Failed to delete local file');
    }
  }

  private generateFileKey(
    originalName: string,
    category: string,
    userId?: string
  ): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');
    
    const userPrefix = userId ? `${userId}/` : '';
    return `${category}/${userPrefix}${timestamp}_${randomString}_${baseName}${ext}`;
  }

  async moveFile(oldKey: string, newKey: string): Promise<void> {
    if (this.useLocalStorage) {
      await this.moveLocalFile(oldKey, newKey);
    } else {
      await this.moveS3File(oldKey, newKey);
    }
  }

  private async moveLocalFile(oldKey: string, newKey: string) {
    try {
      const oldPath = path.join(process.cwd(), 'uploads', oldKey);
      const newPath = path.join(process.cwd(), 'uploads', newKey);
      
      // Ensure new directory exists
      await fs.mkdir(path.dirname(newPath), { recursive: true });
      
      // Move file
      await fs.rename(oldPath, newPath);
      
      logger.info(`File moved locally: ${oldKey} -> ${newKey}`);
    } catch (error) {
      logger.error('Error moving local file:', error);
      throw new Error('Failed to move local file');
    }
  }

  private async moveS3File(oldKey: string, newKey: string) {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    try {
      const AWS = require('@aws-sdk/client-s3');
      // Copy to new location
      const copyCommand = new AWS.PutObjectCommand({
        Bucket: this.bucketName,
        Key: newKey,
        CopySource: `${this.bucketName}/${oldKey}`
      });

      await this.s3Client.send(copyCommand);

      // Delete old file
      await this.deleteFromS3(oldKey);

      logger.info(`File moved in S3: ${oldKey} -> ${newKey}`);
    } catch (error) {
      logger.error('Error moving S3 file:', error);
      throw new Error('Failed to move S3 file');
    }
  }

  getFileInfo(key: string): {
    category: string;
    userId?: string;
    timestamp: number;
    filename: string;
  } {
    const parts = key.split('/');
    const category = parts[0];
    const filenamePart = parts[parts.length - 1];
    
    let userId: string | undefined;
    if (parts.length > 2) {
      userId = parts[1];
    }

    const [timestampStr] = filenamePart.split('_');
    const timestamp = parseInt(timestampStr) || 0;

    return {
      category,
      userId,
      timestamp,
      filename: filenamePart
    };
  }
}

export const fileUploadService = new FileUploadService();
