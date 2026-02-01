import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";

function Users({ data, onLogout }) {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedRole, setSelectedRole] = useState(''); // stores _id string or ''
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            const headers = {
                'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                'Content-Type': 'application/json'
            };

            const fetchUsers = async () => {
                try {
                    const response = await fetch('http://localhost:4040/api/manage/users', {
                        method: 'GET',
                        headers
                    });
                    if (response.ok) {
                        const res = await response.json();
                        setUsers(res.data);
                    }
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            };

            const fetchRoles = async () => {
                try {
                    const response = await fetch('http://localhost:4040/api/manage/roles', {
                        method: 'GET',
                        headers
                    });
                    if (response.ok) {
                        const res = await response.json();
                        setRoles(res.data || res);
                    }
                } catch (error) {
                    console.error('Error fetching roles:', error);
                }
            };

            fetchUsers();
            fetchRoles();
        }
    }, []);

    // Helper: find roleName by _id from the roles array
    const getRoleName = (roleId) => {
        const found = roles.find((r) => r._id === roleId);
        return found ? found.roleName : roleId; // fallback to raw value if not found
    };

    // Derived filtered list
    const filteredUsers = users.filter((u) => {
        const text = searchText.toLowerCase();
        const roleName = getRoleName(u.role).toLowerCase();
        const matchesText =
            !text ||
            (u.nickname || '').toLowerCase().includes(text) ||
            (u.email || '').toLowerCase().includes(text) ||
            roleName.includes(text);
        const matchesRole = !selectedRole || u.role === selectedRole;
        return matchesText && matchesRole;
    });

    // The currently selected role object (used only for display)
    const activeRoleLabel = selectedRole ? getRoleName(selectedRole) : '';

    const openModal = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    const handleEdit = (user) => {
        navigate(`/manage/user/${user._id}`);
    };

    const handleDelete = (user) => {
        // TODO: Replace with actual delete API call
        // Example:
        // const token = localStorage.getItem('token');
        // await fetch(`http://localhost:4040/api/manage/users/${user._id}`, {
        //     method: 'DELETE',
        //     headers: {
        //         'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
        //         'Content-Type': 'application/json'
        //     }
        // });
        // Then refresh: setUsers(prev => prev.filter(u => u._id !== user._id));

        const confirmed = window.confirm(
            `Are you sure you want to delete user "${user.nickname}" (${user.email})?\n\nThis action cannot be undone.`
        );

        if (confirmed) {
            alert(`[PLACEHOLDER] User "${user.nickname}" would be deleted here.\n\nTo implement: add DELETE request to the handleDelete function.`);
        }
    };

    return (
        <>
            <div className="d-flex flex-column flex-lg-row min-vh-100 bg-light">
                <Navbar data={data} onLogout={onLogout} />

                <div className="flex-grow-1 p-3 p-md-4" style={{ minWidth: 0 }}>
                    {/* Page Header */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
                                <div>
                                    <h1 className="h3 fw-bold text-dark mb-1">Users</h1>
                                    <p className="text-muted mb-0 small">Manage all registered users</p>
                                </div>
                                <span className="badge bg-primary rounded-pill p-2 px-3">
                                    {filteredUsers.length}{filteredUsers.length !== users.length ? ` / ${users.length}` : ''} {users.length === 1 ? 'user' : 'users'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-body p-3">
                            <div className="row g-2 align-items-center">
                                {/* Text search */}
                                <div className="col-12 col-sm-7 col-md-8">
                                    <div className="input-group input-group-sm">
                                        <span className="input-group-text bg-white border-end-0">
                                            <svg width="16" height="16" fill="#6c757d" viewBox="0 0 16 16">
                                                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 6a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
                                            </svg>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0 ps-0"
                                            placeholder="Search by nickname, email or role..."
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

                                {/* Role dropdown — value is _id, display is roleName */}
                                <div className="col-12 col-sm-5 col-md-4">
                                    <select
                                        className="form-select form-select-sm"
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                    >
                                        <option value="">All roles</option>
                                        {roles.map((r) => (
                                            <option key={r._id} value={r._id}>{r.roleName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Active-filter chips */}
                            {(searchText || selectedRole) && (
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
                                    {selectedRole && (
                                        <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
                                            Role: {activeRoleLabel}
                                            <svg width="10" height="10" fill="currentColor" viewBox="0 0 16 16" style={{ cursor: 'pointer' }} onClick={() => setSelectedRole('')}>
                                                <path d="M2.146 2.854a.5.5 0 0 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
                                            </svg>
                                        </span>
                                    )}
                                    <button className="btn btn-link btn-sm p-0 text-danger" onClick={() => { setSearchText(''); setSelectedRole(''); }}>
                                        Clear all
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="card border-0 shadow-sm">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="fw-semibold text-muted small text-uppercase py-3" style={{ width: '60px' }}>#</th>
                                        <th className="fw-semibold text-muted small text-uppercase py-3">Nickname</th>
                                        <th className="fw-semibold text-muted small text-uppercase py-3">Email</th>
                                        <th className="fw-semibold text-muted small text-uppercase py-3">Role</th>
                                        <th className="fw-semibold text-muted small text-uppercase py-3 text-end" style={{ width: '200px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((u, index) => {
                                            const roleName = getRoleName(u.role);
                                            return (
                                                <tr key={index} className="align-middle" onClick={() => openModal(u)} style={{ cursor: 'pointer' }}>
                                                    <td className="text-muted">{index + 1}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white flex-shrink-0"
                                                                style={{ width: '34px', height: '34px', fontSize: '0.8rem' }}>
                                                                {u.nickname ? u.nickname.charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                            <span className="fw-semibold">{u.nickname || 'Unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-muted">{u.email || '—'}</td>
                                                    <td>
                                                        <span className={`badge rounded-pill ${roleName.toLowerCase() === 'admin' ? 'bg-danger' : roleName.toLowerCase() === 'teacher' ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>
                                                            {roleName}
                                                        </span>
                                                    </td>
                                                    <td className="text-end" onClick={(e) => e.stopPropagation()}>
                                                        <div className="btn-group btn-group-sm" role="group">
                                                            <button type="button" className="btn btn-outline-primary" onClick={() => openModal(u)} title="View details">
                                                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                                    <path d="M7.002 11a1 1 0 1 0 2 0 1 1 0 0 0-2 0zM7.1 4.995a.905.905 0 1 0 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                                                                </svg>
                                                            </button>
                                                            <button type="button" className="btn btn-outline-warning" onClick={() => handleEdit(u)} title="Edit user">
                                                                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                                    <path d="M12.146.146a.5.5 0 0 1 .707 0l3 3a.5.5 0 0 1 0 .707l-10 10a.5.5 0 0 1-.203.134l-6 2a.5.5 0 0 1-.633-.633l2-6a.5.5 0 0 1 .134-.203l10-10zM11.207 1.5 13.5 3.793 14.793 2.5 12.5.207l-1.293 1.293zm1.386 1.386L9.3 0.207 10.5 1.407l2.293 2.293-0.207.207z" />
                                                                </svg>
                                                            </button>
                                                            <button type="button" className="btn btn-outline-danger" onClick={() => handleDelete(u)} title="Delete user">
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
                                            <td colSpan="5" className="text-center py-5">
                                                <div className="text-muted">
                                                    <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16" className="mb-3 opacity-50">
                                                        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                                                        <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
                                                    </svg>
                                                    {users.length === 0 ? (
                                                        <>
                                                            <p className="mb-0 fw-semibold">No users found</p>
                                                            <small>The user list is empty</small>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="mb-0 fw-semibold">No matches</p>
                                                            <small>No users match your current search or filter</small>
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
            {showModal && selectedUser && (
                <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                    <div className="modal-backdrop fade show" onClick={closeModal} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}></div>

                    <div className="modal-dialog modal-dialog-centered" role="document" style={{ position: 'relative', zIndex: 1050 }}>
                        <div className="card border-0 shadow-lg rounded-3 overflow-hidden">
                            <div className="card-header bg-primary text-white border-0 d-flex align-items-center justify-content-between py-3 px-4">
                                <h5 className="mb-0 fw-semibold">User Details</h5>
                                <button type="button" className="btn-close btn-close-white btn-sm" onClick={closeModal} aria-label="Close"></button>
                            </div>

                            <div className="card-body p-4">
                                <div className="text-center mb-4">
                                    <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white mx-auto mb-3"
                                        style={{ width: '72px', height: '72px', fontSize: '1.8rem' }}>
                                        {selectedUser.nickname ? selectedUser.nickname.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <h5 className="fw-bold mb-1">{selectedUser.nickname || 'Unknown'}</h5>
                                    {(() => {
                                        const name = getRoleName(selectedUser.role);
                                        return (
                                            <span className={`badge rounded-pill ${name.toLowerCase() === 'admin' ? 'bg-danger' : name.toLowerCase() === 'teacher' ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>
                                                {name}
                                            </span>
                                        );
                                    })()}
                                </div>

                                <table className="table table-sm table-borderless mb-0">
                                    <tbody>
                                        <tr>
                                            <td className="text-muted fw-semibold small text-uppercase py-2" style={{ width: '35%' }}>Email</td>
                                            <td className="py-2">{selectedUser.email || '—'}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-muted fw-semibold small text-uppercase py-2">Nickname</td>
                                            <td className="py-2">{selectedUser.nickname || '—'}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-muted fw-semibold small text-uppercase py-2">Role</td>
                                            <td className="py-2">{getRoleName(selectedUser.role)}</td>
                                        </tr>
                                        {selectedUser._id && (
                                            <tr>
                                                <td className="text-muted fw-semibold small text-uppercase py-2">ID</td>
                                                <td className="py-2"><code className="small">{selectedUser._id}</code></td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="card-footer bg-white border-top d-flex justify-content-end gap-2 py-3 px-4">
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={closeModal}>Close</button>
                                <button type="button" className="btn btn-warning btn-sm text-dark" onClick={() => { closeModal(); handleEdit(selectedUser); }}>
                                    <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                        <path d="M12.146.146a.5.5 0 0 1 .707 0l3 3a.5.5 0 0 1 0 .707l-10 10a.5.5 0 0 1-.203.134l-6 2a.5.5 0 0 1-.633-.633l2-6a.5.5 0 0 1 .134-.203l10-10z" />
                                    </svg>
                                    Edit
                                </button>
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => { closeModal(); handleDelete(selectedUser); }}>
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
            )}
        </>
    );
}

export default Users;