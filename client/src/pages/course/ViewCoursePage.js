import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { SettingsContext } from '../../contexts/SettingsContext';
import AuthImage from '../../components/AuthImage';
import { UtilityModal } from '../../components/UtilityModal';
import PaymentModal from '../../components/PaymentModal';
import { getUser } from '../../utils/auth';
import config from '../../config/config';
import './ViewCoursePage.css';

const API_URL = config.API_URL;
const BASE_URL = API_URL.replace('/api', '');

// ── Helpers ────────────────────────────────────────────────────────────────────
const isContainer = (e) => !e?.type || e.type === 'container' || e.type === 'none';
const TYPE_ICON = { container:'bi-folder', image:'bi-image', video:'bi-camera-video', audio:'bi-music-note', document:'bi-file-pdf', archive:'bi-file-zip', text:'bi-file-text', form:'bi-ui-checks', other:'bi-file-earmark' };
const TYPE_COLOR = { image:'#16a34a', video:'#2563eb', audio:'#d97706', document:'#dc2626', archive:'#6b7280', text:'#0891b2', form:'#7c3aed' };
const typeIcon = (t) => TYPE_ICON[t] || 'bi-file-earmark';
const typeColor = (t) => TYPE_COLOR[t] || '#6b7280';

const extractYouTubeId = url => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] || null;
};

