import React, { useState, useRef, useCallback } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isRecording: boolean;
  disabled?: boolean;
  maxDuration?: number; // in seconds
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  isRecording: externalIsRecording,
  disabled = false,
  maxDuration = 300 // 5 minutes default
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Audio level visualization
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    setAudioLevel(average / 255);

    if (isRecording) {
      animationRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });

      streamRef.current = stream;

      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        onRecordingComplete(audioBlob);
        cleanup();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);

      // Start audio level animation
      updateAudioLevel();

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [onRecordingComplete, maxDuration, updateAudioLevel]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAudioLevel(0);
    setRecordingTime(0);
  }, []);

  // Handle recording toggle
  const handleToggleRecording = useCallback(() => {
    if (disabled) return;

    if (isRecording || externalIsRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [disabled, isRecording, externalIsRecording, startRecording, stopRecording]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const isCurrentlyRecording = isRecording || externalIsRecording;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Recording Button */}
      <button
        onClick={handleToggleRecording}
        disabled={disabled}
        className={`
          relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
          ${disabled 
            ? 'bg-gray-300 cursor-not-allowed' 
            : isCurrentlyRecording
              ? 'bg-red-500 hover:bg-red-600 shadow-lg scale-110'
              : 'bg-blue-500 hover:bg-blue-600 shadow-md hover:scale-105'
          }
        `}
      >
        {isCurrentlyRecording ? (
          <StopIcon className="w-8 h-8 text-white" />
        ) : (
          <MicrophoneIcon className="w-8 h-8 text-white" />
        )}
        
        {/* Pulsing animation during recording */}
        {isCurrentlyRecording && (
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>
        )}
      </button>

      {/* Audio Level Visualization */}
      {isCurrentlyRecording && (
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-100"
            style={{ width: `${audioLevel * 100}%` }}
          />
        </div>
      )}

      {/* Recording Time */}
      {isCurrentlyRecording && (
        <div className="text-center">
          <div className="text-lg font-mono text-red-600 font-bold">
            {formatTime(recordingTime)}
          </div>
          <div className="text-xs text-gray-500">
            Max: {formatTime(maxDuration)}
          </div>
        </div>
      )}

      {/* Status Text */}
      <div className="text-center">
        {disabled ? (
          <p className="text-sm text-gray-500">Recording disabled</p>
        ) : isCurrentlyRecording ? (
          <p className="text-sm text-red-600 font-medium">Recording... Click to stop</p>
        ) : (
          <p className="text-sm text-gray-600">Click to start recording</p>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
