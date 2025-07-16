import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import { ToastProvider } from './contexts/ToastContext';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardPage from './components/pages/DashboardPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { NotFoundPage } from './components/pages/NotFoundPage';
import TeachingSession from './components/pages/TeachingSession';
import { ApiDebugInfo } from './components/ui/ApiDebugInfo';
import './index.css';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SessionProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/classroom"
                  element={
                    <ProtectedRoute>
                      <TeachingSession />
                    </ProtectedRoute>
                  }
                />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <ApiDebugInfo />
          </div>
        </Router>
        </SessionProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
