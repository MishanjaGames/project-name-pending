import { useNavigate } from 'react-router-dom';
import { getUser, clearUser } from '../../utils/auth';
import { useContext } from 'react';
import { SettingsContext } from '../../contexts/SettingsContext';

function AccountPage() {
  const navigate = useNavigate();
  const { lang, setLang, theme, setTheme, t } = useContext(SettingsContext);
  const [user, setUserState] = (function(){ try { return [getUser(), ()=>{}]; } catch { return [null, ()=>{}]; } })();

  // redirect to login if not authenticated
  if (!user) {
    // Delay redirect to avoid React render warnings
    setTimeout(() => navigate('/login'), 0);
    return null;
  }

  const enrollments = user.enrolled || [];

  const handleLogout = () => {
    clearUser();
    navigate('/');
  };

  return (
    <div>
      <nav className="navbar navbar-light bg-white shadow-sm">
        <div className="container">
          <a className="navbar-brand" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Project Name</a>
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-secondary me-2" onClick={() => navigate('/')}>{t('home')}</button>

            <select className="form-select form-select-sm me-2" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
              <option value="en">EN</option>
              <option value="uk">UA</option>
            </select>

            <button className="theme-toggle me-2" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">{theme === 'dark' ? '🌙' : '☀️'}</button>

            <div className="me-3 text-muted small">Theme: <strong className="ms-1">{theme}</strong></div>

            <button className="btn btn-danger ms-2" onClick={handleLogout}>{t('logout')}</button>
          </div>
        </div>
      </nav>

      <div className="container my-4">
        <div className="row">
          <div className="col-12 col-md-4">
            <div className="card p-4">
              <h5>{t('account')}</h5>
              <p className="mb-1"><strong>{t('fullName')}:</strong> {user.name}</p>
              <p className="mb-1"><strong>{t('emailAddress')}:</strong> {user.email}</p>
              <p className="mb-1"><strong>{t('coursesEnrolled')}:</strong> {enrollments.length}</p>
            </div>
          </div>

          <div className="col-12 col-md-8">
            <h5>{t('popularCourses')}</h5>
            {enrollments.length === 0 ? (
              <div className="alert alert-info">{t('youHaveNoEnrolled')}</div>
            ) : (
              <div className="row g-3">
                {enrollments.map(c => (
                  <div className="col-12" key={c.id}>
                    <div className="card p-3 d-flex flex-row align-items-center">
                      <img src={c.img} alt={c.title} style={{ width: 100, height: 60, objectFit: 'cover' }} className="me-3" />
                      <div>
                        <div className="fw-bold">{c.title}</div>
                        <div className="text-muted small">{c.author}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <hr />
            <h6>{t('statistics')}</h6>
            <div className="row">
              <div className="col-6">
                <div className="card p-3">{t('coursesEnrolled')}: <strong>{enrollments.length}</strong></div>
              </div>
              <div className="col-6">
                <div className="card p-3">{t('progress')}: <strong>—</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountPage;