function parseTextSyntax(text) {
  if (!text) return '';
  const codeBlocks = [];
  let html = text.replace(/~\(([^)]+)\)\[([\s\S]+?)\]~/g, (_, lang, code) => {
    const esc = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    const idx = codeBlocks.length;
    codeBlocks.push(`<div class="vc-code-block"><div class="vc-code-header"><span class="vc-code-lang">${lang}</span><button class="vc-code-copy" onclick="(function(b){navigator.clipboard.writeText(b.closest('.vc-code-block').querySelector('code').innerText);b.textContent='Copied!';setTimeout(()=>b.textContent='Copy',2000)})(this)">Copy</button></div><pre><code>${esc}</code></pre></div>`);
    return `\x00CODE${idx}\x00`;
  });
  html = html.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>');
  html = html.replace(/`\(([^`]+)\)`/g,'<code class="vc-inline-code">$1</code>').replace(/~~(.+?)~~/g,'<del>$1</del>');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/^---+$/gm,'<hr>').replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>');
  html = html.replace(/\{(https?:\/\/[^}]+)\}/g,'<video src="$1" class="vc-video-player" controls></video>');
  html = html.replace(/\((https?:\/\/[^)]+)\)/g, (_, u) => {
    const id = extractYouTubeId(u);
    const src = id ? `https://www.youtube.com/embed/${id}` : u;
    return `<iframe src="${src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  });
  html = html.replace(/^(\d+)\.\s(.+)$/gm,'<li class="numbered-item">$2</li>').replace(/(<li class="numbered-item">.*?<\/li>\n?)+/gs,'<ol>$&</ol>');
  html = html.replace(/^[•\-\*]\s(.+)$/gm,'<li>$1</li>').replace(/(<li>.*?<\/li>\n?)+/gs,'<ul>$&</ul>');
  html = html.replace(/\\n/g,'<br>');
  html = html.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeBlocks[+i]);
  return html;
}

// ── Main Component ─────────────────────────────────────────────────────────────
function ViewCoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useContext(SettingsContext);
  const currentUser = getUser();
  const token = localStorage.getItem('token');
  const authHeader = token ? `Bearer ${token}` : '';

  const sessionId = new URLSearchParams(location.search).get('session');

  const [course, setCourse] = useState(null);
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(true);
  const [selected, setSelected] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openVolumes, setOpenVolumes] = useState({});
  const [openChapters, setOpenChapters] = useState({});
  const [courseFinished, setCourseFinished] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [session, setSession] = useState(null);
  const [sessionGroup, setSessionGroup] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentPosting, setCommentPosting] = useState(false);
  const [myRating, setMyRating] = useState(null);
  const [avgRating, setAvgRating] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [ratingHover, setRatingHover] = useState(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [modal, setModal] = useState({ show: false });
  const closeModal = () => setModal(p => ({ ...p, show: false }));
  const showInfo = (title, message) => setModal({ show: true, type: 'info', title, message, onClose: closeModal });
  const showConfirm = (title, message, onConfirm) => setModal({ show: true, type: 'confirm', title, message, onConfirm, onCancel: closeModal });

  const resolveVolumes = (d) => (d?.volumes || []).map(v => ({ ...v, type: v.type || 'container', chapters: (v.chapters || []).map(c => ({ ...c, type: c.type || 'container' })) }));

  useEffect(() => { fetchData(); fetchComments(); fetchRating(); if (sessionId) fetchSession(); }, [id, sessionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [courseRes] = await Promise.all([
        fetch(`${API_URL}/courses/${id}`, { headers: { Authorization: authHeader } })
      ]);
      if (courseRes.ok) {
        const { data: d } = await courseRes.json();
        if (d) {
          setCourse(d);
          const vols = resolveVolumes(d);
          setVolumes(vols);
          if (vols.length) {
            setOpenVolumes({ [vols[0].vid]: true });
            if (vols[0].chapters?.length) setOpenChapters({ [vols[0].chapters[0].cid]: true });
          }
          await checkAccess(d);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const checkAccess = async (fetchedCourse) => {
    if (!currentUser) { setLocked(true); return; }
    const isAdmin = ['admin', 'root', 'manage', 'create'].includes(currentUser.role);
    if (isAdmin) { setLocked(false); return; }
    try {
      const res = await fetch(`${API_URL}/users/c`, { headers: { Authorization: authHeader, 'Content-Type': 'application/json' } });
      if (res.ok) {
        const { user } = await res.json();
        const has = (user.courses || []).some(c => (c._id || c) === id);
        setLocked(!has);
        if (has) {
          const entry = user.courses.find(c => (c._id || c) === id);
          if ((entry?.process || 0) >= 1) setCourseFinished(true);
        }
      }
    } catch { setLocked(true); }
  };

  const fetchSession = async () => {
    if (!sessionId || !token) return;
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}`, { headers: { Authorization: authHeader } });
      if (res.ok) { const { data } = await res.json(); setSession(data); }
      const grpRes = await fetch(`${API_URL}/groups?sessionId=${sessionId}`, { headers: { Authorization: authHeader } });
      if (grpRes.ok) {
        const { data: groups } = await grpRes.json();
        const myGroup = (groups || []).find(g => g.members?.some(m => String(m.userId?._id || m.userId) === String(currentUser?._id)));
        if (myGroup) setSessionGroup(myGroup);
      }
    } catch (e) { console.error(e); }
  };

  const fetchComments = async () => {
    try {
      const r = await fetch(`${API_URL}/courses/${id}/comments`);
      if (r.ok) { const j = await r.json(); setComments(j.data || []); }
    } catch {}
  };

  const fetchRating = async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_URL}/courses/${id}/rating`, { headers: { Authorization: authHeader } });
      if (r.ok) { const j = await r.json(); setAvgRating(j.data?.avgRating || 0); setTotalVotes(j.data?.totalVotes || 0); setMyRating(j.data?.myRating || null); }
    } catch {}
  };

  const handleRate = async (value) => {
    if (locked || ratingSubmitting) return;
    setRatingSubmitting(true);
    try {
      const r = await fetch(`${API_URL}/courses/${id}/rating`, { method: 'POST', headers: { Authorization: authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify({ value }) });
      if (r.ok) { const j = await r.json(); setMyRating(j.data.myRating); setAvgRating(j.data.avgRating); setTotalVotes(j.data.totalVotes); }
    } catch {}
    setRatingSubmitting(false);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setCommentPosting(true);
    try {
      const r = await fetch(`${API_URL}/courses/${id}/comments`, { method: 'POST', headers: { Authorization: authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: commentText.trim() }) });
      if (r.ok) { const j = await r.json(); setComments(p => [...p, j.data]); setCommentText(''); }
    } catch {}
    setCommentPosting(false);
  };

  const handleDeleteComment = (commentId) => {
    showConfirm('Delete Comment', 'Delete this comment?', async () => {
      const r = await fetch(`${API_URL}/courses/${id}/comments/${commentId}`, { method: 'DELETE', headers: { Authorization: authHeader } });
      if (r.ok) setComments(p => p.filter(c => c._id !== commentId));
    });
  };

  const handleFinishCourse = async () => {
    setSelected(null);
    if (courseFinished || !token) return;
    try {
      const r = await fetch(`${API_URL}/users/me/courses/${id}/finish`, { method: 'PATCH', headers: { Authorization: authHeader, 'Content-Type': 'application/json' } });
      if (r.ok) { setCourseFinished(true); showInfo('Course Completed!', 'Congratulations! You have finished this course.'); }
    } catch {}
  };

  // Flatten for prev/next
  const flatItems = [];
  volumes.forEach((vol, vi) => {
    if (isContainer(vol)) {
      vol.chapters.forEach((ch, ci) => {
        if (isContainer(ch)) { ch.items.forEach((item, ii) => flatItems.push({ vi, ci, ii })); }
        else flatItems.push({ vi, ci, ii: null });
      });
    } else { flatItems.push({ vi, ci: null, ii: null }); }
  });

  const currentFlatIdx = selected != null ? flatItems.findIndex(f => f.vi === selected.vi && f.ci === selected.ci && f.ii === selected.ii) : -1;

  const goTo = (idx) => {
    if (idx < 0 || idx >= flatItems.length) return;
    const { vi, ci, ii } = flatItems[idx];
    setSelected({ vi, ci, ii });
    if (vi != null) setOpenVolumes(p => ({ ...p, [volumes[vi]?.vid]: true }));
    if (ci != null) setOpenChapters(p => ({ ...p, [volumes[vi]?.chapters[ci]?.cid]: true }));
    if (!locked && flatItems.length > 0) {
      const progress = Math.min(1, (idx + 1) / flatItems.length);
      fetch(`${API_URL}/users/me/courses/${id}/progress`, { method: 'PATCH', headers: { Authorization: authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify({ process: progress }) })
        .then(r => { if (r.ok && progress >= 1) setCourseFinished(true); }).catch(() => {});
    }
  };

  const courseTitle = course?.trans?.[0]?.title || course?.title || '';
  const courseDesc = course?.trans?.[0]?.description || course?.description || '';
  const thumbnail = course?.links?.find(l => l.description?.toLowerCase() === 'course thumbnail');
  const thumbSrc = thumbnail ? `${BASE_URL}${thumbnail.url}` : null;

  if (loading) return (
    <div className="vc-root" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="vc-loading"><div className="vc-spinner" /><p>Loading course…</p></div>
    </div>
  );

  if (!course) return (
    <div className="vc-root" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="vc-error"><i className="bi bi-exclamation-circle" /><p>Course not found.</p><button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>← Go back</button></div>
    </div>
  );

  return (
    <div className={`vc-root${sidebarOpen ? '' : ' vc-root--collapsed'}`}>
      {/* ── Sidebar ── */}
      <aside className="vc-sidebar">
        <div className="vc-sidebar-header">
          <span className="vc-sidebar-title" title={courseTitle}>{courseTitle}</span>
          <button className="vc-sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} title="Toggle sidebar">
            <i className={`bi bi-layout-sidebar${sidebarOpen ? '' : '-reverse'}`} />
          </button>
        </div>
        <nav className="vc-nav">
          {volumes.length === 0 && <p className="vc-nav-empty">No content yet.</p>}
          {volumes.map((vol, vi) => isContainer(vol) ? (
            <div key={vol.vid} className="vc-nav-volume">
              <button className="vc-nav-volume-btn" onClick={() => setOpenVolumes(p => ({ ...p, [vol.vid]: !p[vol.vid] }))} aria-expanded={!!openVolumes[vol.vid]}>
                <i className={`bi bi-chevron-${openVolumes[vol.vid] ? 'down' : 'right'} vc-chevron`} />
                <i className="bi bi-folder vc-folder-icon" />
                <span className="vc-nav-label">{vol.title}</span>
                {!openVolumes[vol.vid] && <span className="vc-nav-count">{vol.chapters.length}</span>}
              </button>
              {openVolumes[vol.vid] && (
                <div className="vc-nav-chapters">
                  {vol.chapters.map((ch, ci) => isContainer(ch) ? (
                    <div key={ch.cid} className="vc-nav-chapter">
                      <button className="vc-nav-chapter-btn" onClick={() => setOpenChapters(p => ({ ...p, [ch.cid]: !p[ch.cid] }))} aria-expanded={!!openChapters[ch.cid]}>
                        <i className={`bi bi-chevron-${openChapters[ch.cid] ? 'down' : 'right'} vc-chevron`} />
                        <span className="vc-nav-label">{ch.title}</span>
                        {!openChapters[ch.cid] && <span className="vc-nav-count">{ch.items.length}</span>}
                      </button>
                      {openChapters[ch.cid] && (
                        <div className="vc-nav-items">
                          {ch.items.map((item, ii) => {
                            const isSel = selected?.vi === vi && selected?.ci === ci && selected?.ii === ii;
                            return (
                              <button key={item.iid} className={`vc-nav-item-btn${isSel ? ' vc-nav-item-btn--active' : ''}${locked ? ' vc-nav-item-btn--locked' : ''}`}
                                onClick={() => { if (locked) return; const idx = flatItems.findIndex(f => f.vi === vi && f.ci === ci && f.ii === ii); idx >= 0 ? goTo(idx) : setSelected({ vi, ci, ii }); }}>
                                <i className={`bi ${typeIcon(item.type)} vc-item-icon`} style={{ color: isSel ? '#fff' : typeColor(item.type) }} />
                                <span className="vc-nav-label">{item.title}</span>
                                {locked && <i className="bi bi-lock-fill vc-lock-icon" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button key={ch.cid} className={`vc-nav-entity-btn${selected?.vi === vi && selected?.ci === ci && selected?.ii === null ? ' vc-nav-item-btn--active' : ''}${locked ? ' vc-nav-item-btn--locked' : ''}`}
                      onClick={() => !locked && setSelected({ vi, ci, ii: null })}>
                      <i className={`bi ${typeIcon(ch.type)} vc-item-icon`} style={{ color: typeColor(ch.type) }} />
                      <span className="vc-nav-label">{ch.title}</span>
                      {locked && <i className="bi bi-lock-fill vc-lock-icon" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button key={vol.vid} className={`vc-nav-volume-entity-btn${selected?.vi === vi && selected?.ci === null ? ' vc-nav-item-btn--active' : ''}${locked ? ' vc-nav-item-btn--locked' : ''}`}
              onClick={() => !locked && setSelected({ vi, ci: null, ii: null })}>
              <i className={`bi ${typeIcon(vol.type)} vc-item-icon`} style={{ color: typeColor(vol.type) }} />
              <span className="vc-nav-label">{vol.title}</span>
              {locked && <i className="bi bi-lock-fill vc-lock-icon" />}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="vc-main">
        {!sidebarOpen && <button className="vc-sidebar-reopen" onClick={() => setSidebarOpen(true)} title="Open sidebar"><i className="bi bi-layout-sidebar" /></button>}

        {selected == null ? (
          <div className="vc-welcome">
            <div className="vc-welcome-inner">
              {thumbSrc ? <img src={thumbSrc} alt={courseTitle} className="vc-thumb vc-thumb--wide" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 12, marginBottom: '1.5rem' }} /> : <div className="vc-welcome-icon"><i className="bi bi-book-open" /></div>}
              <h1 className="vc-welcome-title">{courseTitle}</h1>
              {courseDesc && <p className="vc-welcome-desc">{courseDesc}</p>}
              <div className="vc-welcome-meta">
                {course.direction && <span className="vc-badge">{course.direction}</span>}
                {course.level && <span className="vc-badge vc-badge--secondary">{course.level}</span>}
                {session && <span className="vc-badge vc-badge--session"><i className="bi bi-people-fill me-1" />Session: {session.hostTutor?.nickname || 'Tutor'}</span>}
              </div>
              {locked ? (
                <div className="vc-locked-notice">
                  <i className="bi bi-lock-fill" />
                  <span>Purchase this course to access the content.</span>
                  <button className="btn btn-primary btn-sm mt-2" onClick={() => setShowPayment(true)}>
                    {course.price > 0 ? `Buy for $${course.price}` : 'Enrol for free'}
                  </button>
                </div>
              ) : flatItems.length > 0 && (
                <div className="d-flex gap-2 flex-wrap align-items-center">
                  {courseFinished ? (
                    <button className="btn btn-success" disabled><i className="bi bi-check-circle-fill me-1" />Completed!</button>
                  ) : (
                    <button className="vc-start-btn" onClick={() => goTo(0)}>Start Learning <i className="bi bi-arrow-right ms-1" /></button>
                  )}
                </div>
              )}
            </div>

            {/* Right: rating + comments */}
            <div className="vc-welcome-right">
              {!locked && (
                <div className="vc-rate-section">
                  <div className="vc-rate-avg">
                    <span className="vc-rate-num">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
                    <div className="vc-rate-stars-display">{[1,2,3,4,5].map(n => <i key={n} className={`bi ${avgRating >= n ? 'bi-star-fill' : avgRating >= n - 0.5 ? 'bi-star-half' : 'bi-star'} vc-star-display`} />)}</div>
                    <span className="vc-rate-count">({totalVotes} ratings)</span>
                  </div>
                  <div className="vc-rate-row">
                    <span className="vc-rate-label">{myRating ? 'Your rating:' : 'Rate this course:'}</span>
                    <div className="vc-stars-interactive">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} className={`vc-star-btn${(ratingHover || myRating) >= n ? ' active' : ''}`}
                          onMouseEnter={() => setRatingHover(n)} onMouseLeave={() => setRatingHover(null)}
                          onClick={() => handleRate(n)} disabled={ratingSubmitting}>
                          <i className={`bi ${(ratingHover || myRating) >= n ? 'bi-star-fill' : 'bi-star'}`} />
                        </button>
                      ))}
                    </div>
                    {myRating && <span className="vc-rated-badge"><i className="bi bi-check-circle-fill me-1" />Rated</span>}
                  </div>
                </div>
              )}

              <div className="vc-comments">
                <h3 className="vc-comments-title"><i className="bi bi-chat-left-text me-2" />Comments {comments.length > 0 && <span className="vc-comments-count">{comments.length}</span>}</h3>
                {!locked && (
                  <div className="vc-comment-compose">
                    <textarea className="vc-comment-textarea" rows={3} placeholder="Write a comment…" value={commentText} onChange={e => setCommentText(e.target.value)} maxLength={4000} />
                    <div className="vc-compose-footer">
                      <span className="vc-char-count">{commentText.length} / 4000</span>
                      <button className="vc-btn-primary vc-compose-submit" onClick={handleAddComment} disabled={!commentText.trim() || commentPosting}>
                        {commentPosting ? <><span className="vc-spinner-sm" /> Posting…</> : <><i className="bi bi-send me-1" />Post</>}
                      </button>
                    </div>
                  </div>
                )}
                {comments.length === 0 ? <p className="vc-comments-empty">No comments yet{locked ? '.' : ' — be the first!'}</p> : (
                  <div className="vc-comment-list">
                    {comments.map(comment => (
                      <div key={comment._id} className="vc-comment">
                        <div className="vc-comment-header">
                          <span className="vc-comment-author"><i className="bi bi-person-circle me-1" />{comment.nickname}</span>
                          <span className="vc-comment-date">{new Date(comment.date).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' })}</span>
                          {currentUser && (String(currentUser._id) === String(comment.userId) || ['admin','root'].includes(currentUser.role)) && (
                            <button className="vc-comment-delete" onClick={() => handleDeleteComment(comment._id)} title="Delete"><i className="bi bi-trash" /></button>
                          )}
                        </div>
                        <div className="vc-comment-body vc-text-body" dangerouslySetInnerHTML={{ __html: parseTextSyntax(comment.text) }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <ContentPanel
            key={`${selected.vi}-${selected.ci}-${selected.ii}`}
            selected={selected} volumes={volumes} locked={locked}
            hasPrev={currentFlatIdx > 0} hasNext={currentFlatIdx < flatItems.length - 1}
            onPrev={() => goTo(currentFlatIdx - 1)} onNext={() => goTo(currentFlatIdx + 1)}
            finish={handleFinishCourse} sessionId={sessionId} sessionGroup={sessionGroup} studentId={currentUser?._id}
          />
        )}
      </main>

      <UtilityModal show={modal.show} type={modal.type} title={modal.title} message={modal.message}
        onConfirm={() => { modal.onConfirm?.(); closeModal(); }} onCancel={modal.onCancel || closeModal} onClose={closeModal} />
      {showPayment && course && (
        <PaymentModal course={course} onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); setLocked(false); fetchData(); }} />
      )}
    </div>
  );
}

// ── Content Panel ──────────────────────────────────────────────────────────────
function ContentPanel({ selected, volumes, locked, hasPrev, hasNext, onPrev, onNext, finish, sessionId, sessionGroup, studentId }) {
  const { vi, ci, ii } = selected;
  const vol = volumes[vi]; const ch = ci != null ? vol?.chapters[ci] : null;
  const item = ii != null ? ch?.items[ii] : (ci != null ? ch : vol);
  if (!item) return <div className="vc-pane-error"><i className="bi bi-exclamation-triangle" /><p>Item not found.</p></div>;
  const breadcrumb = [vol?.title, ch?.title, ii != null ? item.title : null].filter(Boolean);
  return (
    <div className="vc-pane">
      <nav className="vc-breadcrumb">{breadcrumb.map((crumb, i) => <span key={i} className="vc-breadcrumb-item">{i > 0 && <i className="bi bi-chevron-right vc-bc-sep" />}<span className={i === breadcrumb.length - 1 ? 'vc-bc-current' : 'vc-bc-ancestor'}>{crumb}</span></span>)}</nav>
      <h1 className="vc-content-title"><i className={`bi ${typeIcon(item.type)} vc-title-icon`} style={{ color: typeColor(item.type) }} />{item.title}</h1>
      <div className="vc-content-body">
        {locked ? (
          <div className="vc-locked-pane"><i className="bi bi-lock-fill" /><h3>Content Locked</h3><p>Purchase this course to access all lessons.</p></div>
        ) : (
          <ItemRenderer item={item} sessionId={sessionId} sessionGroup={sessionGroup} studentId={studentId} />
        )}
      </div>
      <div className="vc-pane-nav">
        <button className="vc-pane-nav-btn" onClick={onPrev} disabled={!hasPrev}><i className="bi bi-arrow-left" /> Previous</button>
        {!hasNext ? <button className="btn btn-success" onClick={finish}>Finish <i className="bi bi-flag-fill ms-1" /></button>
          : <button className="vc-pane-nav-btn vc-pane-nav-btn--next" onClick={onNext} disabled={!hasNext}>Next <i className="bi bi-arrow-right" /></button>}
      </div>
    </div>
  );
}

// ── Item Renderer ──────────────────────────────────────────────────────────────
function ItemRenderer({ item, sessionId, sessionGroup, studentId }) {
  const token = localStorage.getItem('token');
  const { type, url } = item;
  if (type === 'text') return <TextViewer url={url} />;
  if (type === 'video') return <VideoViewer url={url} />;
  if (type === 'image') return <ImageViewer url={url} title={item.title} />;
  if (type === 'audio') return <AudioViewer url={url} title={item.title} />;
  if (type === 'document') return <DocumentViewer url={url} title={item.title} />;
  if (type === 'archive') return <ArchiveViewer url={url} title={item.title} />;
  return <div className="vc-unknown"><i className="bi bi-file-earmark" /><p>Unsupported type: <code>{type}</code></p>{url && <a href={url} target="_blank" rel="noopener noreferrer" className="vc-btn-ghost">Open file</a>}</div>;
}

function TextViewer({ url }) {
  const [html, setHtml] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const BASE_URL = config.API_URL.replace('/api', '');
  useEffect(() => {
    if (!url) { setLoading(false); return; }
    setLoading(true);
    (async () => {
      try {
        const full = url.startsWith('http') ? url : `${BASE_URL}${url}`;
        const r = await fetch(`${full}?_=${Date.now()}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
        if (r.ok) setHtml(parseTextSyntax(await r.text())); else setError('Could not load content.');
      } catch (e) { setError('Network error'); }
      setLoading(false);
    })();
  }, [url]);
  if (loading) return <div className="vc-skeleton"><div className="vc-sk-line vc-sk-line--full" /><div className="vc-sk-line vc-sk-line--80" /></div>;
  if (error) return <div className="vc-fetch-error"><i className="bi bi-exclamation-triangle" /> {error}</div>;
  return <div className="vc-text-body" dangerouslySetInnerHTML={{ __html: html }} />;
}

