import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, PlayIcon, ClockIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { aiAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Layout } from '../ui/Layout';
import type { Session, CreateSessionFormData } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';

const AITeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateSessionFormData>({
    title: '',
    subject: '',
    language: 'en',
    difficulty: 'beginner'
  });

  // Debug logging
  useEffect(() => {
    console.log('AITeacherDashboard mounted');
    console.log('User:', user);
    console.log('Loading sessions...');
  }, []);

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      console.log('Starting to load sessions...');
      setIsLoading(true);
      const sessionsData = await aiAPI.getSessions();
      console.log('Sessions loaded:', sessionsData);
      setSessions(sessionsData);
    } catch (error: any) {
      console.error('Failed to load sessions:', error);
      console.error('Error details:', error.response?.data);
      showToast(error.message || 'Failed to load sessions', 'error');
      
      // If it's an auth error, redirect to login
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.subject.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setIsCreating(true);
      console.log('Creating session with data:', formData);
      const newSession = await aiAPI.createSession(formData);
      console.log('Session created:', newSession);
      showToast('Session created successfully!', 'success');
      
      // Reset form and close modal
      setFormData({
        title: '',
        subject: '',
        language: 'en',
        difficulty: 'beginner'
      });
      setShowCreateForm(false);
      
      // Reload sessions to show the new one
      await loadSessions();
      
      // Navigate to the new session
      navigate(`/classroom/${newSession.id}`);
    } catch (error: any) {
      console.error('Failed to create session:', error);
      console.error('Error response:', error.response?.data);
      showToast(error.response?.data?.message || error.message || 'Failed to create session', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSession = (sessionId: string) => {
    navigate(`/classroom/${sessionId}`);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Teacher Platform</h1>
                <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
              </div>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>New Session</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AcademicCapIcon className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <PlayIcon className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sessions.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Learning Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(sessions.reduce((total, session) => total + session.duration, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Learning Sessions</h2>
          </div>
          
          {sessions.length === 0 ? (
            <div className="p-8 text-center">
              <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-600 mb-4">Create your first AI learning session to get started!</p>
              <Button onClick={() => setShowCreateForm(true)}>
                Create Session
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <div key={session.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{session.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Subject: {session.subject}</span>
                        <span>Duration: {formatDuration(session.duration)}</span>
                        <span>Language: {session.language}</span>
                        <span>Difficulty: {session.difficulty}</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <span>Messages: {session.metadata.totalMessages}</span>
                        <span className="ml-4">Questions: {session.metadata.totalQuestions}</span>
                        <span className="ml-4">Created: {new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {session.status === 'active' || session.status === 'paused' ? (
                        <Button
                          onClick={() => handleJoinSession(session.id)}
                          className="flex items-center space-x-1"
                        >
                          <PlayIcon className="w-4 h-4" />
                          <span>{session.status === 'paused' ? 'Resume' : 'Continue'}</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => handleJoinSession(session.id)}
                          className="flex items-center space-x-1"
                        >
                          <span>Review</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Session</h2>
            
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Math Practice Session"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mathematics, Science, History"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Session'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AITeacherDashboard;
