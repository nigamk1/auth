import api from './api';

export interface SessionSummary {
  sessionId: string;
  session: {
    title: string;
    subject: string;
    status: string;
    startedAt: string;
    endedAt?: string;
  };
  highlights: {
    totalDuration: number;
    messageCount: number;
    whiteboardActions: number;
    topicsDiscussed: string[];
    rating?: number;
    keyMoments: Array<{
      content: string;
      timestamp: string;
      confidence?: number;
    }>;
  };
  summary: {
    totalMessages: number;
    totalWhiteboardActions: number;
    mainTopics: string[];
    keyLearnings: string[];
    questionsAsked: number;
    questionsAnswered: number;
    averageResponseTime: number;
    sessionRating?: number;
    feedback?: string;
  };
  analytics: {
    userEngagement: {
      messageCount: number;
      whiteboardInteractions: number;
      timeSpentActive: number;
      lastActivity: string;
    };
    aiPerformance: {
      averageConfidence: number;
      responseAccuracy?: number;
      helpfulnessRating?: number;
    };
    learningProgress: {
      conceptsCovered: string[];
      masteryLevel: 'beginner' | 'intermediate' | 'advanced';
      improvementAreas: string[];
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  metadata?: {
    confidence?: number;
    aiModel?: string;
    processingTime?: number;
    sentiment?: 'positive' | 'negative' | 'neutral';
  };
}

export interface WhiteboardSnapshot {
  elements: any[];
  canvasState: {
    zoom: number;
    viewBox: { x: number; y: number; width: number; height: number };
    backgroundColor: string;
  };
  timestamp: string;
  createdBy: string;
  version: number;
}

class SessionMemoryService {
  
  // Get all user sessions with highlights
  async getUserSessions(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await api.get(`/session-memory/sessions?${queryParams.toString()}`);
    return response.data;
  }

  // Get detailed session summary
  async getSessionSummary(sessionId: string) {
    const response = await api.get(`/session-memory/session/${sessionId}/summary`);
    return response.data;
  }

  // Get chat history for a session
  async getChatHistory(sessionId: string, params?: {
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/session-memory/session/${sessionId}/chat?${queryParams.toString()}`);
    return response.data;
  }

  // Get whiteboard history for a session
  async getWhiteboardHistory(sessionId: string) {
    const response = await api.get(`/session-memory/session/${sessionId}/whiteboard`);
    return response.data;
  }

  // Add chat message to session memory
  async addChatMessage(sessionId: string, message: {
    message: string;
    type: 'user' | 'ai' | 'system';
    metadata?: any;
  }) {
    const response = await api.post(`/session-memory/session/${sessionId}/chat`, message);
    return response.data;
  }

  // Save whiteboard snapshot
  async saveWhiteboardSnapshot(sessionId: string, snapshot: {
    elements: any[];
    canvasState: any;
    createdBy: string;
  }) {
    const response = await api.post(`/session-memory/session/${sessionId}/whiteboard`, snapshot);
    return response.data;
  }

  // Update session feedback and rating
  async updateSessionFeedback(sessionId: string, feedback: {
    rating: number;
    feedback?: string;
    keyLearnings?: string[];
  }) {
    const response = await api.post(`/session-memory/session/${sessionId}/feedback`, feedback);
    return response.data;
  }

  // Export session data
  async exportSessionData(sessionId: string, format: 'json' = 'json') {
    const response = await api.get(`/session-memory/session/${sessionId}/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Delete session memory
  async deleteSessionMemory(sessionId: string) {
    const response = await api.delete(`/session-memory/session/${sessionId}`, {
      data: { confirm: true }
    });
    return response.data;
  }

  // Get or create session memory
  async getOrCreateSessionMemory(sessionId: string) {
    const response = await api.get(`/session-memory/session/${sessionId}`);
    return response.data;
  }
}

export default new SessionMemoryService();
