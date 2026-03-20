import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { UtilityModal } from "../components/UtilityModal";

const API = "http://localhost:4040/api";
const TUTOR_RANKS = ['assistant','teacher','lecturer','instructor','tutor','professor'];

function Sessions({ data, onLogout }) {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const ah = { Authorization: `${token?.split(" ")[0]} ${token?.split(" ")[1]}`, "Content-Type": "application/json" };

    const [sessions, setSessions] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCourseType, setFilterCourseType] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortDir, setSortDir] = useState('desc');
    const [courses, setCourses]   = useState([]);
    const [users, setUsers]       = useState([]);
    const [loading, setLoading]   = useState(true);

    // Create form
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        courseId: "", courseType: "HOSTED", coTutors: [], restrictionIgnored: false
    });
    const [saving, setSaving] = useState(false);

    // Modal
    const [modal, setModal] = useState({ show: false, type: "info", title: "", message: "", onConfirm: null, onCancel: null, onClose: null, danger: false });
    const closeModal  = () => setModal(p => ({ ...p, show: false }));
    const showInfo    = (t, m) => setModal({ show: true, type: "info", title: t, message: m, onClose: closeModal });
    const showConfirm = (t, m, fn, d = false) => setModal({ show: true, type: "confirm", danger: d, title: t, message: m, onConfirm: fn, onCancel: closeModal });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [sessRes, courseRes] = await Promise.all([
                fetch(`${API}/sessions`, { headers: ah }),
                fetch(`${API}/courses`, { headers: ah })
            ]);
            if (sessRes.ok)   { const d = await sessRes.json();   setSessions(d.data || []); }
            if (courseRes.ok) { const d = await courseRes.json(); setCourses(d.data || []); }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const courseTitle = (c) => c?.trans?.[0]?.title || "(untitled)";

    const filteredSessions = (() => {
        let result = sessions.filter(s => {
            const t = courseTitle(s.courseId).toLowerCase();
            const matchesText = !searchText || t.includes(searchText.toLowerCase()) ||
                (s.hostTutor?.nickname || '').toLowerCase().includes(searchText.toLowerCase());
            const matchesStatus = !filterStatus || s.status === filterStatus;
            const matchesType   = !filterCourseType || s.courseType === filterCourseType;
            return matchesText && matchesStatus && matchesType;
        });
        result = [...result].sort((a, b) => {
            if (sortBy === 'title')  { const cmp = courseTitle(a.courseId).localeCompare(courseTitle(b.courseId)); return sortDir === 'asc' ? cmp : -cmp; }
            if (sortBy === 'status') { const cmp = (a.status||'').localeCompare(b.status||''); return sortDir === 'asc' ? cmp : -cmp; }
            if (sortBy === 'date')   { return sortDir === 'asc' ? new Date(a.createdAt)-new Date(b.createdAt) : new Date(b.createdAt)-new Date(a.createdAt); }
            return 0;
        });
        return result;
    })();
    const getStatus = (s) => ({
        draft: "bg-secondary", active: "bg-success", completed: "bg-primary", archived: "bg-dark"
    }[s] || "bg-secondary");

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.courseId) { showInfo("Validation", "Select a course"); return; }
        setSaving(true);
        try {
            const res = await fetch(`${API}/sessions`, {
                method: "POST", headers: ah,
                body: JSON.stringify(form)
            });
            const json = await res.json();
            if (res.ok) {
                showInfo("Created", "Session created successfully.");
                setShowForm(false);
                setForm({ courseId: "", courseType: "HOSTED", coTutors: [], restrictionIgnored: false });
                fetchAll();
            } else { showInfo("Error", json.message || "Failed to create session"); }
        } catch (e) { showInfo("Error", "Network error"); }
        setSaving(false);
    };

    const handleArchive = (session) => {
        showConfirm("Archive Session", `Archive session for "${courseTitle(session.courseId)}"?`, async () => {
            try {
                const res = await fetch(`${API}/sessions/${session._id}`, { method: "DELETE", headers: ah });
                if (res.ok) fetchAll();
                else { const d = await res.json(); showInfo("Error", d.message); }
            } catch (e) { showInfo("Error", "Network error"); }
        }, true);
    };

    if (loading) return (
        <><Navbar data={data} onLogout={onLogout} />
        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
            <div className="spinner-border text-primary" />
        </div></>
    );

    return (
        <>
            <Navbar data={data} onLogout={onLogout} />
            <div className="flex-grow-1 p-3 p-md-4" style={{ minWidth: 0 }}>

                {/* Header */}
                <div className="row mb-4">
                    <div className="col-12 d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div>
                            <h1 className="h3 fw-bold mb-1">My Sessions</h1>
                            <p className="text-muted small mb-0">Tutor-led course sessions</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowForm(p => !p)}>
                            {showForm ? "Cancel" : "+ New Session"}
                        </button>
                    </div>
                </div>

                {/* Create form */}
                {showForm && (
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-white fw-semibold">Create Session</div>
                        <div className="card-body">
                            <form onSubmit={handleCreate}>
                                <div className="row g-3">
                                    <div className="col-12 col-md-5">
                                        <label className="form-label fw-semibold">Course <span className="text-danger">*</span></label>
                                        <select className="form-select" value={form.courseId}
                                            onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
                                            <option value="">Select a course…</option>
                                            {courses.map(c => (
                                                <option key={c._id} value={c._id}>
                                                    {courseTitle(c)} — {c.level} ({c.courseType || 'SELF_TAUGHT'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-12 col-md-3">
                                        <label className="form-label fw-semibold">Session Type</label>
                                        <select className="form-select" value={form.courseType}
                                            onChange={e => setForm(p => ({ ...p, courseType: e.target.value }))}>
                                            <option value="HOSTED">HOSTED — no purchase needed</option>
                                            <option value="MENTORED">MENTORED — must own course</option>
                                            <option value="SELF_TAUGHT">SELF_TAUGHT — no session features</option>
                                        </select>
                                    </div>
                                    <div className="col-12 col-md-2">
                                        <label className="form-label fw-semibold">Override Rank Check</label>
                                        <div className="form-check mt-2">
                                            <input className="form-check-input" type="checkbox"
                                                id="restrictionIgnored"
                                                checked={form.restrictionIgnored}
                                                onChange={e => setForm(p => ({ ...p, restrictionIgnored: e.target.checked }))} />
                                            <label className="form-check-label small" htmlFor="restrictionIgnored">
                                                Ignore level rank requirement
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col-12 d-flex justify-content-end">
                                        <button type="submit" className="btn btn-primary" disabled={saving}>
                                            {saving ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</> : "Create Session"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Session list */}
                {sessions.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <i className="bi bi-people display-4 d-block mb-3"></i>
                        <p>No sessions yet. Create your first session above.</p>
                    </div>
                ) : (
                    <>
                        <div className="d-flex gap-2 flex-wrap mb-3 align-items-center">
                            <input type="text" className="form-control form-control-sm" style={{maxWidth:200}}
                                placeholder="Search by title or tutor…"
                                value={searchText} onChange={e => setSearchText(e.target.value)} />
                            <select className="form-select form-select-sm" style={{maxWidth:140}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="">All statuses</option>
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="archived">Archived</option>
                            </select>
                            <select className="form-select form-select-sm" style={{maxWidth:150}} value={filterCourseType} onChange={e => setFilterCourseType(e.target.value)}>
                                <option value="">All types</option>
                                <option value="HOSTED">Hosted</option>
                                <option value="MENTORED">Mentored</option>
                                <option value="SELF_TAUGHT">Self-Taught</option>
                            </select>
                            <div className="input-group input-group-sm" style={{maxWidth:190}}>
                                <select className="form-select form-select-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                    <option value="date">Date</option>
                                    <option value="title">Title</option>
                                    <option value="status">Status</option>
                                </select>
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => setSortDir(d => d==='asc'?'desc':'asc')}>{sortDir==='asc'?'↑':'↓'}</button>
                            </div>
                            <small className="text-muted">{filteredSessions.length} / {sessions.length}</small>
                        </div>
                        <div className="row g-3">
                            {filteredSessions.map(sess => {
                                const course = sess.courseId;
                                const isHost = String(sess.hostTutor?._id || sess.hostTutor) === String(data._id);
                                return (
                                    <div key={sess._id} className="col-12 col-md-6 col-xl-4">
                                        <div className="card border-0 shadow-sm h-100">
                                            <div className="card-body">
                                                <div className="d-flex align-items-start justify-content-between mb-2">
                                                    <h5 className="fw-bold mb-0 text-truncate" style={{ maxWidth: 220 }}>
                                                        {courseTitle(course)}
                                                    </h5>
                                                    <span className={`badge ${getStatus(sess.status)} ms-2 flex-shrink-0`}>
                                                        {sess.status}
                                                    </span>
                                                </div>
                                                <div className="text-muted small mb-3">
                                                    <div><i className="bi bi-layers me-1"></i>{course?.level} · {sess.courseType}</div>
                                                    <div><i className="bi bi-person-fill me-1"></i>
                                                        Host: {sess.hostTutor?.nickname || "you"}
                                                        {isHost && <span className="badge bg-primary ms-1">you</span>}
                                                    </div>
                                                    {sess.coTutors?.length > 0 && (
                                                        <div><i className="bi bi-people me-1"></i>
                                                            {sess.coTutors.length} co-tutor{sess.coTutors.length > 1 ? "s" : ""}
                                                        </div>
                                                    )}
                                                    {sess.schedule?.length > 0 && (
                                                        <div><i className="bi bi-calendar-event me-1"></i>
                                                            {sess.schedule.length} scheduled session{sess.schedule.length > 1 ? "s" : ""}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-sm btn-primary flex-grow-1"
                                                        onClick={() => navigate(`/manage/session/${sess._id}`)}>
                                                        <i className="bi bi-gear me-1"></i>Manage
                                                    </button>
                                                    {isHost && sess.status !== "archived" && (
                                                        <button className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleArchive(sess)} title="Archive session">
                                                            <i className="bi bi-archive"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            <UtilityModal show={modal.show} type={modal.type} title={modal.title} message={modal.message}
                danger={modal.danger}
                onConfirm={() => { modal.onConfirm?.(); closeModal(); }}
                onCancel={modal.onCancel || closeModal} onClose={modal.onClose || closeModal} />
        </>
    );
}

export default Sessions;
