import { useState } from 'react';
import LoginPage from './pages/login/LoginPage';
import HomePage from './pages/home/HomePage';
import SignUpPage from './pages/register/RegisterPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // Listen to button clicks
  const showLogin = () => setCurrentPage('login');
  const showHome = () => setCurrentPage('home');

  // Override navigation
  if (typeof window !== 'undefined') {
    window.addEventListener('click', (e) => {
      const target = e.target.closest('button, a');
      if (target) {
        const text = target.textContent;
        if (text === 'Login') {
          e.preventDefault();
          showLogin();
        }
      }
    });
  }

  return (
    <div className="App">
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'register' && <SignUpPage />}
    </div>
  );
}

export default App;