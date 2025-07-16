import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Session state types
export interface SessionState {
  // Current session info
  sessionId: string | null;
  isSessionActive: boolean;
  
  // Topic and flow management
  currentTopic: string | null;
  currentStep: number;
  topicProgress: Array<{
    step: number;
    content: string;
    completed: boolean;
    timestamp: Date;
  }>;
  
  // Conversation flow
  lastStudentInput: string | null;
  lastAIResponse: string | null;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    drawingInstructions?: string[];
  }>;
  
  // AI and user states
  aiState: 'idle' | 'listening' | 'processing' | 'speaking' | 'drawing';
  userState: 'idle' | 'speaking' | 'waiting' | 'typing';
  
  // Flow control
  expectingUserInput: boolean;
  shouldPromptUser: boolean;
  waitingForResponse: boolean;
  
  // Session metadata
  subject: string | null;
  startTime: Date | null;
  totalInteractions: number;
  lastActivity: Date | null;
  
  // Context and learning state
  learningGoals: string[];
  completedConcepts: string[];
  strugglingAreas: string[];
  
  // Error and status tracking
  lastError: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

// Session actions
export type SessionAction =
  | { type: 'START_SESSION'; payload: { sessionId: string; subject?: string } }
  | { type: 'END_SESSION' }
  | { type: 'SET_TOPIC'; payload: { topic: string; step?: number } }
  | { type: 'ADVANCE_STEP'; payload?: { content: string } }
  | { type: 'ADD_USER_MESSAGE'; payload: { content: string; timestamp?: Date } }
  | { type: 'ADD_AI_MESSAGE'; payload: { content: string; drawingInstructions?: string[]; timestamp?: Date } }
  | { type: 'SET_AI_STATE'; payload: SessionState['aiState'] }
  | { type: 'SET_USER_STATE'; payload: SessionState['userState'] }
  | { type: 'SET_EXPECTING_INPUT'; payload: boolean }
  | { type: 'SET_SHOULD_PROMPT'; payload: boolean }
  | { type: 'SET_WAITING_RESPONSE'; payload: boolean }
  | { type: 'UPDATE_LEARNING_PROGRESS'; payload: { goals?: string[]; completed?: string[]; struggling?: string[] } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION_STATUS'; payload: SessionState['connectionStatus'] }
  | { type: 'RESET_SESSION' };

// Initial state
const initialSessionState: SessionState = {
  sessionId: null,
  isSessionActive: false,
  currentTopic: null,
  currentStep: 0,
  topicProgress: [],
  lastStudentInput: null,
  lastAIResponse: null,
  conversationHistory: [],
  aiState: 'idle',
  userState: 'idle',
  expectingUserInput: true,
  shouldPromptUser: false,
  waitingForResponse: false,
  subject: null,
  startTime: null,
  totalInteractions: 0,
  lastActivity: null,
  learningGoals: [],
  completedConcepts: [],
  strugglingAreas: [],
  lastError: null,
  connectionStatus: 'disconnected'
};

// Session reducer
const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        subject: action.payload.subject || null,
        isSessionActive: true,
        startTime: new Date(),
        lastActivity: new Date(),
        aiState: 'idle',
        userState: 'idle',
        expectingUserInput: true,
        shouldPromptUser: false,
        waitingForResponse: false,
        connectionStatus: 'connected',
        conversationHistory: [],
        totalInteractions: 0,
        lastError: null
      };

    case 'END_SESSION':
      return {
        ...initialSessionState,
        connectionStatus: 'disconnected'
      };

    case 'SET_TOPIC':
      return {
        ...state,
        currentTopic: action.payload.topic,
        currentStep: action.payload.step || 1,
        lastActivity: new Date()
      };

    case 'ADVANCE_STEP':
      const newStep = {
        step: state.currentStep + 1,
        content: action.payload?.content || '',
        completed: true,
        timestamp: new Date()
      };
      return {
        ...state,
        currentStep: state.currentStep + 1,
        topicProgress: [...state.topicProgress, newStep],
        lastActivity: new Date()
      };

    case 'ADD_USER_MESSAGE':
      const userMessage = {
        role: 'user' as const,
        content: action.payload.content,
        timestamp: action.payload.timestamp || new Date()
      };
      return {
        ...state,
        lastStudentInput: action.payload.content,
        conversationHistory: [...state.conversationHistory, userMessage],
        totalInteractions: state.totalInteractions + 1,
        lastActivity: new Date(),
        userState: 'waiting',
        aiState: 'processing',
        waitingForResponse: true,
        expectingUserInput: false
      };

    case 'ADD_AI_MESSAGE':
      const aiMessage = {
        role: 'assistant' as const,
        content: action.payload.content,
        timestamp: action.payload.timestamp || new Date(),
        drawingInstructions: action.payload.drawingInstructions
      };
      return {
        ...state,
        lastAIResponse: action.payload.content,
        conversationHistory: [...state.conversationHistory, aiMessage],
        lastActivity: new Date(),
        aiState: action.payload.drawingInstructions?.length ? 'drawing' : 'speaking',
        userState: 'idle',
        waitingForResponse: false,
        expectingUserInput: true
      };

    case 'SET_AI_STATE':
      return {
        ...state,
        aiState: action.payload,
        lastActivity: new Date()
      };

    case 'SET_USER_STATE':
      return {
        ...state,
        userState: action.payload,
        lastActivity: new Date()
      };

    case 'SET_EXPECTING_INPUT':
      return {
        ...state,
        expectingUserInput: action.payload,
        shouldPromptUser: action.payload && !state.shouldPromptUser
      };

    case 'SET_SHOULD_PROMPT':
      return {
        ...state,
        shouldPromptUser: action.payload
      };

    case 'SET_WAITING_RESPONSE':
      return {
        ...state,
        waitingForResponse: action.payload
      };

    case 'UPDATE_LEARNING_PROGRESS':
      return {
        ...state,
        learningGoals: action.payload.goals || state.learningGoals,
        completedConcepts: action.payload.completed || state.completedConcepts,
        strugglingAreas: action.payload.struggling || state.strugglingAreas,
        lastActivity: new Date()
      };

    case 'SET_ERROR':
      return {
        ...state,
        lastError: action.payload,
        lastActivity: new Date()
      };

    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: action.payload,
        lastActivity: new Date()
      };

    case 'RESET_SESSION':
      return initialSessionState;

    default:
      return state;
  }
};

