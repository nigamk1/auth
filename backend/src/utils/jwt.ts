import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '../types';

// JWT utility functions
export class JWTUtils {
  private static getAccessSecret(): string {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
    }
    return secret;
  }

  private static getRefreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
    }
    return secret;
  }
  // Generate access token
  static generateAccessToken(payload: JWTPayload): string {
    const options: SignOptions = {
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '2h') as any,
      issuer: 'auth-system',
      audience: 'auth-system-users'
    };
    
    return jwt.sign(payload, this.getAccessSecret(), options);
  }

  // Generate refresh token
  static generateRefreshToken(payload: JWTPayload): string {
    const options: SignOptions = {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
      issuer: 'auth-system',
      audience: 'auth-system-users'
    };
    
    return jwt.sign(payload, this.getRefreshSecret(), options);
  }

  // Generate both tokens
  static generateTokens(payload: JWTPayload): { accessToken: string; refreshToken: string } {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    return { accessToken, refreshToken };
  }

  // Verify access token
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.getAccessSecret()) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.getRefreshSecret()) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Extract token from authorization header
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Get token expiration time
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Check if token is expired
  static isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return Date.now() >= expiration.getTime();
  }
}
