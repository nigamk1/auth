import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { tokenStorage } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import { Layout } from '../ui/Layout';
import VoiceRecorder from './VoiceRecorder';
import VideoPlayer from './VideoPlayer';
import FileUpload from './FileUpload';
import { 
  MicrophoneIcon, 
  PhotoIcon, 
  PaperAirplaneIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  XMarkIcon,
  StarIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  type: 'question' | 'answer';
  content: string;
  timestamp: Date;
  questionId?: string;
  answerId?: string;
  metadata?: {
    subject?: string;
    difficulty?: string;
    hasVideo?: boolean;
    videoUrl?: string;
    isProcessing?: boolean;
    imageUrl?: string;
    audioUrl?: string;
    rating?: number;
  };
}

interface Conversation {
  id: string;
  title: string;
  subject: string;
  messageCount: number;
  lastActivity: Date;
  previewMessage?: string;
}

const TutorInterface: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('General');
  const [selectedDifficulty, setSelectedDifficulty] = useState('intermediate');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showConversations, setShowConversations] = useState(false);
  const [inputType, setInputType] = useState<'text' | 'voice' | 'image'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Subjects list
  const subjects = [
    'General', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 
    'Computer Science', 'History', 'Literature', 'Economics'
  ];

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = tokenStorage.getAccessToken();
      if (token) {
        socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
          auth: { token }
        });

        socketRef.current.on('connect', () => {
          console.log('Connected to tutor server');
        });

        socketRef.current.on('question:status', (data) => {
          updateQuestionStatus(data.questionId, data.status);
        });

        socketRef.current.on('answer:progress', (data) => {
          updateAnswerProgress(data.answerId, data.progress);
        });

        socketRef.current.on('answer:complete', (data) => {
          addAnswerMessage(data.answer);
        });

        socketRef.current.on('video:progress', (data) => {
          if (data.status === 'completed') {
            setIsGeneratingVideo(null);
            showToast('Video explanation generated successfully!', 'success');
          }
        });
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
      loadUsageStats();
    }
  }, [isAuthenticated]);

  // Helper functions
  const updateQuestionStatus = (questionId: string, status: string) => {
    setMessages(prev => prev.map(msg => 
      msg.questionId === questionId 
        ? { ...msg, metadata: { ...msg.metadata, isProcessing: status === 'processing' } }
        : msg
    ));
  };

  const updateAnswerProgress = (answerId: string, progress: number) => {
    setMessages(prev => prev.map(msg => 
      msg.answerId === answerId 
        ? { ...msg, metadata: { ...msg.metadata, progress } }
        : msg
    ));
  };

  const addAnswerMessage = (answer: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'answer',
      content: answer.content,
      timestamp: new Date(),
      answerId: answer.id,
      metadata: {
        subject: answer.subject,
        difficulty: answer.difficulty,
        hasVideo: answer.hasVideo,
        videoUrl: answer.videoUrl
      }
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const loadConversations = async () => {
    try {
      const token = tokenStorage.getAccessToken();
      const response = await fetch('/api/tutor/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadUsageStats = async () => {
    try {
      const token = tokenStorage.getAccessToken();
      const response = await fetch('/api/tutor/usage', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && !selectedFile) return;

    setIsLoading(true);
    try {
      const token = tokenStorage.getAccessToken();
      const formData = new FormData();
      
      if (inputType === 'text') {
        formData.append('question', inputValue);
        formData.append('type', 'text');
      } else if (inputType === 'image' && selectedFile) {
        formData.append('image', selectedFile);
        formData.append('type', 'image');
        if (inputValue) formData.append('question', inputValue);
      }
      
      formData.append('subject', selectedSubject);
      formData.append('difficulty', selectedDifficulty);
      formData.append('language', selectedLanguage);

      const response = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Add question message
        const questionMessage: Message = {
          id: Date.now().toString(),
          type: 'question',
          content: inputValue || 'Image question',
          timestamp: new Date(),
          questionId: data.questionId,
          metadata: {
            subject: selectedSubject,
            difficulty: selectedDifficulty,
            imageUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined
          }
        };
        setMessages(prev => [...prev, questionMessage]);

        // Clear input
        setInputValue('');
        setSelectedFile(null);
        setInputType('text');
        
        showToast('Question sent successfully!', 'success');
      } else {
        throw new Error(data.message || 'Failed to send question');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send question. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const requestVideoExplanation = async (answerId: string) => {
    try {
      setIsGeneratingVideo(answerId);
      const token = tokenStorage.getAccessToken();
      
      const response = await fetch(`/api/tutor/answer/${answerId}/video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        showToast('Video generation started. You will be notified when ready.', 'info');
      } else {
        throw new Error(data.message || 'Failed to generate video');
      }
    } catch (error) {
      console.error('Error requesting video:', error);
      showToast('Failed to generate video. Please try again.', 'error');
      setIsGeneratingVideo(null);
    }
  };

  const handleVoiceRecording = (audioBlob: Blob) => {
    const audioFile = new File([audioBlob], 'voice-recording.wav', { type: 'audio/wav' });
    setSelectedFile(audioFile);
    setInputType('voice');
    showToast('Voice recording captured. Click send to submit your question.', 'info');
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setInputType('image');
  };

  const handleFileError = (error: string) => {
    showToast(error, 'error');
  };

  const rateAnswer = async (answerId: string, rating: number) => {
    try {
      const token = tokenStorage.getAccessToken();
      const response = await fetch(`/api/tutor/answer/${answerId}/rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating })
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.answerId === answerId 
            ? { ...msg, metadata: { ...msg.metadata, rating } }
            : msg
        ));
        showToast('Rating submitted successfully!', 'success');
      }
    } catch (error) {
      console.error('Error rating answer:', error);
      showToast('Failed to submit rating.', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
            <p className="text-gray-600">You need to be signed in to use the AI Tutor.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-full">
        {/* Sidebar - Conversations */}
        <div className={`${showConversations ? 'w-1/4' : 'w-0'} transition-all duration-300 bg-gray-50 border-r border-gray-200 overflow-hidden`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Conversations</h3>
              <Button
                onClick={() => setShowConversations(false)}
                variant="outline"
                size="sm"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              onClick={() => {
                setCurrentConversation(null);
                setMessages([]);
              }}
              variant="outline"
              size="sm"
              className="w-full mb-4"
            >
              New Conversation
            </Button>

            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    setCurrentConversation(conv.id);
                    // Load conversation messages
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentConversation === conv.id 
                      ? 'bg-blue-100 border-blue-300' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  } border`}
                >
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {conv.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {conv.subject} • {conv.messageCount} messages
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setShowConversations(!showConversations)}
                  variant="outline"
                  size="sm"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">AI Tutor</h1>
              </div>

              {/* Subject Selection */}
              <div className="flex items-center space-x-4">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>

                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>

                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Welcome to your AI Tutor!
                </h3>
                <p className="text-gray-600 mb-4">
                  Ask questions via text, voice, or upload an image. Get instant explanations with optional video tutorials.
                </p>
                <div className="flex justify-center space-x-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <DocumentTextIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600">Text Questions</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <MicrophoneIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-600">Voice Questions</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <PhotoIcon className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="text-sm text-gray-600">Image Questions</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <VideoCameraIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-600">Video Explanations</p>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'question' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl p-4 rounded-lg ${
                      message.type === 'question'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {message.type === 'question' ? (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium">You</span>
                          {message.metadata?.subject && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                              {message.metadata.subject}
                            </span>
                          )}
                        </div>
                        {message.metadata?.imageUrl && (
                          <img
                            src={message.metadata.imageUrl}
                            alt="Question"
                            className="max-w-xs rounded-lg mb-2"
                          />
                        )}
                        <p>{message.content}</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">AI Tutor</span>
                            {message.metadata?.subject && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {message.metadata.subject}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {!message.metadata?.hasVideo && message.answerId && (
                              <Button
                                onClick={() => requestVideoExplanation(message.answerId!)}
                                variant="outline"
                                size="sm"
                                disabled={isGeneratingVideo === message.answerId}
                              >
                                {isGeneratingVideo === message.answerId ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <VideoCameraIcon className="h-4 w-4" />
                                )}
                                Video
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <ShareIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="prose prose-sm max-w-none mb-4">
                          <p className="text-gray-800">{message.content}</p>
                        </div>

                        {message.metadata?.videoUrl && (
                          <div className="mb-4">
                            <VideoPlayer videoUrl={message.metadata.videoUrl} />
                          </div>
                        )}

                        {/* Rating */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Rate this answer:</span>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => message.answerId && rateAnswer(message.answerId, rating)}
                              className={`p-1 rounded ${
                                message.metadata?.rating === rating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300 hover:text-yellow-400'
                              }`}
                            >
                              <StarIcon className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-xs mt-2 opacity-75">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-4">
            {/* Input Type Selector */}
            <div className="flex items-center space-x-4 mb-4">
              <Button
                onClick={() => setInputType('text')}
                variant={inputType === 'text' ? 'primary' : 'outline'}
                size="sm"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Text
              </Button>
              <VoiceRecorder 
                onRecordingComplete={handleVoiceRecording} 
                onError={handleFileError}
              />
              <FileUpload
                onFileSelect={handleFileSelect}
                onError={handleFileError}
                accept="image/*"
                maxSize={10 * 1024 * 1024} // 10MB
              />
            </div>

            {/* Selected File Preview */}
            {selectedFile && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {inputType === 'image' && (
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Selected"
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setSelectedFile(null);
                    setInputType('text');
                  }}
                  variant="outline"
                  size="sm"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Input Field */}
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    inputType === 'text' 
                      ? "Ask any academic question..."
                      : inputType === 'voice'
                      ? "Voice recording ready. Add additional context or click send."
                      : "Image uploaded. Add additional context or click send."
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  disabled={isLoading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={isLoading || (!inputValue.trim() && !selectedFile)}
                className="px-6 py-3"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <PaperAirplaneIcon className="h-5 w-5" />
                )}
                Send
              </Button>
            </div>

            {/* Usage Stats */}
            {usage && (
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Today: {usage.questionsToday || 0} questions • {usage.videosGenerated || 0} videos
                  {usage.subscription?.type === 'free' && usage.questionsToday >= 10 && (
                    <span className="text-orange-600 ml-2">
                      Daily limit reached. Upgrade for unlimited access.
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TutorInterface;