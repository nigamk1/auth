import React, { useRef } from 'react';
import Lottie from 'lottie-react';
import { useSession } from '../../contexts/SessionContext';

interface LottieTeacherAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showStatus?: boolean;
}

// Simple teacher animation data that works with Lottie
const createTeacherAnimation = (isTalking: boolean) => ({
  v: "5.7.0",
  fr: 24,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: isTalking ? "Teacher Talking" : "Teacher Idle",
  ddd: 0,
  assets: [],
  layers: [
    // Head layer
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "head",
      sr: 1,
      ks: {
        o: { a: 0, k: 100, ix: 11 },
        r: { 
          a: isTalking ? 1 : 0, 
          k: isTalking ? [
            { i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 }, t: 0, s: [0] },
            { i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 }, t: 30, s: [2] },
            { t: 60, s: [0] }
          ] : 0,
          ix: 10 
        },
        p: { a: 0, k: [100, 100, 0], ix: 2 },
        a: { a: 0, k: [0, 0, 0], ix: 1 },
        s: { a: 0, k: [100, 100, 100], ix: 6 }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ind: 0,
              ty: "sh",
              ix: 1,
              ks: {
                a: 0,
                k: {
                  i: [[-16.569, 0], [0, -16.569], [16.569, 0], [0, 16.569]],
                  o: [[16.569, 0], [0, 16.569], [-16.569, 0], [0, -16.569]],
                  v: [[0, -30], [30, 0], [0, 30], [-30, 0]],
                  c: true
                },
                ix: 2
              },
              nm: "Path 1",
              mn: "ADBE Vector Shape - Group",
              hd: false
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.96, 0.87, 0.7, 1], ix: 4 },
              o: { a: 0, k: 100, ix: 5 },
              r: 1,
              bm: 0,
              nm: "Fill 1",
              mn: "ADBE Vector Graphic - Fill",
              hd: false
            }
          ],
          nm: "Ellipse 1",
          np: 3,
          cix: 2,
          bm: 0,
          ix: 1,
          mn: "ADBE Vector Group",
          hd: false
        }
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0
    }
  ]
});

export const LottieTeacherAvatar: React.FC<LottieTeacherAvatarProps> = ({ 
  size = 'md', 
  className = '',
  showStatus = true 
}) => {
  const { session } = useSession();
  const lottieRef = useRef<any>(null);

  // Size configurations
  const sizeConfig = {
    sm: { width: 80, height: 80, containerClass: 'w-20 h-20' },
    md: { width: 120, height: 120, containerClass: 'w-30 h-30' },
    lg: { width: 160, height: 160, containerClass: 'w-40 h-40' }
  };

  const config = sizeConfig[size];
  const isTalking = session.aiState === 'speaking' || session.aiState === 'drawing';

  const getStatusColor = () => {
    switch (session.aiState) {
      case 'speaking': return 'border-green-500 shadow-green-200';
      case 'processing': return 'border-yellow-500 shadow-yellow-200';
      case 'drawing': return 'border-purple-500 shadow-purple-200';
      case 'listening': return 'border-blue-500 shadow-blue-200';
      default: return 'border-gray-300 shadow-gray-200';
    }
  };

  const getStatusText = () => {
    switch (session.aiState) {
      case 'speaking': return '🗣️ Teaching';
      case 'processing': return '🤔 Thinking';
      case 'drawing': return '✏️ Drawing';
      case 'listening': return '👂 Listening';
      default: return '😊 Ready';
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {/* Avatar Container */}
      <div className={`
        relative ${config.containerClass} rounded-full border-4 transition-all duration-300
        ${getStatusColor()}
        bg-gradient-to-br from-blue-50 to-indigo-100
        shadow-lg hover:shadow-xl transform hover:scale-105
        ${isTalking ? 'animate-pulse' : ''}
      `}>
        {/* Background Circle */}
        <div className="absolute inset-2 rounded-full bg-white/90 backdrop-blur-sm"></div>
        
        {/* Lottie Animation */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <Lottie
            lottieRef={lottieRef}
            animationData={createTeacherAnimation(isTalking)}
            loop={true}
            autoplay={true}
            style={{ 
              width: config.width * 0.8, 
              height: config.height * 0.8 
            }}
          />
        </div>

        {/* Overlay SVG for better features */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg 
            width={config.width * 0.6} 
            height={config.height * 0.6} 
            viewBox="0 0 80 80" 
            className="overflow-visible"
          >
            {/* Eyes */}
            <circle cx="30" cy="35" r="3" fill="#2C3E50" />
            <circle cx="50" cy="35" r="3" fill="#2C3E50" />
            <circle cx="31" cy="33" r="1" fill="white" />
            <circle cx="51" cy="33" r="1" fill="white" />
            
            {/* Nose */}
            <path d="M38 40 Q40 44 42 40" stroke="#DEB887" strokeWidth="1" fill="none" />
            
            {/* Mouth */}
            {isTalking ? (
              <ellipse 
                cx="40" 
                cy="50" 
                rx="4" 
                ry="3" 
                fill="#CD5C5C"
                className="animate-pulse"
              />
            ) : (
              <path 
                d="M35 48 Q40 53 45 48" 
                stroke="#CD5C5C" 
                strokeWidth="2" 
                fill="none"
                strokeLinecap="round"
              />
            )}
            
            {/* Glasses */}
            <circle cx="30" cy="35" r="6" stroke="#4A4A4A" strokeWidth="1.5" fill="none" opacity="0.7" />
            <circle cx="50" cy="35" r="6" stroke="#4A4A4A" strokeWidth="1.5" fill="none" opacity="0.7" />
            <path d="M36 35 L44 35" stroke="#4A4A4A" strokeWidth="1" />
          </svg>
        </div>

        {/* Speaking indicator */}
        {session.aiState === 'speaking' && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
            <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
          </div>
        )}

        {/* Processing indicator */}
        {session.aiState === 'processing' && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center animate-spin">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}

        {/* Drawing indicator */}
        {session.aiState === 'drawing' && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Status Text */}
      {showStatus && (
        <div className="text-center">
          <span className="text-sm font-medium text-gray-700">
            {getStatusText()}
          </span>
          {session.currentTopic && (
            <p className="text-xs text-gray-500 mt-1 max-w-32 truncate" title={session.currentTopic}>
              {session.currentTopic}
            </p>
          )}
        </div>
      )}

      {/* Voice Wave Animation (when speaking) */}
      {session.aiState === 'speaking' && (
        <div className="flex items-center space-x-1">
          {[0, 150, 300, 450, 600].map((delay, index) => (
            <div 
              key={index}
              className="w-1 bg-green-500 rounded-full animate-pulse" 
              style={{
                height: `${8 + (index % 2) * 4}px`, 
                animationDelay: `${delay}ms`,
                animationDuration: '1s'
              }}
            ></div>
          ))}
        </div>
      )}

      {/* Thinking dots (when processing) */}
      {session.aiState === 'processing' && (
        <div className="flex items-center space-x-1">
          {[0, 200, 400].map((delay, index) => (
            <div 
              key={index}
              className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" 
              style={{animationDelay: `${delay}ms`}}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};
