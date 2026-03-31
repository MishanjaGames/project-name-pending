import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthImage from './AuthImage';

// ── Theme context ─────────────────────────────────────────────────────────────
const ThemeCtx = createContext({ theme: 'light', toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggle = useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), []);
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

// ── Access level ordering ─────────────────────────────────────────────────────
const ACCESS = { default: 0, create: 1, tutor: 1.5, quality: 2, manage: 3, admin: 4, root: 5 };
const lvl = (a) => ACCESS[a] ?? 0;

// ── Navigation definition ─────────────────────────────────────────────────────
const NAV = [
  // {
  //   section: 'Learning',
  //   minLvl: 0,
  //   items: [
  //     { to: '/my-courses',  icon: 'bi-collection-play',   label: 'My Courses' },
  //     { to: '/my-grades',   icon: 'bi-award',              label: 'My Grades' },
  //     { to: '/redeem',      icon: 'bi-key',                label: 'Redeem Key' },
  //   ],
  // },
  {
    section: 'Management',
    minLvl: 3,
    items: [
      { to: '/',                  icon: 'bi-speedometer2',    label: 'Dashboard' },
      { to: '/manage/users',      icon: 'bi-people-fill',     label: 'Users' },
      { to: '/manage/roles',      icon: 'bi-shield-lock',     label: 'Roles' },
      { to: '/manage/promos',     icon: 'bi-tag',             label: 'Promo Codes' },
      { to: '/manage/keys',       icon: 'bi-key-fill',        label: 'Product Keys' },
      { to: '/manage/directions', icon: 'bi-compass',         label: 'Directions' },
      { to: '/manage/levels',     icon: 'bi-bar-chart-steps', label: 'Levels' },
    ],
  },
  {
    section: 'Tutor',
    minLvl: 1.5,
    items: [
      { to: '/manage/sessions', icon: 'bi-people',     label: 'Sessions' },
      { to: '/manage/courses',  icon: 'bi-book',       label: 'Courses' },
    ],
  },
  {
    section: 'Support',
    minLvl: 0,
    items: [
      { to: '/creator/apply',       icon: 'bi-pen',           label: 'Apply as Creator',  maxLvl: 2 },
      { to: '/tutor/apply',         icon: 'bi-mortarboard',   label: 'Apply as Tutor',    maxLvl: 2 },
      { to: '/support/open-ticket', icon: 'bi-headset',       label: 'Support Ticket' },
      { to: '/manage/forms',        icon: 'bi-ui-checks',     label: 'Review Forms',      minLvl: 2 },
    ],
  },
  {
    section: 'System',
    minLvl: 4,
    items: [
      { to: '/manage/settings', icon: 'bi-gear', label: 'Settings & Logs' },
    ],
  },
];

// ── User avatar ───────────────────────────────────────────────────────────────
function UserAvatar({ user, size = 32 }) {
  const initials = (user?.nickname || user?.email || '?').split(' ')
    .map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = [...(user?.nickname || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  if (user?.links?.find(l => l.description?.toLowerCase() === 'profile picture')) {
    const link = user.links.find(l => l.description?.toLowerCase() === 'profile picture');
    return (
      <AuthImage
        src={link.url}
        alt={user.nickname}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        fallback={<div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},50%,40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * .36, fontWeight: 700, color: '#fff' }}>{initials}</div>}
      />
    );
  }

  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},50%,40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * .36, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ data, onLogout, mobileOpen, onClose }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { theme, toggle } = useTheme();
  const userLvl = lvl(data?.accessLevel);
  const roleColor = { root:'#aaa', admin:'#ff6b6b', manage:'#ffd43b', quality:'#69db7c', tutor:'#22d3ee', create:'#748ffc' }[data?.accessLevel] || 'var(--nav-text)';

  const isActive = (to) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const handleLogout = () => {
    onClose?.();
    onLogout();
  };

  return (
    <aside className={`app-sidebar${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Logo */}
      <Link to="/" className="sidebar-logo" onClick={onClose}>
        <div className="logo-icon">🎓</div>
        <span>EduPanel</span>
      </Link>

      {/* Nav sections */}
      <nav style={{ flex: 1, paddingBottom: '1rem' }}>
        {NAV.map(sec => {
          const visibleItems = sec.items.filter(item => {
            if (item.minLvl !== undefined && userLvl < item.minLvl) return false;
            if (item.maxLvl !== undefined && userLvl > item.maxLvl) return false;
            return true;
          });
          if (userLvl < (sec.minLvl ?? 0) || visibleItems.length === 0) return null;
          return (
            <div key={sec.section}>
              <div className="sidebar-section-label">{sec.section}</div>
              {visibleItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`sidebar-item${isActive(item.to) ? ' active' : ''}`}
                  onClick={onClose}
                >
                  <i className={`bi ${item.icon} si-icon`} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Bottom: theme + user */}
      <div className="sidebar-bottom">
        {/* Theme toggle */}
        <div
          className="sidebar-item"
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'} si-icon`} />
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </div>

        {/* User row */}
        <div className="sidebar-user" onClick={() => { navigate('/manage/settings'); onClose?.(); }}>
          <UserAvatar user={data} size={32} />
          <div className="user-info" style={{ minWidth: 0 }}>
            <div className="user-name">{data?.nickname || data?.email || 'User'}</div>
            <div className="user-role" style={{ color: roleColor }}>
              {data?.accessLevel || 'default'}
              {data?.tutorRank ? ` · ${data.tutorRank}` : ''}
            </div>
          </div>
          <button
            className="sidebar-item"
            style={{ padding: '4px 6px', margin: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nav-text)' }}
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            title="Log out"
          >
            <i className="bi bi-box-arrow-right" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar({ title, onMenuClick, actions }) {
  return (
    <div className="app-topbar">
      <button
        className="sidebar-toggle-btn"
        onClick={onMenuClick}
        style={{ display: 'flex' }}
      >
        <i className="bi bi-list" />
      </button>
      <span className="topbar-title">{title}</span>
      <div className="topbar-actions">{actions}</div>
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export function AppLayout({ data, onLogout, title = '', topbarActions, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close on route change
  const location = useLocation();
  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <div className="app-shell">
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop${mobileOpen ? ' visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <Sidebar
        data={data}
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="app-main">
        <Topbar
          title={title}
          onMenuClick={() => setMobileOpen(p => !p)}
          actions={topbarActions}
        />
        <div className="app-content page-fade">
          {children}
        </div>
      </div>
    </div>
  );
}

// Legacy Navbar export for pages that still import it
export const Navbar = ({ data, onLogout }) => null; // replaced by AppLayout

export default AppLayout;
