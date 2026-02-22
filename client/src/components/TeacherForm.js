import React, { useState, useContext } from 'react';
import './TeacherForm.css';
import { submitTeacherApplication } from '../utils/teacher';
import { SettingsContext } from '../contexts/SettingsContext';

// TeacherForm
// - Client-side validation
// - Builds FormData and sends to backend via submitTeacherApplication
// Backend integration notes (to help the backend colleague):
// Expected POST /api/teacher-applications (multipart/form-data)
// Fields:
//  - name (string, required)
//  - email (string, required)
//  - bio (string, required, min length 50)
//  - subjects (string, comma-separated)
//  - experience (number, optional)
//  - cert (file, required) - PDF/JPG/PNG
//  - id (file, required) - PDF/JPG/PNG (identity doc)
//  - sample (file, optional) - MP4/JPG/PNG
// Response: 201 or 200 with { ok: true, message: string }

export default function TeacherForm({ initialEmail = '' }) {
  const { t } = useContext(SettingsContext);

  const [form, setForm] = useState({
    name: '',
    email: initialEmail || '',
    bio: '',
    subjects: '',
    experience: '',
  });

  const [files, setFiles] = useState({ cert: null, id: null, sample: null });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onFileChange = (e) => {
    const { name, files: f } = e.target;
    setFiles(prev => ({ ...prev, [name]: f && f[0] ? f[0] : null }));
  };

  const validate = () => {
    if (!form.name || !form.email || !form.bio) return t('teacher.errorRequired');
    if (form.bio.length < 50) return t('teacher.errorBioShort');
    if (!files.cert) return t('teacher.errorCert');
    if (!files.id) return t('teacher.errorId');
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const v = validate();
    if (v) return setError(v);
    setSending(true);

    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('bio', form.bio);
      fd.append('subjects', form.subjects);
      if (form.experience) fd.append('experience', form.experience);
      fd.append('cert', files.cert);
      fd.append('id', files.id);
      if (files.sample) fd.append('sample', files.sample);

      const res = await submitTeacherApplication(fd);
      setSuccess(res.message || t('teacher.success'));
      setForm({ name: '', email: form.email, bio: '', subjects: '', experience: '' });
      setFiles({ cert: null, id: null, sample: null });
    } catch (err) {
      setError(err.message || t('teacher.sendError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4">
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="mb-3">
        <label className="form-label">{t('fullName')} *</label>
        <input name="name" value={form.name} onChange={onChange} className="form-control" />
      </div>

      <div className="mb-3">
        <label className="form-label">{t('emailAddress')} *</label>
        <input name="email" value={form.email} onChange={onChange} className="form-control" readOnly={!!initialEmail} />
      </div>

      <div className="mb-3">
        <label className="form-label">{t('teacher.fullBioLabel')}</label>
        <textarea name="bio" value={form.bio} onChange={onChange} className="form-control" rows="4" />
      </div>

      <div className="mb-3">
        <label className="form-label">{t('teacher.subjects')}</label>
        <input name="subjects" value={form.subjects} onChange={onChange} className="form-control" placeholder={t('teacher.subjectsPlaceholder')} />
      </div>

      <div className="mb-3">
        <label className="form-label">{t('teacher.experience')}</label>
        <input name="experience" type="number" value={form.experience} onChange={onChange} className="form-control" min="0" />
      </div>

      <div className="mb-3">
        <label className="form-label">{t('teacher.certLabel')}</label>
        <input name="cert" type="file" className="form-control" accept=".pdf,image/*" onChange={onFileChange} />
      </div>

      <div className="mb-3">
        <label className="form-label">{t('teacher.idLabel')}</label>
        <input name="id" type="file" className="form-control" accept=".pdf,image/*" onChange={onFileChange} />
      </div>

      <div className="mb-3">
        <label className="form-label">{t('teacher.sampleLabel')}</label>
        <input name="sample" type="file" className="form-control" accept="video/*,image/*" onChange={onFileChange} />
      </div>

      <div className="form-check mb-3">
        <input className="form-check-input" type="checkbox" id="agree" required />
        <label className="form-check-label" htmlFor="agree">{t('teacher.agree')}</label>
      </div>

      <div>
        <button className="btn btn-primary" type="submit" disabled={sending}>{sending ? t('teacher.sending') : t('teacher.submit')}</button>
      </div>
    </form>
  );
}
