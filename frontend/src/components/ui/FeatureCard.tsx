import React from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'error';
  details?: string[];
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  status,
  details = [],
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-500',
          titleColor: 'text-green-900',
          descColor: 'text-green-700'
        };
      case 'in-progress':
        return {
          icon: Clock,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-500',
          titleColor: 'text-blue-900',
          descColor: 'text-blue-700'
        };
      case 'pending':
        return {
          icon: AlertCircle,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-500',
          titleColor: 'text-yellow-900',
          descColor: 'text-yellow-700'
        };
      case 'error':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-500',
          titleColor: 'text-red-900',
          descColor: 'text-red-700'
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <StatusIcon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${config.titleColor}`}>
            {title}
          </h3>
          <p className={`text-sm ${config.descColor} mt-1`}>
            {description}
          </p>
          {details.length > 0 && (
            <ul className={`text-xs ${config.descColor} mt-2 space-y-1`}>
              {details.map((detail, index) => (
                <li key={index} className="flex items-center space-x-1">
                  <span className="w-1 h-1 bg-current rounded-full"></span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// Component to show overall progress of Day 13-14 features
export const Day13ProgressDashboard: React.FC = () => {
  const features = [
    {
      title: "Microphone Access Handling",
      description: "Enhanced error handling for mic permissions and browser support",
      status: "completed" as const,
      details: [
        "Permission checking and user-friendly error messages",
        "Browser compatibility detection",
        "Automatic retry and manual retry options",
        "Clear user guidance for troubleshooting"
      ]
    },
    {
      title: "AI Response Truncation/Pagination",
      description: "Smart handling of long AI responses with pagination",
      status: "completed" as const,
      details: [
        "Automatic text truncation for long messages",
        "Page-by-page navigation for long responses",
        "Expand/collapse functionality",
        "Conversation history pagination"
      ]
    },
    {
      title: "Responsive Mobile/Tablet Layout",
      description: "Optimized layouts for different screen sizes",
      status: "completed" as const,
      details: [
        "Mobile-first responsive design",
        "Stacked layout for smaller screens",
        "Touch-friendly controls",
        "Adaptive whiteboard sizing"
      ]
    },
    {
      title: "Loading Spinners & Failover Logic",
      description: "Comprehensive loading states and error recovery",
      status: "completed" as const,
      details: [
        "Network status monitoring",
        "Automatic retry with exponential backoff",
        "Loading indicators for all async operations",
        "Graceful degradation for offline scenarios"
      ]
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          🎯 Day 13–14: Final UI Polish + Edge Cases
        </h2>
        <p className="text-gray-600">
          Comprehensive improvements for production-ready user experience
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            title={feature.title}
            description={feature.description}
            status={feature.status}
            details={feature.details}
          />
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-900 font-medium">
            All Day 13-14 Requirements Completed!
          </span>
        </div>
        <p className="text-green-700 text-sm mt-1">
          The AI-powered virtual teacher project now includes robust error handling, 
          responsive design, and comprehensive user experience improvements.
        </p>
      </div>
    </div>
  );
};

export default FeatureCard;
