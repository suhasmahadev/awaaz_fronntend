import React, { createContext, useState, useEffect, useContext } from 'react';

// Import all translations
import en from './en.json';
import hi from './hi.json';
import kn from './kn.json';
import ta from './ta.json';
import te from './te.json';
import ml from './ml.json';
import mr from './mr.json';
import bn from './bn.json';
import gu from './gu.json';
import ur from './ur.json';

const translations = { en, hi, kn, ta, te, ml, mr, bn, gu, ur };

export const LANGUAGES = [
  { code: 'en', label: 'English', speechCode: 'en-IN' },
  { code: 'hi', label: 'हिंदी', speechCode: 'hi-IN' },
  { code: 'kn', label: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
  { code: 'ta', label: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'te', label: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'ml', label: 'മലയാളം', speechCode: 'ml-IN' },
  { code: 'mr', label: 'मराठी', speechCode: 'mr-IN' },
  { code: 'bn', label: 'বাংলা', speechCode: 'bn-IN' },
  { code: 'gu', label: 'ગુજરાતી', speechCode: 'gu-IN' },
  { code: 'ur', label: 'اردو', speechCode: 'ur-IN' }
];

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("lang") || "en";
  });

  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const getSpeechCode = () => {
    return LANGUAGES.find(l => l.code === language)?.speechCode || 'en-IN';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getSpeechCode }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
