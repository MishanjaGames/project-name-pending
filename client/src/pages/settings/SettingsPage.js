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
    
    alert(t('Settings saved') || 'Settings saved');
  };

  return (
    <div className="container py-5" style={{ maxWidth: '800px' }}>
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">{t('settings')}</h2>
          <p className="text-muted mb-0">Manage your profile and preferences</p>
        </div>
        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-2"></i> Back
        </button>
      </div>

      <div className="row g-4">
        
        {/* LEFT COLUMN: PROFILE */}
        <div className="col-12 col-md-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-person-vcard me-2 text-primary"></i> 
                Profile Information
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold text-uppercase">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text border-end-0"><i className="bi bi-person"></i></span>
                  <input 
                    className="form-control border-start-0 ps-0" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small fw-bold text-uppercase">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text border-end-0"><i className="bi bi-envelope"></i></span>
                  <input 
                    className="form-control border-start-0 ps-0" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-primary px-4 rounded-pill shadow-sm" onClick={save}>
                  <i className="bi bi-check-lg me-2"></i> Save Changes
                </button>
                <button 
                  className="btn btn-light px-4 rounded-pill" 
                  onClick={() => { setName(user.name || ''); setEmail(user.email || ''); setLocalTheme(theme); }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: APPEARANCE */}
        <div className="col-12 col-md-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-palette me-2 text-primary"></i> 
                Appearance
              </h5>
            </div>
            <div className="card-body p-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Interface Theme</label>
              
              <div className="d-grid gap-2">
                <div 
                  className={`btn text-start p-3 border ${localTheme === 'light' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                  onClick={() => setLocalTheme('light')}
                  style={{ borderRadius: '12px', cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-center">
                    <i className="bi bi-sun fs-4 me-3 text-warning"></i>
                    <div>
                      <div className="fw-bold">Light Mode</div>
                      <div className="small text-muted">Default clear look</div>
                    </div>
                    {localTheme === 'light' && <i className="bi bi-check-circle-fill ms-auto text-primary"></i>}
                  </div>
                </div>

                <div 
                  className={`btn text-start p-3 border ${localTheme === 'dark' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                  onClick={() => setLocalTheme('dark')}
                  style={{ borderRadius: '12px', cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-center">
                    <i className="bi bi-moon-stars fs-4 me-3 text-info"></i>
                    <div>
                      <div className="fw-bold">Dark Mode</div>
                      <div className="small text-muted">Easy on the eyes</div>
                    </div>
                    {localTheme === 'dark' && <i className="bi bi-check-circle-fill ms-auto text-primary"></i>}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top">
                <small className="text-muted d-block lh-sm">
                  <i className="bi bi-info-circle me-1"></i>
                  Theme updates are applied immediately after clicking "Save Changes".
                </small>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default SettingsPage;