// Session context type
export interface SessionContextType {
  // State
  session: SessionState;
  
  // Actions
  startSession: (subject?: string) => void;
  endSession: () => void;
  setTopic: (topic: string, step?: number) => void;
  advanceStep: (content?: string) => void;
  addUserMessage: (content: string) => void;
  addAIMessage: (content: string, drawingInstructions?: string[]) => void;
  setAIState: (state: SessionState['aiState']) => void;
  setUserState: (state: SessionState['userState']) => void;
  setExpectingInput: (expecting: boolean) => void;
  setShouldPrompt: (should: boolean) => void;
  setWaitingResponse: (waiting: boolean) => void;
  updateLearningProgress: (progress: { goals?: string[]; completed?: string[]; struggling?: string[] }) => void;
  setError: (error: string | null) => void;
  setConnectionStatus: (status: SessionState['connectionStatus']) => void;
  resetSession: () => void;
  
  // Computed properties
  isAIBusy: boolean;
  isUserTurn: boolean;
  shouldShowPrompt: boolean;
  sessionDuration: number | null;
}

// Create context
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Session provider component
export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, dispatch] = useReducer(sessionReducer, initialSessionState);

  // Auto-generate session ID when starting
  const startSession = (subject?: string) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    dispatch({ type: 'START_SESSION', payload: { sessionId, subject } });
  };

  const endSession = () => {
    dispatch({ type: 'END_SESSION' });
  };

  const setTopic = (topic: string, step?: number) => {
    dispatch({ type: 'SET_TOPIC', payload: { topic, step } });
  };

  const advanceStep = (content?: string) => {
    dispatch({ type: 'ADVANCE_STEP', payload: content ? { content } : undefined });
  };

  const addUserMessage = (content: string) => {
    dispatch({ type: 'ADD_USER_MESSAGE', payload: { content } });
  };

  const addAIMessage = (content: string, drawingInstructions?: string[]) => {
    dispatch({ type: 'ADD_AI_MESSAGE', payload: { content, drawingInstructions } });
  };

  const setAIState = (state: SessionState['aiState']) => {
    dispatch({ type: 'SET_AI_STATE', payload: state });
  };

  const setUserState = (state: SessionState['userState']) => {
    dispatch({ type: 'SET_USER_STATE', payload: state });
  };

  const setExpectingInput = (expecting: boolean) => {
    dispatch({ type: 'SET_EXPECTING_INPUT', payload: expecting });
  };

  const setShouldPrompt = (should: boolean) => {
    dispatch({ type: 'SET_SHOULD_PROMPT', payload: should });
  };

  const setWaitingResponse = (waiting: boolean) => {
    dispatch({ type: 'SET_WAITING_RESPONSE', payload: waiting });
  };

  const updateLearningProgress = (progress: { goals?: string[]; completed?: string[]; struggling?: string[] }) => {
    dispatch({ type: 'UPDATE_LEARNING_PROGRESS', payload: progress });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const setConnectionStatus = (status: SessionState['connectionStatus']) => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: status });
  };

  const resetSession = () => {
    dispatch({ type: 'RESET_SESSION' });
  };

  // Computed properties
  const isAIBusy = session.aiState === 'processing' || session.aiState === 'speaking' || session.aiState === 'drawing';
  const isUserTurn = session.expectingUserInput && !session.waitingForResponse && !isAIBusy;
  const shouldShowPrompt = session.shouldPromptUser && isUserTurn;
  const sessionDuration = session.startTime ? Date.now() - session.startTime.getTime() : null;

  // Auto-manage prompting based on AI state changes
  useEffect(() => {
    if (session.aiState === 'idle' && session.expectingUserInput && !session.shouldPromptUser) {
      // Add a small delay before prompting to avoid interrupting
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_SHOULD_PROMPT', payload: true });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [session.aiState, session.expectingUserInput, session.shouldPromptUser]);

  // Auto-clear prompts when user starts interacting
  useEffect(() => {
    if (session.userState === 'speaking' && session.shouldPromptUser) {
      dispatch({ type: 'SET_SHOULD_PROMPT', payload: false });
    }
  }, [session.userState, session.shouldPromptUser]);

  const value: SessionContextType = {
    session,
    startSession,
    endSession,
    setTopic,
    advanceStep,
    addUserMessage,
    addAIMessage,
    setAIState,
    setUserState,
    setExpectingInput,
    setShouldPrompt,
    setWaitingResponse,
    updateLearningProgress,
    setError,
    setConnectionStatus,
    resetSession,
    isAIBusy,
    isUserTurn,
    shouldShowPrompt,
    sessionDuration
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

// Custom hook to use session context
export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
