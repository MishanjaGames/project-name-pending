import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsContext } from '../contexts/SettingsContext';
import { getUser } from '../utils/auth';
import { courseService } from '../api/courseService';

export default function AddCourseForm() {
  const { t } = useContext(SettingsContext);
  const navigate = useNavigate();
  const user = getUser();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    direction: 'Programming',
    level: 'junior',
    price: '',
    links: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await courseService.create(formData, user);
      alert(t('course.success') || 'Course created successfully!');
      navigate('/account');
    } catch (error) {
      alert('Error creating course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Title */}
      <div className="mb-3">
        <label className="form-label">{t('course.titleLabel')}</label>
        <input 
          name="title" 
          className="form-control" 
          value={formData.title} 
          onChange={handleChange} 
          required 
        />
      </div>

      {/* Direction */}
      <div className="mb-3">
        <label className="form-label">Direction</label>
        <select 
          name="direction" 
          className="form-select" 
          value={formData.direction} 
          onChange={handleChange}
        >
          <option value="Programming">Programming</option>
          <option value="Game Dev">Game Dev</option>
          <option value="Data Science">Data Science</option>
          <option value="Design">Design</option>
        </select>
      </div>

      {/* Level */}
      <div className="mb-3">
        <label className="form-label">Level</label>
        <select 
          name="level" 
          className="form-select" 
          value={formData.level} 
          onChange={handleChange}
        >
          <option value="junior">Junior</option>
          <option value="middle">Middle</option>
          <option value="senior">Senior</option>
        </select>
      </div>

      {/* Price */}
      <div className="mb-3">
        <label className="form-label">{t('course.priceLabel')}</label>
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input 
            type="number" 
            name="price" 
            className="form-control" 
            value={formData.price} 
            onChange={handleChange} 
            required 
            min="0"
          />
        </div>
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="form-label">{t('course.descriptionLabel')}</label>
        <textarea 
          name="description" 
          className="form-control" 
          rows="4" 
          value={formData.description} 
          onChange={handleChange} 
        />
      </div>

      {/* Links */}
      <div className="mb-4">
        <label className="form-label">Materials/Links (comma separated)</label>
        <input 
          name="links" 
          className="form-control" 
          placeholder="https://github.com/repo, https://drive.google.com/..." 
          value={formData.links} 
          onChange={handleChange} 
        />
        <div className="form-text">Paste URLs to videos or repositories.</div>
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t('course.sending') : t('course.submit')}
        </button>
      </div>
    </form>
  );
}