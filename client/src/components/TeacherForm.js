import React, { useState, useContext, useRef } from 'react';
import './TeacherForm.css';
import { submitTeacherApplication } from '../utils/teacher'; // Оставляем твой импорт
import { SettingsContext } from '../contexts/SettingsContext';

export default function TeacherForm({ initialEmail = '' }) {
  const { t } = useContext(SettingsContext);

  // Основной стейт формы
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    agreement: false
  });

  // Массив навыков (каждый навык содержит свои данные и файлы)
  const [skills, setSkills] = useState([]);

  // Состояния для модального окна добавления/редактирования навыка
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkillIndex, setEditingSkillIndex] = useState(null);
  const [currentSkill, setCurrentSkill] = useState({
    type: '',
    subject: '',
    experience: '',
    source: '',
    certs: [], // Массив файлов
    examples: [], // Массив объектов { type: 'file'|'link', data: File|String }
  });

  // Вспомогательные состояния
  const [tempLink, setTempLink] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const certInputRef = useRef(null);
  const exampleInputRef = useRef(null);

  // --- ОБРАБОТЧИКИ ОСНОВНОЙ ФОРМЫ ---
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // --- ОБРАБОТЧИКИ МОДАЛЬНОГО ОКНА ---
  const openSkillModal = (index = null) => {
    if (index !== null) {
      setEditingSkillIndex(index);
      setCurrentSkill(skills[index]);
    } else {
      setEditingSkillIndex(null);
      setCurrentSkill({ type: '', subject: '', experience: '', source: '', certs: [], examples: [] });
    }
    setTempLink('');
    setIsModalOpen(true);
  };

  const closeSkillModal = () => {
    setIsModalOpen(false);
    setEditingSkillIndex(null);
  };

  const onSkillChange = (e) => {
    setCurrentSkill({ ...currentSkill, [e.target.name]: e.target.value });
  };

  // Файлы сертификатов
  const handleCertUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCurrentSkill(prev => ({ ...prev, certs: [...prev.certs, ...Array.from(e.target.files)] }));
    }
    e.target.value = null; // Сброс input
  };

  const removeCert = (idx) => {
    setCurrentSkill(prev => ({ ...prev, certs: prev.certs.filter((_, i) => i !== idx) }));
  };

  // Примеры работ (Файлы и Ссылки)
  const handleExampleUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newExamples = Array.from(e.target.files).map(f => ({ type: 'file', data: f }));
      setCurrentSkill(prev => ({ ...prev, examples: [...prev.examples, ...newExamples] }));
    }
    e.target.value = null;
  };

  const addExampleLink = () => {
    if (tempLink.trim()) {
      setCurrentSkill(prev => ({ ...prev, examples: [...prev.examples, { type: 'link', data: tempLink.trim() }] }));
      setTempLink('');
    }
  };

  const removeExample = (idx) => {
    setCurrentSkill(prev => ({ ...prev, examples: prev.examples.filter((_, i) => i !== idx) }));
  };

  const saveSkill = () => {
    if (!currentSkill.type || !currentSkill.subject || !currentSkill.experience) {
      alert('Please fill Type, Subject and Experience');
      return;
    }

    if (editingSkillIndex !== null) {
      const updatedSkills = [...skills];
      updatedSkills[editingSkillIndex] = currentSkill;
      setSkills(updatedSkills);
    } else {
      setSkills([...skills, currentSkill]);
    }
    closeSkillModal();
  };

  const deleteSkill = (idx) => {
    setSkills(skills.filter((_, i) => i !== idx));
  };

  // --- ОТПРАВКА НА БЭКЕНД ---
  const validate = () => {
    if (!form.firstName || !form.lastName || !form.bio) return 'Please fill all required personal fields.';
    if (skills.length === 0) return 'Please add at least one skill.';
    if (!form.agreement) return 'You must agree to the terms.';
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
      fd.append('firstName', form.firstName);
      fd.append('lastName', form.lastName);
      fd.append('email', initialEmail); // Email берем из пропсов аккаунта
      fd.append('bio', form.bio);

      // Важно для БЭКЕНДА: Упаковываем сложную структуру навыков.
      // Текстовые данные навыков шлем как JSON строку
      const skillsMetadata = skills.map(s => ({
        type: s.type, subject: s.subject, experience: s.experience, source: s.source,
        links: s.examples.filter(ex => ex.type === 'link').map(ex => ex.data)
      }));
      fd.append('skillsData', JSON.stringify(skillsMetadata));

      // Файлы прикрепляем с уникальными ключами (чтобы бэкенд понял, какому навыку они принадлежат)
      skills.forEach((skill, skillIdx) => {
        skill.certs.forEach((cert, certIdx) => {
          fd.append(`cert_skill_${skillIdx}_${certIdx}`, cert);
        });
        const fileExamples = skill.examples.filter(ex => ex.type === 'file');
        fileExamples.forEach((ex, exIdx) => {
          fd.append(`example_skill_${skillIdx}_${exIdx}`, ex.data);
        });
      });

      const res = await submitTeacherApplication(fd);
      setSuccess(res.message || 'Application submitted successfully!');
      
      // Очистка формы
      setForm({ firstName: '', lastName: '', bio: '', agreement: false });
      setSkills([]);
    } catch (err) {
      setError(err.message || 'Error sending application.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="teacher-form-container">
      {/* <div className="mb-4">
        <h3 className="fw-bold mb-1">Teacher application</h3>
        <p className="text-muted small">Fill the form to apply for a teacher role. An administrator will contact you after review.</p>
      </div> */}

      <form onSubmit={handleSubmit} className="card p-4 border-0 shadow-sm bg-transparent">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="mb-3">
          <label className="form-label">{t('teacher.firstName')} <span className="req-star">*</span></label>
          <input name="firstName" value={form.firstName} onChange={onChange} className="form-control" placeholder={t('teacher.firstNamePlaceholder')} />
        </div>

        <div className="mb-3">
          <label className="form-label">{t('teacher.lastName')} <span className="req-star">*</span></label>
          <input name="lastName" value={form.lastName} onChange={onChange} className="form-control" placeholder={t('teacher.lastNamePlaceholder')} />
        </div>

        <div className="mb-3">
          <label className="form-label">{t('teacher.bio')} <span className="req-star">*</span></label>
          <textarea name="bio" value={form.bio} onChange={onChange} className="form-control" rows="4" placeholder={t('teacher.bioPlaceholder')} />
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label mb-0">{t('teacher.skills')} <span className="req-star">*</span></label>
            <button type="button" className="btn btn-sm btn-primary rounded-pill px-4" onClick={() => openSkillModal()}>{t('teacher.addBtn')}</button>
          </div>
          
          <div className="skills-list-container">
            {skills.length === 0 ? (
              <div className="text-muted small text-center py-3">{t('teacher.noSkills')}</div>
            ) : (
              skills.map((s, idx) => (
                <div className="skill-pill" key={idx}>
                  <div className="skill-pill-data">
                    <span className="fw-bold text-truncate" style={{maxWidth: '100px'}}>{s.type}</span>
                    <span className="text-muted text-truncate" style={{maxWidth: '100px'}}>{s.subject}</span>
                    <span className="badge bg-secondary">{s.experience} yrs</span>
                    <span className="text-muted">{s.source}</span>
                    <span className="text-primary small">[{s.certs.length} certs]</span>
                    <span className="text-info small">[{s.examples.length} examples]</span>
                  </div>
                  <div className="skill-pill-actions">
                    <button type="button" onClick={() => openSkillModal(idx)}><i className="bi bi-pencil"></i></button>
                    <button type="button" onClick={() => deleteSkill(idx)} className="text-danger"><i className="bi bi-x-lg"></i></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="form-check mb-4 d-flex align-items-center gap-2">
          <input className="form-check-input mt-0" type="checkbox" id="agreement" name="agreement" checked={form.agreement} onChange={onChange} style={{width: '20px', height: '20px'}} />
          <label className="form-check-label" htmlFor="agreement">{t('teacher.agreement')} <span className="req-star">*</span></label>
        </div>

        <button className="btn btn-primary btn-lg w-100 rounded-3" type="submit" disabled={sending}>
          {sending ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
          {sending ? t('teacher.submitting') : t('teacher.submitBtn')}
        </button>
      </form>

      {/* --- МОДАЛЬНОЕ ОКНО --- */}
      {isModalOpen && (
        <div className="skill-modal-overlay" onClick={closeSkillModal}>
          <div className="skill-modal-content" onClick={e => e.stopPropagation()}>
            <div className="skill-modal-header">
              <h5>{editingSkillIndex !== null ? 'Edit Skill' : 'Add Skill'}</h5>
              <button type="button" className="btn-close btn-close-white" onClick={closeSkillModal}></button>
            </div>
            
            <div className="skill-modal-body">
              <div className="mb-3">
                <label className="form-label small text-muted text-uppercase fw-bold">Type of knowledge <span className="req-star">*</span></label>
                <select name="type" value={currentSkill.type} onChange={onSkillChange} className="form-select rounded-pill">
                  <option value="">Select type...</option>
                  <option value="Specified">Specified</option>
                  <option value="General">General</option>
                  <option value="Language">Language</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small text-muted text-uppercase fw-bold">Subject <span className="req-star">*</span></label>
                <select name="subject" value={currentSkill.subject} onChange={onSkillChange} className="form-select rounded-pill">
                  <option value="">Select subject...</option>
                  <option value="Design">Design</option>
                  <option value="Coding">Coding</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small text-muted text-uppercase fw-bold">Experience (in full years) <span className="req-star">*</span></label>
                <input type="number" name="experience" value={currentSkill.experience} onChange={onSkillChange} className="form-control rounded-pill" min="0" placeholder="0" />
              </div>

              <div className="mb-4">
                <label className="form-label small text-muted text-uppercase fw-bold">Source of knowledge <span className="req-star">*</span></label>
                <select name="source" value={currentSkill.source} onChange={onSkillChange} className="form-select rounded-pill">
                  <option value="">Select source...</option>
                  <option value="Self-taught">Self-taught</option>
                  <option value="University">University</option>
                  <option value="Courses">Courses</option>
                </select>
              </div>

              {/* Сертификаты */}
              <div className="mb-4">
                <label className="form-label small text-muted text-uppercase fw-bold">Certificate / Diploma (with grades) <span className="req-star">*</span></label>
                
                <div className="file-upload-zone" onClick={() => certInputRef.current?.click()}>
                   Add files (PDF or Image)
                </div>
                <input type="file" multiple accept=".pdf,image/*" ref={certInputRef} onChange={handleCertUpload} className="d-none" />
                
                {currentSkill.certs.map((file, idx) => (
                  <div className="file-item" key={`cert-${idx}`}>
                    <div className="file-item-info">
                      <i className="bi bi-file-earmark-text text-primary"></i>
                      <span>{file.name}</span>
                    </div>
                    <div className="file-item-actions">
                      <button type="button" onClick={() => removeCert(idx)}><i className="bi bi-x-lg"></i></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Примеры работ */}
              <div className="mb-2">
                <label className="form-label small text-muted text-uppercase fw-bold">Examples of work <span className="req-star">*</span></label>
                
                <div className="file-upload-zone" onClick={() => exampleInputRef.current?.click()}>
                   Add archive or paste link to cloud storage
                </div>
                <input type="file" multiple accept=".zip,.rar,image/*,video/*" ref={exampleInputRef} onChange={handleExampleUpload} className="d-none" />
                
                <div className="link-input-group">
                  <input type="url" value={tempLink} onChange={(e) => setTempLink(e.target.value)} className="form-control rounded-pill" placeholder="https://..." />
                  <button type="button" className="btn btn-outline-primary rounded-pill" onClick={addExampleLink}>Add</button>
                </div>

                {currentSkill.examples.map((ex, idx) => (
                  <div className="file-item" key={`ex-${idx}`}>
                    <div className="file-item-info">
                      <i className={`bi ${ex.type === 'link' ? 'bi-link-45deg text-info' : 'bi-file-zip text-warning'}`}></i>
                      <span className="text-truncate" style={{maxWidth: '250px'}}>{ex.type === 'link' ? ex.data : ex.data.name}</span>
                    </div>
                    <div className="file-item-actions">
                      <button type="button" onClick={() => removeExample(idx)}><i className="bi bi-x-lg"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-top" style={{ borderColor: 'var(--input-border)' }}>
               <button className="btn btn-primary w-100 rounded-pill" onClick={saveSkill}>
                 {editingSkillIndex !== null ? 'UPDATE' : 'ADD'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}