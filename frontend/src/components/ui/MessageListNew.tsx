import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../ui/Button';

interface Message {
  id: string;
  speaker: 'user' | 'ai';
  content: string;
  timestamp: Date;
  audioData?: any;
  metadata?: any;
}

interface MessageListProps {
  messages: Message[];
  maxMessageLength?: number;
  messagesPerPage?: number;
  className?: string;
  onSendMessage?: (message: string) => void;
  disabled?: boolean;
}

interface TruncatedMessage extends Message {
  isExpanded: boolean;
  pages: string[];
  currentPage: number;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  maxMessageLength = 500,
  messagesPerPage = 10,
  className = '',
  onSendMessage,
  disabled = false
}) => {
  const [processedMessages, setProcessedMessages] = useState<TruncatedMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');

  // Process messages for truncation and pagination
  useEffect(() => {
    const processed = messages.map((message) => {
      const isLongMessage = message.content.length > maxMessageLength;
      let pages: string[] = [];
      
      if (isLongMessage) {
        // Split long message into pages
        const words = message.content.split(' ');
        let currentPageContent = '';
        
        for (const word of words) {
          if ((currentPageContent + ' ' + word).length > maxMessageLength) {
            if (currentPageContent) {
              pages.push(currentPageContent.trim());
              currentPageContent = word;
            } else {
              // Handle very long words
              pages.push(word);
            }
          } else {
            currentPageContent += (currentPageContent ? ' ' : '') + word;
          }
        }
        
        if (currentPageContent) {
          pages.push(currentPageContent.trim());
        }
      } else {
        pages = [message.content];
      }

      return {
        ...message,
        isExpanded: false,
        pages,
        currentPage: 1
      };
    });

    setProcessedMessages(processed);
  }, [messages, maxMessageLength]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (messageInput.trim() && onSendMessage && !disabled) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMessageExpansion = (messageId: string) => {
    setProcessedMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, isExpanded: !msg.isExpanded }
          : msg
      )
    );
  };

  const renderMessage = (message: TruncatedMessage) => {
    const isLongMessage = message.pages.length > 1;
    const currentContent = message.isExpanded
      ? message.pages[message.currentPage - 1]
      : message.pages[0];
    const isTruncated = !message.isExpanded && isLongMessage;

    return (
      <div
        key={message.id}
        className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
          message.speaker === 'user' ? 'flex-row-reverse space-x-reverse' : ''
        }`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            message.speaker === 'user'
              ? 'bg-blue-600 text-white'
              : message.metadata?.isThinking
              ? 'bg-yellow-100 text-yellow-600'
              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
          }`}>
            {message.speaker === 'user' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )}
          </div>
          
          {/* Message Bubble */}
          <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${
            message.speaker === 'user'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
              : message.metadata?.isThinking
              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              : 'bg-white text-gray-900 border border-gray-200 shadow-md'
          }`}>
            {/* Message Tail */}
            <div className={`absolute top-3 w-3 h-3 transform rotate-45 ${
              message.speaker === 'user'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 -right-1'
                : message.metadata?.isThinking
                ? 'bg-yellow-50 border-l border-b border-yellow-200 -left-1'
                : 'bg-white border-l border-b border-gray-200 -left-1'
            }`} />
            
            <div className="text-sm leading-relaxed">
              {message.metadata?.isThinking && (
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="font-medium">AI is thinking...</span>
                </div>
              )}
              {!message.metadata?.isThinking && (
                <>
                  <div className="whitespace-pre-wrap">
                    {currentContent}
                    {isTruncated && '...'}
                  </div>
                  
                  {/* Timestamp */}
                  <div className={`text-xs mt-2 opacity-70 ${
                    message.speaker === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </>
              )}
            </div>
            
            {/* Expand/Collapse Button for Long Messages */}
            {isLongMessage && !message.metadata?.isThinking && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMessageExpansion(message.id)}
                  className={`text-xs px-2 py-1 ${
                    message.speaker === 'user'
                      ? 'border-blue-300 text-blue-100 hover:bg-blue-500'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {message.isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Show More
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {processedMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Start the conversation!</p>
            <p className="text-sm text-gray-400 mt-1">Ask questions using voice or text</p>
          </div>
        ) : (
          <div className="space-y-4">
            {processedMessages.map(renderMessage)}
          </div>
        )}
      </div>
      
      {/* Text Input */}
      {onSendMessage && (
        <div className="border-t bg-white p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question here..."
                disabled={disabled}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm placeholder-gray-400"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <Button
              type="submit"
              disabled={!messageInput.trim() || disabled}
              size="sm"
              className={`px-6 py-3 rounded-xl font-medium transition-all transform ${
                !messageInput.trim() || disabled
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg hover:scale-105'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MessageList;
