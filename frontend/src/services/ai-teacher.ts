import axios from 'axios';
import type {
  AISession,
  CreateSessionRequest,
  CreateSessionResponse,
  GetSessionsResponse,
  UpdateSessionStatusRequest
} from '../types/ai-teacher';

import { getApiUrl } from '../utils/environment';

const API_BASE_URL = getApiUrl();

// Create axios instance with auth interceptor
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/ai`,
  timeout: 10000,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export class AITeacherService {
  /**
   * Create a new AI teaching session
   */
  static async createSession(data: CreateSessionRequest): Promise<CreateSessionResponse> {
    const response = await apiClient.post<CreateSessionResponse>('/sessions', data);
    return response.data;
  }

  /**
   * Get user's AI teaching sessions
   */
  static async getSessions(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'completed' | 'paused';
  }): Promise<GetSessionsResponse> {
    const response = await apiClient.get<GetSessionsResponse>('/sessions', { params });
    return response.data;
  }

  /**
   * Get specific session details
   */
  static async getSession(sessionId: string): Promise<{
    session: AISession;
    transcript: any;
    whiteboard: any;
  }> {
    const response = await apiClient.get(`/sessions/${sessionId}`);
    return response.data;
  }

  /**
   * Update session status
   */
  static async updateSessionStatus(
    sessionId: string,
    data: UpdateSessionStatusRequest
  ): Promise<{ message: string; session: AISession }> {
    const response = await apiClient.patch(`/sessions/${sessionId}/status`, data);
    return response.data;
  }

  /**
   * Delete session and all associated data
   */
  static async deleteSession(sessionId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/sessions/${sessionId}`);
    return response.data;
  }

  /**
   * Get session analytics/summary
   */
  static async getSessionAnalytics(sessionId: string): Promise<{
    totalDuration: number;
    messageCount: number;
    topicsDiscussed: string[];
    difficultyLevel: string;
    engagementScore: number;
  }> {
    const response = await apiClient.get(`/sessions/${sessionId}/analytics`);
    return response.data;
  }

  /**
   * Export session transcript
   */
  static async exportTranscript(
    sessionId: string,
    format: 'txt' | 'pdf' | 'json' = 'txt'
  ): Promise<Blob> {
    const response = await apiClient.get(`/sessions/${sessionId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Get whiteboard snapshot
   */
  static async getWhiteboardSnapshot(sessionId: string): Promise<{
    elements: any[];
    canvasState: any;
    snapshots: any[];
  }> {
    const response = await apiClient.get(`/sessions/${sessionId}/whiteboard`);
    return response.data;
  }

  /**
   * Save whiteboard snapshot
   */
  static async saveWhiteboardSnapshot(
    sessionId: string,
    description?: string
  ): Promise<{ message: string; snapshotId: string }> {
    const response = await apiClient.post(`/sessions/${sessionId}/whiteboard/snapshot`, {
      description
    });
    return response.data;
  }
}

export default AITeacherService;
