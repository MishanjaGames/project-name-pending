import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UtilityModal } from '../../components/UtilityModal';
import { getUser } from '../../utils/auth';
import config from '../../config/config';

const API_URL = config.API_URL;

// ── Form Configs ───────────────────────────────────────────────────────────────
const FORM_TYPES = {
  'support-ticket': {
    title: 'Support Ticket',
    description: 'Report a problem or ask a question. Our team will get back to you.',
    fields: [
      { name: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'Something doesn\'t work...' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 5, required: true, placeholder: 'Describe the issue in detail...' },
      { name: 'severity', label: 'Severity', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
    ],
    skills: null,
    icon: 'bi-headset',
    color: '#0891b2',
  },
};

// ── FileRow ─────────────────────────────────────────────────────────────────────
function FileRow({ name, onRemove }) {
  return (
    <div className="d-flex align-items-center justify-content-between rounded px-2 py-1 mb-1" style={{ background: '#f8f9fa', border: '1px solid #dee2e6', fontSize: '.82rem' }}>
      <span className="d-flex align-items-center gap-2 text-truncate">
        <i className="bi bi-file-earmark text-muted" /><span className="text-truncate" style={{ maxWidth: 200 }}>{name}</span>
      </span>
      <button type="button" className="btn btn-link btn-sm p-0 text-danger ms-2" onClick={onRemove}><i className="bi bi-x-lg" /></button>
    </div>
  );
}

// ── SkillModal ─────────────────────────────────────────────────────────────────
const KNOWLEDGE_TYPES = ['Academic', 'Professional', 'Practical', 'Research'];
const SUBJECTS_BY_TYPE = { Academic: ['Mathematics','Physics','Chemistry','Biology','History','Literature'], Professional: ['Design','Coding','Marketing','Management','Finance','Law'], Practical: ['Cooking','Crafts','Music','Sports','Photography','Woodworking'], Research: ['Data Science','Machine Learning','Psychology','Sociology','Economics'] };
const KNOWLEDGE_SOURCES = ['Self-taught','University Degree','Online Course','Bootcamp','Apprenticeship','Certification'];

function SkillModal({ show, skill, onClose, onSave }) {
  const empty = () => ({ type:'', subject:'', experience: 0, source:'', certificates:[], examples:[] });
  const [form, setForm] = useState(skill || empty());
  const [errors, setErrors] = useState({});
  const [exUrl, setExUrl] = useState('');
  const certRef = useRef(); const exFileRef = useRef();

  useEffect(() => { if (show) { setForm(skill || empty()); setErrors({}); setExUrl(''); } }, [show, skill]);
  if (!show) return null;

  const set = (field, value) => { setForm(p => ({ ...p, [field]: value })); if (errors[field]) setErrors(p => ({ ...p, [field]: '' })); };
  const validate = () => {
    const e = {};
    if (!form.type) e.type = 'Required'; if (!form.subject) e.subject = 'Required';
    if (form.experience < 0) e.experience = 'Must be ≥ 0'; if (!form.source) e.source = 'Required';
    if (!form.certificates.length) e.certificates = 'At least one certificate required';
    setErrors(e); return !Object.keys(e).length;
  };

  const subjects = SUBJECTS_BY_TYPE[form.type] || [];
  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
      <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header"><h5 className="modal-title fw-bold">{skill?._editing ? 'Edit Skill' : 'Add Skill'}</h5><button className="btn-close" onClick={onClose} /></div>
            <div className="modal-body p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Type <span className="text-danger">*</span></label>
                  <select className={`form-select ${errors.type ? 'is-invalid' : ''}`} value={form.type} onChange={e => { set('type', e.target.value); set('subject', ''); }}>
                    <option value="">Select type…</option>{KNOWLEDGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.type && <div className="invalid-feedback">{errors.type}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Subject <span className="text-danger">*</span></label>
                  <select className={`form-select ${errors.subject ? 'is-invalid' : ''}`} value={form.subject} onChange={e => set('subject', e.target.value)} disabled={!form.type}>
                    <option value="">Select subject…</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.subject && <div className="invalid-feedback">{errors.subject}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Experience (years) <span className="text-danger">*</span></label>
                  <input type="number" className={`form-control ${errors.experience ? 'is-invalid' : ''}`} value={form.experience} min={0} onChange={e => set('experience', parseInt(e.target.value) || 0)} />
                  {errors.experience && <div className="invalid-feedback">{errors.experience}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Source of knowledge <span className="text-danger">*</span></label>
                  <select className={`form-select ${errors.source ? 'is-invalid' : ''}`} value={form.source} onChange={e => set('source', e.target.value)}>
                    <option value="">Select source…</option>{KNOWLEDGE_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.source && <div className="invalid-feedback">{errors.source}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Certificates <span className="text-danger">*</span></label>
                  <input ref={certRef} type="file" className="d-none" accept="image/*,application/pdf" multiple onChange={e => { Array.from(e.target.files).forEach(f => set('certificates', [...form.certificates, { file: f, name: f.name }])); e.target.value = ''; if (errors.certificates) setErrors(p => ({ ...p, certificates: '' })); }} />
                  <div className="border rounded p-3 text-center mb-2" style={{ cursor: 'pointer', borderStyle: 'dashed', background: '#f8f9fa' }} onClick={() => certRef.current.click()}>
                    <i className="bi bi-upload text-muted me-2" /><span className="text-muted small">Add PDF or image</span>
                  </div>
                  {errors.certificates && <div className="text-danger small mb-1">{errors.certificates}</div>}
                  {form.certificates.map((c, i) => <FileRow key={i} name={c.name} onRemove={() => set('certificates', form.certificates.filter((_, j) => j !== i))} />)}
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Examples of work</label>
                  <input ref={exFileRef} type="file" className="d-none" accept=".zip,application/zip" multiple onChange={e => { Array.from(e.target.files).forEach(f => set('examples', [...form.examples, { kind: 'file', file: f, name: f.name }])); e.target.value = ''; }} />
                  <div className="border rounded p-3 text-center mb-2" style={{ cursor: 'pointer', borderStyle: 'dashed', background: '#f8f9fa' }} onClick={() => exFileRef.current.click()}>
                    <i className="bi bi-upload text-muted me-2" /><span className="text-muted small">Add archive</span>
                  </div>
                  <div className="input-group mb-2">
                    <input type="text" className="form-control" placeholder="Or paste a link (Drive, Dropbox…)" value={exUrl} onChange={e => setExUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), exUrl.trim() && (set('examples', [...form.examples, { kind: 'link', name: exUrl.trim(), url: exUrl.trim() }]), setExUrl('')))} />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => { if (exUrl.trim()) { set('examples', [...form.examples, { kind: 'link', name: exUrl.trim(), url: exUrl.trim() }]); setExUrl(''); } }}>Add</button>
                  </div>
                  {form.examples.map((ex, i) => <FileRow key={i} name={ex.name} onRemove={() => set('examples', form.examples.filter((_, j) => j !== i))} />)}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary px-4" onClick={() => validate() && onSave(form)}>{skill?._editing ? 'Update' : 'Add'}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Generic field ──────────────────────────────────────────────────────────────
function FormField({ field, value, onChange, error }) {
  const { name, label, type, required, placeholder, rows, options } = field;
  const id = `ff_${name}`;
  const cls = `form-control${error ? ' is-invalid' : ''}`;
  return (
    <div className="col-12 mb-2">
      <label htmlFor={id} className="form-label fw-semibold">{label}{required && <span className="text-danger ms-1">*</span>}</label>
      {type === 'textarea' ? <textarea id={id} name={name} className={cls} rows={rows ?? 3} placeholder={placeholder} value={value} onChange={onChange} />
        : type === 'select' ? <select id={id} name={name} className={`form-select${error ? ' is-invalid' : ''}`} value={value} onChange={onChange}><option value="">Select…</option>{(options || []).map(o => <option key={o} value={o}>{o}</option>)}</select>
        : <input type={type} id={id} name={name} className={cls} placeholder={placeholder} value={value} onChange={onChange} />}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}

// ── Form component ─────────────────────────────────────────────────────────────
function ApplicationForm({ formType, onBack }) {
  const cfgMap = {
    'tutor-application': {
      title: 'Tutor Application', description: 'Apply to become a tutor. HR will contact you after review.',
      apiType: 'tutor', icon: 'bi-mortarboard', color: '#7048e8',
      fields: [
        { name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'John', col: 6 },
        { name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Smith', col: 6 },
        { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'example@email.com' },
        { name: 'about', label: 'Tell us about yourself', type: 'textarea', required: true, rows: 4, placeholder: 'Your background, teaching experience, what you are passionate about…' },
      ],
      skills: true, agreement: 'I agree to the terms and conditions of the tutor application program',
    },
    'support-ticket': {
      title: 'Support Ticket', description: 'Report a problem or ask a question.',
      apiType: 'support-ticket', icon: 'bi-headset', color: '#0891b2',
      fields: [
        { name: 'name', label: 'Your Name', type: 'text', required: true, placeholder: 'John Smith' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'example@email.com' },
        { name: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'Something doesn\'t work...' },
        { name: 'description', label: 'Description', type: 'textarea', required: true, rows: 5, placeholder: 'Describe the issue in detail...' },
        { name: 'severity', label: 'Severity', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Critical', 'Emergency'] },
      ],
      skills: false, agreement: null,
    },
  };

  const cfg = cfgMap[formType];
  const [fields, setFields] = useState(() => Object.fromEntries((cfg?.fields || []).map(f => [f.name, ''])));
  const [skills, setSkills] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [skillModal, setSkillModal] = useState(false);
  const [editSkill, setEditSkill] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [modal, setModal] = useState({ show: false });
  const closeModal = () => setModal(p => ({ ...p, show: false }));
  const showInfo = (title, message) => setModal({ show: true, type: 'info', title, message, onClose: closeModal });

  if (!cfg) return <div className="alert alert-danger">Unknown form type: {formType}</div>;

  const handleChange = e => { const { name, value } = e.target; setFields(p => ({ ...p, [name]: value })); if (errors[name]) setErrors(p => ({ ...p, [name]: '' })); };
  const validate = () => {
    const e = {};
    (cfg.fields || []).forEach(f => { if (f.required && !fields[f.name]) e[f.name] = `${f.label} is required`; });
    if (cfg.skills && !skills.length) e.skills = 'Add at least 1 skill';
    if (cfg.agreement && !agreed) e.agreed = 'You must agree to continue';
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify(fields));
      if (cfg.skills) {
        const skillsJson = skills.map(s => ({ ...s, certificates: [], examples: s.examples.filter(ex => ex.kind === 'link') }));
        fd.append('skills', JSON.stringify(skillsJson));
        skills.forEach((skill, i) => {
          skill.certificates.forEach(c => fd.append(`cert_${i}`, c.file));
          skill.examples.filter(ex => ex.kind === 'file').forEach(ex => fd.append(`example_${i}`, ex.file));
        });
      }
      const res = await fetch(`${API_URL}/forms/apply/${cfg.apiType}`, { method: 'POST', body: fd });
      if (res.ok) setSubmitted(true);
      else { const j = await res.json().catch(() => ({})); showInfo('Error', j.message || 'Submission failed.'); }
    } catch { showInfo('Error', 'Network error. Please try again.'); }
    setSubmitting(false);
  };

  if (submitted) return (
    <div className="text-center py-5">
      <div className="mb-3"><span className="badge bg-success rounded-circle p-3" style={{ fontSize: '1.5rem' }}>✓</span></div>
      <h4 className="fw-bold mb-2">Submitted!</h4>
      <p className="text-muted mb-4">{cfg.description}</p>
      <button className="btn btn-outline-primary me-2" onClick={() => { setSubmitted(false); setFields(Object.fromEntries(cfg.fields.map(f => [f.name, '']))); setSkills([]); setAgreed(false); }}>Submit another</button>
      <button className="btn btn-outline-secondary" onClick={onBack}>← Back</button>
    </div>
  );

  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>← Back</button>
        <div>
          <h4 className="fw-bold mb-0"><i className={`bi ${cfg.icon} me-2`} style={{ color: cfg.color }} />{cfg.title}</h4>
          <p className="text-muted small mb-0">{cfg.description}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        {cfg.fields.map(field => <FormField key={field.name} field={field} value={fields[field.name]} onChange={handleChange} error={errors[field.name]} />)}
        {cfg.skills && (
          <div className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <label className="form-label fw-semibold mb-0">Skills <span className="text-danger">*</span></label>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => { setEditSkill(null); setEditIdx(null); setSkillModal(true); }}>+ Add</button>
            </div>
            {errors.skills && <div className="text-danger small mb-2">{errors.skills}</div>}
            {skills.length === 0 ? (
              <div className="text-center text-muted small rounded py-3" style={{ border: '1px dashed #ced4da', background: '#fafafa' }}>No skills added yet — click <strong>+ Add</strong></div>
            ) : skills.map((skill, i) => (
              <div key={i} className="d-flex align-items-center justify-content-between rounded px-3 py-2 mb-2" style={{ border: '1px solid #dee2e6', background: '#fff', fontSize: '.875rem' }}>
                <span className="d-flex flex-wrap gap-2 align-items-center text-truncate">
                  <span className="fw-semibold">{skill.type}</span><span className="text-muted">|</span><span>{skill.subject}</span><span className="text-muted">|</span><span>{skill.experience}yr</span>
                  {skill.certificates.length > 0 && <span className="badge bg-success-subtle text-success-emphasis">{skill.certificates.length} cert{skill.certificates.length > 1 ? 's' : ''}</span>}
                </span>
                <span className="d-flex gap-1 ms-3 flex-shrink-0">
                  <button type="button" className="btn btn-warning btn-sm" style={{ width: 28, height: 28, padding: 0 }} onClick={() => { setEditSkill({ ...skill, _editing: true }); setEditIdx(i); setSkillModal(true); }}><i className="bi bi-pencil" /></button>
                  <button type="button" className="btn btn-danger btn-sm" style={{ width: 28, height: 28, padding: 0 }} onClick={() => setSkills(p => p.filter((_, j) => j !== i))}><i className="bi bi-trash" /></button>
                </span>
              </div>
            ))}
          </div>
        )}
        {cfg.agreement && (
          <div className="mb-3">
            <div className="form-check">
              <input type="checkbox" id="agreed" className={`form-check-input ${errors.agreed ? 'is-invalid' : ''}`} checked={agreed} onChange={e => { setAgreed(e.target.checked); if (errors.agreed) setErrors(p => ({ ...p, agreed: '' })); }} />
              <label htmlFor="agreed" className="form-check-label small">{cfg.agreement} <span className="text-danger">*</span></label>
              {errors.agreed && <div className="invalid-feedback">{errors.agreed}</div>}
            </div>
          </div>
        )}
        <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
          {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Submitting…</> : 'Submit'}
        </button>
      </form>
      <SkillModal show={skillModal} skill={editSkill}
        onClose={() => setSkillModal(false)}
        onSave={skill => { if (editIdx !== null) setSkills(p => { const a = [...p]; a[editIdx] = skill; return a; }); else setSkills(p => [...p, skill]); setSkillModal(false); }} />
      <UtilityModal show={modal.show} type={modal.type} title={modal.title} message={modal.message}
        onConfirm={closeModal} onCancel={closeModal} onClose={closeModal} />
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
function MyFormsPage() {
  const navigate = useNavigate();
  const { theme } = useContext(SettingsContext);
  const [view, setView] = useState('list'); // 'list' | form type key
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!getUser()) { navigate('/login'); return; }
    fetchMyForms();
  }, []);

  const fetchMyForms = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/forms/my`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); setMyApplications(d.data || []); }
    } catch {}
    setLoading(false);
  };

  const AVAILABLE_FORMS = [
    { key: 'tutor-application', title: 'Tutor Application', description: 'Apply to become a tutor on the platform.', icon: 'bi-mortarboard', color: '#7048e8' },
    { key: 'support-ticket', title: 'Support Ticket', description: 'Report a problem or ask a question.', icon: 'bi-headset', color: '#0891b2' },
  ];

  if (view !== 'list') return (
    <div className="min-vh-100 py-4 page-bg">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="card border-0 shadow-sm p-4">
          <ApplicationForm formType={view} onBack={() => { setView('list'); fetchMyForms(); }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-vh-100 py-4 page-bg">
      <div className="container">
        <div className="mb-4">
          <h2 className="fw-bold mb-1">My Forms & Applications</h2>
          <p className="text-muted mb-0">Submit applications or report issues</p>
        </div>

        {/* Available forms */}
        <h5 className="fw-semibold mb-3">Available Forms</h5>
        <div className="row g-3 mb-5">
          {AVAILABLE_FORMS.map(f => (
            <div key={f.key} className="col-md-6">
              <div className="card border-0 shadow-sm h-100" style={{ cursor: 'pointer', borderRadius: 12 }} onClick={() => setView(f.key)}>
                <div className="card-body d-flex align-items-center gap-3 p-4">
                  <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 52, height: 52, background: `${f.color}18` }}>
                    <i className={`bi ${f.icon}`} style={{ color: f.color, fontSize: '1.4rem' }} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">{f.title}</h6>
                    <p className="text-muted small mb-0">{f.description}</p>
                  </div>
                  <i className="bi bi-chevron-right text-muted ms-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* My submissions */}
        <h5 className="fw-semibold mb-3">My Submissions</h5>
        {loading ? <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-primary" /></div>
          : myApplications.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-2 mb-2 d-block" style={{ opacity: .3 }} />
              <p className="small">No submissions yet</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {myApplications.map(app => (
                <div key={app._id} className="card border-0 shadow-sm">
                  <div className="card-body p-3 d-flex align-items-center gap-3">
                    <i className="bi bi-file-earmark-text text-muted fs-5" />
                    <div className="flex-grow-1">
                      <div className="fw-semibold small">{app.formType || 'Application'}</div>
                      <div className="text-muted" style={{ fontSize: '.75rem' }}>{new Date(app.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`badge ${app.status === 'approved' ? 'bg-success' : app.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                      {app.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

export default MyFormsPage;