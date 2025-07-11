import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LANGUAGE_OPTIONS, UI_TRANSLATIONS } from '../../types/language';
import type { Language } from '../../types/language';

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  showLabel = true,
  size = 'md'
}) => {
  const { currentLanguage, setLanguage, translate } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };

  const buttonClasses = {
    sm: 'min-w-[100px]',
    md: 'min-w-[120px]',
    lg: 'min-w-[140px]'
  };

  const currentOption = LANGUAGE_OPTIONS.find(option => option.code === currentLanguage);

  const handleLanguageChange = (language: Language) => {
    setLanguage(language);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {translate(UI_TRANSLATIONS.languageSelector)}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            ${sizeClasses[size]} ${buttonClasses[size]}
            bg-white dark:bg-gray-800 
            border border-gray-300 dark:border-gray-600 
            rounded-lg shadow-sm 
            flex items-center justify-between
            hover:bg-gray-50 dark:hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors duration-200
          `}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{currentOption?.flag}</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {currentOption?.displayName}
            </span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`} 
          />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            
            {/* Dropdown */}
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
              <ul className="py-1" role="listbox">
                {LANGUAGE_OPTIONS.map((option) => (
                  <li key={option.code} role="option" aria-selected={option.code === currentLanguage}>
                    <button
                      type="button"
                      onClick={() => handleLanguageChange(option.code)}
                      className={`
                        w-full px-3 py-2 text-left flex items-center space-x-2
                        hover:bg-gray-100 dark:hover:bg-gray-700
                        transition-colors duration-150
                        ${option.code === currentLanguage 
                          ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                          : 'text-gray-900 dark:text-gray-100'
                        }
                      `}
                    >
                      <span className="text-lg">{option.flag}</span>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.displayName}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {option.name}
                        </span>
                      </div>
                      {option.code === currentLanguage && (
                        <div className="ml-auto">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
