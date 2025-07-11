import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';
import Button from '../ui/Button';
import Pagination from '../ui/Pagination';

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
  className = ''
}) => {
  const [processedMessages, setProcessedMessages] = useState<TruncatedMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

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

  const toggleMessageExpansion = (messageId: string) => {
    setProcessedMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, isExpanded: !msg.isExpanded }
          : msg
      )
    );
  };

  const changeMessagePage = (messageId: string, newPage: number) => {
    setProcessedMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, currentPage: newPage }
          : msg
      )
    );
  };

  const totalPages = Math.ceil(processedMessages.length / messagesPerPage);
  const startIndex = (currentPage - 1) * messagesPerPage;
  const endIndex = startIndex + messagesPerPage;
  const currentMessages = processedMessages.slice(startIndex, endIndex);

  const renderMessage = (message: TruncatedMessage) => {
    const isLongMessage = message.pages.length > 1;
    const currentContent = message.isExpanded 
      ? message.pages[message.currentPage - 1] || message.pages[0]
      : message.pages[0].substring(0, maxMessageLength);
    
    const isTruncated = !message.isExpanded && message.content.length > maxMessageLength;

    return (
      <div
        key={message.id}
        className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            message.speaker === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">
            {currentContent}
            {isTruncated && '...'}
          </div>
          
          {/* Message controls */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs opacity-75">
              {new Date(message.timestamp).toLocaleTimeString()}
            </p>
            
            <div className="flex items-center space-x-2">
              {/* Pagination for expanded long messages */}
              {message.isExpanded && isLongMessage && (
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeMessagePage(message.id, Math.max(1, message.currentPage - 1))}
                    disabled={message.currentPage === 1}
                    className="p-1 text-xs"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <span className="text-xs opacity-75">
                    {message.currentPage}/{message.pages.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeMessagePage(message.id, Math.min(message.pages.length, message.currentPage + 1))}
                    disabled={message.currentPage === message.pages.length}
                    className="p-1 text-xs"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
              )}
              
              {/* Expand/Collapse button for long messages */}
              {isLongMessage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMessageExpansion(message.id)}
                  className="p-1 text-xs"
                >
                  {message.isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <MoreHorizontal className="w-3 h-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Start the conversation by speaking!</p>
            <p className="text-sm mt-2">Use the voice controls to ask questions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentMessages.map(renderMessage)}
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t p-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="justify-center"
          />
        </div>
      )}
    </div>
  );
};

export default MessageList;
