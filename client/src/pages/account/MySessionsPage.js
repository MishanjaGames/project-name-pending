import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsContext } from '../../contexts/SettingsContext';
import { getUser } from '../../utils/auth';
import config from '../../config/config';

const API_URL = config.API_URL;
const BASE_URL = API_URL.replace('/api', '');

function MySessionsPage() {
  const navigate = useNavigate();
  const { theme } = useContext(SettingsContext);
  const token = localStorage.getItem('token');
  const ah = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [sessions, setSessions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!getUser()) { navigate('/login'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const grpRes = await fetch(`${API_URL}/groups/my`, { headers: { Authorization: `Bearer ${token}` } });
      if (grpRes.ok) {
        const { data: grpData } = await grpRes.json();
        setGroups(grpData || []);
        const sessIds = [...new Set((grpData || []).map(g => g.sessionId).filter(Boolean))];
        const sessData = await Promise.all(sessIds.map(async sid => {
          try {
            const r = await fetch(`${API_URL}/sessions/${sid}`, { headers: { Authorization: `Bearer ${token}` } });
            return r.ok ? (await r.json()).data : null;
          } catch { return null; }
        }));
        setSessions(sessData.filter(Boolean));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filtered = sessions.filter(s => {
    const title = s.courseId?.trans?.[0]?.title || s.courseId?.title || '';
    if (search && !title.toLowerCase().includes(search.toLowerCase()) && !(s.hostTutor?.nickname || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    return true;
  });

  const getMyGroup = (sessId) => groups.find(g => String(g.sessionId) === String(sessId));

  const statusBadge = (status) => {
    const map = { active: 'bg-success', draft: 'bg-secondary', completed: 'bg-primary', archived: 'bg-dark' };
    return map[status] || 'bg-secondary';
  };

  if (loading) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center"><div className="spinner-border text-primary mb-3" /><p className="text-muted">Loading sessions…</p></div>
    </div>
  );

  return (
    <div className="min-vh-100 py-4 page-bg">
      <div className="container">
        <div className="mb-4">
          <h2 className="fw-bold mb-1">My Sessions</h2>
          <p className="text-muted mb-0">Sessions you are enrolled in as a student</p>
        </div>

        {/* Filters */}
        <div className="card border-0 shadow-sm p-3 mb-4">
          <div className="d-flex gap-3 flex-wrap align-items-center">
            <input className="form-control" style={{ maxWidth: 280 }} placeholder="Search by course or tutor…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className="d-flex gap-2 flex-wrap">
              {[['','All'],['active','Active'],['draft','Draft'],['completed','Completed'],['archived','Archived']].map(([val, label]) => (
                <button key={val} className={`btn btn-sm ${filterStatus === val ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setFilterStatus(val)}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-people fs-1 mb-3 d-block" style={{ opacity: .3 }} />
            {sessions.length === 0
              ? <><h5>No sessions yet</h5><p>You haven't been added to any sessions by a tutor.</p></>
              : <><h5>No sessions match your filter</h5><button className="btn btn-outline-secondary btn-sm mt-2" onClick={() => { setFilterStatus(''); setSearch(''); }}>Clear filters</button></>
            }
          </div>
        )}

        <div className="row g-3">
          {filtered.map(s => {
            const myGroup = getMyGroup(s._id);
            const courseTitle = s.courseId?.trans?.[0]?.title || s.courseId?.title || '(untitled)';
            const thumb = s.courseId?.links?.find(l => l.description?.toLowerCase() === 'course thumbnail');
            const thumbSrc = thumb ? `${BASE_URL}${thumb.url}` : null;
            const now = new Date();
            const upcoming = (s.schedule || []).filter(e => new Date(e.datetime) > now).sort((a, b) => new Date(a.datetime) - new Date(b.datetime))[0];
            const past = (s.schedule || []).filter(e => new Date(e.datetime) <= now).length;

            return (
              <div key={s._id} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12, overflow: 'hidden' }}>
                  {thumbSrc && <img src={thumbSrc} alt={courseTitle} style={{ height: 120, objectFit: 'cover', width: '100%' }} />}
                  <div className="card-body">
                    <div className="d-flex align-items-start justify-content-between mb-2">
                      <h6 className="fw-bold mb-0" style={{ lineHeight: 1.3 }}>{courseTitle}</h6>
                      <span className={`badge ${statusBadge(s.status)} ms-2 flex-shrink-0`}>{s.status}</span>
                    </div>

                    <div className="d-flex flex-wrap gap-1 mb-3">
                      <span className="badge bg-light text-dark border" style={{ fontSize: '.68rem' }}>{s.courseType}</span>
                      {s.courseId?.level && <span className="badge bg-light text-dark border" style={{ fontSize: '.68rem' }}>{s.courseId.level}</span>}
                      {myGroup && <span className="badge bg-info text-dark" style={{ fontSize: '.68rem' }}><i className="bi bi-people me-1" />{myGroup.name}</span>}
                    </div>

                    <div className="mb-3" style={{ fontSize: '.82rem', color: 'var(--bs-secondary-color)' }}>
                      <div className="mb-1"><i className="bi bi-person-fill me-1" />Tutor: <strong>{s.hostTutor?.nickname || '—'}</strong></div>
                      {s.coTutors?.length > 0 && <div className="mb-1"><i className="bi bi-people me-1" />{s.coTutors.length} co-tutor{s.coTutors.length > 1 ? 's' : ''}</div>}
                      <div className="mb-1"><i className="bi bi-calendar-event me-1" />{s.schedule?.length || 0} classes scheduled ({past} past)</div>
                      {upcoming && (
                        <div className="p-2 rounded mt-2" style={{ background: 'var(--bs-primary-bg-subtle)', border: '1px solid var(--bs-primary-border-subtle)' }}>
                          <div className="fw-semibold small text-primary"><i className="bi bi-clock me-1" />Next class</div>
                          <div className="small">{new Date(upcoming.datetime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                          {upcoming.title && <div className="small text-muted">{upcoming.title}</div>}
                        </div>
                      )}
                    </div>

                    <button className="btn btn-primary btn-sm w-100"
                      onClick={() => navigate(`/learn/${s.courseId?._id || s.courseId}?session=${s._id}`)}>
                      <i className="bi bi-arrow-right-circle me-1" />Go to Course
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MySessionsPage;