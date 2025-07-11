import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/auth/ResetPasswordPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardPage from "./components/pages/DashboardPage";
import { DevDashboardPage } from "./components/pages/DevDashboardPage";
import { SettingsPage } from "./components/pages/SettingsPage";
import { NotFoundPage } from "./components/pages/NotFoundPage";
import { AITeacherPage } from "./components/pages/AITeacherPage";
import AiChatPage from "./components/pages/AiChatPage";
import RealTimePage from "./components/pages/RealTimePage";
import PreviousSessionsPage from "./components/pages/PreviousSessionsPage";
import SessionDetailPage from "./components/pages/SessionDetailPage";
import "./index.css";

function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
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
                  path="/dev-dashboard"
                  element={
                    <ProtectedRoute>
                      <DevDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-teacher-session"
                  element={
                    <ProtectedRoute>
                      <AITeacherPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-chat"
                  element={
                    <ProtectedRoute>
                      <AiChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/realtime"
                  element={
                    <ProtectedRoute>
                      <RealTimePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sessions"
                  element={
                    <ProtectedRoute>
                      <PreviousSessionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sessions/:sessionId"
                  element={
                    <ProtectedRoute>
                      <SessionDetailPage />
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
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