function VideoViewer({ url }) {
  if (!url) return <p className="vc-empty-note">No video URL set.</p>;
  const ytId = extractYouTubeId(url);
  if (ytId) return <div className="vc-video-wrap"><iframe src={`https://www.youtube.com/embed/${ytId}`} title="Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="vc-video-player" /></div>;
  return <div className="vc-video-wrap"><video src={url} controls className="vc-video-player" /></div>;
}

function ImageViewer({ url, title }) {
  if (!url) return <p className="vc-empty-note">No image URL.</p>;
  return <div className="vc-image-wrap"><img src={url} alt={title || 'Image'} className="vc-image" /></div>;
}

function AudioViewer({ url, title }) {
  if (!url) return <p className="vc-empty-note">No audio URL.</p>;
  return <div className="vc-audio-wrap"><div className="vc-audio-card"><i className="bi bi-music-note-beamed vc-audio-icon" /><p className="vc-audio-label">{title}</p><audio src={url} controls className="vc-audio-player" /></div></div>;
}

function DocumentViewer({ url, title }) {
  if (!url) return <p className="vc-empty-note">No document URL.</p>;
  return <div className="vc-doc-wrap"><div className="vc-doc-card"><i className="bi bi-file-pdf vc-doc-icon" /><p className="vc-doc-name">{title || url.split('/').pop()}</p><a href={url} target="_blank" rel="noopener noreferrer" className="vc-btn-primary"><i className="bi bi-box-arrow-up-right me-1" />Open Document</a></div></div>;
}

function ArchiveViewer({ url, title }) {
  if (!url) return <p className="vc-empty-note">No archive URL.</p>;
  return <div className="vc-doc-wrap"><div className="vc-doc-card"><i className="bi bi-file-zip vc-doc-icon" style={{ color:'#6b7280' }} /><p className="vc-doc-name">{title || url.split('/').pop()}</p><a href={url} download className="vc-btn-primary"><i className="bi bi-download me-1" />Download Archive</a></div></div>;
}

export default ViewCoursePage;