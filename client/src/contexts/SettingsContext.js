import React, { createContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // Импортируем хук

export const SettingsContext = createContext({
  lang: 'en',
  setLang: () => {},
  theme: 'light',
  setTheme: () => {},
  t: (k) => k
});

export function SettingsProvider({ children }) {

  const { t, i18n } = useTranslation();
  
  // Сохраняем тему по старинке
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.classList.toggle('theme-dark', theme === 'dark');
  }, [theme]);

  // Функция смены языка
  const setLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  // Текущий язык
  const lang = i18n.language;

  return (
    <SettingsContext.Provider value={{ lang, setLang, theme, setTheme, t }}>
      {children}
    </SettingsContext.Provider>
  );
}