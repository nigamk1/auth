import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../ui/Layout';
import LoadingSpinner from '../ui/LoadingSpinner';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import sessionMemoryService from '../../services/sessionMemory';
import type { SessionSummary } from '../../services/sessionMemory';

const PreviousSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadSessions();
  }, [currentPage, sortBy, sortOrder]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionMemoryService.getUserSessions({
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder
      });

      setSessions(response.data.sessions);
      setTotalPages(response.data.pagination.totalPages);
      setError('');
    } catch (err: any) {
      setError('Failed to load sessions');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return '⭐ Not rated';
    
    const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    return `${stars} (${rating}/5)`;
  };

  const getMasteryBadge = (level: string) => {
    const badges = {
      beginner: '🟢 Beginner',
      intermediate: '🟡 Intermediate',
      advanced: '🔴 Advanced'
    };
    return badges[level as keyof typeof badges] || '⚪ Unknown';
  };

  if (loading && sessions.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Previous Sessions
            </h1>
            <p className="text-gray-600">
              Review your learning journey and session history
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="summary.sessionRating">Rating</option>
                  <option value="summary.totalMessages">Message Count</option>
                  <option value="highlights.totalDuration">Duration</option>
                </select>
                
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>

              <div className="text-sm text-gray-500">
                Total Sessions: {sessions.length}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert type="error" message={error} />
          )}

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-600 mb-6">Start your first AI learning session to see it here.</p>
              <Link to="/realtime">
                <Button>Start New Session</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {sessions.map((session) => (
                <div key={session.sessionId} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Session Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {session.session.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>📚 {session.session.subject}</span>
                          <span>📅 {formatDate(session.createdAt)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            session.session.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : session.session.status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {session.session.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/sessions/${session.sessionId}`}>
                          <Button variant="secondary" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Session Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {session.highlights.messageCount}
                        </div>
                        <div className="text-sm text-blue-800">Messages</div>
                      </div>

                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {session.highlights.whiteboardActions}
                        </div>
                        <div className="text-sm text-green-800">Whiteboard</div>
                      </div>

                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatDuration(session.highlights.totalDuration)}
                        </div>
                        <div className="text-sm text-purple-800">Duration</div>
                      </div>

                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-sm font-medium text-orange-600">
                          {getRatingStars(session.summary.sessionRating)}
                        </div>
                        <div className="text-sm text-orange-800">Rating</div>
                      </div>
                    </div>

                    {/* Session Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Topics & Learning */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">📋 Topics Covered</h4>
                        {session.summary.mainTopics.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {session.summary.mainTopics.slice(0, 3).map((topic, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                {topic}
                              </span>
                            ))}
                            {session.summary.mainTopics.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{session.summary.mainTopics.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No topics recorded</p>
                        )}

                        <div className="mt-3">
                          <span className="text-sm text-gray-600">
                            {getMasteryBadge(session.analytics.learningProgress.masteryLevel)}
                          </span>
                        </div>
                      </div>

                      {/* Key Moments */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">✨ Key Moments</h4>
                        {session.highlights.keyMoments.length > 0 ? (
                          <div className="space-y-2">
                            {session.highlights.keyMoments.slice(0, 2).map((moment, index) => (
                              <div key={index} className="text-sm">
                                <p className="text-gray-700 line-clamp-2">{moment.content}</p>
                                <span className="text-xs text-gray-500">
                                  Confidence: {Math.round((moment.confidence || 0) * 100)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No key moments recorded</p>
                        )}
                      </div>
                    </div>

                    {/* Feedback */}
                    {session.summary.feedback && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-1">💬 Your Feedback</h4>
                        <p className="text-sm text-gray-700 italic">"{session.summary.feedback}"</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PreviousSessionsPage;
