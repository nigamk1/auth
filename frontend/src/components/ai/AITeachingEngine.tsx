import React, { useState } from 'react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import Alert from '../ui/Alert';
import { getApiUrl } from '../../utils/environment';
import { tokenStorage } from '../../services/api';

/* interface QAPair {
  id: string;
  question: string;
  answer: string;
  aiResponse: string;
  timestamp: Date;
  level: string;
} */

interface TeachingSession {
  id: string;
  topic: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  progress: number;
  totalQuestions: number;
}

interface TeachingEngineProps {
  sessionId?: string; // Make sessionId optional
}

export const AITeachingEngine: React.FC<TeachingEngineProps> = ({ sessionId: propSessionId }) => {
  const [session, setSession] = useState<TeachingSession | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(propSessionId || null);
  // const [qaHistory, setQaHistory] = useState<QAPair[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentTopic, setCurrentTopic] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string>('');

  // Create or get session
  const createOrGetSession = async (): Promise<string> => {
    if (currentSessionId) {
      return currentSessionId;
    }

    const token = tokenStorage.getAccessToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    const response = await fetch(`${getApiUrl()}/api/ai/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: `AI Teaching Session - ${currentTopic || 'General Learning'}`,
        subject: currentTopic || 'General Learning',
        aiPersonality: {
          name: 'Professor AI',
          voice: 'alloy',
          teachingStyle: 'patient'
        },
        metadata: {
          sessionType: 'lesson',
          difficulty: difficultyLevel,
          tags: ['teaching', 'interactive']
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    const data = await response.json();
    const newSessionId = data.session.id;
    setCurrentSessionId(newSessionId);
    return newSessionId;
  };

  // Start teaching session
  const startSession = async () => {
    if (!currentTopic.trim()) {
      setError('Please enter a topic to learn about.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Create session first if needed
      const sessionId = await createOrGetSession();

      const response = await fetch(`${getApiUrl()}/api/ai/teaching/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: currentTopic,
          level: difficultyLevel,
          userPreferences: {
            learningStyle: 'visual',
            pace: 'normal',
            examples: true
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSession(data.data.teachingSession);
        setAiResponse(data.data.aiResponse);
      } else {
        setError(data.message || 'Failed to start teaching session');
      }
    } catch (err: any) {
      console.error('Start session error:', err);
      if (err.message.includes('authentication') || err.message.includes('log in')) {
        setError('Authentication failed. Please log in again.');
      } else if (err.message.includes('Failed to create session')) {
        setError('Could not create a new session. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to start teaching session');
      }
    } finally {
      setLoading(false);
    }
  };

  // Ask a question
  const askQuestion = async () => {
    if (!currentQuestion.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      if (!currentSessionId) {
        throw new Error('No active session. Please start a session first.');
      }

      const response = await fetch(`${getApiUrl()}/api/ai/teaching/${currentSessionId}/question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: currentQuestion,
          responseTime: 30
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAiResponse(data.data.aiResponse);
        setCurrentQuestion('');
        
        // Update session stats
        if (session) {
          setSession({
            ...session,
            progress: data.data.progress,
            totalQuestions: data.data.sessionStats.totalQuestions
          });
        }
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      console.error('Ask question error:', err);
      if (err.message.includes('authentication') || err.message.includes('log in')) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to ask question');
      }
    } finally {
      setLoading(false);
    }
  };

  // Request a diagram
  const requestDiagram = async (concept: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      if (!currentSessionId) {
        throw new Error('No active session. Please start a session first.');
      }

      const response = await fetch(`${getApiUrl()}/api/ai/teaching/${currentSessionId}/diagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ concept })
      });

      const data = await response.json();
      
      if (data.success) {
        setAiResponse(data.data.explanation);
        // Whiteboard actions would be applied automatically
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      console.error('Request diagram error:', err);
      if (err.message.includes('authentication') || err.message.includes('log in')) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to request diagram');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update difficulty level
  const updateDifficulty = async (newLevel: 'beginner' | 'intermediate' | 'advanced') => {
    try {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      if (!currentSessionId) {
        throw new Error('No active session. Please start a session first.');
      }

      const response = await fetch(`${getApiUrl()}/api/ai/teaching/${currentSessionId}/level`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ level: newLevel })
      });

      const data = await response.json();
      
      if (data.success) {
        setDifficultyLevel(newLevel);
        if (session) {
          setSession({ ...session, currentLevel: newLevel });
        }
      }
    } catch (err: any) {
      console.error('Update difficulty error:', err);
      if (err.message.includes('authentication') || err.message.includes('log in')) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to update difficulty level');
      }
    }
  };

  return (
    <div className="ai-teaching-engine p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🧠 AI Teaching Engine - Day 9
        </h2>
        
        {/* Session Setup */}
        {!session && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Start Teaching Session</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic to Learn
                </label>
                <input
                  type="text"
                  value={currentTopic}
                  onChange={(e) => setCurrentTopic(e.target.value)}
                  placeholder="e.g., photosynthesis, quantum mechanics, algebra"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner - Simple explanations</option>
                  <option value="intermediate">Intermediate - Balanced detail</option>
                  <option value="advanced">Advanced - Technical depth</option>
                </select>
              </div>
              
              <Button
                onClick={startSession}
                disabled={!currentTopic.trim() || loading}
                className="w-full"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Start Learning Session'}
              </Button>
            </div>
          </div>
        )}

        {/* Active Session */}
        {session && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Learning: {session.topic}</h3>
                <p className="text-sm text-gray-600">
                  Level: {session.currentLevel} | Progress: {session.progress}% | 
                  Questions: {session.totalQuestions}
                </p>
              </div>
              
              <div className="flex space-x-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <Button
                    key={level}
                    onClick={() => updateDifficulty(level)}
                    variant={session.currentLevel === level ? 'primary' : 'outline'}
                    size="sm"
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${session.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* AI Response Display */}
        {aiResponse && (
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-blue-800 mb-2">🤖 AI Teacher Response:</h4>
            <div className="text-gray-700 whitespace-pre-wrap">{aiResponse}</div>
          </div>
        )}

        {/* Question Input */}
        {session && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h4 className="font-semibold mb-4">Ask a Question</h4>
            
            <div className="space-y-4">
              <textarea
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                placeholder="Ask anything about the topic..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="flex space-x-3">
                <Button
                  onClick={askQuestion}
                  disabled={!currentQuestion.trim() || loading}
                  className="flex-1"
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Ask Question'}
                </Button>
                
                <Button
                  onClick={() => requestDiagram(session.topic)}
                  disabled={loading}
                  variant="outline"
                >
                  📊 Request Diagram
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Topic Suggestions */}
        {session && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold mb-3">💡 Quick Questions:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                `What is ${session.topic}?`,
                `How does ${session.topic} work?`,
                `Why is ${session.topic} important?`,
                `What are examples of ${session.topic}?`
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  onClick={() => setCurrentQuestion(suggestion)}
                  variant="outline"
                  size="sm"
                  className="text-left justify-start"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert type="error" message={error} />
        )}
      </div>

      {/* Features Showcase */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4">✨ Day 9 Features Implemented</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-blue-600 mb-2">📝 Smart Prompts</h4>
            <p className="text-sm text-gray-600">
              "Explain like a school teacher" templates that adapt to difficulty levels
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-green-600 mb-2">🧠 Memory Context</h4>
            <p className="text-sm text-gray-600">
              Keeps last 5 Q&A pairs for contextual learning conversations
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-purple-600 mb-2">📊 Multi-Level</h4>
            <p className="text-sm text-gray-600">
              Beginner, intermediate, and advanced difficulty adaptation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
