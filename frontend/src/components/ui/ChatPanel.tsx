import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import type { Message } from '../../types';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || disabled) return;

    onSendMessage(inputValue.trim());
    setInputValue('');
    inputRef.current?.focus();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Format timestamp
  const formatTime = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Play audio message
  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  };

  // Render message content based on type
  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case 'user_text':
        return (
          <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs ml-auto">
            <p className="text-sm">{message.content.text}</p>
          </div>
        );

      case 'user_audio':
        return (
          <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs ml-auto">
            <div className="flex items-center space-x-2">
              <SpeakerWaveIcon className="w-4 h-4" />
              <span className="text-sm">Voice message</span>
              {message.content.audioUrl && (
                <button
                  onClick={() => playAudio(message.content.audioUrl!)}
                  className="text-xs underline hover:no-underline"
                >
                  Play
                </button>
              )}
            </div>
            {message.content.transcription && (
              <p className="text-xs mt-1 opacity-80">"{message.content.transcription}"</p>
            )}
          </div>
        );

      case 'ai_response':
        return (
          <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2 max-w-xs mr-auto">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-white font-bold">AI</span>
              </div>
              <div className="flex-1">
                {message.content.text && (
                  <p className="text-sm">{message.content.text}</p>
                )}
                {message.content.audioUrl && (
                  <button
                    onClick={() => playAudio(message.content.audioUrl!)}
                    className="flex items-center space-x-1 mt-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <SpeakerWaveIcon className="w-3 h-3" />
                    <span>Play audio</span>
                  </button>
                )}
                {message.aiResponse?.whiteboardCommands && message.aiResponse.whiteboardCommands.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    📝 Updated whiteboard
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="bg-yellow-50 text-yellow-800 rounded-lg px-3 py-2 text-center max-w-xs mx-auto">
            <p className="text-xs">{message.content.text}</p>
          </div>
        );

      default:
        return (
          <div className="bg-gray-100 text-gray-600 rounded-lg px-3 py-2 max-w-xs">
            <p className="text-sm">Unknown message type</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Chat</h3>
        <p className="text-sm text-gray-500">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start a conversation with the AI teacher!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex flex-col space-y-1">
              {renderMessageContent(message)}
              <div className={`text-xs text-gray-400 ${
                message.type.startsWith('user') ? 'text-right' : 'text-left'
              }`}>
                {formatTime(message.createdAt || new Date())}
                {!message.processed && message.type.startsWith('user') && (
                  <span className="ml-1">⏳</span>
                )}
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="bg-gray-100 text-gray-600 rounded-lg px-4 py-2 max-w-xs mr-auto">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">AI</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Chat disabled" : "Type your message..."}
            disabled={disabled}
            className={`
              flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            `}
          />
          <button
            type="submit"
            disabled={disabled || !inputValue.trim()}
            className={`
              px-4 py-2 rounded-md transition-colors duration-200
              ${disabled || !inputValue.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              }
            `}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatPanel;
