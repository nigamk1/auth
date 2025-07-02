import React, { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, StopIcon, PlayIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onError,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setHasRecording(true);
        onRecordingComplete(audioBlob);

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        onError('Failed to play recording');
      };

      audio.play().catch(() => {
        onError('Failed to play recording');
      });
    }
  };

  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setHasRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
      {!hasRecording ? (
        <>
          <Button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={`flex items-center space-x-2 ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRecording ? (
              <>
                <StopIcon className="h-5 w-5" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <MicrophoneIcon className="h-5 w-5" />
                <span>Record</span>
              </>
            )}
          </Button>
          
          {isRecording && (
            <div className="flex items-center space-x-2">
              <div className="animate-pulse bg-red-500 rounded-full h-3 w-3"></div>
              <span className="text-sm text-gray-600">
                Recording: {formatTime(recordingTime)}
              </span>
            </div>
          )}
        </>
      ) : (
        <>
          <Button
            type="button"
            onClick={isPlaying ? stopPlaying : playRecording}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <PlayIcon className="h-5 w-5" />
            <span>{isPlaying ? 'Stop' : 'Play'}</span>
          </Button>
          
          <span className="text-sm text-gray-600">
            Recording: {formatTime(recordingTime)}
          </span>
          
          <Button
            type="button"
            onClick={clearRecording}
            variant="outline"
            className="text-sm"
          >
            Clear
          </Button>
        </>
      )}
    </div>
  );
};

export default VoiceRecorder;
