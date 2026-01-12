import React, { createContext, useState, useEffect } from 'react';

const translations = {
  en: {
    courses: 'Courses',
    searchPlaceholder: 'Search courses',
    search: 'Search',
    noResults: 'No results match your filters.',
    preview: 'Preview',
    enroll: 'Enroll',
    alreadyEnrolled: 'Already enrolled',
    enrolledIn: 'Enrolled in ',
    account: 'Account',
    logout: 'Logout',
    login: 'Login',
    signup: 'Sign up',
    filters: 'Filters',
    title: 'Title',
    type: 'Type',
    author: 'Author',
    priceRange: 'Price range',
    clear: 'Clear',
    results: 'results',
    min: 'Min',
    max: 'Max',
    searchResults: 'Search results',
    showing: 'Showing',
    all: 'All',
    heroTitle: 'Learn real skills, build real projects',
    heroLead: 'Interactive courses, mentorship and career support — everything you need to grow.',
    getStarted: 'Get Started',
    learnMore: 'Learn more',
    popularCourses: 'Popular courses',
    goToCourse: 'Go to course',
    welcomeBack: 'Welcome Back',
    pleaseLogin: 'Please login to your account',
    emailAddress: 'Email address',
    enterYourEmail: 'Enter your email',
    password: 'Password',
    enterYourPassword: 'Enter your password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    orLoginWith: 'Or login with',
    orSignUpWith: 'Or sign up with',
    createAccount: 'Create Account',
    signUpToGetStarted: 'Sign up to get started',
    fullName: 'Full Name',
    confirmPassword: 'Confirm Password',
    agreeTerms: 'I agree to the Terms & Conditions',
    signUp: 'Sign Up',
    settings: 'Settings',
    youHaveNoEnrolled: 'You have no enrolled courses yet.',
    statistics: 'Statistics',
    coursesEnrolled: 'Courses enrolled',
    progress: 'Progress',
    privacy: 'Privacy',
    terms: 'Terms',
    home: 'Home',
    feature1Title: 'Interactive Courses',
    feature1Desc: 'Hands-on lessons with practical projects.',
    feature2Title: 'Expert Mentors',
    feature2Desc: 'Learn from industry professionals.',
    feature3Title: 'Flexible Schedule',
    feature3Desc: 'Study at your own pace, anytime.',
    courseCardText: 'Short description for {title} course.'
  },
  uk: {
    courses: 'Курси',
    searchPlaceholder: 'Пошук курсів',
    search: 'Пошук',
    noResults: 'Немає результатів за заданими фільтрами.',
    preview: 'Перегляд',
    enroll: 'Записатися',
    alreadyEnrolled: 'Вже записано',
    enrolledIn: 'Ви записані на ',
    account: 'Акаунт',
    logout: 'Вийти',
    login: 'Увійти',
    signup: 'Реєстрація',
    filters: 'Фільтри',
    title: 'Назва',
    type: 'Тип',
    author: 'Автор',
    priceRange: 'Ціновий діапазон',
    clear: 'Очистити',
    results: 'результатів',
    min: 'Мін',
    max: 'Макс',
    searchResults: 'Результати пошуку',
    showing: 'Показано',
    all: 'Усі',
    heroTitle: 'Опануйте реальні навички, створюйте реальні проекти',
    heroLead: "Інтерактивні курси, наставництво та підтримка кар'єри — усе, що потрібно для розвитку.",
    getStarted: 'Почати',
    learnMore: 'Дізнатись більше',
    popularCourses: 'Популярні курси',
    goToCourse: 'Перейти до курсу',
    welcomeBack: 'Ласкаво просимо',
    pleaseLogin: 'Будь ласка, увійдіть у свій обліковий запис',
    emailAddress: 'Електронна адреса',
    enterYourEmail: 'Введіть вашу електронну адресу',
    password: 'Пароль',
    enterYourPassword: 'Введіть ваш пароль',
    rememberMe: 'Запам’ятати мене',
    forgotPassword: 'Забули пароль?',
    orLoginWith: 'Або увійдіть за допомогою',
    orSignUpWith: 'Або зареєструйтесь за допомогою',
    createAccount: 'Створити акаунт',
    signUpToGetStarted: 'Зареєструйтеся, щоб почати',
    fullName: 'Повне ім\'я',
    confirmPassword: 'Підтвердьте пароль',
    agreeTerms: 'Я погоджуюсь з Умовами',
    signUp: 'Зареєструватись',
    settings: 'Налаштування',
    youHaveNoEnrolled: 'Ви ще не записані на курси.',
    statistics: 'Статистика',
    coursesEnrolled: 'Записано курсів',
    progress: 'Прогрес',
    privacy: 'Конфіденційність',
    terms: 'Умови',
    home: 'Головна',
    feature1Title: 'Інтерактивні курси',
    feature1Desc: 'Практичні заняття з реальними проєктами.',
    feature2Title: 'Експертні наставники',
    feature2Desc: 'Навчайтесь у професіоналів галузі.',
    feature3Title: 'Гнучкий графік',
    feature3Desc: 'Вчіться у зручний для вас час.',
    courseCardText: 'Короткий опис курсу {title}.'
  }
};

export const SettingsContext = createContext({
  lang: 'en',
  setLang: () => {},
  theme: 'light',
  setTheme: () => {},
  t: (k) => k
});

export function SettingsProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.classList.toggle('theme-dark', theme === 'dark');
    // debug: log theme changes to help diagnose toggle issues
    try { console.debug('[Settings] theme set to', theme, 'body.classList.contains("theme-dark")=', document.body.classList.contains('theme-dark')); } catch (e) { /* ignore in non-browser env */ }
  }, [theme]);

  const t = (key) => translations[lang] && translations[lang][key] ? translations[lang][key] : key;

  return (
    <SettingsContext.Provider value={{ lang, setLang, theme, setTheme, t }}>
      {children}
    </SettingsContext.Provider>
  );
}
