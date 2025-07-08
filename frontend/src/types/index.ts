// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  bio?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Auth Context types
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileFormData {
  firstName: string;
  lastName: string;
  bio?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
}

// Component prop types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  register: any;
  className?: string;
}

export interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

// Hook types
export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseToastResult {
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  hideToast: () => void;
  toast: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    visible: boolean;
  } | null;
}

// Local Storage types
export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Dashboard types
export interface UserStats {
  accountAge: number;
  lastLogin?: string;
  isEmailVerified: boolean;
  activeTokens: number;
}

export interface DashboardData {
  user: User;
  stats: UserStats;
}

// AI Teacher Platform Types
export interface Session {
  id: string;
  title: string;
  subject: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'active' | 'completed' | 'paused';
  startTime: Date;
  endTime?: Date;
  duration: number;
  summary?: string;
  tags: string[];
  metadata: {
    totalMessages: number;
    totalQuestions: number;
    topicsDiscussed: string[];
    whiteboard: {
      actions: number;
      elements: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  sessionId: string;
  type: 'user_audio' | 'user_text' | 'ai_response' | 'system';
  content: {
    text?: string;
    audioUrl?: string;
    transcription?: string;
    audioData?: {
      duration: number;
      fileSize: number;
      format: string;
    };
  };
  aiResponse?: {
    spokenText: string;
    audioUrl?: string;
    whiteboardCommands?: WhiteboardCommand[];
    emotion?: string;
    confidence: number;
  };
  metadata: {
    timestamp: Date;
    language: string;
    processingTime?: number;
    tokens?: {
      input: number;
      output: number;
    };
  };
  createdAt: Date;
}

export interface WhiteboardCommand {
  type: 'draw' | 'text' | 'shape' | 'equation' | 'diagram' | 'clear' | 'highlight';
  action: 'add' | 'update' | 'delete' | 'move';
  element: {
    id: string;
    type: string;
    position: { x: number; y: number };
    properties: any;
    content?: string;
  };
}

export interface WhiteboardState {
  elements: any[];
  version: number;
  lastModified: Date;
  metadata: {
    totalElements: number;
    canvasSize: {
      width: number;
      height: number;
    };
    backgroundColor: string;
  };
}

export interface SessionAnalytics {
  overview: {
    totalSessions: number;
    totalDuration: number;
    averageDuration: number;
    completedSessions: number;
    totalMessages: number;
    totalQuestions: number;
    subjects: string[];
    languages: string[];
  };
  subjectBreakdown: {
    _id: string;
    count: number;
    totalDuration: number;
    averageDuration: number;
  }[];
  timeRange: string;
}

export interface VoiceRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioBlob?: Blob;
  audioUrl?: string;
}

export interface AIProcessingState {
  status: 'idle' | 'transcribing' | 'thinking' | 'speaking' | 'complete';
  message: string;
  progress?: number;
}

export interface ClassroomSettings {
  voiceSettings: {
    inputDevice?: string;
    outputDevice?: string;
    noiseReduction: boolean;
    autoGainControl: boolean;
    echoCancellation: boolean;
  };
  teacherSettings: {
    voice: 'male' | 'female';
    speed: number;
    emotion: 'neutral' | 'encouraging' | 'empathetic' | 'enthusiastic' | 'patient';
    language: string;
  };
  whiteboardSettings: {
    backgroundColor: string;
    gridEnabled: boolean;
    snapToGrid: boolean;
    autoSave: boolean;
  };
  generalSettings: {
    theme: 'light' | 'dark';
    notifications: boolean;
    autoplay: boolean;
    subtitles: boolean;
  };
}

// WebSocket Event Types
export interface SocketEvents {
  'join_session': (sessionId: string) => void;
  'leave_session': (sessionId: string) => void;
  'voice_message': (data: { sessionId: string; audioData: ArrayBuffer; language?: string }) => void;
  'text_message': (data: { sessionId: string; text: string; language?: string }) => void;
  'whiteboard_update': (data: { sessionId: string; elements: any[] }) => void;
  'pause_session': (sessionId: string) => void;
  'resume_session': (sessionId: string) => void;
  'end_session': (sessionId: string) => void;
}

export interface SocketListeners {
  'transcription_result': (data: { messageId: string; transcription: string }) => void;
  'ai_response': (data: {
    messageId: string;
    text: string;
    audioUrl?: string;
    emotion: string;
    confidence: number;
    whiteboardCommands?: WhiteboardCommand[];
  }) => void;
  'processing_status': (data: { status: string; message: string }) => void;
  'whiteboard_state': (elements: any[]) => void;
  'whiteboard_update': (elements: any[]) => void;
  'session_status_changed': (data: { sessionId: string; status: string; timestamp: Date }) => void;
  'error': (data: { message: string }) => void;
}

// Form Types
export interface CreateSessionFormData {
  title: string;
  subject: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface SessionFilters {
  status?: 'active' | 'completed' | 'paused';
  subject?: string;
  language?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// API Response Types for AI Features
export interface SessionsResponse {
  sessions: Session[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SessionDetailsResponse {
  session: Session;
  messages: Message[];
  whiteboard: WhiteboardState | null;
}

export interface ProcessMessageResponse {
  userMessage: {
    id: string;
    text?: string;
    transcription?: string;
    timestamp: Date;
  };
  aiResponse: {
    id: string;
    text: string;
    audioUrl?: string;
    emotion: string;
    confidence: number;
    whiteboardCommands?: WhiteboardCommand[];
    timestamp: Date;
  };
}
