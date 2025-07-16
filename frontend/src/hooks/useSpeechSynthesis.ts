import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechSynthesisOptions {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface UseSpeechSynthesisReturn {
  speak: (text: string) => Promise<void>;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  error: string | null;
}

export const useSpeechSynthesis = (
  options: UseSpeechSynthesisOptions = {}
): UseSpeechSynthesisReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const {
    voice = null,
    rate = 1,
    pitch = 1,
    volume = 1
  } = options;

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    
    // Some browsers load voices asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setError(null);
  }, [isSupported]);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!isSupported) {
      setError('Speech synthesis is not supported in this browser');
      return Promise.reject(new Error('Speech synthesis not supported'));
    }

    if (!text.trim()) {
      setError('No text provided to speak');
      return Promise.reject(new Error('No text provided'));
    }

    // Cancel any ongoing speech
    cancel();

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        // Configure utterance
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        // Set voice if specified, otherwise use a suitable default
        if (voice) {
          utterance.voice = voice;
        } else if (voices.length > 0) {
          // Try to find a good English voice
          const englishVoice = voices.find(v => 
            v.lang.startsWith('en') && !v.name.includes('Google')
          ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
          utterance.voice = englishVoice;
        }

        // Event handlers
        utterance.onstart = () => {
          setIsSpeaking(true);
          setError(null);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
          resolve();
        };

        utterance.onerror = (event) => {
          setIsSpeaking(false);
          utteranceRef.current = null;
          const errorMessage = `Speech synthesis error: ${event.error}`;
          setError(errorMessage);
          reject(new Error(errorMessage));
        };

        utterance.onpause = () => {
          setIsSpeaking(false);
        };

        utterance.onresume = () => {
          setIsSpeaking(true);
        };

        // Start speaking
        speechSynthesis.speak(utterance);

      } catch (err) {
        const errorMessage = `Failed to initialize speech synthesis: ${err}`;
        setError(errorMessage);
        reject(new Error(errorMessage));
      }
    });
  }, [isSupported, voice, rate, pitch, volume, voices, cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    speak,
    cancel,
    isSpeaking,
    isSupported,
    voices,
    error
  };
};
