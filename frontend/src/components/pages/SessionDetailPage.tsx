import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../ui/Layout';
import LoadingSpinner from '../ui/LoadingSpinner';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import sessionMemoryService from '../../services/sessionMemory';
import type { ChatMessage, WhiteboardSnapshot } from '../../services/sessionMemory';

const SessionDetailPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [whiteboardHistory, setWhiteboardHistory] = useState<WhiteboardSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'whiteboard' | 'analytics'>('overview');
  const [chatPage, setChatPage] = useState(1);
  const [hasMoreChat, setHasMoreChat] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  const loadSessionData = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      
      // Load session summary
      const summaryResponse = await sessionMemoryService.getSessionSummary(sessionId);
      setSessionSummary(summaryResponse.data);

      // Load chat history
      const chatResponse = await sessionMemoryService.getChatHistory(sessionId, { 
        page: 1, 
        limit: 50 
      });
      setChatHistory(chatResponse.data.messages);
      setHasMoreChat(chatResponse.data.pagination.hasMore);

      // Load whiteboard history
      const whiteboardResponse = await sessionMemoryService.getWhiteboardHistory(sessionId);
      setWhiteboardHistory(whiteboardResponse.data.snapshots);

      setError('');
    } catch (err: any) {
      setError('Failed to load session data');
      console.error('Error loading session data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreChat = async () => {
    if (!sessionId || !hasMoreChat) return;

    try {
      const response = await sessionMemoryService.getChatHistory(sessionId, { 
        page: chatPage + 1, 
        limit: 50 
      });
      setChatHistory(prev => [...prev, ...response.data.messages]);
      setChatPage(prev => prev + 1);
      setHasMoreChat(response.data.pagination.hasMore);
    } catch (err) {
      console.error('Error loading more chat:', err);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return '⭐ Not rated';
    
    const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    return `${stars} (${rating}/5)`;
  };

  const exportSession = async () => {
    if (!sessionId) return;
    
    try {
      const data = await sessionMemoryService.exportSessionData(sessionId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting session:', err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !sessionSummary) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert type="error" message={error || 'Session not found'} />
          <div className="mt-4">
            <Link to="/sessions">
              <Button variant="secondary">← Back to Sessions</Button>
            </Link>
          </div>
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
            <div className="flex items-center justify-between">
              <div>
                <Link to="/sessions" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                  ← Back to Sessions
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {sessionSummary.session.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>📚 {sessionSummary.session.subject}</span>
                  <span>📅 {formatDate(sessionSummary.session.startedAt)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    sessionSummary.session.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : sessionSummary.session.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sessionSummary.session.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={exportSession}>
                  📥 Export
                </Button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'chat', label: 'Chat History', icon: '💬' },
                { id: 'whiteboard', label: 'Whiteboard', icon: '🎨' },
                { id: 'analytics', label: 'Analytics', icon: '📈' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Session Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {sessionSummary.summary.totalMessages}
                  </div>
                  <div className="text-sm text-blue-800">Total Messages</div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {sessionSummary.summary.totalWhiteboardActions}
                  </div>
                  <div className="text-sm text-green-800">Whiteboard Actions</div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatDuration(sessionSummary.metadata.sessionDuration)}
                  </div>
                  <div className="text-sm text-purple-800">Duration</div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-sm font-medium text-orange-600">
                    {getRatingStars(sessionSummary.summary.sessionRating)}
                  </div>
                  <div className="text-sm text-orange-800">Rating</div>
                </div>
              </div>

              {/* Key Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">📋 Topics Covered</h3>
                  {sessionSummary.summary.mainTopics.length > 0 ? (
                    <div className="space-y-2">
                      {sessionSummary.summary.mainTopics.map((topic: string, index: number) => (
                        <span key={index} className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm mr-2 mb-2">
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No topics recorded</p>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">🎯 Key Learnings</h3>
                  {sessionSummary.summary.keyLearnings.length > 0 ? (
                    <ul className="space-y-2">
                      {sessionSummary.summary.keyLearnings.map((learning: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700">• {learning}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No key learnings recorded</p>
                  )}
                </div>
              </div>

              {/* Feedback */}
              {sessionSummary.summary.feedback && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">💬 Your Feedback</h3>
                  <p className="text-gray-700 italic">"{sessionSummary.summary.feedback}"</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Chat History</h3>
                <p className="text-sm text-gray-600">
                  {chatHistory.length} messages • Q&A: {sessionSummary.summary.questionsAsked} questions, {sessionSummary.summary.questionsAnswered} answers
                </p>
              </div>
              
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {chatHistory.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'ai'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-yellow-100 text-yellow-900'
                    }`}>
                      <div className="text-sm">
                        <div className="font-medium mb-1">
                          {message.type === 'user' ? message.userName : 'AI Assistant'}
                        </div>
                        <div>{message.content}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {formatDate(message.timestamp)}
                          {message.metadata?.confidence && (
                            <span className="ml-2">• {Math.round(message.metadata.confidence * 100)}% confidence</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {hasMoreChat && (
                  <div className="text-center">
                    <Button variant="secondary" size="sm" onClick={loadMoreChat}>
                      Load More Messages
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'whiteboard' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Whiteboard History</h3>
                <p className="text-sm text-gray-600">
                  {whiteboardHistory.length} snapshots saved
                </p>
              </div>
              
              <div className="p-4">
                {whiteboardHistory.length > 0 ? (
                  <div className="space-y-4">
                    {whiteboardHistory.map((snapshot, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Snapshot {snapshot.version}</h4>
                          <span className="text-sm text-gray-500">
                            {formatDate(snapshot.timestamp)} • by {snapshot.createdBy}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Elements: {snapshot.elements.length} • 
                          Zoom: {snapshot.canvasState.zoom}x • 
                          Background: {snapshot.canvasState.backgroundColor}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No whiteboard snapshots available</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Engagement Analytics */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">👤 User Engagement</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {sessionSummary.analytics.userEngagement.messageCount}
                    </div>
                    <div className="text-sm text-gray-600">Messages Sent</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {sessionSummary.analytics.userEngagement.whiteboardInteractions}
                    </div>
                    <div className="text-sm text-gray-600">Whiteboard Interactions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatDuration(sessionSummary.analytics.userEngagement.timeSpentActive)}
                    </div>
                    <div className="text-sm text-gray-600">Active Time</div>
                  </div>
                </div>
              </div>

              {/* AI Performance */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">🤖 AI Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(sessionSummary.analytics.aiPerformance.averageConfidence * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Average Confidence</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {sessionSummary.analytics.aiPerformance.helpfulnessRating || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Helpfulness Rating</div>
                  </div>
                </div>
              </div>

              {/* Learning Progress */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">📚 Learning Progress</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Mastery Level</label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        sessionSummary.analytics.learningProgress.masteryLevel === 'advanced'
                          ? 'bg-red-100 text-red-800'
                          : sessionSummary.analytics.learningProgress.masteryLevel === 'intermediate'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {sessionSummary.analytics.learningProgress.masteryLevel}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Concepts Covered</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {sessionSummary.analytics.learningProgress.conceptsCovered.map((concept: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SessionDetailPage;
