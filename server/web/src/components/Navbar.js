import { Link, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import './navbar.css'
import AuthImage from './AuthImage'

const ACCESS = { default: 0, create: 1, tutor: 1.5, quality: 2, manage: 3, admin: 4, root: 5 }
const lvl = (a) => ACCESS[a] ?? 0

const NAV_SECTIONS = [
    {
        label: 'Learning',
        minLvl: 0,
        items: [
            { to: '/my-courses', icon: 'bi-collection-play', label: 'My Courses' },
            { to: '/my-grades', icon: 'bi-award', label: 'My Grades' },
            { to: '/redeem', icon: 'bi-key', label: 'Redeem Key' },
        ]
    },
    {
        label: 'Support',
        minLvl: 2,
        items: [
            { to: '/creator/apply', icon: 'bi-pen', label: 'Creator Apply' },
            { to: '/tutor/apply', icon: 'bi-mortarboard', label: 'Tutor Apply' },
            { to: '/support/open-ticket', icon: 'bi-headset', label: 'Support' },
            { to: '/manage/forms', icon: 'bi-ui-checks', label: 'Applications / Forms' },
        ]
    },
    {
        label: 'Management',
        minLvl: 3,
        items: [
            { to: '/', icon: 'bi-speedometer2', label: 'Dashboard' },
            { to: '/manage/courses', icon: 'bi-book', label: 'Courses' },
            { to: '/manage/sessions', icon: 'bi-people', label: 'Sessions' },
            { to: '/manage/users', icon: 'bi-people-fill', label: 'Users' },
            { to: '/manage/roles', icon: 'bi-shield-lock', label: 'Roles' },
            { to: '/manage/promos', icon: 'bi-tag', label: 'Promo Codes' },
            { to: '/manage/keys', icon: 'bi-key-fill', label: 'Product Keys' },
            { to: '/manage/directions', icon: 'bi-compass', label: 'Directions' },
            { to: '/manage/levels', icon: 'bi-bar-chart-steps', label: 'Levels' },
        ]
    },
    {
        label: 'Catalogue',
        minLvl: 3,
        items: []
    },
    {
        label: 'System',
        minLvl: 4,
        items: [
            { to: '/manage/settings', icon: 'bi-gear', label: 'Settings' },
        ]
    },
]

export const Navbar = ({ data, onLogout }) => {
    const [open, setOpen] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()
    const userLvl = lvl(data?.accessLevel)

    useEffect(() => { setOpen(false) }, [location])

    const isActive = (to) =>
        to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

    const accessLabel = data?.accessLevel || 'default'
    const accessColors = {
        root: '#424242', admin: '#dc3545', manage: '#ffc107',
        quality: '#35dc3d',tutor: '#0dcaf0', create: '#0d6efd', default: '#9aa0a5'
    }
    const roleColor = accessColors[accessLabel] || '#6c757d'

    return (
        <>
            <nav className="top-bar navbar navbar-dark bg-dark">
                <div className="container-fluid px-3">
                    <button className="navbar-toggler border-0 p-2" type="button"
                        onClick={() => setOpen(o => !o)} aria-label="Toggle sidebar">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <span className="navbar-brand mb-0 h6 mx-auto fw-bold" style={{ letterSpacing: '-.01em' }}>
                        <i className="bi bi-mortarboard-fill me-2" style={{ color: '#3b5bdb' }}></i>
                        project-name-pending Admin Panel
                    </span>
                    <button className="btn btn-outline-light btn-sm d-flex align-items-center justify-content-center"
                        style={{ width: 34, height: 34 }} onClick={onLogout} title="Logout">
                        <i className="bi bi-box-arrow-right"></i>
                    </button>
                </div>
            </nav>

            {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

            <aside className={`sidebar bg-dark text-white ${open ? 'show' : ''}`}>

                {/* ── User strip ── */}
                <div className="sidebar-user px-3 py-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <AuthImage
                            src={data?.links?.find(l => l.type === 'image' && l.description?.toLowerCase() === 'profile picture')?.url || null}
                            alt={data?.nickname}
                            className="sb-avatar"
                            style={{ objectFit: 'cover', padding: 0 }}
                            fallback={<div className="sb-avatar">{(data?.nickname || '?')[0].toUpperCase()}</div>}
                        />
                        <div className="overflow-hidden flex-1">
                            <div className="fw-semibold text-white text-truncate" style={{ fontSize: '.875rem' }}>
                                {data?.nickname || 'User'}
                            </div>
                            <div className="text-truncate" style={{ fontSize: '.72rem', color: '#868e96' }}>
                                {data?.email}
                            </div>
                        </div>
                    </div>
                    <span className="sb-role-badge" style={{ background: roleColor, color: ['manage', 'default', 'tutor'].includes(accessLabel) ? '#000' : '#fff' }}>
                        {accessLabel}
                    </span>
                </div>

                {/* ── Nav ── */}
                <nav className="sidebar-nav">
                    {NAV_SECTIONS.map(section => {
                        if (userLvl < (section.minLvl || 0)) return null
                        const items = section.items.filter(i => userLvl >= (i.minLvl || 0))
                        if (!items.length) return null
                        return (
                            <div key={section.label} className="sb-section">
                                <div className="sb-section-label">{section.label}</div>
                                <ul className="nav flex-column">
                                    {items.map(item => {
                                        const active = isActive(item.to)
                                        return (
                                            <li key={item.to} className="nav-item">
                                                <Link to={item.to}
                                                    className={`nav-link sb-link d-flex align-items-center gap-2 ${active ? 'active' : ''}`}>
                                                    <i className={`bi ${item.icon} sb-icon`}></i>
                                                    <span className="sb-label">{item.label}</span>
                                                    {active && <i className="bi bi-dot ms-auto sb-dot"></i>}
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        )
                    })}
                </nav>

                {/* ── Footer ── */}
                <div className="sidebar-footer border-top border-secondary p-3 d-flex flex-column gap-2">
                    <button className="btn btn-sm btn-outline-secondary w-100 text-white border-secondary"
                        onClick={() => { navigate(`/manage/user/${data?._id}`); setOpen(false) }}>
                        <i className="bi bi-person-gear me-2"></i>Profile Settings
                    </button>
                    <button className="btn btn-sm btn-outline-danger w-100" onClick={onLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </button>
                </div>
            </aside>
        </>
    )
}