import { Navbar } from "../components/Navbar";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { formatLaunchTime, formatUptime, getTimeAgo } from "../utils/utils";

// ── Mini sparkline bar (pure SVG, no deps) ────────────────────────────────────
function Sparkbar({ value, max, color = '#0d6efd' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ height: 4, borderRadius: 2, background: '#e9ecef', overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .4s ease' }} />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color = '#0d6efd', sparkValue, sparkMax, onClick }) {
  return (
    <div
      className={`card border-0 shadow-sm h-100${onClick ? ' cursor-pointer' : ''}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div className="card-body p-3">
        <div className="d-flex align-items-start justify-content-between mb-1">
          <h6 className="text-muted mb-0 small text-uppercase fw-semibold" style={{ letterSpacing: '.04em' }}>
            {label}
          </h6>
          <span style={{ fontSize: 20, color, opacity: .8 }}>{icon}</span>
        </div>
        <h3 className="fw-bold mb-0" style={{ color }}>
          {value === undefined || value === null ? <span className="text-secondary">—</span> : value}
        </h3>
        {sub && <small className="text-muted">{sub}</small>}
        {sparkMax !== undefined && (
          <Sparkbar value={sparkValue || 0} max={sparkMax} color={color} />
        )}
      </div>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ ok, label }) {
  return (
    <span className={`badge rounded-pill px-3 py-2 ${ok ? 'bg-success' : 'bg-danger'}`}>
      {ok ? '● ' : '○ '}{label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function Main({ data, onLogout }) {
  const navigate = useNavigate();

  const [serverStatus, setServerStatus] = useState({
    status: 'ok', db_status: 'ok', uptime: 0, launchTime: undefined,
  });
  const [stats, setStats] = useState({
    totalUsers: null, totalCourses: null,
    sessionCount: null, activeSessionCount: null,
    groupCount: null, assignmentCount: null,
    pendingSubmissionCount: null,
    upcomingMeetings: []
  });
  const [sseState, setSseState] = useState('connecting');
  const esRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const url = `${process.env.REACT_APP_API_URL}/utils/status/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;
    es.onopen = () => setSseState('open');
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        setServerStatus(p => ({
          ...p,
          status:    d.status    ?? p.status,
          db_status: d.db_status ?? p.db_status,
          uptime:    d.uptime    ?? p.uptime,
          launchTime: d.launchTime ?? p.launchTime,
        }));
        setStats(p => ({
          totalUsers:            d.userCount            ?? p.totalUsers,
          totalCourses:          d.courseCount          ?? p.totalCourses,
          sessionCount:          d.sessionCount         ?? p.sessionCount,
          activeSessionCount:    d.activeSessionCount   ?? p.activeSessionCount,
          groupCount:            d.groupCount           ?? p.groupCount,
          assignmentCount:       d.assignmentCount      ?? p.assignmentCount,
          pendingSubmissionCount: d.pendingSubmissionCount ?? p.pendingSubmissionCount,
          upcomingMeetings:      d.upcomingMeetings     ?? p.upcomingMeetings,
        }));
      } catch (err) { console.error('SSE parse error:', err); }
    };
    es.onerror = () => {
      setSseState('closed');
      setServerStatus(p => ({ ...p, status: 'fixing' }));
    };
    return () => { es.close(); setSseState('closed'); };
  }, []);

  const serverOk = serverStatus.status === 'ok';
  const dbOk     = serverOk && serverStatus.db_status === 'connected';

  return (
    <>
      <Navbar data={data} onLogout={onLogout} />

      <div className="flex-grow-1 p-3 p-md-4" style={{ minWidth: 0 }}>

        {/* ── Header ── */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="h3 fw-bold mb-0">Dashboard</h1>
            <small className="text-muted">Live · Updates every 5 s</small>
          </div>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <StatusPill ok={serverOk} label={serverOk ? 'Server OK' : 'Server unreachable'} />
            <StatusPill ok={dbOk}     label={dbOk     ? 'DB connected' : 'DB offline'} />
            {sseState === 'open' && <span className="badge bg-success">● Live</span>}
            {sseState === 'connecting' && <span className="badge bg-warning text-dark">Connecting…</span>}
            {sseState === 'closed' && <span className="badge bg-danger">Reconnecting…</span>}
          </div>
        </div>

        {/* ── Row 1: server vitals ── */}
        <div className="row g-3 mb-3">
          <div className="col-6 col-lg-3">
            <StatCard
              label="Uptime"
              value={serverOk ? formatUptime(serverStatus.uptime) : '—'}
              sub={serverOk ? '✓ Stable' : '⚠ Unreachable'}
              icon="🕐"
              color={serverOk ? '#198754' : '#dc3545'}
            />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard
              label="Last Restart"
              value={serverStatus.launchTime ? getTimeAgo(serverStatus.launchTime) : '—'}
              sub={serverStatus.launchTime ? formatLaunchTime(serverStatus.launchTime) : ''}
              icon="🔄"
              color="#6c757d"
            />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard
              label="Total Users"
              value={stats.totalUsers}
              sub="Registered accounts"
              icon="👤"
              color="#0d6efd"
              sparkValue={stats.totalUsers}
              sparkMax={Math.max(stats.totalUsers || 0, 100)}
              onClick={() => navigate('/manage/users')}
            />
          </div>
          <div className="col-6 col-lg-3">
            <StatCard
              label="Total Courses"
              value={stats.totalCourses}
              sub="All course types"
              icon="📚"
              color="#6610f2"
              sparkValue={stats.totalCourses}
              sparkMax={Math.max(stats.totalCourses || 0, 50)}
              onClick={() => navigate('/manage/courses')}
            />
          </div>
        </div>

        {/* ── Row 2: tutor/session stats ── */}
        <div className="row g-3 mb-3">
          <div className="col-6 col-md-3">
            <StatCard
              label="Sessions"
              value={stats.sessionCount}
              sub={`${stats.activeSessionCount ?? '—'} active`}
              icon="🎓"
              color="#0dcaf0"
              sparkValue={stats.activeSessionCount}
              sparkMax={Math.max(stats.sessionCount || 0, 1)}
              onClick={() => navigate('/manage/sessions')}
            />
          </div>
          <div className="col-6 col-md-3">
            <StatCard
              label="Groups"
              value={stats.groupCount}
              sub="Across all sessions"
              icon="👥"
              color="#fd7e14"
              sparkValue={stats.groupCount}
              sparkMax={Math.max(stats.groupCount || 0, 10)}
            />
          </div>
          <div className="col-6 col-md-3">
            <StatCard
              label="Assignments"
              value={stats.assignmentCount}
              sub="Defined tasks"
              icon="📋"
              color="#20c997"
            />
          </div>
          <div className="col-6 col-md-3">
            <StatCard
              label="Pending Reviews"
              value={stats.pendingSubmissionCount}
              sub="Submissions awaiting grade"
              icon="⏳"
              color={stats.pendingSubmissionCount > 0 ? '#dc3545' : '#198754'}
              sparkValue={stats.pendingSubmissionCount}
              sparkMax={Math.max(stats.pendingSubmissionCount || 0, 10)}
            />
          </div>
        </div>

        {/* ── Row 3: upcoming meetings + system info ── */}
        <div className="row g-3">

          {/* Upcoming meetings */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom d-flex align-items-center justify-content-between py-3">
                <h6 className="mb-0 fw-semibold">📅 Upcoming Meetings <span className="text-muted fw-normal small">(next 7 days)</span></h6>
                <button className="btn btn-sm btn-outline-primary" onClick={() => navigate('/manage/sessions')}>
                  All Sessions
                </button>
              </div>
              <div className="card-body p-0">
                {!stats.upcomingMeetings?.length ? (
                  <div className="text-center text-muted py-4 small">
                    <span style={{ fontSize: 28 }}>📭</span>
                    <p className="mb-0 mt-2">No meetings in the next 7 days</p>
                  </div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {stats.upcomingMeetings.map((m, i) => {
                      const d     = new Date(m.datetime);
                      const isToday = d.toDateString() === new Date().toDateString();
                      return (
                        <li key={i} className="list-group-item px-3 py-2">
                          <div className="d-flex align-items-start gap-3">
                            <div className="text-center flex-shrink-0"
                              style={{ minWidth: 44, background: isToday ? '#0d6efd' : '#f8f9fa',
                                color: isToday ? '#fff' : '#495057',
                                borderRadius: 8, padding: '4px 6px', lineHeight: 1.2 }}>
                              <div style={{ fontSize: 11, fontWeight: 700 }}>
                                {d.toLocaleDateString('en', { month: 'short' }).toUpperCase()}
                              </div>
                              <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>
                                {d.getDate()}
                              </div>
                            </div>
                            <div className="flex-grow-1 overflow-hidden">
                              <div className="fw-semibold text-truncate" style={{ fontSize: '.9rem' }}>{m.title}</div>
                              <small className="text-muted">{m.courseTitle}</small>
                            </div>
                            <div className="text-end flex-shrink-0">
                              <div className="small fw-semibold">
                                {d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <small className="text-muted">{m.durationMin} min</small>
                            </div>
                          </div>
                          {m.meetingLink && (
                            <a href={m.meetingLink} target="_blank" rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-success mt-1 w-100" style={{ fontSize: '.75rem' }}>
                              <i className="bi bi-camera-video me-1"></i>Join Meeting
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* System info */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-semibold">🖥 System Information</h6>
              </div>
              <div className="card-body">
                <table className="table table-sm table-borderless mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted" width="45%"><strong>Server</strong></td>
                      <td>
                        <StatusPill ok={serverOk} label={serverOk ? 'Online' : 'Unreachable'} />
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>Database</strong></td>
                      <td>
                        <StatusPill ok={dbOk} label={
                          dbOk ? 'Connected' :
                          serverStatus.db_status === 'reconnecting' ? 'Reconnecting' : 'Disconnected'
                        } />
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>Uptime</strong></td>
                      <td>{serverOk ? formatUptime(serverStatus.uptime) : '—'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>Last restart</strong></td>
                      <td>
                        {serverStatus.launchTime
                          ? <>{formatLaunchTime(serverStatus.launchTime)} <small className="text-muted">({getTimeAgo(serverStatus.launchTime)})</small></>
                          : '—'
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted"><strong>Live feed</strong></td>
                      <td>
                        {sseState === 'open'
                          ? <span className="text-success small">● Connected</span>
                          : <span className="text-warning small">○ {sseState}</span>
                        }
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Quick nav */}
                <hr className="my-3" />
                <p className="text-muted small fw-semibold mb-2">Quick links</p>
                <div className="d-flex flex-wrap gap-2">
                  {[
                    { label: 'Users',    path: '/manage/users',    icon: '👤' },
                    { label: 'Courses',  path: '/manage/courses',  icon: '📚' },
                    { label: 'Sessions', path: '/manage/sessions', icon: '🎓' },
                    { label: 'Keys',     path: '/manage/keys',     icon: '🔑' },
                    { label: 'Promos',   path: '/manage/promos',   icon: '🏷' },
                    { label: 'Settings', path: '/manage/settings', icon: '⚙️' },
                  ].map(l => (
                    <button key={l.path} className="btn btn-sm btn-outline-secondary"
                      onClick={() => navigate(l.path)}>
                      {l.icon} {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default Main;
