import React from 'react';
import { Layout } from '../ui/Layout';
import AiChatWindow from '../ai/AiChatWindow';

export const AiChatPage: React.FC = () => {
  const handleMessageSent = (message: any) => {
    console.log('Message sent:', message);
  };

  const handleResponseReceived = (message: any) => {
    console.log('Response received:', message);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Text Q&A
          </h1>
          <p className="text-gray-600">
            Ask questions and get intelligent responses from our AI assistant. 
            Use text input or voice recording for a natural conversation experience.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Window */}
          <div className="lg:col-span-2">
            <AiChatWindow
              placeholder="Ask me anything about programming, science, history, or any topic..."
              language="en"
              context="General knowledge and educational assistance"
              maxMessages={100}
              onMessageSent={handleMessageSent}
              onResponseReceived={handleResponseReceived}
              className="h-[600px]"
            />
          </div>

          {/* Sidebar with Tips */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  💡 Tips for Better Conversations
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Be specific in your questions</li>
                  <li>• Ask follow-up questions for clarity</li>
                  <li>• Use voice input for natural interaction</li>
                  <li>• Enable voice responses for audio feedback</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  🎯 Example Questions
                </h3>
                <div className="space-y-2">
                  <button 
                    className="block w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                    onClick={() => {
                      const event = new CustomEvent('aiChatQuestion', { 
                        detail: 'Explain quantum computing in simple terms' 
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    "Explain quantum computing in simple terms"
                  </button>
                  <button 
                    className="block w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                    onClick={() => {
                      const event = new CustomEvent('aiChatQuestion', { 
                        detail: 'What are the benefits of learning React?' 
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    "What are the benefits of learning React?"
                  </button>
                  <button 
                    className="block w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                    onClick={() => {
                      const event = new CustomEvent('aiChatQuestion', { 
                        detail: 'How does photosynthesis work?' 
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    "How does photosynthesis work?"
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  🎙️ Voice Features
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Click mic button to record voice questions</li>
                  <li>• AI responses can be spoken aloud</li>
                  <li>• Toggle voice responses on/off</li>
                  <li>• Works in modern browsers with microphone access</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  📚 Supported Topics
                </h3>
                <div className="flex flex-wrap gap-1">
                  {[
                    'Programming', 'Science', 'Math', 'History', 
                    'Literature', 'Technology', 'Business', 'Arts'
                  ].map(topic => (
                    <span 
                      key={topic}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AiChatPage;
