import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Mic, MicOff, Volume2, VolumeX, AlertTriangle, Settings, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface VoiceHandlerProps {
  socket: Socket | null;
  sessionId: string | null;
  isConnected: boolean;
  onTranscriptionReceived?: (text: string) => void;
  onAIResponseReceived?: (text: string, audioData?: ArrayBuffer) => void;
  disabled?: boolean;
}

interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  transcriptionText: string;
  errorMessage: string;
  micPermission: 'granted' | 'denied' | 'prompt' | 'checking';
  audioSupported: boolean;
  recordingDuration: number;
}

interface VoiceError {
  type: 'permission' | 'network' | 'processing' | 'playback' | 'browser';
  message: string;
  suggestion?: string;
  action?: () => void;
}

export const VoiceHandler: React.FC<VoiceHandlerProps> = ({
  socket,
  sessionId,
  isConnected,
  onTranscriptionReceived,
  onAIResponseReceived,
  disabled = false
}) => {
  const { getVoiceSettings } = useLanguage();
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isProcessing: false,
    isPlaying: false,
    isMuted: false,
    transcriptionText: '',
    errorMessage: '',
    micPermission: 'prompt',
    audioSupported: typeof navigator !== 'undefined' && !!navigator.mediaDevices,
    recordingDuration: 0
  });

  const [currentError, setCurrentError] = useState<VoiceError | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxRecordingTime = 60000; // 60 seconds max recording

  // Check microphone permissions on component mount
  useEffect(() => {
    checkMicrophonePermissions();
  }, []);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      audioContextRef.current = new AudioContext();
    }
    
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Mic permission checking
  const checkMicrophonePermissions = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceState(prev => ({ ...prev, audioSupported: false }));
      setCurrentError({
        type: 'browser',
        message: 'Your browser doesn\'t support voice recording',
        suggestion: 'Please use a modern browser like Chrome, Firefox, or Safari'
      });
      return;
    }

    setVoiceState(prev => ({ ...prev, micPermission: 'checking' }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      setVoiceState(prev => ({ ...prev, micPermission: 'granted' }));
      setCurrentError(null);
      stream.getTracks().forEach(track => track.stop());

    } catch (error: any) {
      console.error('Microphone permission error:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setVoiceState(prev => ({ ...prev, micPermission: 'denied' }));
        setCurrentError({
          type: 'permission',
          message: 'Microphone access denied',
          suggestion: 'Please allow microphone access in your browser settings to use voice features',
          action: () => checkMicrophonePermissions()
        });
      } else if (error.name === 'NotFoundError') {
        setVoiceState(prev => ({ ...prev, micPermission: 'denied' }));
        setCurrentError({
          type: 'permission',
          message: 'No microphone found',
          suggestion: 'Please connect a microphone to use voice features'
        });
      } else {
        setVoiceState(prev => ({ ...prev, micPermission: 'denied' }));
        setCurrentError({
          type: 'permission',
          message: 'Unable to access microphone',
          suggestion: 'Please check your microphone settings and try again',
          action: () => checkMicrophonePermissions()
        });
      }
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleTranscriptionResult = (data: { text: string; confidence: number }) => {
      setVoiceState(prev => ({
        ...prev,
        transcriptionText: data.text,
        isProcessing: false
      }));
      
      if (onTranscriptionReceived) {
        onTranscriptionReceived(data.text);
      }
    };

    const handleAIAudioResponse = (data: { 
      text: string; 
      audioBuffer: ArrayBuffer;
      audioFormat: string;
    }) => {
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
      
      if (onAIResponseReceived) {
        onAIResponseReceived(data.text, data.audioBuffer);
      }
      
      if (!voiceState.isMuted && data.audioBuffer) {
        playAudioBuffer(data.audioBuffer, data.audioFormat);
      }
    };

    const handleVoiceError = (error: { message: string; code?: string }) => {
      setVoiceState(prev => ({
        ...prev,
        isProcessing: false,
        isRecording: false,
        errorMessage: error.message
      }));
      setCurrentError({
        type: 'processing',
        message: error.message,
        suggestion: 'Please try again'
      });
    };

    socket.on('transcription-result', handleTranscriptionResult);
    socket.on('ai-audio-response', handleAIAudioResponse);
    socket.on('voice-error', handleVoiceError);

    return () => {
      socket.off('transcription-result', handleTranscriptionResult);
      socket.off('ai-audio-response', handleAIAudioResponse);
      socket.off('voice-error', handleVoiceError);
    };
  }, [socket, onTranscriptionReceived, onAIResponseReceived, voiceState.isMuted]);

  // Enhanced recording start with comprehensive error handling
  const startRecording = useCallback(async () => {
    if (!socket || !sessionId || disabled) {
      setCurrentError({
        type: 'network',
        message: 'Cannot start recording',
        suggestion: 'Please ensure you are connected to a session'
      });
      return;
    }

    if (voiceState.micPermission === 'denied') {
      setCurrentError({
        type: 'permission',
        message: 'Microphone access denied',
        suggestion: 'Please allow microphone access to use voice features',
        action: () => checkMicrophonePermissions()
      });
      return;
    }

    try {
      setVoiceState(prev => ({ ...prev, errorMessage: '', recordingDuration: 0 }));
      setCurrentError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const options: MediaRecorderOptions = {};
      
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options.mimeType = 'audio/ogg';
      } else {
        throw new Error('No supported audio format found in your browser');
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          await processRecording();
        }
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        setVoiceState(prev => ({ 
          ...prev, 
          isRecording: false,
          recordingDuration: 0
        }));

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        setCurrentError({
          type: 'processing',
          message: 'Recording failed',
          suggestion: 'Please try again or check your microphone'
        });
        stopRecording();
      };

      mediaRecorder.start(100);
      
      setVoiceState(prev => ({ 
        ...prev, 
        isRecording: true,
        micPermission: 'granted'
      }));

      recordingTimerRef.current = setInterval(() => {
        setVoiceState(prev => {
          const newDuration = prev.recordingDuration + 1000;
          
          if (newDuration >= maxRecordingTime) {
            stopRecording();
            setCurrentError({
              type: 'processing',
              message: 'Recording stopped automatically',
              suggestion: `Maximum recording time of ${maxRecordingTime / 1000} seconds reached`
            });
            return prev;
          }
          
          return { ...prev, recordingDuration: newDuration };
        });
      }, 1000);

    } catch (error: any) {
      console.error('Error starting recording:', error);
      
      setVoiceState(prev => ({ ...prev, isRecording: false }));
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setVoiceState(prev => ({ ...prev, micPermission: 'denied' }));
        setCurrentError({
          type: 'permission',
          message: 'Microphone access denied',
          suggestion: 'Please allow microphone access in your browser settings',
          action: () => checkMicrophonePermissions()
        });
      } else if (error.name === 'NotFoundError') {
        setCurrentError({
          type: 'permission',
          message: 'No microphone found',
          suggestion: 'Please connect a microphone to use voice features'
        });
      } else if (error.name === 'NotReadableError') {
        setCurrentError({
          type: 'permission',
          message: 'Microphone is busy',
          suggestion: 'Please close other applications using the microphone and try again'
        });
      } else {
        setCurrentError({
          type: 'processing',
          message: 'Failed to start recording',
          suggestion: error.message || 'Please check your microphone and try again'
        });
      }
    }
  }, [socket, sessionId, disabled, voiceState.micPermission, maxRecordingTime]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && voiceState.isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [voiceState.isRecording]);

  // Process the recorded audio
  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) return;

    try {
      setVoiceState(prev => ({ ...prev, isProcessing: true }));

      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
      });

      // Convert to ArrayBuffer for transmission
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      const voiceSettings = getVoiceSettings();
      
      // Send audio to backend for processing
      if (socket && sessionId) {
        socket.emit('voice-transcription', {
          sessionId,
          audioData: arrayBuffer,
          audioFormat: mediaRecorderRef.current?.mimeType || 'audio/webm',
          language: voiceSettings.sttLanguageCode
        });
      }

    } catch (error) {
      console.error('Error processing recording:', error);
      setCurrentError({
        type: 'processing',
        message: 'Failed to process recording',
        suggestion: 'Please try recording again'
      });
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Play audio buffer
  const playAudioBuffer = async (audioBuffer: ArrayBuffer, format: string) => {
    try {
      if (!audioContextRef.current) return;

      setVoiceState(prev => ({ ...prev, isPlaying: true }));

      const audioBlob = new Blob([audioBuffer], { type: format });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setVoiceState(prev => ({ ...prev, isPlaying: false }));
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setVoiceState(prev => ({ ...prev, isPlaying: false }));
        setCurrentError({
          type: 'playback',
          message: 'Failed to play audio response',
          suggestion: 'Please check your speakers or try again'
        });
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

    } catch (error) {
      console.error('Error playing audio:', error);
      setVoiceState(prev => ({ ...prev, isPlaying: false }));
      setCurrentError({
        type: 'playback',
        message: 'Cannot play audio',
        suggestion: 'Please check your browser audio settings'
      });
    }
  };

  // Toggle mute
  const toggleMute = useCallback(() => {
    setVoiceState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  // Format recording duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Render permission error
  if (currentError?.type === 'permission' || !voiceState.audioSupported) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {currentError?.message || 'Voice features unavailable'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {currentError?.suggestion || 'Your browser doesn\'t support voice recording'}
          </p>
          
          {currentError?.action && (
            <Button
              onClick={currentError.action}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {voiceState.micPermission === 'denied' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">
                <strong>How to enable microphone:</strong><br />
                1. Click the microphone icon in your browser's address bar<br />
                2. Select "Allow" for microphone access<br />
                3. Refresh the page if needed
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Voice Assistant</h3>
          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleMute}
              variant="outline"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              {voiceState.isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Current Error Alert */}
        {currentError && (
          <div className="mb-4">
            <Alert
              type="error"
              message={currentError.message}
              onClose={() => setCurrentError(null)}
            />
            {currentError.suggestion && (
              <p className="text-sm text-gray-600 mt-2 px-4 py-2 bg-gray-50 rounded">
                💡 {currentError.suggestion}
              </p>
            )}
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex flex-col items-center space-y-4">
          {/* Main Record Button */}
          <div className="relative">
            <Button
              onClick={voiceState.isRecording ? stopRecording : startRecording}
              disabled={disabled || !isConnected || voiceState.isProcessing || voiceState.micPermission !== 'granted'}
              className={`
                w-16 h-16 rounded-full transition-all duration-200
                ${voiceState.isRecording 
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-700'
                }
              `}
            >
              {voiceState.isProcessing ? (
                <LoadingSpinner className="w-6 h-6 text-white" />
              ) : voiceState.isRecording ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </Button>
            
            {/* Recording indicator */}
            {voiceState.isRecording && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
            )}
          </div>

          {/* Recording Duration */}
          {voiceState.isRecording && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(voiceState.recordingDuration)}</span>
              <span className="text-gray-400">/ {formatDuration(maxRecordingTime)}</span>
            </div>
          )}

          {/* Status Text */}
          <div className="text-center">
            {voiceState.isRecording && (
              <p className="text-sm text-red-600 font-medium">Recording... Click to stop</p>
            )}
            {voiceState.isProcessing && (
              <p className="text-sm text-blue-600 font-medium">Processing your voice...</p>
            )}
            {voiceState.isPlaying && (
              <p className="text-sm text-green-600 font-medium">Playing AI response...</p>
            )}
            {!voiceState.isRecording && !voiceState.isProcessing && !voiceState.isPlaying && (
              <p className="text-sm text-gray-600">Click to start voice conversation</p>
            )}
          </div>

          {/* Transcription Result */}
          {voiceState.transcriptionText && (
            <div className="w-full p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-700">
                <strong>You said:</strong> {voiceState.transcriptionText}
              </p>
            </div>
          )}
        </div>

        {/* Connection Status */}
        <div className="text-center">
          <div className={`inline-flex items-center space-x-2 text-xs ${
            isConnected ? 'text-green-600' : 'text-red-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceHandler;
