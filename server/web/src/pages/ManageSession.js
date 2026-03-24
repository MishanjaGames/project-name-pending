import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { UtilityModal } from "../components/UtilityModal";

const API = "http://localhost:4040/api";
const TUTOR_RANKS = ['assistant','teacher','lecturer','instructor','tutor','professor'];
const MARK_SCALES = ['5','12','100','custom'];

function ManageSession({ data, onLogout }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const ah = { Authorization: `${token?.split(" ")[0]} ${token?.split(" ")[1]}`, "Content-Type": "application/json" };
    const mh = { Authorization: `${token?.split(" ")[0]} ${token?.split(" ")[1]}` };

    // Core state
    const [session, setSession]     = useState(null);
    const [groups, setGroups]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [tab, setTab]             = useState("overview");
    const [saving, setSaving]       = useState(false);

    // Modal
    const [modal, setModal] = useState({ show: false, type: "info", title: "", message: "", confirmToken: "", tokenLabel: "", onConfirm: null, onDelete: null, onCancel: null, onClose: null, danger: false });
    const closeModal  = () => setModal(p => ({ ...p, show: false }));
    const showInfo    = (t, m) => setModal({ show: true, type: "info", title: t, message: m, onClose: closeModal });
    const showConfirm = (t, m, fn, d = false) => setModal({ show: true, type: "confirm", danger: d, title: t, message: m, onConfirm: fn, onCancel: closeModal });

    // ── Schedule state ──────────────────────────────────────────────────────
    const [scheduleForm, setScheduleForm] = useState({
        title: "", datetime: "", durationMin: 60, meetingLink: "", notes: "",
        isRecurring: false,
        recurrence: { frequency: "weekly", daysOfWeek: [], endDate: "", maxOccurrences: "" }
    });
    const [savingSchedule, setSavingSchedule] = useState(false);

    // ── Deadline state ──────────────────────────────────────────────────────
    const [deadlineForm, setDeadlineForm] = useState({ targetType: "item", targetId: "", dueAt: "", description: "", lockAfterDue: false });
    const [savingDeadline, setSavingDeadline] = useState(false);

    // ── Group state ─────────────────────────────────────────────────────────
    const [newGroupName, setNewGroupName] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [memberSearch, setMemberSearch] = useState("");
    const [memberResults, setMemberResults] = useState([]);
    const [addingMember, setAddingMember] = useState(false);

    // ── Assignment state ────────────────────────────────────────────────────
    const [assignmentForm, setAssignmentForm] = useState({
        title: "", description: "", dueAt: "", markScale: "5", maxMark: "5", groupIds: [], files: []
    });
    const [savingAssignment, setSavingAssignment] = useState(false);
    const [assignments, setAssignments]   = useState([]);
    const [submissions, setSubmissions]   = useState({});  // { [assignmentId]: [submission,...] }
    const [gradingId, setGradingId]       = useState(null);
    const [gradeForm, setGradeForm]       = useState({ mark: "", feedback: "", status: "approved" });
    const [editingAssignment, setEditingAssignment] = useState(null);  // assignment being edited
    const [editForm, setEditForm]         = useState(null);
    const [savingEdit, setSavingEdit]     = useState(false);

    // ── Co-tutor state ──────────────────────────────────────────────────────
    const [coTutorSearch, setCoTutorSearch]   = useState("");
    const [coTutorResults, setCoTutorResults] = useState([]);

    // ── Private copy state ──────────────────────────────────────────────────
    const [creatingCopy, setCreatingCopy] = useState(false);

    // ── Fetch ───────────────────────────────────────────────────────────────
    const fetchSession = useCallback(async () => {
        try {
            const res = await fetch(`${API}/sessions/${id}`, { headers: ah });
            if (res.ok) { const d = await res.json(); setSession(d.data);}
            else if (res.status === 403) { showInfo("Access Denied", "You are not a tutor in this session."); navigate("/manage/sessions"); }
        } catch (e) { console.error(e); }
    }, [id]);

    const fetchGroups = useCallback(async () => {
        try {
            const res = await fetch(`${API}/groups?sessionId=${id}`, { headers: ah });
            if (res.ok) { const d = await res.json(); setGroups(d.data || []); }
        } catch (e) { console.error(e); }
    }, [id]);

    const fetchAssignments = useCallback(async (groupId) => {
        if (!groupId) return;
        try {
            const res = await fetch(`${API}/assignments?groupId=${groupId}`, { headers: ah });
            if (res.ok) { const d = await res.json(); setAssignments(d.data || []); }
        } catch (e) { console.error(e); }
    }, []);

    const fetchAllAssignments = useCallback(async () => {
        if (!groups.length) return;
        try {
            const results = await Promise.all(
                groups.map(g => fetch(`${API}/assignments?groupId=${g._id}`, { headers: ah }).then(r => r.ok ? r.json() : { data: [] }))
            );
            const all = results.flatMap(r => r.data || []);
            // deduplicate by _id
            const seen = new Set();
            setAssignments(all.filter(a => { if (seen.has(a._id)) return false; seen.add(a._id); return true; }));
        } catch (e) { console.error(e); }
    }, [groups]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchSession(), fetchGroups()]);
            setLoading(false);
        };
        load();
    }, [id]);

    useEffect(() => {
        if (selectedGroup) fetchAssignments(selectedGroup._id);
    }, [selectedGroup]);

    useEffect(() => {
        if (tab === "assignments" && groups.length) fetchAllAssignments();
    }, [tab, groups]);

    // ── Helpers ─────────────────────────────────────────────────────────────
    const courseTitle = (c) => c?.trans?.[0]?.title || c?.title || "(untitled)";
    const isHost = session && String(session.hostTutor?._id || session.hostTutor) === String(data._id);
    const myCoEntry = session?.coTutors?.find(ct => String(ct.userId?._id || ct.userId) === String(data._id));
    const canEditSession = isHost || (myCoEntry?.canSchedule);
    const canGrade       = isHost || (myCoEntry?.canGrade);

    const overdueDeduction = (scale) => ['12','100'].includes(scale) ? 2 : 1;

    // ── Status update ───────────────────────────────────────────────────────
    const updateStatus = async (status) => {
        setSaving(true);
        try {
            const res = await fetch(`${API}/sessions/${id}`, { method: "PATCH", headers: ah, body: JSON.stringify({ status }) });
            if (res.ok) fetchSession();
            else { const d = await res.json(); showInfo("Error", d.message); }
        } catch (e) { showInfo("Error", "Network error"); }
        setSaving(false);
    };

    // ── Private copy ────────────────────────────────────────────────────────
    const handleCreatePrivateCopy = async () => {
        setCreatingCopy(true);
        try {
            const res = await fetch(`${API}/sessions/${id}/private-copy`, { method: "POST", headers: ah });
            const d = await res.json();
            if (res.ok) { showInfo("Created", `Private copy created (${d.message})`); fetchSession(); }
            else showInfo("Error", d.message);
        } catch (e) { showInfo("Error", "Network error"); }
        setCreatingCopy(false);
    };

    // ── Toggle copyEditAllowed ───────────────────────────────────────────────
    const toggleCopyEdit = async () => {
        const res = await fetch(`${API}/sessions/${id}`, { method: "PATCH", headers: ah,
            body: JSON.stringify({ copyEditAllowed: !session.copyEditAllowed }) });
        if (res.ok) fetchSession();
    };

    // ── Schedule ────────────────────────────────────────────────────────────
    const addScheduleEntry = async (e) => {
        e.preventDefault();
        if (!scheduleForm.title || !scheduleForm.datetime) { showInfo("Validation", "Title and date/time are required"); return; }
        setSavingSchedule(true);
        const entry = {
            title: scheduleForm.title,
            datetime: scheduleForm.datetime,
            durationMin: +scheduleForm.durationMin,
            meetingLink: scheduleForm.meetingLink,
            notes: scheduleForm.notes,
            isRecurring: scheduleForm.isRecurring,
        };
        if (scheduleForm.isRecurring) {
            entry.recurrence = {
                frequency: scheduleForm.recurrence.frequency,
                daysOfWeek: scheduleForm.recurrence.daysOfWeek,
                endDate: scheduleForm.recurrence.endDate || null,
                maxOccurrences: scheduleForm.recurrence.maxOccurrences ? +scheduleForm.recurrence.maxOccurrences : null,
            };
        }
        const newSchedule = [...(session.schedule || []), entry];
        try {
            const res = await fetch(`${API}/sessions/${id}`, { method: "PATCH", headers: ah, body: JSON.stringify({ schedule: newSchedule }) });
            if (res.ok) {
                fetchSession();
                setScheduleForm({ title: "", datetime: "", durationMin: 60, meetingLink: "", notes: "", isRecurring: false, recurrence: { frequency: "weekly", daysOfWeek: [], endDate: "", maxOccurrences: "" } });
            } else { const d = await res.json(); showInfo("Error", d.message); }
        } catch (e) { showInfo("Error", "Network error"); }
        setSavingSchedule(false);
    };

    const removeScheduleEntry = async (idx) => {
        const newSchedule = session.schedule.filter((_, i) => i !== idx);
        const res = await fetch(`${API}/sessions/${id}`, { method: "PATCH", headers: ah, body: JSON.stringify({ schedule: newSchedule }) });
        if (res.ok) fetchSession();
    };

    // ── Deadlines ───────────────────────────────────────────────────────────
    const addDeadline = async (e) => {
        e.preventDefault();
        if (!deadlineForm.targetId || !deadlineForm.dueAt) { showInfo("Validation", "Target ID and due date required"); return; }
        setSavingDeadline(true);
        const newDeadlines = [...(session.deadlines || []), deadlineForm];
        try {
            const res = await fetch(`${API}/sessions/${id}`, { method: "PATCH", headers: ah, body: JSON.stringify({ deadlines: newDeadlines }) });
            if (res.ok) { fetchSession(); setDeadlineForm({ targetType: "item", targetId: "", dueAt: "", description: "", lockAfterDue: false }); }
            else { const d = await res.json(); showInfo("Error", d.message); }
        } catch (e) { showInfo("Error", "Network error"); }
        setSavingDeadline(false);
    };

    const removeDeadline = async (idx) => {
        const newDeadlines = session.deadlines.filter((_, i) => i !== idx);
        const res = await fetch(`${API}/sessions/${id}`, { method: "PATCH", headers: ah, body: JSON.stringify({ deadlines: newDeadlines }) });
        if (res.ok) fetchSession();
    };

    // ── Groups ──────────────────────────────────────────────────────────────
    const createGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        try {
            const res = await fetch(`${API}/groups`, { method: "POST", headers: ah, body: JSON.stringify({ sessionId: id, name: newGroupName.trim() }) });
            if (res.ok) { setNewGroupName(""); fetchGroups(); }
            else { const d = await res.json(); showInfo("Error", d.message); }
        } catch (e) { showInfo("Error", "Network error"); }
    };

    // ── Live member search ───────────────────────────────────────────────────
    useEffect(() => {
        if (memberSearch.trim().length < 2) { setMemberResults([]); return; }
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`${API}/users?search=${encodeURIComponent(memberSearch.trim())}`, { headers: ah });
                if (res.ok) { const d = await res.json(); setMemberResults(d.data || []); }
            } catch (e) { console.error(e); }
        }, 300);
        return () => clearTimeout(t);
    }, [memberSearch]);

    const addMember = async (groupId, emailOrNickname) => {
        const query = emailOrNickname || memberSearch.trim();
        if (!query) return;
        setAddingMember(true);
        try {
            const res = await fetch(`${API}/groups/${groupId}/members`, { method: "POST", headers: ah, body: JSON.stringify({ emailOrNickname: query }) });
            const d = await res.json();
            if (res.ok) { showInfo("Added", `${d.data?.nickname} added to group.`); setMemberSearch(""); setMemberResults([]); fetchGroups(); }
            else showInfo("Error", d.message);
        } catch (e) { showInfo("Error", "Network error"); }
        setAddingMember(false);
    };

    const removeMember = (groupId, userId, nickname) => {
        showConfirm("Remove Member", `Remove ${nickname} from this group?`, async () => {
            const res = await fetch(`${API}/groups/${groupId}/members/${userId}`, { method: "DELETE", headers: ah });
            if (res.ok) fetchGroups();
            else { const d = await res.json(); showInfo("Error", d.message); }
        }, true);
    };

    const deleteGroup = (group) => {
        showConfirm("Delete Group", `Delete group "${group.name}"? All assignment records will be lost.`, async () => {
            const res = await fetch(`${API}/groups/${group._id}`, { method: "DELETE", headers: ah });
            if (res.ok) { fetchGroups(); if (selectedGroup?._id === group._id) setSelectedGroup(null); }
            else { const d = await res.json(); showInfo("Error", d.message); }
        }, true);
    };

    // ── Assignments ─────────────────────────────────────────────────────────
    const createAssignment = async (e) => {
        e.preventDefault();
        const groupIds = assignmentForm.groupIds.length ? assignmentForm.groupIds : (selectedGroup ? [selectedGroup._id] : []);
        if (!groupIds.length) { showInfo("Validation", "Select at least one group"); return; }
        if (!assignmentForm.title || !assignmentForm.dueAt || !assignmentForm.maxMark) { showInfo("Validation", "Title, due date, and max mark required"); return; }
        setSavingAssignment(true);
        try {
            const courseId = session.privateCopyId || session.courseId?._id || session.courseId;
            // Create for each group
            for (const gId of groupIds) {
                const formData = new FormData();
                formData.append("sessionId", id);
                formData.append("groupId", gId);
                formData.append("courseId", courseId);
                formData.append("title", assignmentForm.title);
                formData.append("description", assignmentForm.description);
                formData.append("dueAt", assignmentForm.dueAt);
                formData.append("markScale", assignmentForm.markScale);
                formData.append("maxMark", assignmentForm.maxMark);
                (assignmentForm.files || []).forEach(f => formData.append("taskFiles", f));
                await fetch(`${API}/assignments`, { method: "POST", headers: mh, body: formData });
            }
            showInfo("Created", `Assignment created for ${groupIds.length} group(s).`);
            setAssignmentForm({ title: "", description: "", dueAt: "", markScale: "5", maxMark: "5", groupIds: [], files: [] });
            fetchGroups();
            fetchAllAssignments();
        } catch (e) { showInfo("Error", "Network error"); }
        setSavingAssignment(false);
    };

    const startEditAssignment = (a) => {
        setEditingAssignment(a._id);
        setEditForm({
            title: a.title,
            description: a.description,
            dueAt: a.dueAt ? new Date(a.dueAt).toISOString().slice(0, 16) : "",
            markScale: a.markScale,
            maxMark: String(a.maxMark),
            newFiles: [],
            removedFiles: []
        });
    };

    const saveEditAssignment = async (a) => {
        if (!editForm.title || !editForm.dueAt || !editForm.maxMark) { showInfo("Validation", "Title, due date, and max mark required"); return; }
        setSavingEdit(true);
        try {
            const formData = new FormData();
            formData.append("title", editForm.title);
            formData.append("description", editForm.description);
            formData.append("dueAt", editForm.dueAt);
            formData.append("markScale", editForm.markScale);
            formData.append("maxMark", editForm.maxMark);
            (editForm.newFiles || []).forEach(f => formData.append("taskFiles", f));
            if (editForm.removedFiles?.length) formData.append("removeFiles", JSON.stringify(editForm.removedFiles));
            const res = await fetch(`${API}/assignments/${a._id}`, { method: "PATCH", headers: mh, body: formData });
            const d = await res.json();
            if (res.ok) { showInfo("Saved", "Assignment updated."); setEditingAssignment(null); setEditForm(null); fetchAllAssignments(); }
            else showInfo("Error", d.message);
        } catch (e) { showInfo("Error", "Network error"); }
        setSavingEdit(false);
    };

    const deleteAssignment = (a) => {
        showConfirm("Delete Assignment", `Delete assignment "${a.title}"? This cannot be undone.`, async () => {
            const res = await fetch(`${API}/assignments/${a._id}`, { method: "DELETE", headers: ah });
            if (res.ok) { fetchAllAssignments(); }
            else { const d = await res.json(); showInfo("Error", d.message); }
        }, true);
    };

    const loadSubmissions = async (groupId, assignmentId) => {
        try {
            const res = await fetch(`${API}/submissions/${groupId}/${assignmentId}`, { headers: ah });
            if (res.ok) { const d = await res.json(); setSubmissions(p => ({ ...p, [assignmentId]: d.data || [] })); }
        } catch (e) { console.error(e); }
    };

    const submitGrade = async (groupId, assignmentId, studentId) => {
        if (!gradeForm.mark || !gradeForm.status) { showInfo("Validation", "Mark and status required"); return; }
        try {
            const res = await fetch(`${API}/submissions/${groupId}/${assignmentId}/${studentId}/grade`, {
                method: "PATCH", headers: ah,
                body: JSON.stringify({ mark: +gradeForm.mark, feedback: gradeForm.feedback, status: gradeForm.status })
            });
            const d = await res.json();
            if (res.ok) {
                showInfo("Graded", `Submission ${gradeForm.status}. Final mark: ${d.data?.mark}`);
                setGradingId(null);
                loadSubmissions(groupId, assignmentId);
            } else showInfo("Error", d.message);
        } catch (e) { showInfo("Error", "Network error"); }
    };

    // ── Co-tutor search ─────────────────────────────────────────────────────
    useEffect(() => {
        if (coTutorSearch.trim().length < 2) { setCoTutorResults([]); return; }
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`${API}/users?search=${encodeURIComponent(coTutorSearch.trim())}&tutorOnly=true`, { headers: ah });
                if (res.ok) { const d = await res.json(); setCoTutorResults(d.data || []); }
            } catch (e) { console.error(e); }
        }, 300);
        return () => clearTimeout(t);
    }, [coTutorSearch]);

    const addCoTutor = async (userId) => {
        const existing = session.coTutors || [];
        if (existing.some(ct => String(ct.userId?._id || ct.userId) === userId)) { showInfo("Info", "Already a co-tutor"); return; }
        const newCoTutors = [...existing, { userId, canGrade: true, canSchedule: true, canEditCopy: false }];
        const res = await fetch(`${API}/sessions/${id}`, { method: "PATCH", headers: ah, body: JSON.stringify({ coTutors: newCoTutors }) });
        if (res.ok) { fetchSession(); setCoTutorResults([]); setCoTutorSearch(""); }
    };

    const removeCoTutor = (userId) => {
        showConfirm("Remove Co-tutor", "Remove this co-tutor from the session?", async () => {
            const newCoTutors = session.coTutors.filter(ct => String(ct.userId?._id || ct.userId) !== String(userId));
            const res = await fetch(`${API}/sessions/${id}`, { method: "PATCH", headers: ah, body: JSON.stringify({ coTutors: newCoTutors }) });
            if (res.ok) fetchSession();
        }, true);
    };

    const toggleCoTutorPerm = async (userId, perm) => {
        const newCoTutors = session.coTutors.map(ct => {
            const ctId = String(ct.userId?._id || ct.userId);
            if (ctId === String(userId)) return { ...ct, [perm]: !ct[perm] };
            return ct;
        });
        const res = await fetch(`${API}/sessions/${id}`, { method: "PATCH", headers: ah, body: JSON.stringify({ coTutors: newCoTutors }) });
        if (res.ok) fetchSession();
    };

    // ── Override rank restriction ───────────────────────────────────────────
    const overrideRank = async () => {
        const res = await fetch(`${API}/sessions/${id}/override-rank`, { method: "POST", headers: ah });
        if (res.ok) { showInfo("Done", "Rank restriction overridden."); fetchSession(); }
        else { const d = await res.json(); showInfo("Error", d.message); }
    };

    // ────────────────────────────────────────────────────────────────────────
    if (loading) return (
        <><Navbar data={data} onLogout={onLogout} />
        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
            <div className="spinner-border text-primary" />
        </div></>
    );

    if (!session) return (
        <><Navbar data={data} onLogout={onLogout} />
        <div className="flex-grow-1 p-4 text-muted">Session not found.</div></>
    );

    const course = session.courseId;
    const statusColors = { draft: "secondary", active: "success", completed: "primary", archived: "dark" };

    return (
        <>
            <Navbar data={data} onLogout={onLogout} />
            <div className="flex-grow-1 p-3 p-md-4" style={{ minWidth: 0 }}>

                {/* Header */}
                <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
                    <div>
                        <button className="btn btn-outline-secondary btn-sm mb-2" onClick={() => navigate("/manage/sessions")}>
                            ← Sessions
                        </button>
                        <h1 className="h3 fw-bold mb-1">{courseTitle(course)}</h1>
                        <div className="d-flex gap-2 flex-wrap align-items-center">
                            <span className={`badge bg-${statusColors[session.status] || "secondary"}`}>{session.status}</span>
                            <span className="badge bg-light text-dark border">{session.courseType}</span>
                            {session.isPrivateCopy && <span className="badge bg-warning text-dark">Has private copy</span>}
                            {session.restrictionIgnored && <span className="badge bg-info text-dark">Rank override active</span>}
                        </div>
                    </div>
                    {isHost && (
                        <div className="d-flex gap-2 flex-wrap">
                            {session.status === "draft" && (
                                <button className="btn btn-success btn-sm" disabled={saving} onClick={() => updateStatus("active")}>
                                    <i className="bi bi-play-fill me-1"></i>Start Session
                                </button>
                            )}
                            {session.status === "active" && (
                                <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => updateStatus("completed")}>
                                    <i className="bi bi-check2-all me-1"></i>Complete
                                </button>
                            )}
                            {!session.privateCopyId && (
                                <button className="btn btn-outline-warning btn-sm" disabled={creatingCopy} onClick={handleCreatePrivateCopy}>
                                    {creatingCopy ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-files me-1"></i>}
                                    Create Private Copy
                                </button>
                            )}
                            {session.privateCopyId && (
                                <button
                                    className={`btn btn-sm ${session.copyEditAllowed ? "btn-warning" : "btn-outline-secondary"}`}
                                    onClick={toggleCopyEdit}
                                    title="Allow co-tutors to edit the private copy"
                                >
                                    <i className={`bi bi-pencil${session.copyEditAllowed ? "-fill" : ""} me-1`}></i>
                                    Allow edit copy: {session.copyEditAllowed ? "ON" : "OFF"}
                                </button>
                            )}
                            {!session.restrictionIgnored && (
                                <button className="btn btn-outline-info btn-sm" onClick={overrideRank}>
                                    <i className="bi bi-unlock me-1"></i>Override Rank
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Course action links */}
                <div className="mb-3 d-flex gap-2 flex-wrap">
                    <button className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/course/view/${session.courseId._id}`)}>
                        <i className="bi bi-eye me-1"></i>View Course
                    </button>
                    <button className="btn btn-sm btn-outline-success"
                        onClick={() => navigate(`/course/view/${session.privateCopyId?._id}?session=${id}`)}>
                        <i className="bi bi-eye me-1"></i>Go to Course
                    </button>
                    <div className="d-flex gap-2" hidden={session.privateCopyId?false:true}>
                        <button className="btn btn-sm btn-outline-warning"
                            onClick={() => navigate(`/manage/course/preview/${session.privateCopyId._id}?private=1`)}>
                            <i className="bi bi-pencil me-1"></i>Edit Private Copy
                        </button>
                        <button className="btn btn-sm btn-outline-warning"
                            onClick={() => navigate(`/manage/course/${session.privateCopyId._id}`)}>
                            <i className="bi bi-pencil me-1"></i>Edit Private Copy Detail
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                {(() => {
                    const isTutorOrManager = isHost || myCoEntry || ['manage','admin','root'].includes(data.accessLevel);
                    const allTabs = [
                        { key: "overview",     label: "Overview",     icon: "bi-info-circle",     always: true },
                        { key: "schedule",     label: "Schedule",     icon: "bi-calendar-event",  always: true },
                        { key: "groups",       label: "Groups",       icon: "bi-people",           always: true },
                        { key: "deadlines",    label: "Deadlines",    icon: "bi-clock",            always: false },
                        { key: "assignments",  label: "Assignments",  icon: "bi-clipboard-check",  always: false },
                        { key: "tutors",       label: "Co-tutors",    icon: "bi-person-badge",     always: false },
                    ];
                    const visibleTabs = allTabs.filter(t => t.always || isTutorOrManager);
                    return (
                        <ul className="nav nav-tabs mb-4">
                            {visibleTabs.map(t => (
                                <li key={t.key} className="nav-item">
                                    <button className={`nav-link ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
                                        <i className={`bi ${t.icon} me-1`}></i>{t.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    );
                })()}

                {/* ══ TAB: OVERVIEW ══ */}
                {tab === "overview" && (
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white fw-semibold">Session Info</div>
                                <div className="card-body">
                                    <table className="table table-sm table-borderless mb-0">
                                        <tbody>
                                            <tr><td className="text-muted">Course</td><td>{courseTitle(course)}</td></tr>
                                            <tr><td className="text-muted">Level</td><td>{course?.level}</td></tr>
                                            <tr><td className="text-muted">Type</td><td>{session.courseType}</td></tr>
                                            <tr><td className="text-muted">Status</td><td><span className={`badge bg-${statusColors[session.status]}`}>{session.status}</span></td></tr>
                                            <tr><td className="text-muted">Host</td><td>{session.hostTutor?.nickname || "—"} <span className="text-muted small">({session.hostTutor?.tutorRank || "n/a"})</span></td></tr>
                                            <tr><td className="text-muted">Private copy</td><td>{session.privateCopyId ? <span className="text-success">✓ Created</span> : <span className="text-muted">None</span>}</td></tr>
                                            <tr><td className="text-muted">Groups</td><td>{groups.length}</td></tr>
                                            <tr><td className="text-muted">Total students</td><td>{groups.reduce((s, g) => s + (g.members?.filter(m => m.status === 'active').length || 0), 0)}</td></tr>
                                            <tr><td className="text-muted">Schedule entries</td><td>{session.schedule?.length || 0}</td></tr>
                                            <tr><td className="text-muted">Deadlines</td><td>{session.deadlines?.length || 0}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white fw-semibold">Upcoming Schedule</div>
                                <div className="card-body p-0">
                                    {!session.schedule?.length ? (
                                        <p className="text-muted p-3 mb-0">No scheduled sessions yet.</p>
                                    ) : (
                                        <ul className="list-group list-group-flush">
                                            {session.schedule.slice(0, 5).map((s, i) => (
                                                <li key={i} className="list-group-item">
                                                    <div className="fw-semibold small">{s.title}</div>
                                                    <div className="text-muted small">{new Date(s.datetime).toLocaleString()} · {s.durationMin} min</div>
                                                    {s.meetingLink && (
                                                        <a href={s.meetingLink} target="_blank" rel="noopener noreferrer" className="small">
                                                            <i className="bi bi-camera-video me-1"></i>Join
                                                        </a>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ TAB: SCHEDULE ══ */}
                {tab === "schedule" && (
                    <div>
                        {canEditSession && (
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-header bg-white fw-semibold">Add Schedule Entry</div>
                                <div className="card-body">
                                    <form onSubmit={addScheduleEntry}>
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold">Title <span className="text-danger">*</span></label>
                                                <input type="text" className="form-control" placeholder="e.g. Week 1 — Introduction"
                                                    value={scheduleForm.title} onChange={e => setScheduleForm(p => ({ ...p, title: e.target.value }))} />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label fw-semibold">Date & Time <span className="text-danger">*</span></label>
                                                <input type="datetime-local" className="form-control"
                                                    value={scheduleForm.datetime} onChange={e => setScheduleForm(p => ({ ...p, datetime: e.target.value }))} />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label fw-semibold">Duration (min)</label>
                                                <input type="number" className="form-control" min={15} step={15}
                                                    value={scheduleForm.durationMin} onChange={e => setScheduleForm(p => ({ ...p, durationMin: e.target.value }))} />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label fw-semibold">Meeting Link</label>
                                                <input type="url" className="form-control" placeholder="https://meet.google.com/…"
                                                    value={scheduleForm.meetingLink} onChange={e => setScheduleForm(p => ({ ...p, meetingLink: e.target.value }))} />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-semibold">Notes</label>
                                                <textarea className="form-control" rows={2}
                                                    value={scheduleForm.notes} onChange={e => setScheduleForm(p => ({ ...p, notes: e.target.value }))} />
                                            </div>
                                            {/* Recurrence toggle */}
                                            <div className="col-12">
                                                <div className="form-check">
                                                    <input className="form-check-input" type="checkbox" id="isRecurring"
                                                        checked={scheduleForm.isRecurring}
                                                        onChange={e => setScheduleForm(p => ({ ...p, isRecurring: e.target.checked }))} />
                                                    <label className="form-check-label fw-semibold" htmlFor="isRecurring">
                                                        Repeating schedule
                                                    </label>
                                                </div>
                                            </div>
                                            {scheduleForm.isRecurring && (
                                                <>
                                                    <div className="col-md-3">
                                                        <label className="form-label fw-semibold">Frequency</label>
                                                        <select className="form-select"
                                                            value={scheduleForm.recurrence.frequency}
                                                            onChange={e => setScheduleForm(p => ({ ...p, recurrence: { ...p.recurrence, frequency: e.target.value } }))}>
                                                            <option value="daily">Daily</option>
                                                            <option value="weekly">Weekly</option>
                                                            <option value="biweekly">Biweekly</option>
                                                            <option value="monthly">Monthly</option>
                                                        </select>
                                                    </div>
                                                    {["weekly","biweekly"].includes(scheduleForm.recurrence.frequency) && (
                                                        <div className="col-md-5">
                                                            <label className="form-label fw-semibold">Days of week</label>
                                                            <div className="d-flex gap-2 flex-wrap">
                                                                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => (
                                                                    <div key={i} className="form-check form-check-inline">
                                                                        <input className="form-check-input" type="checkbox" id={`dow-${i}`}
                                                                            checked={scheduleForm.recurrence.daysOfWeek.includes(i)}
                                                                            onChange={e => {
                                                                                const days = scheduleForm.recurrence.daysOfWeek;
                                                                                const next = e.target.checked ? [...days, i] : days.filter(x => x !== i);
                                                                                setScheduleForm(p => ({ ...p, recurrence: { ...p.recurrence, daysOfWeek: next } }));
                                                                            }} />
                                                                        <label className="form-check-label" htmlFor={`dow-${i}`}>{d}</label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="col-md-2">
                                                        <label className="form-label fw-semibold">End date</label>
                                                        <input type="date" className="form-control"
                                                            value={scheduleForm.recurrence.endDate}
                                                            onChange={e => setScheduleForm(p => ({ ...p, recurrence: { ...p.recurrence, endDate: e.target.value } }))} />
                                                    </div>
                                                    <div className="col-md-2">
                                                        <label className="form-label fw-semibold">Max occurrences</label>
                                                        <input type="number" className="form-control" min={1}
                                                            placeholder="Unlimited"
                                                            value={scheduleForm.recurrence.maxOccurrences}
                                                            onChange={e => setScheduleForm(p => ({ ...p, recurrence: { ...p.recurrence, maxOccurrences: e.target.value } }))} />
                                                    </div>
                                                </>
                                            )}
                                            <div className="col-12 d-flex justify-content-end">
                                                <button type="submit" className="btn btn-primary" disabled={savingSchedule}>
                                                    {savingSchedule ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                                                    Add Entry
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                        {!session.schedule?.length ? (
                            <p className="text-muted">No schedule entries yet.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr><th>Title</th><th>Date & Time</th><th>Duration</th><th>Meeting</th><th>Notes</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {session.schedule.map((s, i) => (
                                            <tr key={i}>
                                                <td className="fw-semibold">
                                                    {s.title}
                                                    {s.isRecurring && <span className="badge bg-info text-dark ms-2 small"><i className="bi bi-arrow-repeat me-1"></i>{s.recurrence?.frequency}</span>}
                                                </td>
                                                <td>{new Date(s.datetime).toLocaleString()}</td>
                                                <td>{s.durationMin} min</td>
                                                <td>{s.meetingLink ? <a href={s.meetingLink} target="_blank" rel="noopener noreferrer"><i className="bi bi-camera-video"></i> Join</a> : "—"}</td>
                                                <td><small className="text-muted">{s.notes || "—"}</small></td>
                                                <td>
                                                    {canEditSession && (
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeScheduleEntry(i)}><i className="bi bi-trash"></i></button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ TAB: DEADLINES ══ */}
                {tab === "deadlines" && (
                    <div>
                        {canEditSession && (() => {
                            // Build selectable options per targetType from session's course structure
                            const courseData = session.courseId;
                            const volumes = courseData?.volumes || [];
                            const deadlineTargetOptions = (() => {
                                if (deadlineForm.targetType === "volume") {
                                    return volumes.map(v => ({ id: v.vid, label: v.title || v.vid }));
                                }
                                if (deadlineForm.targetType === "chapter") {
                                    return volumes.flatMap(v => (v.chapters || []).map(c => ({ id: c.cid, label: `${v.title || v.vid} → ${c.title || c.cid}` })));
                                }
                                if (deadlineForm.targetType === "item") {
                                    return volumes.flatMap(v => (v.chapters || []).flatMap(c => (c.items || []).map(i => ({ id: i.iid, label: `${v.title || v.vid} → ${c.title || c.cid} → ${i.title || i.iid}` }))));
                                }
                                if (deadlineForm.targetType === "assignment") {
                                    return assignments.map(a => ({ id: a._id, label: a.title }));
                                }
                                return [];
                            })();
                            return (
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-header bg-white fw-semibold">Add Deadline</div>
                                <div className="card-body">
                                    <form onSubmit={addDeadline}>
                                        <div className="row g-3">
                                            <div className="col-md-2">
                                                <label className="form-label fw-semibold">Target Type</label>
                                                <select className="form-select" value={deadlineForm.targetType}
                                                    onChange={e => setDeadlineForm(p => ({ ...p, targetType: e.target.value, targetId: "" }))}>
                                                    <option value="volume">Volume</option>
                                                    <option value="chapter">Chapter</option>
                                                    <option value="item">Item</option>
                                                    <option value="assignment">Assignment</option>
                                                </select>
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label fw-semibold">Target <span className="text-danger">*</span></label>
                                                {deadlineTargetOptions.length > 0 ? (
                                                    <select className="form-select" value={deadlineForm.targetId}
                                                        onChange={e => setDeadlineForm(p => ({ ...p, targetId: e.target.value }))}>
                                                        <option value="">Select {deadlineForm.targetType}…</option>
                                                        {deadlineTargetOptions.map(opt => (
                                                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input type="text" className="form-control" placeholder={`${deadlineForm.targetType} ID`}
                                                        value={deadlineForm.targetId} onChange={e => setDeadlineForm(p => ({ ...p, targetId: e.target.value }))} />
                                                )}
                                                <small className="text-muted">
                                                    {deadlineTargetOptions.length === 0 && "No items found — enter ID manually"}
                                                </small>
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label fw-semibold">Due At <span className="text-danger">*</span></label>
                                                <input type="datetime-local" className="form-control"
                                                    value={deadlineForm.dueAt} onChange={e => setDeadlineForm(p => ({ ...p, dueAt: e.target.value }))} />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label fw-semibold">Description</label>
                                                <input type="text" className="form-control" placeholder="Optional note"
                                                    value={deadlineForm.description} onChange={e => setDeadlineForm(p => ({ ...p, description: e.target.value }))} />
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label fw-semibold">Lock after due</label>
                                                <div className="form-check mt-2">
                                                    <input className="form-check-input" type="checkbox" id="lockAfterDue"
                                                        checked={deadlineForm.lockAfterDue}
                                                        onChange={e => setDeadlineForm(p => ({ ...p, lockAfterDue: e.target.checked }))} />
                                                    <label className="form-check-label small" htmlFor="lockAfterDue">Lock content</label>
                                                </div>
                                            </div>
                                            <div className="col-12 d-flex justify-content-end">
                                                <button type="submit" className="btn btn-primary" disabled={savingDeadline}>Add Deadline</button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            );
                        })()}
                        {!session.deadlines?.length ? (
                            <p className="text-muted">No deadlines set.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr><th>Type</th><th>Target ID</th><th>Due At</th><th>Lock?</th><th>Description</th><th>Status</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {session.deadlines.map((dl, i) => {
                                            const isPast = new Date() > new Date(dl.dueAt);
                                            return (
                                                <tr key={i}>
                                                    <td><span className="badge bg-light text-dark border">{dl.targetType}</span></td>
                                                    <td><code>{dl.targetId}</code></td>
                                                    <td className={isPast ? "text-danger" : ""}>{new Date(dl.dueAt).toLocaleString()}</td>
                                                    <td>{dl.lockAfterDue ? <i className="bi bi-lock-fill text-danger"></i> : <i className="bi bi-unlock text-muted"></i>}</td>
                                                    <td><small>{dl.description || "—"}</small></td>
                                                    <td>{isPast ? <span className="badge bg-danger">Past</span> : <span className="badge bg-success">Active</span>}</td>
                                                    <td>
                                                        {canEditSession && (
                                                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeDeadline(i)}><i className="bi bi-trash"></i></button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ TAB: GROUPS ══ */}
                {tab === "groups" && (
                    <div className="row g-3">
                        {/* Left: group list */}
                        <div className="col-md-4">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white fw-semibold">Groups ({groups.length})</div>
                                <div className="card-body p-0">
                                    {groups.map(g => (
                                        <div key={g._id}
                                            className={`p-3 border-bottom cursor-pointer d-flex justify-content-between align-items-center ${selectedGroup?._id === g._id ? "bg-primary bg-opacity-10" : ""}`}
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setSelectedGroup(g)}>
                                            <div>
                                                <div className="fw-semibold">{g.name}</div>
                                                <small className="text-muted">{g.members?.filter(m => m.status === "active").length || 0} active members</small>
                                            </div>
                                            {isHost && (
                                                <button className="btn btn-sm btn-outline-danger" onClick={e => { e.stopPropagation(); deleteGroup(g); }}>
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {groups.length === 0 && <p className="text-muted p-3 mb-0">No groups yet.</p>}
                                </div>
                                <div className="card-footer bg-white">
                                    <form onSubmit={createGroup} className="d-flex gap-2">
                                        <input type="text" className="form-control form-control-sm"
                                            placeholder="New group name" value={newGroupName}
                                            onChange={e => setNewGroupName(e.target.value)} />
                                        <button type="submit" className="btn btn-sm btn-primary">+</button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Right: selected group members */}
                        <div className="col-md-8">
                            {!selectedGroup ? (
                                <div className="text-muted text-center py-5">Select a group to manage members</div>
                            ) : (
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                        <span className="fw-semibold">{selectedGroup.name} — Members</span>
                                        <span className="badge bg-primary">{selectedGroup.members?.length || 0}</span>
                                    </div>
                                    <div className="card-body">
                                        {/* Add member — live search */}
                                        <div className="position-relative mb-3">
                                            <div className="input-group">
                                                <input type="text" className="form-control"
                                                    placeholder="Type email or nickname to search…"
                                                    value={memberSearch} onChange={e => { setMemberSearch(e.target.value); }}
                                                    autoComplete="off" />
                                                <button className="btn btn-primary" disabled={addingMember || !memberSearch.trim()}
                                                    onClick={() => addMember(selectedGroup._id)}>
                                                    {addingMember ? <span className="spinner-border spinner-border-sm" /> : "Add"}
                                                </button>
                                            </div>
                                            {memberResults.length > 0 && (
                                                <div className="border rounded bg-white shadow-sm position-absolute w-100 z-3" style={{ top: "100%", maxHeight: 200, overflowY: "auto", zIndex: 1000 }}>
                                                    {memberResults.map(u => (
                                                        <div key={u._id} className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom"
                                                            style={{ cursor: "pointer" }}
                                                            onMouseDown={e => e.preventDefault()}>
                                                            <div>
                                                                <span className="fw-semibold">{u.nickname}</span>
                                                                <small className="text-muted ms-2">{u.email}</small>
                                                            </div>
                                                            <button className="btn btn-sm btn-outline-primary"
                                                                onClick={() => { setMemberSearch(u.email); addMember(selectedGroup._id, u.email); setMemberResults([]); }}>
                                                                Add
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {session.courseType !== "HOSTED" && (
                                            <div className="alert alert-info small py-2 mb-3">
                                                <i className="bi bi-info-circle me-1"></i>
                                                <strong>{session.courseType}</strong> — students must own the course before being added.
                                            </div>
                                        )}
                                        {/* Member table */}
                                        {!selectedGroup.members?.length ? (
                                            <p className="text-muted">No members yet.</p>
                                        ) : (
                                            <table className="table table-sm align-middle">
                                                <thead className="table-light">
                                                    <tr><th>Nickname</th><th>Status</th><th>Joined</th><th></th></tr>
                                                </thead>
                                                <tbody>
                                                    {selectedGroup.members.map(m => (
                                                        <tr key={m._id}>
                                                            <td>
                                                                <div className="fw-semibold">{m.userId?.nickname || "—"}</div>
                                                                <small className="text-muted">{m.userId?.email}</small>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${m.status === "active" ? "bg-success" : m.status === "dropped" ? "bg-danger" : "bg-secondary"}`}>
                                                                    {m.status}
                                                                </span>
                                                            </td>
                                                            <td><small>{new Date(m.joinedAt).toLocaleDateString()}</small></td>
                                                            <td>
                                                                <button className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => removeMember(selectedGroup._id, m.userId?._id || m.userId, m.userId?.nickname)}>
                                                                    <i className="bi bi-x-lg"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══ TAB: ASSIGNMENTS ══ */}
                {tab === "assignments" && (
                    <div>
                        {/* Create assignment */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-white fw-semibold">Create Assignment</div>
                            <div className="card-body">
                                <form onSubmit={createAssignment}>
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Title <span className="text-danger">*</span></label>
                                            <input type="text" className="form-control" value={assignmentForm.title}
                                                onChange={e => setAssignmentForm(p => ({ ...p, title: e.target.value }))} />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label fw-semibold">Due Date <span className="text-danger">*</span></label>
                                            <input type="datetime-local" className="form-control" value={assignmentForm.dueAt}
                                                onChange={e => setAssignmentForm(p => ({ ...p, dueAt: e.target.value }))} />
                                        </div>
                                        <div className="col-md-1">
                                            <label className="form-label fw-semibold">Scale</label>
                                            <select className="form-select" value={assignmentForm.markScale}
                                                onChange={e => setAssignmentForm(p => ({ ...p, markScale: e.target.value, maxMark: e.target.value !== "custom" ? e.target.value : p.maxMark }))}>
                                                {MARK_SCALES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label fw-semibold">Max Mark</label>
                                            <input type="number" className="form-control" value={assignmentForm.maxMark} min={1}
                                                disabled={assignmentForm.markScale !== "custom"}
                                                onChange={e => setAssignmentForm(p => ({ ...p, maxMark: e.target.value }))} />
                                            <small className="text-muted">Overdue −{overdueDeduction(assignmentForm.markScale)}</small>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label fw-semibold">Groups <span className="text-danger">*</span></label>
                                            <div className="border rounded p-2" style={{ maxHeight: 120, overflowY: "auto" }}>
                                                {groups.length === 0 && <small className="text-muted">No groups yet</small>}
                                                {groups.map(g => (
                                                    <div key={g._id} className="form-check">
                                                        <input className="form-check-input" type="checkbox" id={`grp-${g._id}`}
                                                            checked={assignmentForm.groupIds.includes(g._id)}
                                                            onChange={e => {
                                                                const ids = assignmentForm.groupIds;
                                                                setAssignmentForm(p => ({ ...p, groupIds: e.target.checked ? [...ids, g._id] : ids.filter(x => x !== g._id) }));
                                                            }} />
                                                        <label className="form-check-label small" htmlFor={`grp-${g._id}`}>{g.name}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Description</label>
                                            <textarea className="form-control" rows={2} value={assignmentForm.description}
                                                onChange={e => setAssignmentForm(p => ({ ...p, description: e.target.value }))} />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Task files <span className="text-muted small">(optional, .pdf/.zip/.txt)</span></label>
                                            <input type="file" className="form-control" multiple accept=".pdf,.zip,.txt"
                                                onChange={e => setAssignmentForm(p => ({ ...p, files: Array.from(e.target.files) }))} />
                                            {assignmentForm.files?.length > 0 && (
                                                <small className="text-muted">{assignmentForm.files.length} file(s) selected</small>
                                            )}
                                        </div>
                                        <div className="col-12 d-flex justify-content-end">
                                            <button type="submit" className="btn btn-primary" disabled={savingAssignment}>
                                                {savingAssignment ? <span className="spinner-border spinner-border-sm me-2" /> : null}Create Assignment
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* All assignments across all groups */}
                        {assignments.length === 0 && (
                            <p className="text-muted">No assignments yet. Create one above.</p>
                        )}

                        {assignments.map(a => {
                            const subs = submissions[a._id] || [];
                            const isOverdue = new Date() > new Date(a.dueAt);
                            const assignmentGroup = groups.find(g => g._id === (a.groupId?._id || a.groupId));
                            return (
                                <div key={a._id} className="card border-0 shadow-sm mb-3">
                                    <div className="card-header bg-white d-flex align-items-center justify-content-between">
                                        <div>
                                            <span className="fw-semibold">{a.title}</span>
                                            <span className="badge bg-light text-dark border ms-2">{a.markScale}-pt scale</span>
                                            <span className="badge bg-light text-dark border ms-1">max {a.maxMark}</span>
                                            {assignmentGroup && <span className="badge bg-secondary ms-1"><i className="bi bi-people me-1"></i>{assignmentGroup.name}</span>}
                                            {isOverdue && <span className="badge bg-danger ms-1">Overdue</span>}
                                        </div>
                                        <div className="d-flex gap-2 align-items-center">
                                            <small className="text-muted">Due: {new Date(a.dueAt).toLocaleString()}</small>
                                            <button className="btn btn-sm btn-outline-secondary"
                                                onClick={() => { loadSubmissions(selectedGroup?._id || groups[0]?._id, a._id); }}>
                                                <i className="bi bi-arrow-clockwise me-1"></i>Submissions
                                            </button>
                                            {canGrade && (
                                                <>
                                                    <button className="btn btn-sm btn-outline-warning"
                                                        onClick={() => editingAssignment === a._id ? setEditingAssignment(null) : startEditAssignment(a)}>
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger"
                                                        onClick={() => deleteAssignment(a)}>
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Inline edit form */}
                                    {editingAssignment === a._id && editForm && (
                                        <div className="card-body bg-light border-bottom">
                                            <div className="row g-2">
                                                <div className="col-md-4">
                                                    <label className="form-label small fw-semibold">Title</label>
                                                    <input type="text" className="form-control form-control-sm" value={editForm.title}
                                                        onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                                                </div>
                                                <div className="col-md-2">
                                                    <label className="form-label small fw-semibold">Due Date</label>
                                                    <input type="datetime-local" className="form-control form-control-sm" value={editForm.dueAt}
                                                        onChange={e => setEditForm(p => ({ ...p, dueAt: e.target.value }))} />
                                                </div>
                                                <div className="col-md-1">
                                                    <label className="form-label small fw-semibold">Scale</label>
                                                    <select className="form-select form-select-sm" value={editForm.markScale}
                                                        onChange={e => setEditForm(p => ({ ...p, markScale: e.target.value, maxMark: e.target.value !== "custom" ? e.target.value : p.maxMark }))}>
                                                        {MARK_SCALES.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-md-1">
                                                    <label className="form-label small fw-semibold">Max Mark</label>
                                                    <input type="number" className="form-control form-control-sm" value={editForm.maxMark} min={1}
                                                        disabled={editForm.markScale !== "custom"}
                                                        onChange={e => setEditForm(p => ({ ...p, maxMark: e.target.value }))} />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label small fw-semibold">Description</label>
                                                    <textarea className="form-control form-control-sm" rows={2} value={editForm.description}
                                                        onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                                                </div>
                                                {/* Existing task files */}
                                                {a.taskFiles?.length > 0 && (
                                                    <div className="col-12">
                                                        <label className="form-label small fw-semibold">Current files</label>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {a.taskFiles.filter(f => !editForm.removedFiles?.includes(f.filename)).map((f, fi) => (
                                                                <span key={fi} className="badge bg-light text-dark border d-flex align-items-center gap-1">
                                                                    <i className="bi bi-file-earmark"></i>{f.originalName || f.filename}
                                                                    <button type="button" className="btn-close btn-close-sm ms-1" style={{ fontSize: 8 }}
                                                                        onClick={() => setEditForm(p => ({ ...p, removedFiles: [...(p.removedFiles||[]), f.filename] }))} />
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="col-12">
                                                    <label className="form-label small fw-semibold">Add files</label>
                                                    <input type="file" className="form-control form-control-sm" multiple accept=".pdf,.zip,.txt"
                                                        onChange={e => setEditForm(p => ({ ...p, newFiles: Array.from(e.target.files) }))} />
                                                </div>
                                                <div className="col-12 d-flex gap-2 justify-content-end">
                                                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingAssignment(null)}>Cancel</button>
                                                    <button className="btn btn-sm btn-primary" disabled={savingEdit} onClick={() => saveEditAssignment(a)}>
                                                        {savingEdit ? <span className="spinner-border spinner-border-sm me-1" /> : null}Save
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {a.description && !editingAssignment !== a._id && <div className="card-body pt-2 pb-2 text-muted small">{a.description}</div>}

                                    {/* Submissions */}
                                    {subs.length > 0 && (
                                        <div className="card-body pt-0">
                                            <table className="table table-sm align-middle mb-0">
                                                <thead className="table-light">
                                                    <tr><th>Student</th><th>Submitted</th><th>Overdue?</th><th>Status</th><th>Mark</th><th>Actions</th></tr>
                                                </thead>
                                                <tbody>
                                                    {subs.map(s => {
                                                        const studentId = String(s.studentId?._id || s.studentId);
                                                        const isGrading = gradingId === `${a._id}-${studentId}`;
                                                        // console.log(`${API}/submissions/${selectedGroup._id}/${a._id}/${studentId}/file`)
                                                        // console.log(`${selectedGroup}`)
                                                        return (
                                                            <tr key={studentId}>
                                                                <td><small>{s.studentId?.nickname || studentId}</small></td>
                                                                <td><small>{new Date(s.submittedAt).toLocaleString()}</small></td>
                                                                <td>{s.isOverdue ? <span className="badge bg-warning text-dark">Yes</span> : <span className="text-muted">No</span>}</td>
                                                                <td>
                                                                    <span className={`badge ${s.status === "approved" ? "bg-success" : s.status === "declined" ? "bg-danger" : "bg-secondary"}`}>
                                                                        {s.status}
                                                                    </span>
                                                                </td>
                                                                <td>{s.mark !== null && s.mark !== undefined ? `${s.mark}/${a.maxMark}` : "—"}</td>
                                                                <td>
                                                                    <div className="d-flex gap-1 flex-wrap">
                                                                        <button className="btn btn-sm btn-outline-info" onClick={console.log(selectedGroup)} ><i className="bi bi-download"></i> Download</button>
                                                                        {/* <a className="btn btn-sm btn-outline-info"
                                                                            href={`${API}/submissions/${selectedGroup._id}/${a._id}/${studentId}/file`}
                                                                            target="_blank" rel="noopener noreferrer" title="Download">
                                                                            <i className="bi bi-download"></i>
                                                                        </a> */}
                                                                        {canGrade && s.status !== "approved" && (
                                                                            <button className="btn btn-sm btn-outline-primary"
                                                                                onClick={() => { setGradingId(`${a._id}-${studentId}`); setGradeForm({ mark: s.mark || "", feedback: s.feedback || "", status: "approved" }); }}>
                                                                                <i className="bi bi-pencil"></i>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {isGrading && (
                                                                        <div className="mt-2 p-2 border rounded bg-light">
                                                                            <div className="d-flex gap-2 mb-2">
                                                                                <input type="number" className="form-control form-control-sm" placeholder="Mark"
                                                                                    style={{ width: 80 }} value={gradeForm.mark}
                                                                                    onChange={e => setGradeForm(p => ({ ...p, mark: e.target.value }))}
                                                                                    min={0} max={a.maxMark} />
                                                                                <select className="form-select form-select-sm" style={{ width: 120 }}
                                                                                    value={gradeForm.status} onChange={e => setGradeForm(p => ({ ...p, status: e.target.value }))}>
                                                                                    <option value="approved">Approve</option>
                                                                                    <option value="declined">Decline</option>
                                                                                </select>
                                                                            </div>
                                                                            <textarea className="form-control form-control-sm mb-2" rows={2} placeholder="Feedback (optional)"
                                                                                value={gradeForm.feedback} onChange={e => setGradeForm(p => ({ ...p, feedback: e.target.value }))} />
                                                                            <div className="d-flex gap-2">
                                                                                <button className="btn btn-sm btn-primary" onClick={() => submitGrade(selectedGroup._id, a._id, studentId)}>Save</button>
                                                                                <button className="btn btn-sm btn-outline-secondary" onClick={() => setGradingId(null)}>Cancel</button>
                                                                            </div>
                                                                            {s.isOverdue && (
                                                                                <small className="text-warning d-block mt-1">
                                                                                    ⚠ Overdue — {a.overdueDeduction} point(s) will be deducted from entered mark.
                                                                                </small>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ══ TAB: CO-TUTORS ══ */}
                {tab === "tutors" && (
                    <div>
                        {isHost && (
                            <div className="card border-0 shadow-sm mb-4">
                                <div className="card-header bg-white fw-semibold">Add Co-tutor</div>
                                <div className="card-body">
                                    <div className="position-relative mb-2">
                                        <input type="text" className="form-control" placeholder="Type tutor email or nickname to search…"
                                            value={coTutorSearch} onChange={e => setCoTutorSearch(e.target.value)}
                                            autoComplete="off" />
                                        {coTutorSearch.trim().length >= 2 && coTutorResults.length === 0 && (
                                            <small className="text-muted ms-1">No tutors found</small>
                                        )}
                                    </div>
                                    {coTutorResults.length > 0 && (
                                        <div className="border rounded" style={{ maxHeight: 200, overflowY: "auto" }}>
                                            {coTutorResults.map(u => (
                                                <div key={u._id} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                                                    <div>
                                                        <span className="fw-semibold">{u.nickname}</span>
                                                        <small className="text-muted ms-2">{u.email}</small>
                                                        {u.tutorRank && <span className="badge bg-light text-dark border ms-2">{u.tutorRank}</span>}
                                                    </div>
                                                    <button className="btn btn-sm btn-primary" onClick={() => { addCoTutor(u._id); setCoTutorSearch(""); setCoTutorResults([]); }}>Add</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {!session.coTutors?.length ? (
                            <p className="text-muted">No co-tutors yet.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr><th>Name</th><th>Sub-rank</th><th>Can Grade</th><th>Can Schedule</th><th>Can Edit Copy</th><th></th></tr>
                                    </thead>
                                    <tbody>
                                        {session.coTutors.map(ct => {
                                            const u = ct.userId;
                                            const uid = String(u?._id || u);
                                            return (
                                                <tr key={uid}>
                                                    <td>
                                                        <div className="fw-semibold">{u?.nickname || uid}</div>
                                                        <small className="text-muted">{u?.email}</small>
                                                    </td>
                                                    <td>{u?.tutorRank ? <span className="badge bg-light text-dark border">{u.tutorRank}</span> : "—"}</td>
                                                    {isHost ? (
                                                        <>
                                                            <td>
                                                                <div className="form-check form-switch m-0">
                                                                    <input className="form-check-input" type="checkbox" checked={ct.canGrade}
                                                                        onChange={() => toggleCoTutorPerm(uid, "canGrade")} />
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="form-check form-switch m-0">
                                                                    <input className="form-check-input" type="checkbox" checked={ct.canSchedule}
                                                                        onChange={() => toggleCoTutorPerm(uid, "canSchedule")} />
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="form-check form-switch m-0">
                                                                    <input className="form-check-input" type="checkbox" checked={ct.canEditCopy}
                                                                        onChange={() => toggleCoTutorPerm(uid, "canEditCopy")} />
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <button className="btn btn-sm btn-outline-danger" onClick={() => removeCoTutor(uid)}>
                                                                    <i className="bi bi-x-lg"></i>
                                                                </button>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td>{ct.canGrade ? "✓" : "—"}</td>
                                                            <td>{ct.canSchedule ? "✓" : "—"}</td>
                                                            <td>{ct.canEditCopy ? "✓" : "—"}</td>
                                                            <td></td>
                                                        </>
                                                    )}
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

            <UtilityModal show={modal.show} type={modal.type} title={modal.title} message={modal.message}
                danger={modal.danger} confirmToken={modal.confirmToken} tokenLabel={modal.tokenLabel}
                deleteLabel={modal.deleteLabel || "Delete"}
                onConfirm={() => { modal.onConfirm?.(); closeModal(); }}
                onDelete={() => { modal.onDelete?.(); closeModal(); }}
                onCancel={modal.onCancel || closeModal} onClose={modal.onClose || closeModal} />
        </>
    );
}

export default ManageSession;
