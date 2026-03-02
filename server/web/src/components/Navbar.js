import { Link, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import './navbar.css'

export const Navbar = ({ data, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const location = useLocation()

    useEffect(() => {
        setIsSidebarOpen(false)
    }, [location])

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    const closeSidebar = () => {
        setIsSidebarOpen(false)
    }

    return (
        <>
            {/* Top Bar with Hamburger - Always visible */}
            <nav className="top-bar navbar navbar-dark bg-dark">
                <div className="container-fluid">
                    <button 
                        className="navbar-toggler border-0 p-2" 
                        type="button" 
                        onClick={toggleSidebar}
                        aria-label="Toggle sidebar"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    {!isSidebarOpen && (
                        <span className="navbar-brand mb-0 h5 mx-auto">Admin Panel</span>
                    )}
                    <div style={{ width: '31px' }}>
                        {!isSidebarOpen && (
                        <button className="btn btn-outline-light btn-sm w-100" onClick={onLogout}>
                            <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                                <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                            </svg>
                        </button>)}
                    </div> {/* Spacer for centering */}
                    
                </div>
            </nav>

            {/* Overlay when sidebar is open */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={closeSidebar}></div>
            )}

            {/* Sidebar */}
            <aside className={`sidebar bg-dark text-white ${isSidebarOpen ? 'show' : ''}`}>
                {/* Sidebar Header */}
                <div className="sidebar-header p-3 border-bottom border-secondary">
                    <div className="d-flex align-items-center justify-content-between">
                        <h4 className="fw-bold mb-0">Admin Panel</h4>
                        {/* <button 
                            className="btn btn-sm btn-outline-light" 
                            onClick={closeSidebar}
                            aria-label="Close sidebar"
                        >
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                            </svg>
                        </button> */}
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <nav className="sidebar-nav">
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <Link 
                                to='/' 
                                className="nav-link text-white d-flex align-items-center"
                                onClick={closeSidebar}
                            >
                                <span>Dashboard</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link 
                                to='/manage/courses' 
                                className="nav-link text-white d-flex align-items-center"
                                onClick={closeSidebar}
                            >
                                <span>Courses</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link 
                                to='/manage/directions' 
                                className="nav-link text-white d-flex align-items-center"
                                onClick={closeSidebar}
                            >
                                <span>Directions</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link 
                                to='/manage/levels' 
                                className="nav-link text-white d-flex align-items-center"
                                onClick={closeSidebar}
                            >
                                <span>Levels</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link 
                                to='/manage/roles' 
                                className="nav-link text-white d-flex align-items-center"
                                onClick={closeSidebar}
                            >
                                <span>Roles</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link 
                                to='/manage/users' 
                                className="nav-link text-white d-flex align-items-center"
                                onClick={closeSidebar}
                            >
                                <span>Users</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link 
                                to='/manage/settings' 
                                className="nav-link text-white d-flex align-items-center"
                                onClick={closeSidebar}
                            >
                                <span>Settings</span>
                            </Link>
                        </li>
                    </ul>
                </nav>

                {/* Sidebar Footer with User Info */}
                <div className="sidebar-footer border-top border-secondary p-3 mt-auto">
                    <div className="mb-3">
                        <small className="text-white-50 d-block mb-1">User:</small>
                        <p className="mb-1 fw-bold text-white text-truncate">{data.nickname}</p>
                        <small className="text-white-50 d-block mb-1">{data.email}</small>
                    </div>
                    <button className="btn btn-outline-light btn-sm w-100" onClick={onLogout}>
                        <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                            <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>
        </>
    )
}