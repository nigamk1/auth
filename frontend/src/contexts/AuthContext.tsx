import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { 
  AuthContextType, 
  User, 
  LoginCredentials, 
  RegisterCredentials, 
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest
} from '../types';
import { authAPI, userAPI, tokenStorage } from '../services/api';

// Auth state
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Auth actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    const initializeAuth = async () => {
      // Small delay to ensure localStorage is available
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🔍 Initializing authentication...');
      const token = tokenStorage.getAccessToken();
      
      console.log('🔑 Found token:', token ? 'Yes' : 'No');
      
      if (!token) {
        console.log('❌ No token found, setting auth failure');
        dispatch({ type: 'AUTH_FAILURE' });
        return;
      }

      try {
        console.log('🚀 Attempting to get user profile...');
        dispatch({ type: 'AUTH_START' });
        const user = await authAPI.getProfile();
        console.log('✅ User profile retrieved successfully:', user);
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
      } catch (error: any) {
        console.error('❌ Failed to get user profile:', error);
        console.error('Error details:', error.response?.data);
        
        // If it's a 401 error, try to refresh token before giving up
        if (error.response?.status === 401) {
          console.log('🔄 401 error, token refresh should be attempted by interceptor');
        }
        
        tokenStorage.clearTokens();
        dispatch({ type: 'AUTH_FAILURE' });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      console.log('🔐 Attempting login for:', credentials.email);
      dispatch({ type: 'AUTH_START' });
      const authResponse = await authAPI.login(credentials);
      console.log('✅ Login successful, user:', authResponse.user);
      console.log('🔑 Tokens stored in localStorage');
      dispatch({ type: 'AUTH_SUCCESS', payload: authResponse.user });
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      dispatch({ type: 'AUTH_FAILURE' });
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const authResponse = await authAPI.register(credentials);
      dispatch({ type: 'AUTH_SUCCESS', payload: authResponse.user });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await authAPI.forgotPassword({ email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to send reset email');
    }
  };

  // Reset password function
  const resetPassword = async (data: ResetPasswordRequest): Promise<void> => {
    try {
      await authAPI.resetPassword(data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  };
  // Update profile function
  const updateProfile = async (data: UpdateProfileRequest): Promise<void> => {
    try {
      const updatedUser = await userAPI.updateProfile(data);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  // Change password function
  const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    try {
      await userAPI.changePassword(data);
      // After password change, user needs to login again
      dispatch({ type: 'LOGOUT' });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      await authAPI.refreshToken();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({ type: 'LOGOUT' });
      return false;
    }
  };

  const value: AuthContextType = {
    user: state.user,
    token: tokenStorage.getAccessToken(),
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
