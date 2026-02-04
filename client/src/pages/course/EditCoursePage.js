import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SettingsContext } from '../../contexts/SettingsContext';
import { courseService } from '../../api/courseService';

export default function EditCoursePage() {
  const { t } = useContext(SettingsContext);
  const navigate = useNavigate();
  const { id } = useParams(); // Получаем ID из URL

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    direction: 'Programming',
    level: 'junior',
    price: '',
    links: ''
  });

  const [loading, setLoading] = useState(true);

  // Получаем данные курса
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const course = await courseService.getById(id);
        if (course) {
          setFormData({
            title: course.title,
            description: course.description,
            direction: course.direction,
            level: course.level,
            price: course.price,
            links: course.links ? course.links.join(', ') : '' // Превращаем массив обратно в строку
          });
        }
      } catch (error) {
        alert('Error loading course');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Превращаем строку ссылок обратно в массив
      const dataToSend = {
        ...formData,
        links: formData.links.split(',').map(s => s.trim()).filter(s => s)
      };

      await courseService.update(id, dataToSend);
      
      alert('Course updated successfully!');
      navigate('/account'); // Возвращаемся в кабинет
    } catch (error) {
      alert('Error updating course');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-5">Loading...</div>;

  return (
    <div className="container my-5" style={{ maxWidth: '700px' }}>
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <h3 className="mb-4 fw-bold">Edit Course</h3>
          
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-3">
              <label className="form-label">{t('course.titleLabel')}</label>
              <input name="title" className="form-control" value={formData.title} onChange={handleChange} required />
            </div>

            {/* Direction */}
            <div className="mb-3">
              <label className="form-label">Direction</label>
              <select name="direction" className="form-select" value={formData.direction} onChange={handleChange}>
                <option value="Programming">Programming</option>
                <option value="Game Dev">Game Dev</option>
                <option value="Data Science">Data Science</option>
                <option value="Design">Design</option>
              </select>
            </div>

            {/* Level */}
            <div className="mb-3">
              <label className="form-label">Level</label>
              <select name="level" className="form-select" value={formData.level} onChange={handleChange}>
                <option value="junior">Junior</option>
                <option value="middle">Middle</option>
                <option value="senior">Senior</option>
              </select>
            </div>

            {/* Price */}
            <div className="mb-3">
              <label className="form-label">{t('course.priceLabel')}</label>
              <input type="number" name="price" className="form-control" value={formData.price} onChange={handleChange} required min="0" />
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="form-label">{t('course.descriptionLabel')}</label>
              <textarea name="description" className="form-control" rows="4" value={formData.description} onChange={handleChange} />
            </div>

            {/* Links */}
            <div className="mb-4">
              <label className="form-label">Materials/Links (comma separated)</label>
              <input name="links" className="form-control" value={formData.links} onChange={handleChange} />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/account')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}