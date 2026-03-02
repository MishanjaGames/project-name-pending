import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
// ─── Constants ────────────────────────────────────────────────────────────────

const KNOWLEDGE_TYPES = ["Academic", "Professional", "Practical", "Research"];

const SUBJECTS_BY_TYPE = {
    Academic: ["Mathematics", "Physics", "Chemistry", "Biology", "History", "Literature"],
    Professional: ["Design", "Coding", "Marketing", "Management", "Finance", "Law"],
    Practical: ["Cooking", "Crafts", "Music", "Sports", "Photography", "Woodworking"],
    Research: ["Data Science", "Machine Learning", "Psychology", "Sociology", "Economics"],
};

const KNOWLEDGE_SOURCES = ["Self-taught", "University Degree", "Online Course", "Bootcamp", "Apprenticeship", "Certification"];

const ICON = {
    close: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
        </svg>
    ),
    edit: (
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.203.134l-4 1.5a.5.5 0 0 1-.635-.635l1.5-4a.5.5 0 0 1 .134-.203l10-10z" />
        </svg>
    ),
    trash: (
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3h11V2h-11v1z" />
        </svg>
    ),
    upload: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
            <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
        </svg>
    ),
    file: (
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0H4zm5.5 0v4a.5.5 0 0 0 .5.5H14L9.5 0z" />
        </svg>
    ),
    link: (
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 10H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z" />
            <path d="M9 5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9z" />
        </svg>
    ),
    pencil: (
        <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.203.134l-4 1.5a.5.5 0 0 1-.635-.635l1.5-4a.5.5 0 0 1 .134-.203l10-10z" />
        </svg>
    ),
};

// ─── Empty skill template ─────────────────────────────────────────────────────

const emptySkill = () => ({
    type: "",
    subject: "",
    experience: 0,
    source: "",
    certificates: [],   // { file, name } objects
    examples: [],       // { kind: 'file'|'link', file?, name, url? }
});

// ─── FileRow component ────────────────────────────────────────────────────────

function FileRow({ icon, name, onEdit, onRemove }) {
    return (
        <div className="d-flex align-items-center justify-content-between rounded px-2 py-1 mb-1"
            style={{ background: "#f8f9fa", border: "1px solid #dee2e6", fontSize: "0.82rem" }}>
            <span className="d-flex align-items-center gap-2 text-truncate">
                <span className="text-muted">{icon}</span>
                <span className="text-truncate" style={{ maxWidth: 180 }}>{name}</span>
            </span>
            <span className="d-flex align-items-center gap-2 ms-2">
                {onEdit && (
                    <button type="button" className="btn btn-link btn-sm p-0 text-warning" onClick={onEdit} title="Edit">
                        {ICON.pencil}
                    </button>
                )}
                <button type="button" className="btn btn-link btn-sm p-0 text-danger" onClick={onRemove} title="Remove">
                    {ICON.close}
                </button>
            </span>
        </div>
    );
}

// ─── SkillModal component ─────────────────────────────────────────────────────

