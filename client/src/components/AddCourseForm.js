import React, { useState, useContext, useRef, useEffect } from 'react';
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

  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [videoFiles, setVideoFiles] = useState([null]);
  const [videoPreviews, setVideoPreviews] = useState(['']);
  const [learnList, setLearnList] = useState(['']);
  const imgRef = useRef(null);
  const videoUrlsRef = useRef([]);

  useEffect(() => {
    return () => {
      // освобождаем временные objectURL
      if (videoUrlsRef.current.length) {
        videoUrlsRef.current.forEach(u => URL.revokeObjectURL(u));
        videoUrlsRef.current = [];
      }
      if (imgRef.current) {
        URL.revokeObjectURL(imgRef.current);
        imgRef.current = null;
      }
    };
  }, []);

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    setImgFile(file || null);
    if (imgRef.current) { URL.revokeObjectURL(imgRef.current); imgRef.current = null; }
    if (file) {
      const obj = URL.createObjectURL(file);
      imgRef.current = obj;
      setImgPreview(obj);
    } else {
      setImgPreview('');
    }
  };

  const handleVideoSelect = (index, e) => {
    const file = e.target.files && e.target.files[0];
    setVideoFiles(prev => {
      const copy = prev.slice();
      copy[index] = file || null;
      return copy;
    });

    setVideoPreviews(prev => {
      const copy = prev.slice();
      // освобождаем старый preview, если это blob
      if (copy[index] && copy[index].startsWith && copy[index].startsWith('blob:')) {
        try { URL.revokeObjectURL(copy[index]); } catch(_) {}
      }
      if (file) {
        const obj = URL.createObjectURL(file);
        copy[index] = obj;
      } else {
        copy[index] = '';
      }
      return copy;
    });
  };

  const addVideoItem = () => {
    setVideoFiles(prev => ([...prev, null]));
    setVideoPreviews(prev => ([...prev, '']));
  };

  const removeVideoItem = (index) => {
    setVideoFiles(prev => prev.filter((_,i)=>i!==index));
    setVideoPreviews(prev => {
      const copy = prev.slice();
      if (copy[index] && copy[index].startsWith && copy[index].startsWith('blob:')) {
        try { URL.revokeObjectURL(copy[index]); } catch(_) {}
      }
      copy.splice(index,1);
      return copy;
    });
  };

  const handleLearnChange = (index, value) => {
    setLearnList(prev => prev.map((v,i) => i===index?value:v));
  };

  const addLearnItem = () => setLearnList(prev => ([...prev, '']));
  const removeLearnItem = (index) => setLearnList(prev => prev.filter((_,i)=>i!==index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Step 1: Create course (without files)
      const courseData = {
        title: formData.title,
        description: formData.description,
        direction: formData.direction,
        level: formData.level,
        price: parseFloat(formData.price) || 0,
        whatYouWillLearn: learnList.filter(s => s && s.trim())
      };

      const newCourse = await courseService.create(courseData, user);
      
      if (!newCourse || !newCourse._id) {
        throw new Error('Failed to create course - no ID received');
      }

      const courseId = newCourse._id;

      // Step 2: Upload thumbnail if provided
      if (imgFile) {
        try {
          await courseService.uploadThumbnail(courseId, imgFile);
        } catch (error) {
          console.warn('Thumbnail upload failed, continuing...', error);
        }
      }

      // Step 3: Upload content files if provided
      const contentFiles = videoFiles.filter(f => f !== null && f !== undefined);
      if (contentFiles.length > 0) {
        try {
          await courseService.uploadContentFiles(courseId, contentFiles);
        } catch (error) {
          console.warn('Content files upload failed, continuing...', error);
        }
      }

      alert(t('course.success') || 'Course created successfully!');
      navigate('/account');
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Error creating course: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Заголовок */}
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

      {/* Направление */}
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

      {/* Уровень */}
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

      {/* Цена */}
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

      {/* Описание */}
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

      {/* Ссылки убраны — используем локальные файлы или backend links */}
      {/* Upload cover image */}
      <div className="mb-3">
        <label className="form-label fw-bold">Upload cover image</label>
        <input type="file" accept="image/*" className="form-control" onChange={handleImageSelect} />
        <div className="form-text small text-muted">Select an image file from your computer.</div>
      </div>
      {/* Image Preview */}
      <div className="mb-4">
        <label className="form-label">Image Preview</label>
        <div 
          className='rounded shadow-sm overflow-hidden border d-flex align-items-center justify-content-center'
          style={{
            minHeight: '120px',
            height: 'auto', 
            alignItems: 'center', 
            display: 'flex', 
            justifyContent: 'center', 
            backgroundColor: '#2a2a2a'  
          }}
        >
          {imgPreview ? (
            <img 
              src={imgPreview}
              alt="Course Preview"
              className="img-fluid w-100 h-100"
              style={{height: 'auto', display: 'block'}}
              onError={(e) => {e.target.src = 'https://www.freeiconspng.com/uploads/error-icon-15.png'}}
            />
          ) : (
            <div className="text-center text-secondary">
              <i className="bi bi-image fs-2 d-block"></i>
              <span style={{fontSize: '0.7rem'}}>No image uploaded</span>
            </div>
          )}
        </div>
      </div>  

      {/* Video upload
      <div className="mb-4">
        <label className="form-label fw-bold">Lesson videos</label>
        <div className="d-grid gap-3 mb-3">
          {videoPreviews.map((preview, idx) => (
            <div key={idx} className="border rounded p-3" style={{backgroundColor: '#2a2a2a'}}>
              <div className="mb-2 d-flex justify-content-between align-items-center">
                <small className="text-secondary">Video #{idx + 1}</small>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeVideoItem(idx)} disabled={videoPreviews.length === 1}>Remove</button>
              </div>
              <input type="file" accept="video/*" className="form-control form-control-dark mb-2" onChange={(e) => handleVideoSelect(idx, e)} />
              {preview ? (
                <video src={preview} controls style={{width: '100%', maxHeight: '240px'}} />
              ) : (
                <div className="text-secondary small text-center py-4">
                  <i className="bi bi-film"></i> Select a video file
                </div>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addVideoItem}>Add video</button>
      </div> */}

      {/* What you'll learn editor */}
      <div className="mb-4">
        <label className="form-label fw-bold">What you'll learn</label>
        <div className="d-grid gap-2">
          {learnList.map((item, idx) => (
            <div className="input-group" key={idx}>
              <input type="text" className="form-control" value={item} onChange={(e)=>handleLearnChange(idx, e.target.value)} placeholder={`Point ${idx+1}`} />
              <button type="button" className="btn btn-outline-danger" onClick={()=>removeLearnItem(idx)} disabled={learnList.length===1}>Remove</button>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={addLearnItem}>Add point</button>
        </div>
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