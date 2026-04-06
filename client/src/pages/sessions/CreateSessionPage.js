import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UtilityModal } from '../../components/UtilityModal';
import { getUser } from '../../utils/auth';
import config from '../../config/config';

const API_URL = config.API_URL;

function CreateSessionPage() {
  const navigate = useNavigate();
  const { theme } = useContext(SettingsContext);
  const token = localStorage.getItem('token');
  const ah = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ courseId: '', courseType: 'HOSTED', restrictionIgnored: false });
  const [modal, setModal] = useState({ show: false });
  const closeModal = () => setModal(p => ({ ...p, show: false }));
  const showInfo = (title, message) => setModal({ show: true, type: 'info', title, message, onClose: closeModal });
  const showConfirm = (title, message, onConfirm, danger = false) => setModal({ show: true, type: 'confirm', danger, title, message, onConfirm, onCancel: closeModal });

  useEffect(() => {
    const user = getUser();
    if (!user) { navigate('/login'); return; }
    const isTutor = ['create', 'manage', 'admin', 'root'].includes(user.role) || user.isTeacher;
    if (!isTutor) { navigate('/'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sr, cr] = await Promise.all([
        fetch(`${API_URL}/sessions/my`, { headers: ah }),
        fetch(`${API_URL}/courses?mine=true`, { headers: ah }),
      ]);
      if (sr.ok) { const d = await sr.json(); setSessions(d.data || []); }
      if (cr.ok) { const d = await cr.json(); setCourses(d.data || []); }
      // Fallback: get all courses if mine=true not supported
      if (!cr.ok) {
        const allRes = await fetch(`${API_URL}/courses`, { headers: ah });
        if (allRes.ok) { const d = await allRes.json(); setCourses(d.data || []); }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.courseId) { showInfo('Validation', 'Please select a course.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/sessions`, { method: 'POST', headers: ah, body: JSON.stringify(form) });
      const json = await res.json();
      if (res.ok) {
        showInfo('Created', 'Session created successfully!');
        setShowForm(false);
        setForm({ courseId: '', courseType: 'HOSTED', restrictionIgnored: false });
        fetchAll();
      } else showInfo('Error', json.message || 'Failed to create session');
    } catch { showInfo('Error', 'Network error'); }
    setSaving(false);
  };

  const handleArchive = (sess) => {
    const title = sess.courseId?.trans?.[0]?.title || sess.courseId?.title || 'session';
    showConfirm('Archive Session', `Archive "${title}"? It won't be deleted.`, async () => {
      const res = await fetch(`${API_URL}/sessions/${sess._id}`, { method: 'DELETE', headers: ah });
      if (res.ok) fetchAll(); else { const d = await res.json(); showInfo('Error', d.message); }
    }, true);
  };

  const courseTitle = (c) => c?.trans?.[0]?.title || c?.title || '(untitled)';
  const statusColors = { draft: 'secondary', active: 'success', completed: 'primary', archived: 'dark' };

  const stats = { total: sessions.length, active: sessions.filter(s => s.status === 'active').length, draft: sessions.filter(s => s.status === 'draft').length, completed: sessions.filter(s => s.status === 'completed').length };

  if (loading) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center"><div className="spinner-border text-primary mb-3" /><p className="text-muted">Loading…</p></div>
    </div>
  );

  return (
    <div className="min-vh-100 py-4 page-bg">
      <div className="container">
        {/* Header */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1">My Sessions</h2>
            <p className="text-muted mb-0">Manage your tutor-led course sessions</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(p => !p)}>
            <i className={`bi ${showForm ? 'bi-x' : 'bi-plus-lg'} me-1`} />{showForm ? 'Cancel' : 'New Session'}
          </button>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          {[{ label:'Total',value:stats.total,icon:'bi-layers',color:'#3b5bdb' },{ label:'Active',value:stats.active,icon:'bi-broadcast',color:'#2f9e44' },{ label:'Draft',value:stats.draft,icon:'bi-pencil-square',color:'#868e96' },{ label:'Completed',value:stats.completed,icon:'bi-check-circle',color:'#0891b2' }].map(s => (
            <div key={s.label} className="col-6 col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '.68rem', letterSpacing: '.05em' }}>{s.label}</small>
                    <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: '1.1rem', opacity: .8 }} />
                  </div>
                  <div className="fw-bold" style={{ fontSize: '1.6rem', color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent fw-semibold"><i className="bi bi-plus-circle me-2" />Create New Session</div>
            <div className="card-body">
              <form onSubmit={handleCreate}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Course <span className="text-danger">*</span></label>
                    <select className="form-select" value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
                      <option value="">Select a course…</option>
                      {courses.map(c => <option key={c._id} value={c._id}>{courseTitle(c)} — {c.level}</option>)}
                    </select>
                    {!courses.length && <small className="text-muted">No courses found. <button type="button" className="btn btn-link btn-sm p-0" onClick={() => navigate('/add-course')}>Create one first</button></small>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Session Type</label>
                    <select className="form-select" value={form.courseType} onChange={e => setForm(p => ({ ...p, courseType: e.target.value }))}>
                      <option value="HOSTED">HOSTED — no purchase required</option>
                      <option value="MENTORED">MENTORED — students must own course</option>
                      <option value="SELF_TAUGHT">SELF_TAUGHT — no session features</option>
                    </select>
                    <small className="text-muted">
                      {form.courseType === 'HOSTED' ? 'Students get free access via group membership.' : form.courseType === 'MENTORED' ? 'Students need to purchase the course first.' : 'Standard course without session features.'}
                    </small>
                  </div>
                  <div className="col-md-6 d-flex align-items-center">
                    <div className="form-check mt-3">
                      <input type="checkbox" id="ri" className="form-check-input" checked={form.restrictionIgnored} onChange={e => setForm(p => ({ ...p, restrictionIgnored: e.target.checked }))} />
                      <label htmlFor="ri" className="form-check-label small">Override rank restriction</label>
                    </div>
                  </div>
                  <div className="col-12 d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</> : <><i className="bi bi-check2 me-1" />Create Session</>}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sessions list */}
        {sessions.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-people fs-1 mb-3 d-block" style={{ opacity: .3 }} />
            <h5>No sessions yet</h5>
            <p>Create your first session to start teaching!</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>Create Session</button>
          </div>
        ) : (
          <div className="row g-3">
            {sessions.map(sess => {
              const user = getUser();
              const isHost = String(sess.hostTutor?._id || sess.hostTutor) === String(user?._id);
              return (
                <div key={sess._id} className="col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
                    <div className="card-body">
                      <div className="d-flex align-items-start justify-content-between mb-2">
                        <h6 className="fw-bold mb-0 me-2" style={{ lineHeight: 1.3 }}>{courseTitle(sess.courseId)}</h6>
                        <span className={`badge bg-${statusColors[sess.status] || 'secondary'} flex-shrink-0`}>{sess.status}</span>
                      </div>
                      <div className="d-flex flex-wrap gap-1 mb-3">
                        <span className="badge bg-light text-dark border" style={{ fontSize: '.68rem' }}>{sess.courseType}</span>
                        {sess.courseId?.level && <span className="badge bg-light text-dark border" style={{ fontSize: '.68rem' }}>{sess.courseId.level}</span>}
                        {isHost && <span className="badge bg-primary" style={{ fontSize: '.68rem' }}>Host</span>}
                      </div>
                      <div className="mb-3" style={{ fontSize: '.82rem', color: 'var(--bs-secondary-color)' }}>
                        {sess.coTutors?.length > 0 && <div><i className="bi bi-people me-1" />{sess.coTutors.length} co-tutor{sess.coTutors.length > 1 ? 's' : ''}</div>}
                        {sess.schedule?.length > 0 && <div><i className="bi bi-calendar-event me-1" />{sess.schedule.length} scheduled</div>}
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-primary btn-sm flex-grow-1" onClick={() => navigate(`/manage/session/${sess._id}`)}>
                          <i className="bi bi-arrow-right-circle me-1" />Manage
                        </button>
                        {isHost && sess.status !== 'archived' && (
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleArchive(sess)} title="Archive">
                            <i className="bi bi-archive" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <UtilityModal show={modal.show} type={modal.type} title={modal.title} message={modal.message}
        danger={modal.danger} onConfirm={() => { modal.onConfirm?.(); closeModal(); }}
        onCancel={modal.onCancel || closeModal} onClose={modal.onClose || closeModal} />
    </div>
  );
}

export default CreateSessionPage;