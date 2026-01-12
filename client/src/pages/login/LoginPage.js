import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../../utils/auth';
import { SettingsContext } from '../../contexts/SettingsContext';

function LoginPage() {
  const navigate = useNavigate();
  const { t } = useContext(SettingsContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Create a demo user and store it
    const demoUser = { name: email.split('@')[0] || 'User', email, enrolled: [] };
    setUser(demoUser);
    console.log('Login:', demoUser);
    // navigate to search page
    navigate('/search');
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 page-bg">
      <div className="card shadow-lg" style={{ width: '100%', maxWidth: '450px', borderRadius: '15px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <img 
              src="https://getbootstrap.com/docs/4.0/assets/brand/bootstrap-solid.svg" 
              alt="Logo" 
              width="80" 
              height="80"
              className="mb-3"
            />
            <h2 className="fw-bold mb-2">{t('welcomeBack')}</h2>
            <p className="text-muted">{t('pleaseLogin')}</p>
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">{t('password')}</label>
              <input
                type="password"
                className="form-control form-control-lg"
                id="password"
                placeholder={t('enterYourPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                />
                <label className="form-check-label" htmlFor="rememberMe">
                  {t('rememberMe')}
                </label>
              </div>
              <a href="#" className="text-decoration-none">{t('forgotPassword')}</a>
            </div>

            <button 
              onClick={handleLogin}
              className="btn btn-primary btn-lg w-100 mb-3"
              style={{ borderRadius: '10px' }}
              aria-label="Login"
            >
              {t('login')}
            </button>

            <div className="text-center">
              <p className="mb-0">
                Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }} className="text-decoration-none fw-bold" aria-label="Sign up">{t('signUp')}</a>
              </p>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-muted mb-3">{t('orLoginWith')}</p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-outline-secondary" style={{ borderRadius: '10px', width: '45%' }} aria-label="Login with Google">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-google me-2" viewBox="0 0 16 16">
                  <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
                </svg>
                Google
              </button>
              <button className="btn btn-outline-secondary" style={{ borderRadius: '10px', width: '45%' }} aria-label="Login with GitHub">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-github me-2" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

export default LoginPage;