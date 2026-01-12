import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearUser } from '../utils/auth';
import { useState, useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { useCart } from '../contexts/CartContext';

function NavBar() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useContext(SettingsContext);
  const [navQuery, setNavQuery] = useState('');
  const { totalItems } = useCart();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <a className="navbar-brand" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <img src="https://getbootstrap.com/docs/4.0/assets/brand/bootstrap-solid.svg" width="30" height="30" className="d-inline-block align-top me-2" alt="" />
          Project Name
        </a>

        <div className="d-flex align-items-center ms-auto">
          <button className="btn btn-link me-3 text-decoration-none" onClick={() => navigate('/search')}>{t('courses')}</button>

          <form className="d-flex me-3" onSubmit={(e) => { e.preventDefault(); navigate(`/search?q=${encodeURIComponent(navQuery)}`); }}>
            <input className="form-control me-2" type="search" placeholder={t('searchPlaceholder')} value={navQuery} onChange={(e) => setNavQuery(e.target.value)} />
            <button className="btn btn-outline-success" type="submit" title={t('search')} aria-label={t('search')}>
              <i className="bi bi-search" aria-hidden="true"></i>
            </button>
          </form>

          <button className="btn btn-outline-primary me-3" onClick={() => navigate('/cart')} aria-label="Cart">
            <i className="bi bi-cart" aria-hidden="true"></i>
            {totalItems > 0 && <span className="badge bg-danger ms-2">{totalItems}</span>}
          </button>

          <div className="me-3 d-flex align-items-center">
            <select className="form-select form-select-sm me-2" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
              <option value="en">EN</option>
              <option value="uk">UA</option>
            </select>
          </div>

          {(() => {
            const u = getUser();
            return u ? (
              <>
                <button className="btn btn-outline-secondary me-2" onClick={() => navigate('/settings')} title="Settings"><i className="bi bi-gear" aria-hidden="true"></i></button>
                <button className="btn btn-outline-secondary me-2" onClick={() => navigate('/account')} title={t('account')} aria-label={t('account')}>
                  <i className="bi bi-person" aria-hidden="true"></i>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="btn btn-outline-primary me-2">{t('login')}</button>
                <button onClick={() => navigate('/register')} className="btn btn-primary">{t('signup')}</button>
              </>
            );
          })()}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
