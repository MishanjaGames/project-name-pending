import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SettingsContext } from '../../contexts/SettingsContext';
import config from '../../config/config';

const API_URL = config.API_URL;

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function apiFetch(path, opts = {}) {
  return fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...authHeader(), 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
}

const STATUS_BADGE = {
  draft:     'bg-secondary',
  active:    'bg-success',
  completed: 'bg-primary',
  archived:  'bg-warning text-dark',
};

function ManageSessionPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { t }     = useContext(SettingsContext);

  const [activeTab, setActiveTab]   = useState('overview');
  const [session,   setSession]     = useState(null);
  const [groups,    setGroups]      = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [error,     setError]       = useState('');
  const [toast,     setToast]       = useState('');
  const [saving,    setSaving]      = useState(false);

  // Modal states
  const [showAddClassModal,    setShowAddClassModal]    = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddMemberModal,   setShowAddMemberModal]   = useState(null);
  const [memberInput,          setMemberInput]          = useState('');

  const [newClassData, setNewClassData] = useState({
    title: '', date: '', time: '', durationMin: 60, meetingLink: '',
  });
  const [newGroupData, setNewGroupData] = useState({ name: '' });

  // ── notify ──────────────────────────────────────────────────
  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ── Load data ────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [sessRes, grpRes] = await Promise.all([
        apiFetch(`/sessions/${id}`),
        apiFetch(`/groups?sessionId=${id}`),
      ]);

      if (sessRes.ok) {
        const d = await sessRes.json();
        setSession(d.data || d);
      } else {
        const d = await sessRes.json().catch(() => ({}));
        setError(d.message || `Error ${sessRes.status}`);
      }

      if (grpRes.ok) {
        const d = await grpRes.json();
        setGroups(d.data || []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived values ───────────────────────────────────────────
  const courseTitle = session?.courseId?.trans?.[0]?.title
    || session?.courseId?.title
    || session?.courseTitle
    || '—';
  const courseId    = session?.courseId?._id || session?.courseId;
  const tutors      = session?.tutors || [];
  const schedule    = session?.schedule || [];
  const totalMembers = groups.reduce((s, g) => s + (g.members?.length || 0), 0);
  const statusBadge = STATUS_BADGE[session?.status] || 'bg-secondary';

  // ── Update status ────────────────────────────────────────────
  const updateStatus = async (status) => {
    setSaving(true);
    try {
      const r = await apiFetch(`/sessions/${id}`, {
        method: 'PATCH', body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setSession(p => ({ ...p, status }));
      notify(`Status → ${status}`);
    } catch (e) { notify('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  // ── Add schedule entry ───────────────────────────────────────
  const handleAddClass = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const newEntry = {
        title:       newClassData.title,
        datetime:    `${newClassData.date}T${newClassData.time}:00`,
        durationMin: parseInt(newClassData.durationMin) || 60,
        meetingLink: newClassData.meetingLink || undefined,
        isRecurring: false,
      };
      const r = await apiFetch(`/sessions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ schedule: [...schedule, newEntry] }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setSession(d.data || { ...session, schedule: [...schedule, newEntry] });
      setShowAddClassModal(false);
      setNewClassData({ title: '', date: '', time: '', durationMin: 60, meetingLink: '' });
      notify('Class added!');
    } catch (e) { notify('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  // ── Create group ─────────────────────────────────────────────
  const handleCreateGroup = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const r = await apiFetch('/groups', {
        method: 'POST', body: JSON.stringify({ sessionId: id, name: newGroupData.name }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setGroups(p => [...p, d.data]);
      setShowCreateGroupModal(false);
      setNewGroupData({ name: '' });
      notify('Group created!');
    } catch (e) { notify('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  // ── Delete group ─────────────────────────────────────────────
  const deleteGroup = async (gid) => {
    if (!window.confirm('Delete this group?')) return;
    try {
      const r = await apiFetch(`/groups/${gid}`, { method: 'DELETE' });
      if (!r.ok) { const d = await r.json(); throw new Error(d.message); }
      setGroups(p => p.filter(g => g._id !== gid));
      notify('Group deleted');
    } catch (e) { notify('Error: ' + e.message); }
  };

  // ── Add member ───────────────────────────────────────────────
  const handleAddMember = async (e) => {
    e.preventDefault(); if (!memberInput.trim()) return;
    setSaving(true);
    try {
      const r = await apiFetch(`/groups/${showAddMemberModal}/members`, {
        method: 'POST', body: JSON.stringify({ emailOrNickname: memberInput.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      await loadData();
      setShowAddMemberModal(null); setMemberInput('');
      notify('Member added!');
    } catch (e) { notify('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  // ── Remove member ────────────────────────────────────────────
  const removeMember = async (gid, uid) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      const r = await apiFetch(`/groups/${gid}/members/${uid}`, { method: 'DELETE' });
      if (!r.ok) { const d = await r.json(); throw new Error(d.message); }
      await loadData(); notify('Member removed');
    } catch (e) { notify('Error: ' + e.message); }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center page-bg">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" style={{ width: 48, height: 48 }} />
        <p className="text-muted">Loading session...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center page-bg">
      <div className="text-center">
        <i className="bi bi-exclamation-circle fs-1 text-danger mb-3 d-block" />
        <p className="text-muted mb-3">{error}</p>
        <button className="btn btn-outline-secondary rounded-pill px-4"
          onClick={() => navigate(-1)}>← Back</button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  //                          RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="min-vh-100 py-4 page-bg">
      <div className="container" style={{ maxWidth: 1100 }}>

        {/* Toast */}
        {toast && (
          <div className="position-fixed top-0 end-0 m-3" style={{ zIndex: 9999 }}>
            <div className="alert alert-primary shadow-sm py-2 px-3 mb-0" style={{ borderRadius: 10 }}>
              <i className="bi bi-check-circle me-2" />{toast}
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb small">
            <li className="breadcrumb-item">
              <button className="btn btn-link text-muted text-decoration-none p-0"
                onClick={() => navigate('/manage/sessions')}>
                {t('manageSession.myCourses') || 'My Sessions'}
              </button>
            </li>
            <li className="breadcrumb-item active fw-bold" aria-current="page">{courseTitle}</li>
          </ol>
        </nav>

        {/* ── Header ── */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-4 gap-3">
          <div>
            <div className="d-flex align-items-center gap-3 mb-1 flex-wrap">
              <h2 className="fw-bold mb-0">{courseTitle}</h2>
              <span className={`badge ${statusBadge} shadow-sm text-capitalize`}>
                {session?.status || 'draft'}
              </span>
            </div>
            <p className="text-muted mb-0 small">
              <i className="bi bi-tag-fill me-1" />
              {session?.courseType || '—'}
              {tutors.length > 0 && (
                <span className="ms-3">
                  <i className="bi bi-person-badge me-1" />
                  {tutors.find(t => t.isHost)?.userId?.nickname || tutors[0]?.userId?.nickname || 'Tutor'}
                </span>
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="d-flex gap-2 flex-wrap">
            {/* View Course — prominent green button */}
            {courseId && (
              <button
                className="btn btn-success fw-bold px-3"
                onClick={() => navigate(`/course/${courseId}`)}
              >
                <i className="bi bi-eye me-2" />
                View Course
              </button>
            )}
            <button
              className="btn btn-outline-secondary fw-bold"
              onClick={() => navigate(`/instructor/edit-course/${courseId}`)}
            >
              <i className="bi bi-pencil me-1" /> Edit Course
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="card shadow-sm border-0 mb-4 overflow-hidden">
          <div className="card-header bg-transparent border-bottom-0 pt-3 pb-0 px-4">
            <ul className="nav nav-tabs border-bottom-0 gap-4" style={{ marginBottom: '-1px' }}>
              {['overview', 'schedule', 'groups', 'members', 'settings'].map((tab) => (
                <li className="nav-item" key={tab}>
                  <button
                    className={`nav-link border-0 text-capitalize pb-3 px-1 ${activeTab === tab ? 'active fw-bold text-primary' : 'text-muted'}`}
                    style={{
                      backgroundColor: 'transparent',
                      borderBottom: activeTab === tab ? '3px solid var(--primary-color)' : '3px solid transparent',
                      borderRadius: 0,
                    }}
                    onClick={() => setActiveTab(tab)}
                  >
                    {t(`manageSession.tabs.${tab}`) || tab}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ══════════════ OVERVIEW ══════════════ */}
        {activeTab === 'overview' && (
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card shadow-sm border-0 h-100 p-4">
                <h5 className="fw-bold mb-4">
                  {t('manageSession.progressAnalytics') || 'Session Overview'}
                </h5>
                <div className="row g-4 text-center mb-4">
                  <div className="col-sm-4">
                    <div className="p-3 rounded-3" style={{ background: 'var(--bg)' }}>
                      <h3 className="fw-bold text-primary mb-1">{totalMembers}</h3>
                      <span className="text-muted small text-uppercase fw-semibold">Members</span>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="p-3 rounded-3" style={{ background: 'var(--bg)' }}>
                      <h3 className="fw-bold text-success mb-1">{schedule.length}</h3>
                      <span className="text-muted small text-uppercase fw-semibold">Scheduled Classes</span>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="p-3 rounded-3" style={{ background: 'var(--bg)' }}>
                      <h3 className="fw-bold text-warning mb-1">{groups.length}</h3>
                      <span className="text-muted small text-uppercase fw-semibold">Groups</span>
                    </div>
                  </div>
                </div>

                {/* Tutors */}
                {tutors.length > 0 && (
                  <div>
                    <p className="text-muted small fw-bold text-uppercase mb-2">Tutors</p>
                    <div className="d-flex flex-wrap gap-2">
                      {tutors.map((tutor, i) => (
                        <span key={i} className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                          <i className="bi bi-person me-1" />
                          {tutor.userId?.nickname || '—'}
                          {tutor.isHost && <span className="ms-1 opacity-75">(host)</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm border-0 h-100 p-4">
                <h5 className="fw-bold mb-3">{t('manageSession.quickActions') || 'Quick Actions'}</h5>
                <div className="d-grid gap-2">
                  {/* View Course — also in Quick Actions */}
                  {courseId && (
                    <button
                      className="btn btn-success text-start fw-bold"
                      onClick={() => navigate(`/course/${courseId}`)}
                    >
                      <i className="bi bi-eye me-2" /> View Course
                    </button>
                  )}
                  <button
                    className="btn btn-outline-secondary text-start"
                    onClick={() => setActiveTab('schedule')}
                  >
                    <i className="bi bi-plus-circle me-2" /> Add Class
                  </button>
                  <button
                    className="btn btn-outline-secondary text-start"
                    onClick={() => setActiveTab('groups')}
                  >
                    <i className="bi bi-people me-2" /> Manage Groups
                  </button>
                  <button
                    className="btn btn-outline-secondary text-start"
                    onClick={() => navigate(`/live/${id}`)}
                  >
                    <i className="bi bi-camera-video me-2" /> Start Live Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ SCHEDULE ══════════════ */}
        {activeTab === 'schedule' && (
          <div className="card shadow-sm border-0 overflow-hidden">
            <div className="card-header bg-transparent d-flex justify-content-between align-items-center p-4 border-bottom">
              <h5 className="fw-bold mb-0">Schedule ({schedule.length})</h5>
              <button className="btn btn-sm btn-primary fw-bold" onClick={() => setShowAddClassModal(true)}>
                <i className="bi bi-plus-lg me-1" /> Add Class
              </button>
            </div>

            {schedule.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-calendar-x fs-1 d-block mb-3" />
                <p>No classes scheduled yet.</p>
                <button className="btn btn-primary rounded-pill px-4" onClick={() => setShowAddClassModal(true)}>
                  Schedule First Class
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light text-muted small text-uppercase">
                    <tr>
                      <th className="py-3 px-4">Topic</th>
                      <th className="py-3">Date & Time</th>
                      <th className="py-3">Duration</th>
                      <th className="py-3">Meeting</th>
                      <th className="py-3 px-4 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((cls, i) => (
                      <tr key={i}>
                        <td className="py-3 px-4 fw-medium">{cls.title}</td>
                        <td className="py-3 text-muted small">
                          {cls.datetime ? new Date(cls.datetime).toLocaleString() : '—'}
                        </td>
                        <td className="py-3 text-muted small">{cls.durationMin || 60} min</td>
                        <td className="py-3">
                          {cls.meetingLink ? (
                            <a href={cls.meetingLink} target="_blank" rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary rounded-pill px-3">
                              <i className="bi bi-camera-video me-1" /> Join
                            </a>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-end">
                          <button
                            className="btn btn-sm btn-primary fw-bold"
                            onClick={() => navigate(`/live/${id}`)}
                          >
                            <i className="bi bi-play-circle me-1" /> Start
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ GROUPS ══════════════ */}
        {activeTab === 'groups' && (
          <div className="card shadow-sm border-0 overflow-hidden">
            <div className="card-header bg-transparent d-flex justify-content-between align-items-center p-4 border-bottom">
              <h5 className="fw-bold mb-0">Groups ({groups.length})</h5>
              <button className="btn btn-sm btn-primary fw-bold" onClick={() => setShowCreateGroupModal(true)}>
                <i className="bi bi-plus-lg me-1" /> Create Group
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-people fs-1 d-block mb-3" />
                <p>No groups yet.</p>
                <button className="btn btn-primary rounded-pill px-4" onClick={() => setShowCreateGroupModal(true)}>
                  Create First Group
                </button>
              </div>
            ) : (
              <div className="p-4 d-grid gap-3">
                {groups.map(group => (
                  <div key={group._id} className="card border-0 shadow-sm"
                    style={{ borderRadius: 12, background: 'var(--bg)' }}>
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h6 className="fw-bold mb-1 text-primary">{group.name}</h6>
                          <span className="text-muted small">
                            {group.members?.length || 0} member{group.members?.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            onClick={() => setShowAddMemberModal(group._id)}>
                            <i className="bi bi-person-plus me-1" /> Add Member
                          </button>
                          <button className="btn btn-sm btn-outline-danger rounded-pill"
                            onClick={() => deleteGroup(group._id)}>
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </div>
                      {group.members?.length > 0 && (
                        <div className="d-flex flex-wrap gap-2">
                          {group.members.map((m, i) => (
                            <span key={i} className="badge bg-secondary bg-opacity-20 text-secondary px-3 py-2 rounded-pill d-flex align-items-center gap-2">
                              <i className="bi bi-person" />
                              {m.userId?.nickname || m.userId?.email || '—'}
                              <button
                                type="button"
                                className="btn-close btn-close-sm"
                                style={{ fontSize: '0.6rem' }}
                                onClick={() => removeMember(group._id, m.userId?._id || m.userId)}
                              />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ MEMBERS ══════════════ */}
        {activeTab === 'members' && (
          <div className="card shadow-sm border-0 overflow-hidden">
            <div className="card-header bg-transparent d-flex justify-content-between align-items-center p-4 border-bottom">
              <h5 className="fw-bold mb-0">All Members ({totalMembers})</h5>
            </div>

            {totalMembers === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-person-x fs-1 d-block mb-3" />
                <p>No members yet. Add members through Groups.</p>
                <button className="btn btn-outline-primary rounded-pill px-4"
                  onClick={() => setActiveTab('groups')}>
                  Go to Groups
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light text-muted small text-uppercase">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3">Group</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 px-4 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.flatMap(g =>
                      (g.members || []).map((m, i) => (
                        <tr key={`${g._id}-${i}`}>
                          <td className="py-3 px-4">
                            <div className="fw-bold">{m.userId?.nickname || '—'}</div>
                            <div className="small text-muted">{m.userId?.email || ''}</div>
                          </td>
                          <td className="py-3">
                            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                              {g.name}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`badge ${m.status === 'active' ? 'bg-success' : m.status === 'dropped' ? 'bg-danger' : 'bg-secondary'}`}>
                              {m.status || 'active'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-end">
                            <button className="btn btn-sm btn-outline-danger rounded-pill px-3"
                              onClick={() => removeMember(g._id, m.userId?._id || m.userId)}>
                              <i className="bi bi-x-circle me-1" /> Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ SETTINGS ══════════════ */}
        {activeTab === 'settings' && (
          <div className="card shadow-sm border-0 p-4 p-md-5">
            <h4 className="fw-bold mb-4">Session Settings</h4>
            <div className="mb-4">
              <label className="form-label fw-semibold">Change Status</label>
              <div className="d-flex gap-2 flex-wrap">
                {['draft', 'active', 'completed'].map(s => (
                  <button key={s}
                    className={`btn rounded-pill px-4 ${session?.status === s ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => updateStatus(s)}
                    disabled={session?.status === s || saving}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-top pt-4 mt-2">
              <h6 className="fw-bold text-danger mb-3">Danger Zone</h6>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-warning rounded-pill px-4"
                  onClick={async () => {
                    if (!window.confirm('Archive this session?')) return;
                    try {
                      const r = await apiFetch(`/sessions/${id}/archive`, { method: 'PATCH' });
                      if (!r.ok) throw new Error((await r.json()).message);
                      notify('Session archived'); navigate('/manage/sessions');
                    } catch (e) { notify('Error: ' + e.message); }
                  }}
                >
                  <i className="bi bi-archive me-1" /> Archive Session
                </button>
                <button
                  className="btn btn-outline-danger rounded-pill px-4"
                  onClick={async () => {
                    if (!window.confirm('Delete session? It must be "completed" first.')) return;
                    try {
                      const r = await apiFetch(`/sessions/${id}`, { method: 'DELETE' });
                      if (!r.ok) throw new Error((await r.json()).message);
                      notify('Deleted'); navigate('/manage/sessions');
                    } catch (e) { notify('Error: ' + e.message); }
                  }}
                >
                  <i className="bi bi-trash me-1" /> Delete Session
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ════════ MODAL: Add Class ════════ */}
      {showAddClassModal && (
        <>
          <div className="modal-backdrop show" style={{ zIndex: 1040 }} onClick={() => setShowAddClassModal(false)} />
          <div className="modal show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4"
                style={{ background: 'var(--card-bg)', color: 'var(--text)' }}>
                <div className="modal-header border-bottom-0 pb-0">
                  <h5 className="modal-title fw-bold">Schedule New Class</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddClassModal(false)} />
                </div>
                <div className="modal-body">
                  <form onSubmit={handleAddClass}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted text-uppercase">Topic / Title</label>
                      <input type="text" className="form-control" required
                        placeholder="e.g. Introduction to Express.js"
                        value={newClassData.title}
                        onChange={e => setNewClassData(p => ({ ...p, title: e.target.value }))}
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                      />
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <label className="form-label fw-semibold small text-muted text-uppercase">Date</label>
                        <input type="date" className="form-control" required
                          value={newClassData.date}
                          onChange={e => setNewClassData(p => ({ ...p, date: e.target.value }))}
                          style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-semibold small text-muted text-uppercase">Time</label>
                        <input type="time" className="form-control" required
                          value={newClassData.time}
                          onChange={e => setNewClassData(p => ({ ...p, time: e.target.value }))}
                          style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-muted text-uppercase">Duration (minutes)</label>
                      <input type="number" className="form-control" min="15" max="480"
                        value={newClassData.durationMin}
                        onChange={e => setNewClassData(p => ({ ...p, durationMin: e.target.value }))}
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-semibold small text-muted text-uppercase">Meeting Link (optional)</label>
                      <input type="url" className="form-control" placeholder="https://meet.google.com/..."
                        value={newClassData.meetingLink}
                        onChange={e => setNewClassData(p => ({ ...p, meetingLink: e.target.value }))}
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                      />
                    </div>
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-primary fw-bold py-2" disabled={saving}>
                        {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                        Add to Schedule
                      </button>
                      <button type="button" className="btn btn-light" onClick={() => setShowAddClassModal(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════ MODAL: Create Group ════════ */}
      {showCreateGroupModal && (
        <>
          <div className="modal-backdrop show" style={{ zIndex: 1040 }} onClick={() => setShowCreateGroupModal(false)} />
          <div className="modal show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4"
                style={{ background: 'var(--card-bg)', color: 'var(--text)' }}>
                <div className="modal-header border-bottom-0 pb-0">
                  <h5 className="modal-title fw-bold">Create Study Group</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreateGroupModal(false)} />
                </div>
                <div className="modal-body">
                  <form onSubmit={handleCreateGroup}>
                    <div className="mb-4">
                      <label className="form-label fw-semibold small text-muted text-uppercase">Group Name</label>
                      <input type="text" className="form-control" required
                        placeholder="e.g. Group A — Evening"
                        value={newGroupData.name}
                        onChange={e => setNewGroupData({ name: e.target.value })}
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                      />
                    </div>
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-primary fw-bold py-2" disabled={saving}>
                        {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                        Create Group
                      </button>
                      <button type="button" className="btn btn-light" onClick={() => setShowCreateGroupModal(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════ MODAL: Add Member ════════ */}
      {showAddMemberModal && (
        <>
          <div className="modal-backdrop show" style={{ zIndex: 1040 }} onClick={() => setShowAddMemberModal(null)} />
          <div className="modal show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4"
                style={{ background: 'var(--card-bg)', color: 'var(--text)' }}>
                <div className="modal-header border-bottom-0 pb-0">
                  <h5 className="modal-title fw-bold">Add Member to Group</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddMemberModal(null)} />
                </div>
                <div className="modal-body">
                  <form onSubmit={handleAddMember}>
                    <div className="mb-4">
                      <label className="form-label fw-semibold small text-muted text-uppercase">Email or Nickname</label>
                      <input type="text" className="form-control" required
                        placeholder="john@example.com or @nickname"
                        value={memberInput}
                        onChange={e => setMemberInput(e.target.value)}
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text)' }}
                      />
                    </div>
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-primary fw-bold py-2" disabled={saving}>
                        {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                        Add Member
                      </button>
                      <button type="button" className="btn btn-light" onClick={() => { setShowAddMemberModal(null); setMemberInput(''); }}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default ManageSessionPage;