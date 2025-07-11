import React, { useState, useEffect, useRef } from 'react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import useSocket from '../../hooks/useSocket';

interface RealTimeDemoProps {
  sessionId: string;
}

interface WhiteboardElement {
  id: string;
  type: string;
  x: number;
  y: number;
  content?: string;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  type: 'user' | 'ai' | 'system';
  timestamp: Date;
}

export const RealTimeDemo: React.FC<RealTimeDemoProps> = ({ sessionId }) => {
  // State management
  const [connected, setConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [whiteboardElements, setWhiteboardElements] = useState<WhiteboardElement[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const [cursorPositions, setCursorPositions] = useState<Record<string, any>>({});
  const [lastAIResponse, setLastAIResponse] = useState<string>('');
  const [voiceReplies, setVoiceReplies] = useState<any[]>([]);

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const whiteboardRef = useRef<HTMLDivElement>(null);

  // Socket.IO event handlers
  const socketEvents = {
    onConnect: () => {
      console.log('🔌 Connected to real-time server');
      setConnected(true);
    },

    onDisconnect: (reason: string) => {
      console.log('🔌 Disconnected from server:', reason);
      setConnected(false);
    },

    onError: (error: any) => {
      console.error('🔌 Socket error:', error);
    },

    onAIAnswer: (data: any) => {
      console.log('🤖 AI Answer received:', data);
      setLastAIResponse(data.response);
      setIsAIThinking(false);
      
      // Add AI message to chat
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        userId: 'ai',
        userName: 'AI Teacher',
        message: data.response,
        type: 'ai',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);

      // Handle whiteboard actions if any
      if (data.whiteboardActions) {
        const newElements = data.whiteboardActions.map((action: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          type: action.type,
          x: action.position.x,
          y: action.position.y,
          content: action.content,
          timestamp: new Date()
        }));
        setWhiteboardElements(prev => [...prev, ...newElements]);
      }
    },

    onAIThinking: (data: any) => {
      console.log('🤖 AI Thinking:', data.isThinking);
      setIsAIThinking(data.isThinking);
    },

    onAITyping: (data: any) => {
      console.log('🤖 AI Typing:', data.isTyping);
      setIsAITyping(data.isTyping);
    },

    onWhiteboardUpdate: (data: any) => {
      console.log('🎨 Whiteboard update:', data);
      
      switch (data.action) {
        case 'add':
          if (data.element) {
            setWhiteboardElements(prev => [...prev, data.element]);
          }
          break;
        case 'update':
          if (data.element) {
            setWhiteboardElements(prev => 
              prev.map(el => el.id === data.element.id ? data.element : el)
            );
          }
          break;
        case 'delete':
          if (data.element?.id) {
            setWhiteboardElements(prev => prev.filter(el => el.id !== data.element.id));
          }
          break;
        case 'clear':
          setWhiteboardElements([]);
          break;
      }
    },

    onCursorUpdate: (data: any) => {
      setCursorPositions(prev => ({
        ...prev,
        [data.userId]: {
          userName: data.userName,
          position: data.position,
          timestamp: data.timestamp
        }
      }));

      // Remove old cursor positions after 5 seconds
      setTimeout(() => {
        setCursorPositions(prev => {
          const newPositions = { ...prev };
          delete newPositions[data.userId];
          return newPositions;
        });
      }, 5000);
    },

    onChatMessage: (data: any) => {
      console.log('💬 Chat message:', data);
      setChatMessages(prev => [...prev, data]);
    },

    onSessionJoined: (data: any) => {
      console.log('🏠 Session joined:', data);
      setConnectedUsers(data.connectedUsers || []);
      
      if (data.whiteboardState?.elements) {
        setWhiteboardElements(data.whiteboardState.elements);
      }
    },

    onUserJoinedSession: (data: any) => {
      console.log('👤 User joined:', data);
      setConnectedUsers(prev => [...prev, data]);
      
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        userId: 'system',
        userName: 'System',
        message: `${data.userName} joined the session`,
        type: 'system',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, systemMessage]);
    },

    onUserLeftSession: (data: any) => {
      console.log('👤 User left:', data);
      setConnectedUsers(prev => prev.filter(user => user.userId !== data.userId));
      
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        userId: 'system',
        userName: 'System',
        message: `${data.userName} left the session`,
        type: 'system',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, systemMessage]);
    },

    onVoiceReply: (data: any) => {
      console.log('🎤 Voice reply:', data);
      setVoiceReplies(prev => [...prev, data]);
    }
  };

  // Initialize socket
  const {
    connect,
    disconnect,
    joinSession,
    leaveSession,
    sendChatMessage,
    askAIQuestion,
    updateWhiteboard,
    updateCursor,
    requestVoiceReply,
    isConnected
  } = useSocket(socketEvents, {
    autoConnect: false
  });

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Connect and join session
  const handleConnect = () => {
    connect();
    setTimeout(() => {
      joinSession(sessionId);
    }, 1000);
  };

  // Disconnect and leave session
  const handleDisconnect = () => {
    leaveSession(sessionId);
    disconnect();
  };

  // Send chat message
  const handleSendMessage = () => {
    if (currentMessage.trim() && isConnected) {
      sendChatMessage(sessionId, currentMessage);
      setCurrentMessage('');
    }
  };

  // Ask AI question
  const handleAskAI = () => {
    if (aiQuestion.trim() && isConnected) {
      askAIQuestion(sessionId, aiQuestion);
      setAiQuestion('');
    }
  };

  // Add whiteboard element
  const handleAddWhiteboardElement = () => {
    if (isConnected) {
      const element = {
        id: `user-${Date.now()}`,
        type: 'text',
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50,
        content: `Text ${Date.now()}`,
        timestamp: new Date()
      };

      updateWhiteboard(sessionId, {
        action: 'add',
        element
      });
    }
  };

  // Handle mouse move on whiteboard for cursor tracking
  const handleWhiteboardMouseMove = (e: React.MouseEvent) => {
    if (isConnected) {
      const rect = whiteboardRef.current?.getBoundingClientRect();
      if (rect) {
        const position = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        updateCursor(sessionId, position);
      }
    }
  };

  // Request voice for last AI response
  const handleRequestVoice = () => {
    if (lastAIResponse && isConnected) {
      requestVoiceReply(sessionId, lastAIResponse, 'female');
    }
  };

  return (
    <div className="real-time-demo p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          📡 Day 10: Real-Time Sync Demo
        </h2>
        
        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">
                {connected ? '🔌 Connected' : '🔌 Disconnected'}
              </span>
              <span className="text-sm text-gray-600">
                Session: {sessionId}
              </span>
            </div>
            
            <div className="space-x-2">
              <Button
                onClick={handleConnect}
                disabled={connected}
                variant={connected ? 'outline' : 'primary'}
                size="sm"
              >
                Connect
              </Button>
              <Button
                onClick={handleDisconnect}
                disabled={!connected}
                variant="outline"
                size="sm"
              >
                Disconnect
              </Button>
            </div>
          </div>
          
          {connectedUsers.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Connected users ({connectedUsers.length}): {' '}
                {connectedUsers.map(user => user.userName || user.userId).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Real-time Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chat Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">💬 Real-Time Chat</h3>
            
            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="h-64 border border-gray-200 rounded-lg p-4 mb-4 overflow-y-auto bg-gray-50"
            >
              {chatMessages.map((msg) => (
                <div key={msg.id} className="mb-2">
                  <div className={`inline-block max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.type === 'ai' ? 'bg-blue-100 text-blue-800' :
                    msg.type === 'system' ? 'bg-gray-100 text-gray-600' :
                    'bg-green-100 text-green-800'
                  }`}>
                    <div className="font-medium text-xs mb-1">
                      {msg.userName} {msg.type === 'ai' && '🤖'}
                    </div>
                    <div>{msg.message}</div>
                  </div>
                </div>
              ))}
              
              {isAITyping && (
                <div className="text-sm text-gray-500 italic">
                  🤖 AI is typing...
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!connected}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!connected || !currentMessage.trim()}
                size="sm"
              >
                Send
              </Button>
            </div>
          </div>

          {/* AI Interaction Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">🤖 AI Real-Time Interaction</h3>
            
            {/* AI Thinking Indicator */}
            {isAIThinking && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-blue-800">AI is thinking about your question...</span>
                </div>
              </div>
            )}

            {/* Last AI Response */}
            {lastAIResponse && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">Latest AI Response:</h4>
                <p className="text-sm text-blue-700">{lastAIResponse}</p>
                <Button
                  onClick={handleRequestVoice}
                  disabled={!connected}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  🎤 Generate Voice
                </Button>
              </div>
            )}

            {/* AI Question Input */}
            <div className="space-y-4">
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask the AI a question..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!connected}
              />
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleAskAI}
                  disabled={!connected || !aiQuestion.trim() || isAIThinking}
                  className="flex-1"
                >
                  {isAIThinking ? <LoadingSpinner size="sm" /> : 'Ask AI'}
                </Button>
              </div>
            </div>

            {/* Voice Replies */}
            {voiceReplies.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">🎤 Voice Replies:</h4>
                {voiceReplies.slice(-3).map((voice, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3 mb-2">
                    <p className="text-sm text-gray-600 mb-1">
                      {voice.voice} voice • {voice.duration}s
                    </p>
                    <audio controls className="w-full">
                      <source src={voice.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Whiteboard Section */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">🎨 Real-Time Whiteboard</h3>
            
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                Elements: {whiteboardElements.length} | Move mouse to show cursor
              </p>
              <Button
                onClick={handleAddWhiteboardElement}
                disabled={!connected}
                size="sm"
              >
                Add Element
              </Button>
            </div>

            {/* Whiteboard Canvas */}
            <div 
              ref={whiteboardRef}
              onMouseMove={handleWhiteboardMouseMove}
              className="relative h-96 border border-gray-300 rounded-lg bg-white overflow-hidden cursor-crosshair"
            >
              {/* Whiteboard Elements */}
              {whiteboardElements.map((element) => (
                <div
                  key={element.id}
                  style={{
                    position: 'absolute',
                    left: element.x,
                    top: element.y,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className="bg-yellow-200 px-2 py-1 rounded text-xs border border-yellow-400"
                >
                  {element.content || element.type}
                </div>
              ))}

              {/* Cursor Positions */}
              {Object.entries(cursorPositions).map(([userId, cursor]) => (
                <div
                  key={userId}
                  style={{
                    position: 'absolute',
                    left: cursor.position.x,
                    top: cursor.position.y,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className="pointer-events-none"
                >
                  <div className="bg-red-500 w-3 h-3 rounded-full"></div>
                  <div className="bg-red-500 text-white text-xs px-1 py-0.5 rounded mt-1 whitespace-nowrap">
                    {cursor.userName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">✨ Day 10 Real-Time Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-blue-600 mb-2">📡 Socket.IO Events</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• aiAnswer - Real-time AI responses</li>
                <li>• whiteboardUpdate - Live whiteboard sync</li>
                <li>• voiceReply - Generated voice messages</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-green-600 mb-2">🎨 Whiteboard Events</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time element updates</li>
                <li>• Live cursor positions</li>
                <li>• Multi-user collaboration</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-purple-600 mb-2">💬 Chat Events</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Live messaging</li>
                <li>• AI thinking indicators</li>
                <li>• User presence tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