function SkillModal({ show, skill, onClose, onSave }) {
    const [form, setForm] = useState(skill || emptySkill());
    const [errors, setErrors] = useState({});
    const [exampleUrl, setExampleUrl] = useState("");
    const certRef = useRef();
    const exampleFileRef = useRef();

    // Sync with parent skill prop
    useState(() => { setForm(skill || emptySkill()); setErrors({}); }, [skill]);

    if (!show) return null;

    const set = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
    };

    const validate = () => {
        const e = {};
        if (!form.type) e.type = "Required";
        if (!form.subject) e.subject = "Required";
        if (form.experience < 0) e.experience = "Must be ≥ 0";
        if (!form.source) e.source = "Required";
        if (form.certificates.length === 0) e.certificates = "At least one certificate/diploma is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleAddCert = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (!file.type.startsWith("image/") && file.type !== "application/pdf") return;
            set("certificates", [...form.certificates, { file, name: file.name }]);
        });
        e.target.value = "";
        if (errors.certificates) setErrors(prev => ({ ...prev, certificates: "" }));
    };

    const handleAddExampleFile = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            set("examples", [...form.examples, { kind: "file", file, name: file.name }]);
        });
        e.target.value = "";
    };

    const handleAddExampleUrl = () => {
        const url = exampleUrl.trim();
        if (!url) return;
        set("examples", [...form.examples, { kind: "link", name: url, url }]);
        setExampleUrl("");
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave(form);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1040 }}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="modal fade show d-block"
                style={{ zIndex: 1050 }}
                tabIndex="-1"
            >
                <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow-lg">

                        {/* Header */}
                        <div className="modal-header border-bottom">
                            <h5 className="modal-title fw-bold">
                                {skill && skill._editing ? "Edit Skill" : "Add Skill"}
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>

                        {/* Body */}
                        <div className="modal-body p-4">
                            <div className="row g-3">

                                {/* Type of knowledge */}
                                <div className="col-12">
                                    <label className="form-label fw-semibold">
                                        Type of knowledge <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className={`form-select ${errors.type ? "is-invalid" : ""}`}
                                        value={form.type}
                                        onChange={e => { set("type", e.target.value); set("subject", ""); }}
                                    >
                                        <option value="">Select type…</option>
                                        {KNOWLEDGE_TYPES.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                    {errors.type && <div className="invalid-feedback">{errors.type}</div>}
                                </div>

                                {/* Subject */}
                                <div className="col-12">
                                    <label className="form-label fw-semibold">
                                        Subject <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className={`form-select ${errors.subject ? "is-invalid" : ""}`}
                                        value={form.subject}
                                        onChange={e => set("subject", e.target.value)}
                                        disabled={!form.type}
                                    >
                                        <option value="">Select subject…</option>
                                        {(SUBJECTS_BY_TYPE[form.type] || []).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    {!form.type && <small className="text-muted">Select type first</small>}
                                    {errors.subject && <div className="invalid-feedback">{errors.subject}</div>}
                                </div>

                                {/* Experience */}
                                <div className="col-12">
                                    <label className="form-label fw-semibold">
                                        Experience (in full years) <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        className={`form-control ${errors.experience ? "is-invalid" : ""}`}
                                        value={form.experience}
                                        min={0}
                                        onChange={e => set("experience", parseInt(e.target.value, 10) || 0)}
                                    />
                                    {errors.experience && <div className="invalid-feedback">{errors.experience}</div>}
                                </div>

                                {/* Source of knowledge */}
                                <div className="col-12">
                                    <label className="form-label fw-semibold">
                                        Source of knowledge <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className={`form-select ${errors.source ? "is-invalid" : ""}`}
                                        value={form.source}
                                        onChange={e => set("source", e.target.value)}
                                    >
                                        <option value="">Select source…</option>
                                        {KNOWLEDGE_SOURCES.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    {errors.source && <div className="invalid-feedback">{errors.source}</div>}
                                </div>

                                {/* Certificate / Diploma */}
                                <div className="col-12">
                                    <label className="form-label fw-semibold">
                                        Certificate / Diploma (with grades) <span className="text-danger">*</span>
                                    </label>

                                    <input
                                        ref={certRef}
                                        type="file"
                                        className="d-none"
                                        accept="image/*,application/pdf"
                                        multiple
                                        onChange={handleAddCert}
                                    />

                                    <div
                                        className={`border rounded p-3 text-center mb-2 ${errors.certificates ? "border-danger" : "border-dashed"}`}
                                        style={{
                                            cursor: "pointer",
                                            borderStyle: "dashed",
                                            background: "#f8f9fa",
                                            minHeight: 64,
                                        }}
                                        onClick={() => certRef.current.click()}
                                    >
                                        <div className="text-muted small">
                                            {ICON.upload}
                                            <span className="ms-2">Add files</span>
                                            <div className="mt-1" style={{ fontSize: "0.75rem" }}>PDF or image accepted</div>
                                        </div>
                                    </div>

                                    {errors.certificates && (
                                        <div className="text-danger small mb-1">{errors.certificates}</div>
                                    )}

                                    {form.certificates.map((c, i) => (
                                        <FileRow
                                            key={i}
                                            icon={ICON.file}
                                            name={c.name}
                                            onRemove={() => set("certificates", form.certificates.filter((_, j) => j !== i))}
                                        />
                                    ))}
                                </div>

                                {/* Examples of work */}
                                <div className="col-12">
                                    <label className="form-label fw-semibold">
                                        Examples of work <span className="text-danger">*</span>
                                    </label>

                                    <input
                                        ref={exampleFileRef}
                                        type="file"
                                        className="d-none"
                                        accept=".zip,application/zip"
                                        multiple
                                        onChange={handleAddExampleFile}
                                    />

                                    <div
                                        className="border rounded p-3 text-center mb-2"
                                        style={{
                                            cursor: "pointer",
                                            borderStyle: "dashed",
                                            background: "#f8f9fa",
                                            minHeight: 64,
                                        }}
                                        onClick={() => exampleFileRef.current.click()}
                                    >
                                        <div className="text-muted small">
                                            {ICON.upload}
                                            <span className="ms-2">Add archive or paste link to cloud storage with files</span>
                                        </div>
                                    </div>

                                    <div className="input-group mb-2">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Or paste cloud storage link (Google Drive, Dropbox…)"
                                            value={exampleUrl}
                                            onChange={e => setExampleUrl(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddExampleUrl())}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={handleAddExampleUrl}
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {form.examples.map((ex, i) => (
                                        <FileRow
                                            key={i}
                                            icon={ex.kind === "link" ? ICON.link : ICON.file}
                                            name={ex.name}
                                            onRemove={() => set("examples", form.examples.filter((_, j) => j !== i))}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="modal-footer border-top">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-primary px-4" onClick={handleSave}>
                                {skill && skill._editing ? "UPDATE" : "ADD"}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}

// ─── SkillRow component ───────────────────────────────────────────────────────

function SkillRow({ skill, onEdit, onDelete }) {
    return (
        <div
            className="d-flex align-items-center justify-content-between rounded px-3 py-2 mb-2"
            style={{ border: "1px solid #dee2e6", background: "#fff", fontSize: "0.875rem" }}
        >
            <span className="d-flex flex-wrap gap-2 align-items-center text-truncate">
                <span className="fw-semibold">{skill.type}</span>
                <span className="text-muted">|</span>
                <span>{skill.subject}</span>
                <span className="text-muted">|</span>
                <span>{skill.experience} yr{skill.experience !== 1 ? "s" : ""}</span>
                <span className="text-muted">|</span>
                <span className="text-muted">{skill.source}</span>
                {skill.certificates.length > 0 && (
                    <>
                        <span className="text-muted">|</span>
                        <span className="badge bg-success-subtle text-success-emphasis">
                            {skill.certificates.length} cert{skill.certificates.length !== 1 ? "s" : ""}
                        </span>
                    </>
                )}
            </span>
            <span className="d-flex gap-1 ms-3 flex-shrink-0">
                <button
                    type="button"
                    className="btn btn-warning btn-sm d-flex align-items-center justify-content-center"
                    style={{ width: 28, height: 28, padding: 0 }}
                    onClick={onEdit}
                    title="Edit skill"
                >
                    {ICON.edit}
                </button>
                <button
                    type="button"
                    className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
                    style={{ width: 28, height: 28, padding: 0 }}
                    onClick={onDelete}
                    title="Delete skill"
                >
                    {ICON.trash}
                </button>
            </span>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

function CreatorForm({data, onLogout}) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        about: "",
        skills: [],
        agreed: false,
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState(null);   // null = adding new
    const [editingIndex, setEditingIndex] = useState(null);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const openAddSkill = () => {
        setEditingSkill({ ...emptySkill() });
        setEditingIndex(null);
        setModalOpen(true);
    };

    const openEditSkill = (idx) => {
        setEditingSkill({ ...formData.skills[idx], _editing: true });
        setEditingIndex(idx);
        setModalOpen(true);
    };

    const handleModalSave = (skill) => {
        if (editingIndex !== null) {
            setFormData(prev => {
                const updated = [...prev.skills];
                updated[editingIndex] = skill;
                return { ...prev, skills: updated };
            });
        } else {
            setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
        }
        if (errors.skills) setErrors(prev => ({ ...prev, skills: "" }));
        setModalOpen(false);
    };

    const handleDeleteSkill = (idx) => {
        if (!window.confirm("Remove this skill?")) return;
        setFormData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== idx) }));
    };

    const validate = () => {
        const e = {};
        if (!formData.firstName.trim()) e.firstName = "First name is required";
        if (!formData.lastName.trim()) e.lastName = "Last name is required";
        if (!formData.about.trim()) e.about = "Please tell us about yourself";
        if (formData.skills.length === 0) e.skills = "Add at least one skill";
        if (!formData.agreed) e.agreed = "You must agree to the terms";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        // Simulate API call
        console.log(formData)
        setSubmitting(false);
        setSubmitted(true);
    };

    // ── Success screen ─────────────────────────────────────────────────────────

    if (submitted) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center p-4"
                style={{ background: "#f0f4f8" }}>
                <div className="card border-0 shadow-sm text-center p-5" style={{ maxWidth: 420 }}>
                    <div className="mb-3">
                        <span className="badge bg-success rounded-circle p-3" style={{ fontSize: "1.5rem" }}>✓</span>
                    </div>
                    <h4 className="fw-bold mb-2">Application submitted!</h4>
                    <p className="text-muted mb-4">
                        An administrator will review your application and contact you soon.
                    </p>
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => { setSubmitted(false); setFormData({ firstName: "", lastName: "", about: "", skills: [], agreed: false }); }}
                    >
                        Submit another
                    </button>
                    <br/>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => { setSubmitted(false); navigate('/manage/courses') }}
                    >
                        Return
                    </button>
                </div>
            </div>
        );
    }

    // ── Main form ──────────────────────────────────────────────────────────────

    return (
        <>
            <Navbar data={data} onLogout={onLogout} />
            <div className="min-vh-100 p-3 p-md-5" style={{ background: "#f0f4f8" }}>
                <div className="row justify-content-center">
                    <div className="col-12 col-lg-7 col-xl-6">

                        {/* Card */}
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-4 p-md-5">

                                {/* Header */}
                                <div className="mb-4">
                                    <h2 className="h4 fw-bold text-dark mb-1">Teacher application</h2>
                                    <p className="text-muted small mb-0">
                                        Fill the form to apply for a teacher role. An administrator will contact you after review.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="row g-3">

                                        {/* First name */}
                                        <div className="col-12 col-sm-6">
                                            <label htmlFor="firstName" className="form-label fw-semibold">
                                                First Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="firstName"
                                                name="firstName"
                                                className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                                                placeholder="Evguene"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                            />
                                            {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                                        </div>

                                        {/* Last name */}
                                        <div className="col-12 col-sm-6">
                                            <label htmlFor="lastName" className="form-label fw-semibold">
                                                Last Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="lastName"
                                                name="lastName"
                                                className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                                                placeholder="Evguene"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                            />
                                            {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                                        </div>

                                        {/* About */}
                                        <div className="col-12">
                                            <label htmlFor="about" className="form-label fw-semibold">
                                                Tell us about yourself <span className="text-danger">*</span>
                                            </label>
                                            <textarea
                                                id="about"
                                                name="about"
                                                className={`form-control ${errors.about ? "is-invalid" : ""}`}
                                                rows={4}
                                                placeholder="Very interesting story about sour patches that THAT Josh mentioned ……"
                                                value={formData.about}
                                                onChange={handleChange}
                                            />
                                            {errors.about && <div className="invalid-feedback">{errors.about}</div>}
                                        </div>

                                        {/* Skills */}
                                        <div className="col-12">
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <label className="form-label fw-semibold mb-0">
                                                    Skills <span className="text-danger">*</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    onClick={openAddSkill}
                                                >
                                                    + Add
                                                </button>
                                            </div>

                                            {errors.skills && (
                                                <div className="text-danger small mb-2">{errors.skills}</div>
                                            )}

                                            {formData.skills.length === 0 ? (
                                                <div
                                                    className="text-center text-muted small rounded py-3"
                                                    style={{ border: "1px dashed #ced4da", background: "#fafafa" }}
                                                >
                                                    No skills added yet — click <strong>+ Add</strong> to add one
                                                </div>
                                            ) : (
                                                formData.skills.map((skill, idx) => (
                                                    <SkillRow
                                                        key={idx}
                                                        skill={skill}
                                                        onEdit={() => openEditSkill(idx)}
                                                        onDelete={() => handleDeleteSkill(idx)}
                                                    />
                                                ))
                                            )}
                                        </div>

                                        {/* Agreement */}
                                        <div className="col-12">
                                            <div className="form-check">
                                                <input
                                                    type="checkbox"
                                                    id="agreed"
                                                    name="agreed"
                                                    className={`form-check-input ${errors.agreed ? "is-invalid" : ""}`}
                                                    checked={formData.agreed}
                                                    onChange={handleChange}
                                                />
                                                <label htmlFor="agreed" className="form-check-label small">
                                                    I agree to the terms and conditions of the teacher application program{" "}
                                                    <span className="text-danger">*</span>
                                                </label>
                                                {errors.agreed && <div className="invalid-feedback">{errors.agreed}</div>}
                                            </div>
                                        </div>

                                        {/* Submit */}
                                        <div className="col-12 mt-2">
                                            <button
                                                type="submit"
                                                className="btn btn-primary w-100"
                                                disabled={submitting}
                                            >
                                                {submitting ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                                        Submitting…
                                                    </>
                                                ) : "Submit"}
                                            </button>
                                        </div>

                                    </div>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Skill Modal */}
            <SkillModal
                show={modalOpen}
                skill={editingSkill}
                onClose={() => setModalOpen(false)}
                onSave={handleModalSave}
            />
        </>
    );
}

export default CreatorForm;