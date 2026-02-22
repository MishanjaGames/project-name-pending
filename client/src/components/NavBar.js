import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearUser } from '../utils/auth';
import { SettingsContext } from '../contexts/SettingsContext';
import { useCart } from '../contexts/CartContext';

function NavBar() {
  const navigate = useNavigate();
  const { lang, setLang, t, theme, setTheme } = useContext(SettingsContext);
  
  // ИЗМЕНЕНИЕ: Берем не totalItems, а сам массив items
  const { items } = useCart(); 
  
  // Считаем уникальные курсы (просто длина массива)
  const uniqueItemsCount = items.length;

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    clearUser();
    setShowDropdown(false);
    navigate('/login');
  };

  const toggleTheme = (e) => {
    e.stopPropagation(); 
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const navbarClasses = theme === 'dark' 
    ? 'navbar navbar-expand-lg navbar-dark shadow-sm' 
    : 'navbar navbar-expand-lg navbar-light bg-white shadow-sm';

  return (
    <nav className={navbarClasses}>
      <div className="container">
        <a className="navbar-brand" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <img src="https://getbootstrap.com/docs/4.0/assets/brand/bootstrap-solid.svg" width="30" height="30" className="d-inline-block align-top me-2" alt="" />
          Project Name
        </a>

        <div className="d-flex align-items-center ms-auto">
          <button className="btn btn-link me-3 text-decoration-none" onClick={() => navigate('/search')}>{t('courses')}</button>

          <button className="btn btn-outline-primary me-3" onClick={() => navigate('/cart')} aria-label="Cart">
            <i className="bi bi-cart" aria-hidden="true"></i>
            {/* ИЗМЕНЕНИЕ: Показываем uniqueItemsCount вместо totalItems */}
            {uniqueItemsCount > 0 && <span className="badge bg-danger ms-2">{uniqueItemsCount}</span>}
          </button>

          <div className="me-3 d-flex align-items-center">
            <select 
              className={`form-select form-select-sm ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`} 
              value={lang} 
              onChange={(e) => setLang(e.target.value)} 
              aria-label="Language"
            >
              <option value="en">EN</option>
              <option value="uk">UA</option>
            </select>
          </div>

          {(() => {
            const u = getUser();
            return u ? (
              <div className="dropdown" ref={dropdownRef}>
                <button 
                  className={`btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2 ${showDropdown ? 'show' : ''}`}
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-expanded={showDropdown}
                >
                  <i className="bi bi-person-circle"></i>
                </button>

                <ul className={`dropdown-menu dropdown-menu-end ${showDropdown ? 'show' : ''} ${theme === 'dark' ? 'dropdown-menu-dark' : ''}`} style={{ minWidth: '220px' }}>
                  
                  <li>
                    <button className="dropdown-item" onClick={() => { navigate('/account'); setShowDropdown(false); }}>
                      <i className="bi bi-person me-2"></i> {t('account')}
                    </button>
                  </li>

                  <li>
                    <button className="dropdown-item" onClick={() => { navigate('/settings'); setShowDropdown(false); }}>
                      <i className="bi bi-gear me-2"></i> {t('settings')}
                    </button>
                  </li>

                  <li><hr className="dropdown-divider" /></li>
                  
                  <li>
                    <button className="dropdown-item d-flex justify-content-between align-items-center" onClick={toggleTheme}>
                      <span>
                        <i className={`bi ${theme === 'light' ? 'bi-moon' : 'bi-sun'} me-2`}></i> 
                        {theme === 'light' ? t('dark') : t('light')}
                      </span>
                      <div className="form-check form-switch m-0">
                        <input className="form-check-input" type="checkbox" checked={theme === 'dark'} readOnly style={{ pointerEvents: 'none' }} />
                      </div>
                    </button>
                  </li>

                  <li><hr className="dropdown-divider" /></li>

                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i> {t('logout') || 'Logout'}
                    </button>
                  </li>
                </ul>
              </div>
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