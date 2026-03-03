import React, { createContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; 

export const SettingsContext = createContext({
  lang: 'en',
  setLang: () => {},
  theme: 'light',
  setTheme: () => {},
  t: (k) => k
});

export function SettingsProvider({ children }) {
  const { t, i18n } = useTranslation();
  
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    // 1. Твой кастомный класс для App.css
    document.body.classList.toggle('theme-dark', theme === 'dark');
    // 2. ВАЖНО: Родной переключатель для Bootstrap 5
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  const setLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  const lang = i18n.language;

  return (
    <SettingsContext.Provider value={{ lang, setLang, theme, setTheme, t }}>
      {children}
    </SettingsContext.Provider>
  );
}