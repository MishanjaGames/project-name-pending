import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, setUser } from '../../utils/auth';
import { SettingsContext } from '../../contexts/SettingsContext';

function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme, t } = useContext(SettingsContext);
  const [user, setUserState] = useState(() => getUser() || { name: '', email: '' });
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [localTheme, setLocalTheme] = useState(theme || 'light');

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  const save = () => {
    const updated = { ...(user || {}), name, email };
    setUser(updated);
    setUserState(updated);
    setTheme(localTheme);
    alert('Settings saved');
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{t('settings') || 'Settings'}</h2>
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="row">
        <div className="col-12 col-md-6">
          <div className="card p-3">
            <h5 className="mb-3">Profile</h5>
            <label className="form-label">Full name</label>
            <input className="form-control mb-2" value={name} onChange={(e) => setName(e.target.value)} />
            <label className="form-label">Email</label>
            <input className="form-control mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />

            <button className="btn btn-primary me-2" onClick={save}>Save</button>
            <button className="btn btn-outline-secondary" onClick={() => { setName(user.name || ''); setEmail(user.email || ''); setLocalTheme(theme); }}>Reset</button>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card p-3">
            <h5 className="mb-3">Appearance</h5>
            <div className="mb-3">
              <label className="form-label">Theme</label>
              <select className="form-select" value={localTheme} onChange={(e) => setLocalTheme(e.target.value)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <p className="text-muted small">Theme changes will be applied when you save.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
