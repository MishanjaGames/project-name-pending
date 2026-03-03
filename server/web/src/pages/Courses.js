import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { extendSession } from "../utils/utils";
import AuthImage from "../components/AuthImage";

function Courses({ data, onLogout }) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(''); // filter by status
    const [selectedDirection, setSelectedDirection] = useState(''); // filter by direction
    const navigate = useNavigate();

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) {
            fetchCourses();
            fetchUsers();
        }
    }, []);

    const fetchData = async () => {
        setLoading(true);
        await fetchCourses();
        await fetchUsers();
        setLoading(false);
    }

    const fetchCourses = async () => {
        try {
            const response = await fetch('http://localhost:4040/api/manage/courses', {
                method: 'GET',
                headers: {
                    'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 401) {
                await extendSession(data)
            }
            if (response.ok) {
                const res = await response.json();
                setCourses(res.data || res);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:4040/api/manage/users', {
                method: 'GET',
                headers: {
                    'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 401) {
                extendSession(data)
            }
            if (response.ok) {
                const res = await response.json();
                setUsers(res.data || res);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    // Helper: find user by userId from the users array
    const getUserInfo = (userId) => {
        const found = users.find((u) => u._id === userId);
        return found ? { nickname: found.nickname, email: found.email } : { nickname: 'Unknown', email: '—' };
    };

    // Helper to get the first course thumbnail URL from links array
    const getCourseThumbnailUrl = (course) => {
        if (!course.links || course.links.length === 0) return null;

        // Find the first thumbnail (type === 'image' and description matches, or just first link)
        const thumbnail = course.links.find(link =>
            link.type === 'image' &&
            link.description &&
            (link.description.toLowerCase() === 'thumbnail' || link.description.toLowerCase() === 'course thumbnail') &&
            link.url
        );

        // If no thumbnail found, use first image with a URL
        return thumbnail ? thumbnail.url : (course.links[0]?.url || null);
    };

    // Get unique statuses and directions for filter dropdowns
    const uniqueStatuses = [...new Set(courses.map(c => c.status))].filter(Boolean);
    const uniqueDirections = [...new Set(courses.map(c => c.direction))].filter(Boolean);

    // Derived filtered list
    const filteredCourses = courses.filter((c) => {
        const text = searchText.toLowerCase();
        const userInfo = getUserInfo(c.userId);
        const matchesText =
            !text ||
            (c.title || '').toLowerCase().includes(text) ||
            (userInfo.nickname || '').toLowerCase().includes(text) ||
            (userInfo.email || '').toLowerCase().includes(text) ||
            (c.direction || '').toLowerCase().includes(text) ||
            (c.level || '').toLowerCase().includes(text);
        const matchesStatus = !selectedStatus || c.status === selectedStatus;
        const matchesDirection = !selectedDirection || c.direction === selectedDirection;
        return matchesText && matchesStatus && matchesDirection;
    });

    const openModal = (course) => {
        setSelectedCourse(course);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCourse(null);
    };

    const handleEdit = (course) => {
        navigate(`/manage/course/${course._id}`);
    };

    const handleDelete = async (course) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete course "${course.title}" (${getUserInfo(course.userId).email})?\n\nThis action cannot be undone.`
        );

        if (confirmed) {
            let i = prompt(`You confirmed to proceed deleting course "${course.title}" (${getUserInfo(course.userId).email}) \n\n This action cannot be undone.
                \n Please enter course's author's email name to continue.`)
            if (i === getUserInfo(course.userId).email) {
                alert(`Course "${course.title}" (${getUserInfo(course.userId).email}) is DELETING. \n This action cannot be undone.`)

                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`http://localhost:4040/api/manage/courses/${course._id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.ok) {
                        alert(`Course "${course.title}" (${getUserInfo(course.userId).email}) is DELETED.`)
                        fetchCourses()
                        fetchUsers()
                    }
                } catch (error) {
                    console.error('Error deleting course:', error);
                }
            }
        }
    };

    // Helper function to get badge color based on status
    const getStatusBadgeColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'deployed':
                return 'bg-success';
            case 'on-check':
                return 'bg-warning text-dark';
            case 'editing':
                return 'bg-secondary';
            default:
                return 'bg-light text-dark';
        }
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            <Navbar data={data} onLogout={onLogout} />
            <div className="d-flex flex-column flex-lg-row min-vh-100 bg-light">

                <div className="flex-grow-1 p-3 p-md-4" style={{ minWidth: 0 }}>
                    {/* Page Header */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
                                <div>
                                    <h1 className="h3 fw-bold text-dark mb-1">Courses</h1>
                                    <p className="text-muted mb-0 small">Manage all courses and content</p>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/creator/apply')}>
                                        <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                                        </svg>
                                        Apply Form
                                    </button>
                                    <button className="btn btn-success btn-sm" onClick={() => navigate('/manage/courses/create')}>
                                        <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                                        </svg>
                                        Add Course
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => fetchData()}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16" style={{ verticalAlign: 'middle' }}>
                                                    <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm6-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                                                    <path d="M8 4a.5.5 0 0 1 .5.5v3.362l2.236-1.618a.5.5 0 0 1 .894.447l-4 2.9a.5.5 0 0 1-.06.03.5.5 0 0 1-.894-.447l4-2.9a.5.5 0 0 1 .06-.03V4.5A.5.5 0 0 1 8 4z" />
                                                </svg>
                                                Refresh
                                            </>
                                        )}
                                    </button>
                                    <span className="badge bg-primary rounded-pill p-2 px-3">
                                        {filteredCourses.length}{filteredCourses.length !== courses.length ? ` / ${courses.length}` : ''} {courses.length === 1 ? 'course' : 'courses'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-body p-3">
                            <div className="row g-2 align-items-center">
                                {/* Text search */}
                                <div className="col-12 col-md-6">
                                    <div className="input-group input-group-sm">
                                        <span className="input-group-text bg-white border-end-0">
                                            <svg width="16" height="16" fill="#6c757d" viewBox="0 0 16 16">
                                                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 6a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
                                            </svg>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0 ps-0"
                                            placeholder="Search by title, owner, direction..."
                                            value={searchText}
                                            onChange={(e) => setSearchText(e.target.value)}
                                        />
                                        {searchText && (
                                            <button className="btn btn-outline-secondary btn-sm border-start-0" onClick={() => setSearchText('')} title="Clear">
                                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M2.146 2.854a.5.5 0 0 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Status dropdown */}
                                <div className="col-6 col-md-3">
                                    <select
                                        className="form-select form-select-sm"
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                    >
                                        <option value="">All statuses</option>
                                        {uniqueStatuses.map((status) => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Direction dropdown */}
                                <div className="col-6 col-md-3">
                                    <select
                                        className="form-select form-select-sm"
                                        value={selectedDirection}
                                        onChange={(e) => setSelectedDirection(e.target.value)}
                                    >
                                        <option value="">All directions</option>
                                        {uniqueDirections.map((direction) => (
                                            <option key={direction} value={direction}>{direction}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Active-filter chips */}
                            {(searchText || selectedStatus || selectedDirection) && (
                                <div className="d-flex align-items-center flex-wrap gap-2 mt-2">
                                    <small className="text-muted">Filters:</small>
                                    {searchText && (
                                        <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
                                            Text: "{searchText}"
                                            <svg width="10" height="10" fill="currentColor" viewBox="0 0 16 16" style={{ cursor: 'pointer' }} onClick={() => setSearchText('')}>
                                                <path d="M2.146 2.854a.5.5 0 0 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
                                            </svg>
                                        </span>
                                    )}
                                    {selectedStatus && (
                                        <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
                                            Status: {selectedStatus}
                                            <svg width="10" height="10" fill="currentColor" viewBox="0 0 16 16" style={{ cursor: 'pointer' }} onClick={() => setSelectedStatus('')}>
                                                <path d="M2.146 2.854a.5.5 0 0 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
                                            </svg>
                                        </span>
                                    )}
                                    {selectedDirection && (
                                        <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
                                            Direction: {selectedDirection}
                                            <svg width="10" height="10" fill="currentColor" viewBox="0 0 16 16" style={{ cursor: 'pointer' }} onClick={() => setSelectedDirection('')}>
                                                <path d="M2.146 2.854a.5.5 0 0 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
                                            </svg>
                                        </span>
                                    )}
                                    <button className="btn btn-link btn-sm p-0 text-danger" onClick={() => { setSearchText(''); setSelectedStatus(''); setSelectedDirection(''); }}>
                                        Clear all
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Courses Table */}
                    <div className="card border-0 shadow-sm">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="fw-semibold text-muted small text-uppercase py-3" style={{ width: '60px' }}>#</th>
                                        <th className="fw-semibold text-muted small text-uppercase py-3">Title</th>
                                        <th className="fw-semibold text-muted small text-uppercase py-3">Owner</th>
                                        <th className="fw-semibold text-muted small text-uppercase py-3">Status</th>
                                        <th className="fw-semibold text-muted small text-uppercase py-3">Direction</th>
                                        <th className="fw-semibold text-muted small text-uppercase py-3">Level</th>
                                        <th className="fw-semibold text-muted small text-uppercase py-3">Price</th>
                                        <th className="fw-semibold text-muted small text-uppercase py-3 text-end" style={{ width: '200px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCourses.length > 0 ? (
                                        filteredCourses.map((c, index) => {
                                            const userInfo = getUserInfo(c.userId);
                                            return (
                                                <tr key={index} className="align-middle" style={{ cursor: 'pointer' }}>
                                                    <td className="text-muted">{index + 1}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            {(() => {
                                                                const thumbnailUrl = getCourseThumbnailUrl(c);
                                                                return thumbnailUrl ? (
                                                                    <AuthImage
                                                                        src={thumbnailUrl}
                                                                        alt={c.title}
                                                                        className="rounded flex-shrink-0"
                                                                        style={{ width: '34px', height: '34px', objectFit: 'cover' }}
                                                                        fallback={
                                                                            <div className="rounded bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary flex-shrink-0"
                                                                                style={{ width: '34px', height: '34px', fontSize: '0.9rem' }}>
                                                                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                                                    <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 6.464V13.5a.5.5 0 0 0 1 0V6.236a.5.5 0 0 0-.053-.224l-7.5-3.5z" />
                                                                                    <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466 4.176 9.032z" />
                                                                                </svg>
                                                                            </div>
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <div className="rounded bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary flex-shrink-0"
                                                                        style={{ width: '34px', height: '34px', fontSize: '0.9rem' }}>
                                                                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                                            <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 6.464V13.5a.5.5 0 0 0 1 0V6.236a.5.5 0 0 0-.053-.224l-7.5-3.5z" />
                                                                            <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466 4.176 9.032z" />
                                                                        </svg>
                                                                    </div>
                                                                );
                                                            })()}
                                                            <span className="fw-semibold">{c.title || 'Untitled'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <div className="fw-semibold small">{userInfo.nickname}</div>
                                                            <div className="text-muted small">{userInfo.email}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge rounded-pill ${getStatusBadgeColor(c.status)}`}>
                                                            {c.status || '—'}
                                                        </span>
                                                    </td>
                                                    <td className="text-muted">{c.direction || '—'}</td>
                                                    <td className="text-muted">{c.level || '—'}</td>
                                                    <td className="text-muted fw-semibold">{c.price ? `$${c.price}` : '—'}</td>
                                                    <td className="text-end" onClick={(e) => e.stopPropagation()}>
                                                        <div className="btn-group btn-group-sm" role="group">
                                                            <button type="button" className="btn btn-outline-primary" onClick={() => openModal(c)} title="View details">
                                                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                                    <path d="M7.002 11a1 1 0 1 0 2 0 1 1 0 0 0-2 0zM7.1 4.995a.905.905 0 1 0 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                                                                </svg>
                                                            </button>
                                                            <button type="button" className="btn btn-outline-warning" onClick={() => handleEdit(c)} title="Edit course">
                                                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                                    <path d="M12.146.146a.5.5 0 0 1 .707 0l3 3a.5.5 0 0 1 0 .707l-10 10a.5.5 0 0 1-.203.134l-6 2a.5.5 0 0 1-.633-.633l2-6a.5.5 0 0 1 .134-.203l10-10zM11.207 1.5 13.5 3.793 14.793 2.5 12.5.207l-1.293 1.293zm1.386 1.386L9.3 0.207 10.5 1.407l2.293 2.293-0.207.207z" />
                                                                </svg>
                                                            </button>
                                                            <button type="button" className="btn btn-outline-danger" onClick={() => handleDelete(c)} title="Delete course">
                                                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                                    <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5z" />
                                                                    <path d="M5 0 4.5.5l-.5 1H2a1 1 0 0 0-1 1v1h12V2.5a1 1 0 0 0-1-1H10.5l-.5-1L9.5 0h-5zM3 14.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4H3v10.5zM4.5 3h7L11 2H5l-.5 1z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center py-5">
                                                <div className="text-muted">
                                                    <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16" className="mb-3 opacity-50">
                                                        <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 6.464V13.5a.5.5 0 0 0 1 0V6.236a.5.5 0 0 0-.053-.224l-7.5-3.5z" />
                                                        <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466 4.176 9.032z" />
                                                    </svg>
                                                    {courses.length === 0 ? (
                                                        <>
                                                            <p className="mb-0 fw-semibold">No courses found</p>
                                                            <small>The course list is empty</small>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="mb-0 fw-semibold">No matches</p>
                                                            <small>No courses match your current search or filter</small>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {showModal && selectedCourse && (
                <>
                    <div className="modal-backdrop fade show" onClick={closeModal} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}></div>
                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg" role="document" style={{ pointerEvents: 'auto' }}>
                            <div className="card border-0 shadow-lg rounded-3 overflow-hidden">
                                <div className="card-header bg-primary text-white border-0 d-flex align-items-center justify-content-between py-3 px-4">
                                    <h5 className="mb-0 fw-semibold">Course Details</h5>
                                    <button type="button" className="btn-close btn-close-white btn-sm" onClick={closeModal} aria-label="Close"></button>
                                </div>

                                <div className="card-body p-4">
                                    <div className="text-center mb-4">
                                        {(() => {
                                            const thumbnailUrl = getCourseThumbnailUrl(selectedCourse);
                                            return thumbnailUrl ? (
                                                <AuthImage
                                                    src={thumbnailUrl}
                                                    alt={selectedCourse.title}
                                                    className="rounded flex-shrink-0"
                                                    style={{ width: '96px', height: '96px', objectFit: 'cover' }}
                                                    fallback={
                                                        <div className="rounded bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary flex-shrink-0"
                                                            style={{ width: '96px', height: '96px', fontSize: '0.9rem' }}>
                                                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 6.464V13.5a.5.5 0 0 0 1 0V6.236a.5.5 0 0 0-.053-.224l-7.5-3.5z" />
                                                                <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466 4.176 9.032z" />
                                                            </svg>
                                                        </div>
                                                    }
                                                />
                                            ) : (
                                                <div className="rounded bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary flex-shrink-0"
                                                    style={{ width: '96px', height: '96px', fontSize: '0.9rem' }}>
                                                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 6.464V13.5a.5.5 0 0 0 1 0V6.236a.5.5 0 0 0-.053-.224l-7.5-3.5z" />
                                                        <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466 4.176 9.032z" />
                                                    </svg>
                                                </div>
                                            );
                                        })()}
                                        <h5 className="fw-bold mb-2">{selectedCourse.title || 'Untitled'}</h5>
                                        <span className={`badge rounded-pill ${getStatusBadgeColor(selectedCourse.status)}`}>
                                            {selectedCourse.status || '—'}
                                        </span>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-12">
                                            <table className="table table-sm table-borderless mb-0">
                                                <tbody>
                                                    <tr>
                                                        <td className="text-muted fw-semibold small text-uppercase py-2" style={{ width: '30%' }}>Owner</td>
                                                        <td className="py-2">
                                                            {(() => {
                                                                const userInfo = getUserInfo(selectedCourse.userId);
                                                                return (
                                                                    <div>
                                                                        <div className="fw-semibold">{userInfo.nickname}</div>
                                                                        <div className="text-muted small">{userInfo.email}</div>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted fw-semibold small text-uppercase py-2">Title</td>
                                                        <td className="py-2">{selectedCourse.title || '—'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted fw-semibold small text-uppercase py-2">Status</td>
                                                        <td className="py-2">
                                                            <span className={`badge rounded-pill ${getStatusBadgeColor(selectedCourse.status)}`}>
                                                                {selectedCourse.status || '—'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted fw-semibold small text-uppercase py-2">Direction</td>
                                                        <td className="py-2">{selectedCourse.direction || '—'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted fw-semibold small text-uppercase py-2">Level</td>
                                                        <td className="py-2">{selectedCourse.level || '—'}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted fw-semibold small text-uppercase py-2">Price</td>
                                                        <td className="py-2 fw-semibold">{selectedCourse.price ? `$${selectedCourse.price}` : '—'}</td>
                                                    </tr>
                                                    {selectedCourse.description && (
                                                        <tr>
                                                            <td className="text-muted fw-semibold small text-uppercase py-2 align-top">Description</td>
                                                            <td className="py-2">{selectedCourse.description}</td>
                                                        </tr>
                                                    )}
                                                    {selectedCourse.skills && selectedCourse.skills.length > 0 && (
                                                        <tr>
                                                            <td className="text-muted fw-semibold small text-uppercase py-2 align-top">Skills</td>
                                                            <td className="py-2">
                                                                <div className="d-flex flex-wrap gap-1">
                                                                    {selectedCourse.skills.map((skill, idx) => (
                                                                        <span key={idx} className="badge bg-light text-dark border">
                                                                            {skill}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {selectedCourse.createdAt && (
                                                        <tr>
                                                            <td className="text-muted fw-semibold small text-uppercase py-2">Created At</td>
                                                            <td className="py-2 small">{formatDate(selectedCourse.createdAt)}</td>
                                                        </tr>
                                                    )}
                                                    {selectedCourse.updatedAt && (
                                                        <tr>
                                                            <td className="text-muted fw-semibold small text-uppercase py-2">Updated At</td>
                                                            <td className="py-2 small">{formatDate(selectedCourse.updatedAt)}</td>
                                                        </tr>
                                                    )}
                                                    {selectedCourse._id && (
                                                        <tr>
                                                            <td className="text-muted fw-semibold small text-uppercase py-2">ID</td>
                                                            <td className="py-2"><code className="small">{selectedCourse._id}</code></td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-footer bg-white border-top d-flex justify-content-end gap-2 py-3 px-4">
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={closeModal}>Close</button>
                                    <button type="button" className="btn btn-primary btn-sm text-light" onClick={() => { closeModal(); navigate(`/manage/course/preview/${selectedCourse._id}`) }}>
                                        <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">

                                        </svg>
                                        Preview
                                    </button>
                                    <button type="button" className="btn btn-warning btn-sm text-dark" onClick={() => { closeModal(); handleEdit(selectedCourse); }}>
                                        <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                            <path d="M12.146.146a.5.5 0 0 1 .707 0l3 3a.5.5 0 0 1 0 .707l-10 10a.5.5 0 0 1-.203.134l-6 2a.5.5 0 0 1-.633-.633l2-6a.5.5 0 0 1 .134-.203l10-10z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => { closeModal(); handleDelete(selectedCourse); }}>
                                        <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5z" />
                                            <path d="M5 0 4.5.5l-.5 1H2a1 1 0 0 0-1 1v1h12V2.5a1 1 0 0 0-1-1H10.5l-.5-1L9.5 0h-5zM3 14.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4H3v10.5zM4.5 3h7L11 2H5l-.5 1z" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

export default Courses;