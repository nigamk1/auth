export type Language = 'en' | 'hi' | 'hinglish';

export interface LanguageOption {
  code: Language;
  name: string;
  displayName: string;
  flag: string;
  ttsVoice?: string;
  sttLanguageCode?: string;
}

export interface TranslatedContent {
  en: string;
  hi: string;
  hinglish: string;
}

export interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  translate: (content: TranslatedContent) => string;
  formatPromptForLanguage: (basePrompt: string) => string;
  getVoiceSettings: () => {
    ttsVoice?: string;
    sttLanguageCode?: string;
  };
}

// Language configuration
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    displayName: 'English',
    flag: '🇺🇸',
    ttsVoice: 'alloy', // OpenAI voice
    sttLanguageCode: 'en-US'
  },
  {
    code: 'hi',
    name: 'Hindi',
    displayName: 'हिंदी',
    flag: '🇮🇳',
    ttsVoice: 'onyx', // OpenAI voice - deeper voice for Hindi
    sttLanguageCode: 'hi-IN'
  },
  {
    code: 'hinglish',
    name: 'Hinglish',
    displayName: 'Hinglish',
    flag: '🇮🇳',
    ttsVoice: 'nova', // OpenAI voice - natural voice for Hinglish
    sttLanguageCode: 'en-IN'
  }
];

// Language prompts for AI
export const LANGUAGE_PROMPTS = {
  en: "Respond in clear, simple English. Use everyday words and explain complex concepts step by step.",
  hi: "हिंदी में जवाब दें। सरल शब्दों का इस्तेमाल करें और कठिन विषयों को आसान भाषा में समझाएं।",
  hinglish: "Respond in Hinglish (mix of Hindi and English). Use simple words that Indian students commonly understand. Mix both languages naturally like 'Aap ye concept samjh gaye? This is very important topic hai.'"
};

// Common UI translations
export const UI_TRANSLATIONS = {
  languageSelector: {
    en: "Language",
    hi: "भाषा",
    hinglish: "Language"
  },
  selectLanguage: {
    en: "Select Language",
    hi: "भाषा चुनें",
    hinglish: "Language Choose करें"
  },
  aiTeacher: {
    en: "AI Teacher",
    hi: "एआई शिक्षक",
    hinglish: "AI Teacher"
  },
  startSession: {
    en: "Start Session",
    hi: "सत्र शुरू करें",
    hinglish: "Session Start करें"
  },
  listening: {
    en: "Listening...",
    hi: "सुन रहा है...",
    hinglish: "Listening..."
  },
  speaking: {
    en: "Speaking...",
    hi: "बोल रहा है...",
    hinglish: "Speaking..."
  },
  typeMessage: {
    en: "Type your message...",
    hi: "अपना संदेश लिखें...",
    hinglish: "Apna message type करें..."
  },
  send: {
    en: "Send",
    hi: "भेजें",
    hinglish: "Send"
  },
  askQuestion: {
    en: "Ask a question",
    hi: "प्रश्न पूछें",
    hinglish: "Question पूछें"
  },
  explainTopic: {
    en: "Explain this topic",
    hi: "इस विषय को समझाएं",
    hinglish: "Is topic ko explain करें"
  },
  previousSessions: {
    en: "Previous Sessions",
    hi: "पिछले सत्र",
    hinglish: "Previous Sessions"
  },
  sessionHistory: {
    en: "Session History",
    hi: "सत्र इतिहास",
    hinglish: "Session History"
  },
  analytics: {
    en: "Analytics",
    hi: "विश्लेषण",
    hinglish: "Analytics"
  },
  settings: {
    en: "Settings",
    hi: "सेटिंग्स",
    hinglish: "Settings"
  }
};
