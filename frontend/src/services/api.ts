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
  UserStats,
  // AI and Session types
  Session,
  Message,
  WhiteboardCommand,
  WhiteboardState,
  SessionAnalytics,
  CreateSessionFormData
} from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage utilities
export const tokenStorage = {
  getAccessToken: (): string | null => {
    const token = localStorage.getItem('accessToken');
    console.log('📖 Getting access token:', token ? 'Found' : 'Not found');
    return token;
  },
  
  getRefreshToken: (): string | null => {
    const token = localStorage.getItem('refreshToken');
    console.log('📖 Getting refresh token:', token ? 'Found' : 'Not found');
    return token;
  },
  
  setTokens: (accessToken: string, refreshToken: string): void => {
    console.log('💾 Storing tokens in localStorage');
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  
  clearTokens: (): void => {
    console.log('🗑️ Clearing tokens from localStorage');
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
        console.log('🔄 Attempting to refresh token...');
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, {
          refreshToken
        });

        console.log('✅ Token refresh successful');
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        tokenStorage.setTokens(accessToken, newRefreshToken);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
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

// AI and Session API
export const aiAPI = {
  // Create a new session
  createSession: async (data: CreateSessionFormData): Promise<Session> => {
    const response = await api.post<ApiResponse<Session>>('/sessions', data);
    return response.data.data!;
  },

  // Get session by ID
  getSession: async (sessionId: string): Promise<Session> => {
    const response = await api.get<ApiResponse<Session>>(`/sessions/${sessionId}`);
    return response.data.data!;
  },

  // Get all sessions
  getSessions: async (): Promise<Session[]> => {
    const response = await api.get<ApiResponse<Session[]>>('/sessions');
    return response.data.data!;
  },

  // Send a text message to the session
  sendMessage: async (sessionId: string, message: string): Promise<Message> => {
    const response = await api.post<ApiResponse<Message>>(`/ai/message`, { sessionId, message });
    return response.data.data!;
  },

  // Upload a voice file
  uploadVoice: async (sessionId: string, file: File): Promise<{ message: Message; audioUrl?: string }> => {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('sessionId', sessionId);

    const response = await api.post<ApiResponse<{ message: Message; audioUrl?: string }>>(`/ai/voice`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  },

  // Send whiteboard command
  sendWhiteboardCommand: async (sessionId: string, command: WhiteboardCommand): Promise<void> => {
    await api.post<ApiResponse>(`/whiteboard/${sessionId}/command`, command);
  },

  // Get whiteboard state
  getWhiteboardState: async (sessionId: string): Promise<WhiteboardState> => {
    const response = await api.get<ApiResponse<WhiteboardState>>(`/whiteboard/${sessionId}/state`);
    return response.data.data!;
  },

  // Update whiteboard state
  updateWhiteboardState: async (sessionId: string, state: WhiteboardState): Promise<void> => {
    await api.put<ApiResponse>(`/whiteboard/${sessionId}/state`, state);
  },

  // Get session analytics
  getSessionAnalytics: async (sessionId: string): Promise<SessionAnalytics> => {
    const response = await api.get<ApiResponse<SessionAnalytics>>(`/sessions/${sessionId}/analytics`);
    return response.data.data!;
  },

  // End session
  endSession: async (sessionId: string): Promise<Session> => {
    const response = await api.post<ApiResponse<Session>>(`/sessions/${sessionId}/end`);
    return response.data.data!;
  },

  // Pause session
  pauseSession: async (sessionId: string): Promise<Session> => {
    const response = await api.post<ApiResponse<Session>>(`/sessions/${sessionId}/pause`);
    return response.data.data!;
  },

  // Resume session
  resumeSession: async (sessionId: string): Promise<Session> => {
    const response = await api.post<ApiResponse<Session>>(`/sessions/${sessionId}/resume`);
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

// Export the configured axios instance for custom requests
export default api;
