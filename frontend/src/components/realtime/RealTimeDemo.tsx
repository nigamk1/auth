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
  const [sessionJoined, setSessionJoined] = useState(false);
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

  // State for AI teacher visual feedback
  const [isAIWriting, setIsAIWriting] = useState(false);
  const [currentAIAction, setCurrentAIAction] = useState<string>('');

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const whiteboardRef = useRef<HTMLDivElement>(null);

  // Socket.IO event handlers
  const socketEvents = {
    onConnect: () => {
      console.log('🔌 Connected to real-time server');
    },

    onDisconnect: (reason: string) => {
      console.log('🔌 Disconnected from server:', reason);
      setSessionJoined(false);
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

      // Auto-request voice for AI response (like a real teacher speaking)
      if (data.response && isConnected) {
        console.log('🎤 Auto-requesting voice for AI response...');
        requestVoiceReply(sessionId, data.response, 'female');
      }

      // Handle whiteboard actions with animation (like a real teacher writing/drawing)
      if (data.whiteboardActions && data.whiteboardActions.length > 0) {
        console.log('🎨 Processing whiteboard actions:', data.whiteboardActions);
        processWhiteboardActions(data.whiteboardActions);
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
      setSessionJoined(true);
      setConnectedUsers(data.connectedUsers || []);
      
      if (data.whiteboardState?.elements) {
        setWhiteboardElements(data.whiteboardState.elements);
      }
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        userId: 'system',
        userName: 'System',
        message: `Welcome to session ${sessionId}! You can now chat and collaborate.`,
        type: 'system',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, welcomeMessage]);
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
  const handleConnect = async () => {
    if (!isConnected) {
      connect();
      
      // Join session after connection
      setTimeout(() => {
        joinSession(sessionId);
      }, 1000);
    }
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

  // Process whiteboard actions with animation (simulating real teacher writing/drawing)
  const processWhiteboardActions = (actions: any[]) => {
    if (!actions || actions.length === 0) return;
    
    setIsAIWriting(true);
    setCurrentAIAction('Preparing to teach...');
    
    actions.forEach((action, index) => {
      const delay = action.animation?.delay || (index * 1500); // Default 1.5 seconds between actions
      
      setTimeout(() => {
        console.log(`🎨 Executing whiteboard action: ${action.type} - ${action.content}`);
        
        // Update current action for visual feedback
        setCurrentAIAction(
          action.type === 'write' ? `Writing: ${action.content}` :
          action.type === 'formula' ? `Writing formula: ${action.content}` :
          action.type === 'diagram' ? `Drawing diagram: ${action.content}` :
          action.type === 'steps' ? `Showing steps: ${action.content}` :
          action.type === 'clear' ? 'Clearing whiteboard...' :
          `Teaching: ${action.content}`
        );
        
        // Create whiteboard element based on action type
        const element: WhiteboardElement = {
          id: `ai-action-${Date.now()}-${index}`,
          type: action.type || 'text',
          x: action.position?.x || 50 + (index * 20),
          y: action.position?.y || 50 + (index * 30),
          content: action.content || '',
          timestamp: new Date()
        };

        // Handle different action types
        switch (action.type) {
          case 'clear':
            console.log('🧹 AI Teacher is clearing the whiteboard...');
            setWhiteboardElements([]);
            break;
          
          case 'write':
          case 'formula':
          case 'steps':
            console.log(`✍️ AI Teacher is writing: "${action.content}"`);
            setWhiteboardElements(prev => [...prev, element]);
            break;
          
          case 'diagram':
          case 'example':
            console.log(`🎨 AI Teacher is drawing: ${action.content}`);
            setWhiteboardElements(prev => [...prev, {
              ...element,
              type: 'drawing',
              content: `[${action.type.toUpperCase()}] ${action.content}`
            }]);
            break;
          
          default:
            setWhiteboardElements(prev => [...prev, element]);
        }

        // Send whiteboard update to other users
        if (isConnected) {
          updateWhiteboard(sessionId, {
            action: action.type === 'clear' ? 'clear' : 'add',
            element: action.type !== 'clear' ? element : undefined
          });
        }

        // Clear AI writing state after last action
        if (index === actions.length - 1) {
          setTimeout(() => {
            setIsAIWriting(false);
            setCurrentAIAction('');
          }, 1000);
        }
      }, delay);
    });
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
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="font-medium">
                {isConnected ? '🔌 Connected' : '🔌 Disconnected'}
              </span>
              {sessionJoined && (
                <span className="text-sm text-green-600">
                  ✅ Session joined
                </span>
              )}
              <span className="text-sm text-gray-600">
                Session: {sessionId}
              </span>
            </div>
            
            <div className="space-x-2">
              <Button
                onClick={handleConnect}
                disabled={isConnected}
                variant={isConnected ? 'outline' : 'primary'}
                size="sm"
              >
                {isConnected ? 'Connected' : 'Connect'}
              </Button>
              <Button
                onClick={handleDisconnect}
                disabled={!isConnected}
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
                disabled={!isConnected}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!isConnected || !currentMessage.trim()}
                size="sm"
              >
                Send
              </Button>
            </div>
          </div>

          {/* AI Interaction Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">🤖 AI Real-Time Teaching</h3>
            
            {/* Enhanced Teaching Info */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-800 mb-2">🎓 Interactive AI Teacher</h4>
              <p className="text-sm text-blue-700 mb-2">
                Ask any question and experience <strong>voice + visual teaching</strong>! The AI will:
              </p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• 🗣️ <strong>Speak</strong> your answer aloud (auto voice generation)</li>
                <li>• ✍️ <strong>Write</strong> key points on the whiteboard while talking</li>
                <li>• 🎨 <strong>Draw</strong> diagrams, formulas, and step-by-step explanations</li>
                <li>• 📚 <strong>Teach</strong> like a real teacher with visual aids</li>
              </ul>
            </div>

            {/* AI Thinking Indicator */}
            {isAIThinking && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-blue-800">AI Teacher is preparing your lesson...</span>
                </div>
              </div>
            )}

            {/* Last AI Response */}
            {lastAIResponse && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">Latest AI Teaching Response:</h4>
                <p className="text-sm text-blue-700">{lastAIResponse}</p>
                <div className="text-xs text-blue-600 mt-2">
                  <span className="bg-blue-100 px-2 py-1 rounded">🎤 Voice automatically generated</span>
                  {lastAIResponse.includes('[') && <span className="bg-purple-100 px-2 py-1 rounded ml-2">� Whiteboard updated</span>}
                </div>
              </div>
            )}

            {/* AI Question Input */}
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
              <label className="block text-sm font-medium text-blue-800 mb-2">
                🎓 Ask your AI Teacher anything!
              </label>
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="e.g., 'Explain photosynthesis step by step', 'Solve 2x + 5 = 15 and show me the steps', 'What is machine learning and how does it work?'"
                rows={3}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!isConnected}
              />
              
              <div className="flex space-x-2 mt-3">
                <Button
                  onClick={handleAskAI}
                  disabled={!isConnected || !aiQuestion.trim() || isAIThinking}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isAIThinking ? (
                    <>
                      <LoadingSpinner size="sm" /> 
                      <span className="ml-2">AI Teaching...</span>
                    </>
                  ) : (
                    <>
                      🎓 Ask AI Teacher
                    </>
                  )}
                </Button>
              </div>
              
              {/* Quick Examples */}
              <div className="mt-3 text-xs text-blue-600">
                <span className="font-medium">Try these:</span> 
                <button 
                  onClick={() => setAiQuestion('Explain how photosynthesis works with diagrams')}
                  className="ml-2 hover:underline"
                  disabled={!isConnected}
                >
                  Biology
                </button>
                <button 
                  onClick={() => setAiQuestion('Solve the equation 3x + 7 = 22 step by step')}
                  className="ml-2 hover:underline"
                  disabled={!isConnected}
                >
                  Math
                </button>
                <button 
                  onClick={() => setAiQuestion('What is machine learning? Show me examples')}
                  className="ml-2 hover:underline"
                  disabled={!isConnected}
                >
                  Technology
                </button>
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">🎨 Real-Time Whiteboard</h3>
              {isAIWriting && (
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-700 font-medium">
                    🤖 AI Teacher: {currentAIAction}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                Elements: {whiteboardElements.length} | Move mouse to show cursor
              </p>
              <Button
                onClick={handleAddWhiteboardElement}
                disabled={!isConnected}
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
              {whiteboardElements.map((element) => {
                // Enhanced styling based on element type
                const getElementStyle = (type: string) => {
                  switch (type) {
                    case 'write':
                      return 'bg-blue-100 border-blue-300 text-blue-800 font-medium';
                    case 'formula':
                      return 'bg-red-100 border-red-300 text-red-800 font-mono text-lg';
                    case 'diagram':
                    case 'drawing':
                      return 'bg-green-100 border-green-300 text-green-800 italic';
                    case 'steps':
                      return 'bg-purple-100 border-purple-300 text-purple-800 text-sm';
                    case 'example':
                      return 'bg-orange-100 border-orange-300 text-orange-800';
                    default:
                      return 'bg-yellow-100 border-yellow-300 text-yellow-800';
                  }
                };

                return (
                  <div
                    key={element.id}
                    style={{
                      position: 'absolute',
                      left: element.x,
                      top: element.y,
                      transform: 'translate(-50%, -50%)',
                      maxWidth: '250px'
                    }}
                    className={`px-3 py-2 rounded-lg text-sm border-2 shadow-sm transition-all duration-300 ${getElementStyle(element.type)}`}
                  >
                    {/* Type indicator */}
                    {element.type === 'formula' && <span className="text-xs bg-red-200 px-1 rounded mr-1">📐</span>}
                    {element.type === 'diagram' && <span className="text-xs bg-green-200 px-1 rounded mr-1">🎨</span>}
                    {element.type === 'steps' && <span className="text-xs bg-purple-200 px-1 rounded mr-1">📋</span>}
                    {element.type === 'example' && <span className="text-xs bg-orange-200 px-1 rounded mr-1">💡</span>}
                    {element.type === 'write' && <span className="text-xs bg-blue-200 px-1 rounded mr-1">✍️</span>}
                    
                    {element.content || element.type}
                  </div>
                );
              })}

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
