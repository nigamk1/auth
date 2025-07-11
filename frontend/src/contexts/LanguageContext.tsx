import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { 
  Language, 
  LanguageContextType, 
  TranslatedContent
} from '../types/language';
import { 
  LANGUAGE_OPTIONS, 
  LANGUAGE_PROMPTS 
} from '../types/language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage && ['en', 'hi', 'hinglish'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Save language preference when changed
  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('preferredLanguage', language);
    
    // Emit language change event for other components
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language } 
    }));
  };

  // Translate content based on current language
  const translate = (content: TranslatedContent): string => {
    return content[currentLanguage] || content.en;
  };

  // Format AI prompt with language instruction
  const formatPromptForLanguage = (basePrompt: string): string => {
    const languageInstruction = LANGUAGE_PROMPTS[currentLanguage];
    return `${languageInstruction}\n\n${basePrompt}`;
  };

  // Get voice settings for current language
  const getVoiceSettings = () => {
    const languageOption = LANGUAGE_OPTIONS.find(option => option.code === currentLanguage);
    return {
      ttsVoice: languageOption?.ttsVoice,
      sttLanguageCode: languageOption?.sttLanguageCode
    };
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    setLanguage,
    translate,
    formatPromptForLanguage,
    getVoiceSettings
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Higher-order component for class components
export const withLanguage = <P extends object>(
  Component: React.ComponentType<P & LanguageContextType>
) => {
  return (props: P) => {
    const languageContext = useLanguage();
    return <Component {...props} {...languageContext} />;
  };
};
