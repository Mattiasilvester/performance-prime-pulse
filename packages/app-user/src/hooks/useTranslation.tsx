
import { useState, useEffect } from 'react';

type Language = 'it' | 'en';

interface Translations {
  [key: string]: string | Record<string, string>;
}

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>('it');
  const [translations, setTranslations] = useState<Translations>({});

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
      } catch (error) {
        console.error('Error loading translations:', error);
      }
    };

    loadTranslations();
  }, [language]);

  // Listen for language changes from other components
  useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem('app-language') as Language;
      if (savedLanguage && savedLanguage !== language) {
        setLanguage(savedLanguage);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, [language]);

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('app-language', newLanguage);
    // Force all components to re-render with new translations
    window.dispatchEvent(new Event('languageChanged'));
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: string | Record<string, string> | Translations = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        value = (value as Record<string, string | Record<string, string>>)[k] as string | Record<string, string> | Translations;
      } else {
        return key; // fallback to key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return { t, language, changeLanguage };
};
