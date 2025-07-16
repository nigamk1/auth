import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { 
  ApiResponse, 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
  DashboardData,
  UserStats
} from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage utilities
export const tokenStorage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },
  
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },
  
  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  
  clearTokens: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();
      
      if (!refreshToken) {
        processQueue(error, null);
        tokenStorage.clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        tokenStorage.setTokens(accessToken, newRefreshToken);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Register new user
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', credentials);
    const { accessToken, refreshToken } = response.data.data!;
    tokenStorage.setTokens(accessToken, refreshToken);
    return response.data.data!;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const { accessToken, refreshToken } = response.data.data!;
    tokenStorage.setTokens(accessToken, refreshToken);
    return response.data.data!;
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      tokenStorage.clearTokens();
    }
  },

  // Logout from all devices
  logoutAll: async (): Promise<void> => {
    try {
      await api.post('/auth/logout-all');
    } finally {
      tokenStorage.clearTokens();
    }
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await api.post<ApiResponse>('/auth/forgot-password', data);
  },

  // Reset password
  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await api.post<ApiResponse>('/auth/reset-password', data);
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data.data!;
  },

  // Refresh token
  refreshToken: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    const refreshToken = tokenStorage.getRefreshToken();
    const response = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh-token', {
      refreshToken
    });
    const tokens = response.data.data!;
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    return tokens;
  }
};

// User API
export const userAPI = {
  // Update user profile
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/user/profile', data);
    return response.data.data!;
  },

  // Change password
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.put<ApiResponse>('/user/change-password', data);
  },

  // Get user statistics
  getStats: async (): Promise<UserStats> => {
    const response = await api.get<ApiResponse<UserStats>>('/user/stats');
    return response.data.data!;
  },

  // Delete account
  deleteAccount: async (): Promise<void> => {
    await api.delete<ApiResponse>('/user/account');
  }
};

// Protected routes API
export const protectedAPI = {
  // Get dashboard data
  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get<ApiResponse<DashboardData>>('/protected/dashboard');
    return response.data.data!;
  },

  // Get admin data
  getAdminData: async (): Promise<any> => {
    const response = await api.get<ApiResponse>('/protected/admin');
    return response.data.data!;
  },

  // Get user settings
  getSettings: async (): Promise<any> => {
    const response = await api.get<ApiResponse>('/protected/settings');
    return response.data.data!;
  }
};

// Health check
export const healthAPI = {
  check: async (): Promise<any> => {
    const response = await api.get('/health');
    return response.data;
  }
};

// AI Classroom API
export const classroomAPI = {
  // Send student message to AI teacher
  sendMessage: async (
    studentMessage: string, 
    sessionId: string, 
    context?: { subject?: string; studentLevel?: string }
  ): Promise<{ 
    explanation: string; 
    drawingInstructions: Array<{
      type: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      text?: string;
      color?: string;
    }>; 
    sessionId: string;
    timestamp: string;
  }> => {
    const response = await api.post<ApiResponse<{
      explanation: string;
      drawingInstructions: Array<{
        type: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        text?: string;
        color?: string;
      }>;
      sessionId: string;
      timestamp: string;
    }>>('/ai-teacher', {
      studentMessage,
      sessionId,
      context
    });
    return response.data.data!;
  },

  // Get session history
  getSession: async (sessionId: string): Promise<{
    sessionId: string;
    subject?: string;
    createdAt: string;
    lastActivity: string;
    messageCount: number;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
  }> => {
    const response = await api.get<ApiResponse<{
      sessionId: string;
      subject?: string;
      createdAt: string;
      lastActivity: string;
      messageCount: number;
      messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }>;
    }>>(`/ai-teacher/session/${sessionId}`);
    return response.data.data!;
  },

  // Delete a session
  deleteSession: async (sessionId: string): Promise<void> => {
    await api.delete<ApiResponse>(`/ai-teacher/session/${sessionId}`);
  },

  // Get all user sessions
  getAllSessions: async (): Promise<Array<{
    sessionId: string;
    subject?: string;
    createdAt: string;
    lastActivity: string;
    messageCount: number;
  }>> => {
    const response = await api.get<ApiResponse<Array<{
      sessionId: string;
      subject?: string;
      createdAt: string;
      lastActivity: string;
      messageCount: number;
    }>>>('/ai-teacher/sessions');
    return response.data.data!;
  },

  // Update session state
  updateSessionState: async (sessionId: string, stateUpdate: {
    currentTopic?: string;
    currentStep?: number;
    aiState?: string;
    userState?: string;
    expectingUserInput?: boolean;
    shouldPromptUser?: boolean;
    learningGoals?: string[];
    completedConcepts?: string[];
    strugglingAreas?: string[];
  }): Promise<{
    currentTopic: string | null;
    currentStep: number;
    aiState: string;
    userState: string;
    expectingUserInput: boolean;
    shouldPromptUser: boolean;
  }> => {
    const response = await api.put<ApiResponse<{
      currentTopic: string | null;
      currentStep: number;
      aiState: string;
      userState: string;
      expectingUserInput: boolean;
      shouldPromptUser: boolean;
    }>>(`/ai-teacher/session/${sessionId}/state`, stateUpdate);
    return response.data.data!;
  },

  // Add topic progress
  addTopicProgress: async (sessionId: string, progress: {
    content?: string;
    completed?: boolean;
  }): Promise<{
    step: number;
    content: string;
    completed: boolean;
    timestamp: string;
  }> => {
    const response = await api.post<ApiResponse<{
      step: number;
      content: string;
      completed: boolean;
      timestamp: string;
    }>>(`/ai-teacher/session/${sessionId}/topic-progress`, progress);
    return response.data.data!;
  },

  // Legacy methods for backward compatibility (using old classroom routes)
  legacySendMessage: async (message: string): Promise<{ response: string; shouldDrawOnBoard?: boolean; boardContent?: any }> => {
    const response = await api.post<ApiResponse<{ response: string; shouldDrawOnBoard?: boolean; boardContent?: any }>>('/classroom/message', {
      message
    });
    return response.data.data!;
  },

  startSession: async (subject?: string): Promise<{ sessionId: string; greeting: string }> => {
    const response = await api.post<ApiResponse<{ sessionId: string; greeting: string }>>('/classroom/session/start', {
      subject
    });
    return response.data.data!;
  },

  endSession: async (sessionId: string): Promise<void> => {
    await api.post<ApiResponse>('/classroom/session/end', {
      sessionId
    });
  },

  getSessionHistory: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>('/classroom/sessions');
    return response.data.data!;
  }
};

// Export the configured axios instance for custom requests
export default api;
