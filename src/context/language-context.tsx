'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type LanguageContextType = {
  language: string;
  setLanguage: (language: string) => void;
  supportedLanguages: { value: string; label: string }[];
};

const supportedLanguages = [
    { value: "en-US", label: "English" },
    { value: "es-ES", label: "Spanish" },
    { value: "fr-FR", label: "French" },
    { value: "de-DE", label: "German" },
    { value: "hi-IN", label: "Hindi" },
    { value: "ja-JP", label: "Japanese" },
    { value: "zh-CN", label: "Chinese" },
    { value: "ta-IN", label: "Tamil" },
    { value: "pa-IN", label: "Punjabi" },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState('en-US');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator) {
        const browserLanguage = navigator.language;
        const supported = supportedLanguages.find(l => l.value === browserLanguage);
        setLanguage(supported ? browserLanguage : 'en-US');
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
