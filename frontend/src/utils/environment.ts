/**
 * Environment variable utilities for Vite frontend
 * Provides type-safe access to environment variables with validation
 */

interface EnvironmentConfig {
  apiUrl: string;
  appName: string;
  appVersion: string;
  wsUrl: string;
  socketUrl: string;
  maxFileSize: number;
  supportedImageTypes: string[];
  supportedAudioTypes: string[];
  googleClientId?: string;
  githubClientId?: string;
}

/**
 * Validates and parses environment variables
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  // Get environment variables with fallbacks
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const appName = import.meta.env.VITE_APP_NAME || 'AI Teacher Platform';
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  const maxFileSize = parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760', 10);
  
  // Parse comma-separated values
  const supportedImageTypes = import.meta.env.VITE_SUPPORTED_IMAGE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ];
  
  const supportedAudioTypes = import.meta.env.VITE_SUPPORTED_AUDIO_TYPES?.split(',') || [
    'audio/wav',
    'audio/mp3',
    'audio/ogg'
  ];

  // OAuth configuration (optional)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID;

  // Validation
  if (!apiUrl) {
    console.warn('VITE_API_URL is not set, using default localhost:5000');
  }

  if (isNaN(maxFileSize) || maxFileSize <= 0) {
    console.warn('Invalid VITE_MAX_FILE_SIZE, using default 10MB');
  }

  return {
    apiUrl,
    appName,
    appVersion,
    wsUrl,
    socketUrl,
    maxFileSize,
    supportedImageTypes,
    supportedAudioTypes,
    googleClientId,
    githubClientId
  };
};

/**
 * Get API base URL for making requests (includes /api prefix)
 */
export const getApiUrl = (path: string = ''): string => {
  const config = getEnvironmentConfig();
  const baseUrl = config.apiUrl.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}/api${cleanPath}`;
};

/**
 * Get base server URL (without /api prefix)
 */
export const getServerUrl = (): string => {
  const config = getEnvironmentConfig();
  return config.apiUrl.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl;
};

/**
 * Get WebSocket URL for real-time connections
 */
export const getSocketUrl = (): string => {
  const config = getEnvironmentConfig();
  return config.socketUrl;
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

/**
 * Check if we're in production mode
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

/**
 * Get the current environment mode
 */
export const getEnvironmentMode = (): string => {
  return import.meta.env.MODE;
};

/**
 * Debug helper to log environment configuration
 */
export const logEnvironmentConfig = (): void => {
  if (isDevelopment()) {
    console.group('🔧 Environment Configuration');
    console.log('Mode:', getEnvironmentMode());
    console.log('Config:', getEnvironmentConfig());
    console.groupEnd();
  }
};

// Export the singleton config and log it in development
export const env = getEnvironmentConfig();

// Log configuration in development mode
if (isDevelopment()) {
  logEnvironmentConfig();
}

export default env;
