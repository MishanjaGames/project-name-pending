import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UtilityModal } from '../../components/UtilityModal';
import { getUser } from '../../utils/auth';
import config from '../../config/config';

const API_URL = config.API_URL;
const MARK_SCALES = ['5', '12', '100', 'custom'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Schedule Calendar ──────────────────────────────────────────────────────────
function ScheduleCalendar({ schedule = [], onRemove, canEdit }) {
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [view, setView] = useState('month');
  const today = new Date();

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    let d, isOther = false;
    if (i < firstDay) { d = new Date(calYear, calMonth - 1, daysInPrev - firstDay + i + 1); isOther = true; }
    else if (i < firstDay + daysInMonth) d = new Date(calYear, calMonth, i - firstDay + 1);
    else { d = new Date(calYear, calMonth + 1, i - firstDay - daysInMonth + 1); isOther = true; }
    const dayEvents = schedule.filter(e => new Date(e.datetime).toDateString() === d.toDateString());
    cells.push({ date: d, isOther, dayEvents });
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); }}>‹</button>
          <span className="fw-bold" style={{ minWidth: 160, textAlign: 'center' }}>{MONTHS[calMonth]} {calYear}</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); }}>›</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => { setCalMonth(today.getMonth()); setCalYear(today.getFullYear()); }}>Today</button>
        </div>
        <div className="d-flex gap-2">
          <button className={`btn btn-sm ${view==='month'?'btn-primary':'btn-outline-secondary'}`} onClick={() => setView('month')}><i className="bi bi-grid-3x3-gap me-1"/>Month</button>
          <button className={`btn btn-sm ${view==='list'?'btn-primary':'btn-outline-secondary'}`} onClick={() => setView('list')}><i className="bi bi-list-ul me-1"/>List</button>
        </div>
      </div>

      {view === 'month' && (
        <div className="card border-0 shadow-sm overflow-hidden">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'var(--bs-tertiary-bg)' }}>
            {DAYS.map(d => <div key={d} style={{ textAlign:'center', padding:'.4rem', fontSize:'.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em' }} className="text-muted">{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
            {cells.map((cell, i) => {
              const isToday = cell.date.toDateString() === today.toDateString();
              return (
                <div key={i} style={{ minHeight:80, padding:'.35rem', borderRight:(i+1)%7===0?'none':'1px solid var(--bs-border-color)', borderBottom:i>=totalCells-7?'none':'1px solid var(--bs-border-color)', opacity:cell.isOther?.4:1, background:isToday?'var(--bs-primary-bg-subtle)':'var(--bs-body-bg)' }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:isToday?'var(--bs-primary)':'transparent', color:isToday?'#fff':'var(--bs-secondary-color)', fontWeight:600, fontSize:'.78rem', marginBottom:2 }}>{cell.date.getDate()}</div>
                  {cell.dayEvents.slice(0,3).map((ev, j) => (
                    <div key={j} title={ev.title} style={{ fontSize:'.6rem', padding:'1px 4px', borderRadius:3, marginBottom:1, background:'#2563eb', color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {new Date(ev.datetime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} {ev.title}
                    </div>
                  ))}
                  {cell.dayEvents.length > 3 && <div style={{ fontSize:'.6rem', color:'var(--bs-secondary-color)', paddingLeft:4 }}>+{cell.dayEvents.length-3} more</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'list' && (
        <div>
          {schedule.length === 0 ? <p className="text-muted">No schedule entries.</p> : schedule.map((s, i) => {
            const dt = new Date(s.datetime); const isPast = dt < today;
            return (
              <div key={i} className="card border-0 shadow-sm mb-2" style={{ opacity:isPast?.7:1 }}>
                <div className="card-body py-2 px-3 d-flex align-items-center gap-3">
                  <div style={{ textAlign:'center', borderRight:'1px solid var(--bs-border-color)', paddingRight:12, minWidth:48 }}>
                    <div className="fw-bold" style={{ fontSize:'1.2rem', color:isPast?'var(--bs-secondary-color)':'var(--bs-primary)', lineHeight:1 }}>{dt.getDate()}</div>
                    <div style={{ fontSize:'.62rem', color:'var(--bs-secondary-color)' }}>{dt.toLocaleString('en',{month:'short'})} {dt.getFullYear()}</div>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="fw-semibold small">{s.title}</span>
                      {isPast && <span className="badge bg-secondary" style={{fontSize:'.6rem'}}>Past</span>}
                      {s.isRecurring && <span className="badge bg-info text-dark" style={{fontSize:'.6rem'}}><i className="bi bi-arrow-repeat me-1"/>Recurring</span>}
                    </div>
                    <div style={{ fontSize:'.75rem', color:'var(--bs-secondary-color)' }}>{dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} · {s.durationMin} min{s.notes&&<> · <em>{s.notes}</em></>}</div>
                  </div>
                  {canEdit && <button className="btn btn-sm btn-outline-danger" onClick={() => onRemove(i)}><i className="bi bi-trash"/></button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Session Chat ───────────────────────────────────────────────────────────────
function SessionChat({ sessionId }) {
  const token = localStorage.getItem('token');
  const ah = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const currentUser = getUser();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/sessions/${sessionId}/chat`, { headers: ah });
      if (r.ok) { const d = await r.json(); setMessages(d.data || []); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 50); }
    } catch {}
  }, [sessionId]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 4000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`${API_URL}/sessions/${sessionId}/chat`, { method:'POST', headers:ah, body:JSON.stringify({ text:text.trim() }) });
      setText(''); fetchMessages();
    } catch {}
    setSending(false);
  };

  return (
    <div className="card border-0 shadow-sm" style={{ height:440, display:'flex', flexDirection:'column' }}>
      <div className="card-header bg-transparent fw-semibold"><i className="bi bi-chat-dots me-2 text-primary"/>Session Chat</div>
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:6 }}>
        {messages.length === 0 && <div className="text-center text-muted py-4" style={{ fontSize:'.85rem' }}>No messages yet. Start the conversation!</div>}
        {messages.map(msg => {
          const isMine = (msg.sender?._id || msg.sender) === currentUser?._id;
          return (
            <div key={msg._id} style={{ display:'flex', flexDirection:isMine?'row-reverse':'row', alignItems:'flex-end', gap:8 }}>
              <div style={{ maxWidth:'65%' }}>
                {!isMine && <div style={{ fontSize:'.7rem', color:'var(--bs-secondary-color)', marginBottom:2, marginLeft:4 }}>{msg.sender?.nickname||'Unknown'}</div>}
                <div style={{ background:isMine?'#2563eb':'var(--bs-tertiary-bg)', color:isMine?'#fff':'var(--bs-body-color)', borderRadius:isMine?'12px 12px 4px 12px':'12px 12px 12px 4px', padding:'7px 12px', fontSize:'.85rem', wordBreak:'break-word' }}>{msg.text}</div>
                <div style={{ fontSize:'.68rem', color:'var(--bs-secondary-color)', marginTop:2, textAlign:isMine?'right':'left', paddingLeft:4, paddingRight:4 }}>{new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>
      <form onSubmit={sendMessage} style={{ padding:'10px 12px', borderTop:'1px solid var(--bs-border-color)', display:'flex', gap:8 }}>
        <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); sendMessage(e); } }} placeholder="Type a message…" rows={1} className="form-control" style={{ resize:'none', fontSize:'.88rem', maxHeight:80, overflowY:'auto' }}/>
        <button type="submit" className="btn btn-primary" disabled={!text.trim()||sending} style={{ paddingLeft:12, paddingRight:12 }}>
          {sending?<span className="spinner-border spinner-border-sm"/>:<i className="bi bi-send-fill"/>}
        </button>
      </form>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
function ManageSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  useContext(SettingsContext);
  const token = localStorage.getItem('token');
  const ah = { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' };
  const mh = { Authorization:`Bearer ${token}` };
  const currentUser = getUser();

  const [session, setSession] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [saving, setSaving] = useState(false);

  // Schedule
  const [scheduleForm, setScheduleForm] = useState({ title:'', datetime:'', durationMin:60, notes:'', isRecurring:false, recurrence:{ frequency:'weekly', endDate:'', maxOccurrences:'' } });
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Groups
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [addingMember, setAddingMember] = useState(false);
  const [editingGroupTitle, setEditingGroupTitle] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');

  // Assignments
  const [assignments, setAssignments] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState({ title:'', description:'', dueAt:'', markScale:'5', maxMark:'5', groupIds:[], files:[] });
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [submissions, setSubmissions] = useState({});
  const [gradingId, setGradingId] = useState(null);
  const [gradeForm, setGradeForm] = useState({ mark:'', feedback:'', status:'approved' });

  // Co-tutors
  const [coTutorSearch, setCoTutorSearch] = useState('');
  const [coTutorResults, setCoTutorResults] = useState([]);

  // Private copy
  const [creatingCopy, setCreatingCopy] = useState(false);

  // Modal
  const [modal, setModal] = useState({ show:false });
  const closeModal = () => setModal(p => ({ ...p, show:false }));
  const showInfo = (title, message) => setModal({ show:true, type:'info', title, message, onClose:closeModal });
  const showConfirm = (title, message, onConfirm, danger=false) => setModal({ show:true, type:'confirm', danger, title, message, onConfirm, onCancel:closeModal });

  const fetchSession = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/sessions/${id}`, { headers:ah });
      if (r.ok) { const d = await r.json(); setSession(d.data); }
      else if (r.status === 403) { showInfo('Access Denied','You are not a tutor in this session.'); navigate(-1); }
    } catch(e) { console.error(e); }
  }, [id]);

  const fetchGroups = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/groups?sessionId=${id}`, { headers:ah });
      if (r.ok) { const d = await r.json(); setGroups(d.data||[]); }
    } catch(e) { console.error(e); }
  }, [id]);

  const fetchAllAssignments = useCallback(async () => {
    if (!groups.length) return;
    try {
      const results = await Promise.all(groups.map(g => fetch(`${API_URL}/assignments?groupId=${g._id}`, { headers:ah }).then(r => r.ok?r.json():{data:[]})));
      const all = results.flatMap(r => r.data||[]);
      const seen = new Set();
      setAssignments(all.filter(a => { if (seen.has(a._id)) return false; seen.add(a._id); return true; }));
    } catch(e) { console.error(e); }
  }, [groups]);

  useEffect(() => {
    const load = async () => { setLoading(true); await Promise.all([fetchSession(), fetchGroups()]); setLoading(false); };
    load();
  }, [id]);

  useEffect(() => { if (tab==='assignments'&&groups.length) fetchAllAssignments(); }, [tab, groups]);

  useEffect(() => {
    if (memberSearch.trim().length < 2) { setMemberResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${API_URL}/users?search=${encodeURIComponent(memberSearch.trim())}`, { headers:ah });
        if (r.ok) { const d = await r.json(); setMemberResults(d.data||[]); }
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [memberSearch]);

  useEffect(() => {
    if (coTutorSearch.trim().length < 2) { setCoTutorResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${API_URL}/users?search=${encodeURIComponent(coTutorSearch.trim())}&tutorOnly=true`, { headers:ah });
        if (r.ok) { const d = await r.json(); setCoTutorResults(d.data||[]); }
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [coTutorSearch]);

  const courseTitle = (c) => c?.trans?.[0]?.title||c?.title||'(untitled)';
  const isHost = session && String(session.hostTutor?._id||session.hostTutor) === String(currentUser?._id);
  const myCoEntry = session?.coTutors?.find(ct => String(ct.userId?._id||ct.userId) === String(currentUser?._id));
  const canEditSession = isHost || myCoEntry?.canSchedule;
  const canGrade = isHost || myCoEntry?.canGrade;

  const updateStatus = async (status) => {
    setSaving(true);
    const r = await fetch(`${API_URL}/sessions/${id}`, { method:'PATCH', headers:ah, body:JSON.stringify({ status }) });
    if (r.ok) fetchSession(); else { const d = await r.json(); showInfo('Error', d.message); }
    setSaving(false);
  };

  const addScheduleEntry = async (e) => {
    e.preventDefault();
    if (!scheduleForm.title||!scheduleForm.datetime) { showInfo('Validation','Title and date/time required'); return; }
    setSavingSchedule(true);
    const entry = { title:scheduleForm.title, datetime:scheduleForm.datetime, durationMin:+scheduleForm.durationMin, notes:scheduleForm.notes, isRecurring:scheduleForm.isRecurring };
    if (scheduleForm.isRecurring) entry.recurrence = { frequency:scheduleForm.recurrence.frequency, endDate:scheduleForm.recurrence.endDate||null, maxOccurrences:scheduleForm.recurrence.maxOccurrences?+scheduleForm.recurrence.maxOccurrences:null };
    const newSchedule = [...(session.schedule||[]), entry];
    const r = await fetch(`${API_URL}/sessions/${id}`, { method:'PATCH', headers:ah, body:JSON.stringify({ schedule:newSchedule }) });
    if (r.ok) { fetchSession(); setScheduleForm({ title:'', datetime:'', durationMin:60, notes:'', isRecurring:false, recurrence:{ frequency:'weekly', endDate:'', maxOccurrences:'' } }); }
    else { const d = await r.json(); showInfo('Error', d.message); }
    setSavingSchedule(false);
  };

  const removeScheduleEntry = async (idx) => {
    const newSchedule = session.schedule.filter((_,i) => i!==idx);
    const r = await fetch(`${API_URL}/sessions/${id}`, { method:'PATCH', headers:ah, body:JSON.stringify({ schedule:newSchedule }) });
    if (r.ok) fetchSession();
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const r = await fetch(`${API_URL}/groups`, { method:'POST', headers:ah, body:JSON.stringify({ sessionId:id, name:newGroupName.trim() }) });
    if (r.ok) { setNewGroupName(''); fetchGroups(); } else { const d = await r.json(); showInfo('Error', d.message); }
  };

  const renameGroup = async (groupId) => {
    if (!editGroupName.trim()) return;
    const r = await fetch(`${API_URL}/groups/${groupId}`, { method:'PATCH', headers:ah, body:JSON.stringify({ name:editGroupName.trim() }) });
    if (r.ok) { setEditingGroupTitle(null); fetchGroups(); } else { const d = await r.json(); showInfo('Error', d.message); }
  };

  const deleteGroup = (g) => showConfirm('Delete Group',`Delete "${g.name}"? All assignment records will be lost.`, async () => {
    const r = await fetch(`${API_URL}/groups/${g._id}`, { method:'DELETE', headers:ah });
    if (r.ok) { fetchGroups(); if (selectedGroup?._id===g._id) setSelectedGroup(null); } else { const d = await r.json(); showInfo('Error', d.message); }
  }, true);

  const addMember = async (groupId, emailOrNickname) => {
    const query = emailOrNickname||memberSearch.trim();
    if (!query) return;
    setAddingMember(true);
    const r = await fetch(`${API_URL}/groups/${groupId}/members`, { method:'POST', headers:ah, body:JSON.stringify({ emailOrNickname:query }) });
    const d = await r.json();
    if (r.ok) { showInfo('Added',`${d.data?.nickname||query} added.`); setMemberSearch(''); setMemberResults([]); fetchGroups(); }
    else showInfo('Error', d.message);
    setAddingMember(false);
  };

  const removeMember = (groupId, userId, nickname) => showConfirm('Remove Member',`Remove ${nickname}?`, async () => {
    const r = await fetch(`${API_URL}/groups/${groupId}/members/${userId}`, { method:'DELETE', headers:ah });
    if (r.ok) fetchGroups(); else { const d = await r.json(); showInfo('Error', d.message); }
  }, true);

  const createAssignment = async (e) => {
    e.preventDefault();
    const groupIds = assignmentForm.groupIds.length ? assignmentForm.groupIds : (selectedGroup?[selectedGroup._id]:[]);
    if (!groupIds.length) { showInfo('Validation','Select at least one group'); return; }
    if (!assignmentForm.title||!assignmentForm.dueAt||!assignmentForm.maxMark) { showInfo('Validation','Title, due date, and max mark required'); return; }
    setSavingAssignment(true);
    try {
      const courseId = session.privateCopyId||session.courseId?._id||session.courseId;
      for (const gId of groupIds) {
        const fd = new FormData();
        fd.append('sessionId',id); fd.append('groupId',gId); fd.append('courseId',courseId);
        fd.append('title',assignmentForm.title); fd.append('description',assignmentForm.description);
        fd.append('dueAt',assignmentForm.dueAt); fd.append('markScale',assignmentForm.markScale); fd.append('maxMark',assignmentForm.maxMark);
        (assignmentForm.files||[]).forEach(f => fd.append('taskFiles',f));
        await fetch(`${API_URL}/assignments`, { method:'POST', headers:mh, body:fd });
      }
      showInfo('Created',`Assignment created for ${groupIds.length} group(s).`);
      setAssignmentForm({ title:'', description:'', dueAt:'', markScale:'5', maxMark:'5', groupIds:[], files:[] });
      fetchAllAssignments();
    } catch { showInfo('Error','Network error'); }
    setSavingAssignment(false);
  };

  const loadSubmissions = async (groupId, assignmentId) => {
    try {
      const r = await fetch(`${API_URL}/submissions/${groupId}/${assignmentId}`, { headers:ah });
      if (r.ok) { const d = await r.json(); setSubmissions(p => ({ ...p, [assignmentId]:d.data||[] })); }
    } catch {}
  };

  const submitGrade = async (groupId, assignmentId, studentId) => {
    if (!gradeForm.mark||!gradeForm.status) { showInfo('Validation','Mark and status required'); return; }
    const r = await fetch(`${API_URL}/submissions/${groupId}/${assignmentId}/${studentId}/grade`, { method:'PATCH', headers:ah, body:JSON.stringify({ mark:+gradeForm.mark, feedback:gradeForm.feedback, status:gradeForm.status }) });
    const d = await r.json();
    if (r.ok) { showInfo('Graded',`Submission ${gradeForm.status}. Mark: ${d.data?.mark}`); setGradingId(null); loadSubmissions(groupId, assignmentId); }
    else showInfo('Error', d.message);
  };

  const addCoTutor = async (userId) => {
    const existing = session.coTutors||[];
    if (existing.some(ct => String(ct.userId?._id||ct.userId)===userId)) { showInfo('Info','Already a co-tutor'); return; }
    const newCoTutors = [...existing, { userId, canGrade:true, canSchedule:true, canEditCopy:false }];
    const r = await fetch(`${API_URL}/sessions/${id}`, { method:'PATCH', headers:ah, body:JSON.stringify({ coTutors:newCoTutors }) });
    if (r.ok) { fetchSession(); setCoTutorResults([]); setCoTutorSearch(''); }
  };

  const removeCoTutor = (userId) => showConfirm('Remove Co-tutor','Remove this co-tutor from the session?', async () => {
    const newCoTutors = session.coTutors.filter(ct => String(ct.userId?._id||ct.userId)!==String(userId));
    const r = await fetch(`${API_URL}/sessions/${id}`, { method:'PATCH', headers:ah, body:JSON.stringify({ coTutors:newCoTutors }) });
    if (r.ok) fetchSession();
  }, true);

  const toggleCoTutorPerm = async (userId, perm) => {
    const newCoTutors = session.coTutors.map(ct => String(ct.userId?._id||ct.userId)===String(userId)?{ ...ct, [perm]:!ct[perm] }:ct);
    const r = await fetch(`${API_URL}/sessions/${id}`, { method:'PATCH', headers:ah, body:JSON.stringify({ coTutors:newCoTutors }) });
    if (r.ok) fetchSession();
  };

  const handleCreatePrivateCopy = async () => {
    setCreatingCopy(true);
    const r = await fetch(`${API_URL}/sessions/${id}/private-copy`, { method:'POST', headers:ah });
    const d = await r.json();
    if (r.ok) { showInfo('Created',`Private copy created. ${d.message||''}`); fetchSession(); }
    else showInfo('Error', d.message);
    setCreatingCopy(false);
  };

  if (loading) return <div className="min-vh-100 d-flex align-items-center justify-content-center"><div className="spinner-border text-primary"/></div>;
  if (!session) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center"><i className="bi bi-exclamation-circle fs-1 text-muted mb-3 d-block"/><h5>Session not found</h5><button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>← Back</button></div>
    </div>
  );

  const course = session.courseId;
  const statusColors = { draft:'secondary', active:'success', completed:'primary', archived:'dark' };
  const isTutorOrManager = isHost||myCoEntry||['manage','admin','root'].includes(currentUser?.role);

  const TABS = [
    { key:'overview',    label:'Overview',     icon:'bi-info-circle',    show:true },
    { key:'schedule',    label:'Schedule',     icon:'bi-calendar-event', show:true },
    { key:'groups',      label:'Groups',       icon:'bi-people',         show:true },
    { key:'assignments', label:'Assignments',  icon:'bi-clipboard-check',show:isTutorOrManager },
    { key:'cotutors',    label:'Co-tutors',    icon:'bi-person-badge',   show:isHost },
  ].filter(t => t.show);

  return (
    <div className="min-vh-100 py-4 page-bg">
      <div className="container">

        {/* Header */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <button className="btn btn-outline-secondary btn-sm mb-2" onClick={() => navigate(-1)}>← Back</button>
            <h2 className="fw-bold mb-1">{courseTitle(course)}</h2>
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <span className={`badge bg-${statusColors[session.status]||'secondary'}`}>{session.status}</span>
              <span className="badge bg-light text-dark border">{session.courseType}</span>
              {session.privateCopyId && <span className="badge bg-warning text-dark">Private copy active</span>}
            </div>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {isHost && (
              <>
                {session.status==='draft' && <button className="btn btn-success btn-sm" disabled={saving} onClick={() => updateStatus('active')}><i className="bi bi-play-fill me-1"/>Start</button>}
                {session.status==='active' && <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => updateStatus('completed')}><i className="bi bi-check2-all me-1"/>Complete</button>}
                {!session.privateCopyId && <button className="btn btn-outline-warning btn-sm" disabled={creatingCopy} onClick={handleCreatePrivateCopy}>{creatingCopy?<span className="spinner-border spinner-border-sm me-1"/>:<i className="bi bi-files me-1"/>}Create Private Copy</button>}
              </>
            )}
            <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/learn/${course?._id||course}`)}>
              <i className="bi bi-eye me-1"/>View Course
            </button>
          </div>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          {TABS.map(t => (
            <li key={t.key} className="nav-item">
              <button className={`nav-link ${tab===t.key?'active':''}`} onClick={() => setTab(t.key)}>
                <i className={`bi ${t.icon} me-1`}/>{t.label}
              </button>
            </li>
          ))}
        </ul>

        {/* ══ OVERVIEW ══ */}
        {tab==='overview' && (
          <div>
            <div className="row g-3 mb-4">
              {[
                { label:'Groups',          value:groups.length,                                                                                                                         icon:'bi-people',          color:'#3b5bdb' },
                { label:'Active students', value:groups.reduce((s,g) => s+(g.members?.filter(m=>m.status==='active').length||0),0),                                                   icon:'bi-person-check',    color:'#2f9e44' },
                { label:'Schedule',        value:session.schedule?.length||0,                                                                                                          icon:'bi-calendar-event',  color:'#f08c00' },
                { label:'Assignments',     value:assignments.length,                                                                                                                   icon:'bi-clipboard-check', color:'#7048e8' },
                { label:'Co-tutors',       value:session.coTutors?.length||0,                                                                                                         icon:'bi-person-badge',    color:'#0891b2' },
              ].map(c => (
                <div key={c.label} className="col-6 col-md-4 col-lg-2">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <small className="text-muted text-uppercase fw-semibold" style={{ fontSize:'.68rem', letterSpacing:'.05em' }}>{c.label}</small>
                        <i className={`bi ${c.icon}`} style={{ color:c.color, fontSize:'1.1rem', opacity:.8 }}/>
                      </div>
                      <div className="fw-bold" style={{ fontSize:'1.6rem', color:c.color, lineHeight:1.1 }}>{c.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="row g-4">
              <div className="col-md-5">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-transparent fw-semibold"><i className="bi bi-info-circle me-2 text-primary"/>Session Info</div>
                  <div className="card-body p-0">
                    <table className="table table-sm table-borderless mb-0">
                      <tbody>
                        <tr><td className="text-muted ps-3">Course</td><td className="fw-semibold pe-3">{courseTitle(course)}</td></tr>
                        <tr><td className="text-muted ps-3">Level</td><td className="pe-3">{course?.level||'—'}</td></tr>
                        <tr><td className="text-muted ps-3">Type</td><td className="pe-3"><span className="badge bg-light text-dark border">{session.courseType}</span></td></tr>
                        <tr><td className="text-muted ps-3">Status</td><td className="pe-3"><span className={`badge bg-${statusColors[session.status]}`}>{session.status}</span></td></tr>
                        <tr><td className="text-muted ps-3">Host</td><td className="pe-3">{session.hostTutor?.nickname||'—'}</td></tr>
                        <tr><td className="text-muted ps-3">Private copy</td><td className="pe-3">{session.privateCopyId?<span className="text-success"><i className="bi bi-check-circle-fill me-1"/>Created</span>:<span className="text-muted">None</span>}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="col-md-7">
                <SessionChat sessionId={id}/>
              </div>
            </div>
          </div>
        )}

        {/* ══ SCHEDULE ══ */}
        {tab==='schedule' && (
          <div>
            {canEditSession && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-transparent fw-semibold">Add Schedule Entry</div>
                <div className="card-body">
                  <form onSubmit={addScheduleEntry}>
                    <div className="row g-3">
                      <div className="col-md-4"><label className="form-label fw-semibold">Title <span className="text-danger">*</span></label><input type="text" className="form-control" placeholder="e.g. Week 1 — Introduction" value={scheduleForm.title} onChange={e => setScheduleForm(p => ({ ...p, title:e.target.value }))}/></div>
                      <div className="col-md-3"><label className="form-label fw-semibold">Date & Time <span className="text-danger">*</span></label><input type="datetime-local" className="form-control" value={scheduleForm.datetime} onChange={e => setScheduleForm(p => ({ ...p, datetime:e.target.value }))}/></div>
                      <div className="col-md-2"><label className="form-label fw-semibold">Duration (min)</label><input type="number" className="form-control" min={15} step={15} value={scheduleForm.durationMin} onChange={e => setScheduleForm(p => ({ ...p, durationMin:e.target.value }))}/></div>
                      <div className="col-md-3"><label className="form-label fw-semibold">Notes</label><input type="text" className="form-control" placeholder="Optional note" value={scheduleForm.notes} onChange={e => setScheduleForm(p => ({ ...p, notes:e.target.value }))}/></div>
                      <div className="col-12">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="recurring" checked={scheduleForm.isRecurring} onChange={e => setScheduleForm(p => ({ ...p, isRecurring:e.target.checked }))}/>
                          <label className="form-check-label fw-semibold" htmlFor="recurring">Repeating schedule</label>
                        </div>
                      </div>
                      {scheduleForm.isRecurring && (
                        <>
                          <div className="col-md-3"><label className="form-label fw-semibold">Frequency</label><select className="form-select" value={scheduleForm.recurrence.frequency} onChange={e => setScheduleForm(p => ({ ...p, recurrence:{...p.recurrence,frequency:e.target.value} }))}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="monthly">Monthly</option></select></div>
                          <div className="col-md-3"><label className="form-label fw-semibold">End date</label><input type="date" className="form-control" value={scheduleForm.recurrence.endDate} onChange={e => setScheduleForm(p => ({ ...p, recurrence:{...p.recurrence,endDate:e.target.value} }))}/></div>
                          <div className="col-md-3"><label className="form-label fw-semibold">Max occurrences</label><input type="number" className="form-control" min={1} placeholder="Unlimited" value={scheduleForm.recurrence.maxOccurrences} onChange={e => setScheduleForm(p => ({ ...p, recurrence:{...p.recurrence,maxOccurrences:e.target.value} }))}/></div>
                        </>
                      )}
                      <div className="col-12 d-flex justify-content-end"><button type="submit" className="btn btn-primary" disabled={savingSchedule}>{savingSchedule?<span className="spinner-border spinner-border-sm me-2"/>:null}Add Entry</button></div>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <ScheduleCalendar schedule={session.schedule||[]} onRemove={removeScheduleEntry} canEdit={canEditSession}/>
          </div>
        )}

        {/* ══ GROUPS ══ */}
        {tab==='groups' && (
          <div>
            {canEditSession && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body py-2 px-3">
                  <form onSubmit={createGroup} className="d-flex gap-2 align-items-center">
                    <i className="bi bi-plus-circle text-primary"/>
                    <input type="text" className="form-control form-control-sm" placeholder="New group name…" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} style={{ maxWidth:280 }}/>
                    <button type="submit" className="btn btn-sm btn-primary">Create</button>
                  </form>
                </div>
              </div>
            )}
            {groups.length===0 && <p className="text-muted">No groups yet.</p>}
            <div className="d-flex flex-column gap-3">
              {groups.map(g => {
                const isOpen = selectedGroup?._id===g._id;
                const activeMembers = (g.members||[]).filter(m => m.status==='active');
                return (
                  <div key={g._id} className="card border-0 shadow-sm">
                    <div className="card-header bg-transparent d-flex align-items-center gap-3" style={{ cursor:'pointer' }} onClick={() => setSelectedGroup(isOpen?null:g)}>
                      <i className={`bi bi-chevron-${isOpen?'down':'right'} text-muted`}/>
                      {editingGroupTitle===g._id ? (
                        <div className="d-flex gap-2 flex-grow-1" onClick={e => e.stopPropagation()}>
                          <input className="form-control form-control-sm" style={{ maxWidth:220 }} value={editGroupName} onChange={e => setEditGroupName(e.target.value)} autoFocus/>
                          <button className="btn btn-sm btn-primary" onClick={() => renameGroup(g._id)}>Save</button>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingGroupTitle(null)}>Cancel</button>
                        </div>
                      ) : (
                        <span className="fw-semibold flex-grow-1">{g.name}</span>
                      )}
                      {canEditSession&&editingGroupTitle!==g._id && (
                        <button className="btn btn-sm btn-outline-secondary" onClick={e => { e.stopPropagation(); setEditingGroupTitle(g._id); setEditGroupName(g.name); }} title="Rename"><i className="bi bi-pencil"/></button>
                      )}
                      <span className="badge bg-light text-dark border"><i className="bi bi-people me-1"/>{activeMembers.length} members</span>
                      {isHost && <button className="btn btn-sm btn-outline-danger" onClick={e => { e.stopPropagation(); deleteGroup(g); }}><i className="bi bi-trash"/></button>}
                    </div>

                    {isOpen && (
                      <div className="card-body pt-3">
                        {/* Add member */}
                        <div className="position-relative mb-3">
                          <div className="input-group">
                            <span className="input-group-text"><i className="bi bi-search"/></span>
                            <input type="text" className="form-control" placeholder="Search by email or nickname…" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} autoComplete="off"/>
                            <button className="btn btn-primary" disabled={addingMember||!memberSearch.trim()} onClick={() => addMember(g._id)}>
                              {addingMember?<span className="spinner-border spinner-border-sm"/>:'Add'}
                            </button>
                          </div>
                          {memberResults.length>0 && (
                            <div className="border rounded bg-body shadow-sm position-absolute w-100" style={{ top:'100%', maxHeight:200, overflowY:'auto', zIndex:1000 }}>
                              {memberResults.map(u => (
                                <div key={u._id} className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom" style={{ cursor:'pointer' }} onMouseDown={e => e.preventDefault()}>
                                  <div><span className="fw-semibold small">{u.nickname}</span><small className="text-muted ms-2">{u.email}</small></div>
                                  <button className="btn btn-sm btn-outline-primary" onClick={() => { setMemberSearch(u.email); addMember(g._id, u.email); setMemberResults([]); }}>Add</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Members table */}
                        {!g.members?.length ? <p className="text-muted small">No members yet.</p> : (
                          <div className="table-responsive">
                            <table className="table table-sm align-middle mb-0">
                              <thead className="table-light"><tr><th>Student</th><th>Status</th><th>Joined</th><th>Activity</th><th></th></tr></thead>
                              <tbody>
                                {g.members.map(m => {
                                  const memberSubs = (g.assignments||[]).flatMap(a => (a.submissions||[]).filter(s => String(s.studentId?._id||s.studentId)===String(m.userId?._id||m.userId)));
                                  const approved = memberSubs.filter(s => s.status==='approved').length;
                                  const pending = memberSubs.filter(s => s.status==='pending').length;
                                  return (
                                    <tr key={m._id}>
                                      <td><div className="fw-semibold small">{m.userId?.nickname||'—'}</div><div className="text-muted" style={{ fontSize:'.75rem' }}>{m.userId?.email}</div></td>
                                      <td><span className={`badge ${m.status==='active'?'bg-success':m.status==='dropped'?'bg-danger':'bg-secondary'}`}>{m.status}</span></td>
                                      <td><small className="text-muted">{new Date(m.joinedAt).toLocaleDateString()}</small></td>
                                      <td>
                                        <div className="d-flex gap-1">
                                          {approved>0 && <span className="badge bg-success" style={{fontSize:'.65rem'}}>{approved} ✓</span>}
                                          {pending>0 && <span className="badge bg-warning text-dark" style={{fontSize:'.65rem'}}>{pending} pending</span>}
                                          {!approved&&!pending && <span className="text-muted small">—</span>}
                                        </div>
                                      </td>
                                      <td><button className="btn btn-sm btn-outline-danger" onClick={() => removeMember(g._id, m.userId?._id||m.userId, m.userId?.nickname)}><i className="bi bi-x-lg"/></button></td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ ASSIGNMENTS ══ */}
        {tab==='assignments' && (
          <div>
            {canGrade && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-transparent fw-semibold"><i className="bi bi-plus-circle me-2 text-primary"/>Create Assignment</div>
                <div className="card-body">
                  <form onSubmit={createAssignment}>
                    <div className="row g-3">
                      <div className="col-md-4"><label className="form-label fw-semibold">Title <span className="text-danger">*</span></label><input type="text" className="form-control" value={assignmentForm.title} onChange={e => setAssignmentForm(p => ({ ...p, title:e.target.value }))}/></div>
                      <div className="col-md-3"><label className="form-label fw-semibold">Due date <span className="text-danger">*</span></label><input type="datetime-local" className="form-control" value={assignmentForm.dueAt} onChange={e => setAssignmentForm(p => ({ ...p, dueAt:e.target.value }))}/></div>
                      <div className="col-md-2"><label className="form-label fw-semibold">Scale</label><select className="form-select" value={assignmentForm.markScale} onChange={e => setAssignmentForm(p => ({ ...p, markScale:e.target.value, maxMark:e.target.value!=='custom'?e.target.value:p.maxMark }))}>{MARK_SCALES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                      <div className="col-md-3"><label className="form-label fw-semibold">Groups <span className="text-danger">*</span></label><div className="border rounded p-2" style={{ maxHeight:100, overflowY:'auto' }}>{groups.length===0&&<small className="text-muted">No groups yet</small>}{groups.map(g => <div key={g._id} className="form-check"><input className="form-check-input" type="checkbox" id={`grp-${g._id}`} checked={assignmentForm.groupIds.includes(g._id)} onChange={e => setAssignmentForm(p => ({ ...p, groupIds:e.target.checked?[...p.groupIds,g._id]:p.groupIds.filter(x=>x!==g._id) }))}/><label className="form-check-label small" htmlFor={`grp-${g._id}`}>{g.name}</label></div>)}</div></div>
                      <div className="col-12"><label className="form-label fw-semibold">Description</label><textarea className="form-control" rows={2} value={assignmentForm.description} onChange={e => setAssignmentForm(p => ({ ...p, description:e.target.value }))}/></div>
                      <div className="col-12"><label className="form-label fw-semibold">Task files</label><input type="file" className="form-control" multiple accept=".pdf,.zip,.txt" onChange={e => setAssignmentForm(p => ({ ...p, files:Array.from(e.target.files) }))}/></div>
                      <div className="col-12 d-flex justify-content-end"><button type="submit" className="btn btn-primary" disabled={savingAssignment}>{savingAssignment?<span className="spinner-border spinner-border-sm me-2"/>:null}Create</button></div>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {assignments.length===0 && <p className="text-muted">No assignments yet.</p>}
            {assignments.map(a => {
              const subs = submissions[a._id]||[];
              const isOverdue = new Date() > new Date(a.dueAt);
              const assignmentGroup = groups.find(g => String(g._id)===String(a.groupId?._id||a.groupId));
              const pendingCount = subs.filter(s => s.status==='pending').length;
              return (
                <div key={a._id} className="card border-0 shadow-sm mb-3">
                  <div className="card-header bg-transparent d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="fw-semibold">{a.title}</span>
                      <span className="badge bg-light text-dark border">{a.markScale}-pt · max {a.maxMark}</span>
                      {assignmentGroup && <span className="badge bg-secondary"><i className="bi bi-people me-1"/>{assignmentGroup.name}</span>}
                      {isOverdue && <span className="badge bg-danger">Overdue</span>}
                      {pendingCount>0 && <span className="badge bg-warning text-dark"><i className="bi bi-hourglass-split me-1"/>{pendingCount} pending</span>}
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      <small className="text-muted">Due: {new Date(a.dueAt).toLocaleString()}</small>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => loadSubmissions(assignmentGroup?._id||groups[0]?._id, a._id)}><i className="bi bi-arrow-clockwise me-1"/>Submissions</button>
                    </div>
                  </div>
                  {a.description && <div className="card-body py-2 border-bottom"><small className="text-muted">{a.description}</small></div>}
                  {subs.length>0 && (
                    <div className="card-body py-2">
                      <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0">
                          <thead className="table-light"><tr><th>Student</th><th>Submitted</th><th>Status</th><th>Mark</th><th>Actions</th></tr></thead>
                          <tbody>
                            {subs.map(s => {
                              const studentId = String(s.studentId?._id||s.studentId);
                              const isGrading = gradingId===`${a._id}-${studentId}`;
                              return (
                                <tr key={studentId}>
                                  <td><div className="fw-semibold small">{s.studentId?.nickname||'—'}</div>{s.isOverdue&&<span className="badge bg-warning text-dark" style={{fontSize:'.65rem'}}>overdue</span>}</td>
                                  <td><small className="text-muted">{new Date(s.submittedAt).toLocaleString()}</small></td>
                                  <td><span className={`badge ${s.status==='approved'?'bg-success':s.status==='declined'?'bg-danger':'bg-warning text-dark'}`}>{s.status}</span></td>
                                  <td>{s.mark!=null?<span className="fw-semibold">{s.mark}/{a.maxMark}</span>:<span className="text-muted">—</span>}</td>
                                  <td>
                                    <div className="d-flex gap-1 flex-wrap">
                                      {assignmentGroup && <a className="btn btn-sm btn-outline-info" href={`${API_URL}/submissions/${assignmentGroup._id}/${a._id}/${studentId}/file`} target="_blank" rel="noopener noreferrer"><i className="bi bi-download"/></a>}
                                      {canGrade&&s.status!=='approved' && <button className="btn btn-sm btn-outline-primary" onClick={() => { setGradingId(`${a._id}-${studentId}`); setGradeForm({ mark:s.mark||'', feedback:s.feedback||'', status:'approved' }); }}><i className="bi bi-pencil-square me-1"/>Grade</button>}
                                    </div>
                                    {isGrading && (
                                      <div className="mt-2 p-2 border rounded bg-body-secondary">
                                        <div className="d-flex gap-2 mb-2 flex-wrap">
                                          <input type="number" className="form-control form-control-sm" placeholder="Mark" style={{ width:80 }} value={gradeForm.mark} onChange={e => setGradeForm(p => ({ ...p, mark:e.target.value }))} min={0} max={a.maxMark}/>
                                          <select className="form-select form-select-sm" style={{ width:120 }} value={gradeForm.status} onChange={e => setGradeForm(p => ({ ...p, status:e.target.value }))}><option value="approved">Approved</option><option value="declined">Declined</option></select>
                                        </div>
                                        <textarea className="form-control form-control-sm mb-2" rows={2} placeholder="Feedback (optional)" value={gradeForm.feedback} onChange={e => setGradeForm(p => ({ ...p, feedback:e.target.value }))}/>
                                        <div className="d-flex gap-2 justify-content-end">
                                          <button className="btn btn-sm btn-outline-secondary" onClick={() => setGradingId(null)}>Cancel</button>
                                          <button className="btn btn-sm btn-primary" onClick={() => submitGrade(assignmentGroup?._id||groups[0]?._id, a._id, studentId)}>Submit grade</button>
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ CO-TUTORS ══ */}
        {tab==='cotutors' && (
          <div>
            {isHost && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-transparent fw-semibold"><i className="bi bi-person-plus me-2 text-primary"/>Add Co-tutor</div>
                <div className="card-body">
                  <div className="input-group mb-2" style={{ maxWidth:420 }}>
                    <span className="input-group-text"><i className="bi bi-search"/></span>
                    <input type="text" className="form-control" placeholder="Search by email or nickname…" value={coTutorSearch} onChange={e => setCoTutorSearch(e.target.value)} autoComplete="off"/>
                  </div>
                  {coTutorSearch.trim().length>=2&&coTutorResults.length===0 && <small className="text-muted ms-1">No tutors found</small>}
                  {coTutorResults.length>0 && (
                    <div className="border rounded" style={{ maxWidth:420, maxHeight:200, overflowY:'auto' }}>
                      {coTutorResults.map(u => (
                        <div key={u._id} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                          <div><span className="fw-semibold small">{u.nickname}</span><small className="text-muted ms-2">{u.email}</small>{u.tutorRank&&<span className="badge bg-light text-dark border ms-2">{u.tutorRank}</span>}</div>
                          <button className="btn btn-sm btn-primary" onClick={() => { addCoTutor(u._id); setCoTutorSearch(''); setCoTutorResults([]); }}>Add</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {!session.coTutors?.length ? <p className="text-muted">No co-tutors yet.</p> : (
              <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                  {session.coTutors.map(ct => {
                    const u = ct.userId; const uid = String(u?._id||u);
                    return (
                      <div key={uid} className="d-flex align-items-center gap-3 px-3 py-2 border-bottom">
                        <div className="flex-grow-1">
                          <div className="fw-semibold small">{u?.nickname||uid}</div>
                          <div style={{ fontSize:'.75rem', color:'#868e96' }}>{u?.email}{u?.tutorRank&&<span className="badge bg-light text-dark border ms-2">{u.tutorRank}</span>}</div>
                        </div>
                        {isHost ? (
                          <div className="d-flex align-items-center gap-3">
                            {[['canGrade','Grade'],['canSchedule','Schedule'],['canEditCopy','Edit copy']].map(([perm,label]) => (
                              <label key={perm} className="d-flex flex-column align-items-center gap-1" style={{ fontSize:'.7rem', color:'var(--bs-secondary-color)', cursor:'pointer' }}>
                                <div className="form-check form-switch m-0"><input className="form-check-input" type="checkbox" checked={!!ct[perm]} onChange={() => toggleCoTutorPerm(uid, perm)}/></div>
                                {label}
                              </label>
                            ))}
                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeCoTutor(uid)}><i className="bi bi-x-lg"/></button>
                          </div>
                        ) : (
                          <div className="d-flex gap-3" style={{ fontSize:'.8rem', color:'var(--bs-secondary-color)' }}>
                            <span>{ct.canGrade?'✓ Grade':'— Grade'}</span>
                            <span>{ct.canSchedule?'✓ Schedule':'— Schedule'}</span>
                            <span>{ct.canEditCopy?'✓ Edit copy':'— Edit copy'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
      <UtilityModal show={modal.show} type={modal.type} title={modal.title} message={modal.message}
        danger={modal.danger} onConfirm={() => { modal.onConfirm?.(); closeModal(); }}
        onCancel={modal.onCancel||closeModal} onClose={modal.onClose||closeModal}/>
    </div>
  );
}

export default ManageSessionPage;