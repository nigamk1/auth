import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../ui/Layout';
import { RealTimeDemo } from '../realtime/RealTimeDemo';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

const RealTimePage: React.FC = () => {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string>('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Generate a session ID (in a real app, this would come from your session API)
  const createSession = async () => {
    setIsCreatingSession(true);
    try {
      // Simulate session creation
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Auto-create a session on component mount for demo purposes
  useEffect(() => {
    if (!sessionId) {
      createSession();
    }
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Real-Time Collaboration Demo
            </h1>
            <p className="text-gray-600 mb-4">
              Experience real-time features including AI interactions, whiteboard collaboration, 
              chat messaging, and user presence indicators.
            </p>
            
            {sessionId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Session Information</h3>
                    <p className="text-sm text-blue-600">Session ID: {sessionId}</p>
                    <p className="text-sm text-blue-600">User: {user?.firstName} {user?.lastName}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={createSession}
                    disabled={isCreatingSession}
                  >
                    {isCreatingSession ? 'Creating...' : 'New Session'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Features Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-blue-600 mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Chat</h3>
              <p className="text-gray-600 text-sm">
                Send messages and see AI responses in real-time with typing indicators.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-green-600 mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Whiteboard</h3>
              <p className="text-gray-600 text-sm">
                Collaborate on a shared whiteboard with real-time updates and cursor tracking.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-purple-600 mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Presence</h3>
              <p className="text-gray-600 text-sm">
                See who's online, track user activities, and manage session participants.
              </p>
            </div>
          </div>

          {/* Demo Component */}
          {sessionId ? (
            <div className="bg-white rounded-lg shadow-sm border">
              <RealTimeDemo sessionId={sessionId} />
            </div>
          ) : (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <LoadingSpinner />
                <p className="mt-4 text-gray-600">Setting up your session...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RealTimePage;
