import React, { useState, useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { submitCourse } from '../utils/course';

// Simple AddCourseForm for instructors
// Fields: title (required), repoUrl (required), description, tags (comma-separated), price, visibility
export default function AddCourseForm() {
  const { t } = useContext(SettingsContext);
  const [form, setForm] = useState({ title: '', repoUrl: '', description: '', tags: '', price: '', visibility: 'draft' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.title || !form.repoUrl) return t('course.errorRequired');
    // basic URL check
    try {
      const u = new URL(form.repoUrl);
      if (!['http:', 'https:'].includes(u.protocol)) return t('course.errorRepoUrl');
    } catch (e) {
      return t('course.errorRepoUrl');
    }
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
      const payload = {
        title: form.title,
        repoUrl: form.repoUrl,
        description: form.description,
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
        price: form.price ? Number(form.price) : 0,
        visibility: form.visibility,
      };

      const res = await submitCourse(payload);
      setSuccess(res.message || t('course.success'));
      setForm({ title: '', repoUrl: '', description: '', tags: '', price: '', visibility: 'draft' });
    } catch (err) {
      setError(err.message || t('course.sendError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4" style={{ maxWidth: 800 }}>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="mb-3">
        <label className="form-label">{t('course.titleLabel')}</label>
        <input name="title" value={form.title} onChange={onChange} className="form-control" />
      </div>

      <div className="mb-3">
        <label className="form-label">{t('course.repoLabel')}</label>
        <input name="repoUrl" value={form.repoUrl} onChange={onChange} className="form-control" placeholder="https://github.com/username/repo" />
      </div>

      <div className="mb-3">
        <label className="form-label">{t('course.descriptionLabel')}</label>
        <textarea name="description" value={form.description} onChange={onChange} className="form-control" rows={4} />
      </div>

      <div className="mb-3">
        <label className="form-label">{t('course.tagsLabel')}</label>
        <input name="tags" value={form.tags} onChange={onChange} className="form-control" placeholder={t('course.tagsPlaceholder')} />
      </div>

      <div className="row g-3 mb-3">
        <div className="col-6">
          <label className="form-label">{t('course.priceLabel')}</label>
          <input name="price" type="number" min="0" value={form.price} onChange={onChange} className="form-control" />
        </div>
        <div className="col-6">
          <label className="form-label">{t('course.visibility')}</label>
          <select name="visibility" value={form.visibility} onChange={onChange} className="form-select">
            <option value="draft">{t('course.visibilityDraft')}</option>
            <option value="published">{t('course.visibilityPublished')}</option>
          </select>
        </div>
      </div>

      <div>
        <button className="btn btn-primary" type="submit" disabled={sending}>{sending ? t('course.sending') : t('course.submit')}</button>
      </div>
    </form>
  );
}
