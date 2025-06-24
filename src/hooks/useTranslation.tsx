
import { useState, useEffect } from 'react';

type Language = 'it' | 'en';

interface Translations {
  [key: string]: any;
}

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>('it');
  const [translations, setTranslations] = useState<Translations>({});
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('app-language') as Language;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const translationModule = language === 'en' 
          ? await import('../i18n/en.json')
          : await import('../i18n/it.json');
        setTranslations(translationModule.default);
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('Error loading translations:', error);
      }
    };

    loadTranslations();
  }, [language]);

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('app-language', newLanguage);
    // Force all components to re-render with new translations
    window.dispatchEvent(new Event('languageChanged'));
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // fallback to key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return { t, language, changeLanguage };
};
