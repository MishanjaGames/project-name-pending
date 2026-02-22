import React, { useState, useEffect, useContext, useRef } from 'react';
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

  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [learnList, setLearnList] = useState(['']);
  const imgObjectUrlRef = useRef(null);

  const [loading, setLoading] = useState(true);

  // Загружаем курс и подготавливаем превью/списки для редактирования
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const course = await courseService.getById(id);
        if (!course) return;

        setFormData({
          title: course.title,
          description: course.description,
          direction: course.direction,
          level: course.level,
          price: course.price,
          links: course.links ? (Array.isArray(course.links) ? course.links.map(l => typeof l === 'object' ? l.url : l).join(', ') : course.links.join(', ')) : ''
        });

        if (course._tempImage || course.img) setImgPreview(course._tempImage || course.img);

        if (course._tempVideos && course._tempVideos.length > 0) {
          setVideoPreviews(course._tempVideos.slice());
          setVideoFiles(new Array(course._tempVideos.length).fill(null));
        } else if (course._tempVideo) {
          setVideoPreviews([course._tempVideo]);
          setVideoFiles([null]);
        }

        if (course.whatYouWillLearn && course.whatYouWillLearn.length > 0) setLearnList(course.whatYouWillLearn.slice());
      } catch (error) {
        alert('Ошибка загрузки курса');
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

  const handleLearnChange = (index, value) => {
    setLearnList(prev => prev.map((v,i) => i===index ? value : v));
  };

  const addLearnItem = () => setLearnList(prev => ([...prev, '']));
  const removeLearnItem = (index) => setLearnList(prev => prev.filter((_,i)=>i!==index));

  const handleImageSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    setImgFile(file || null);

    // clean previous object url
    if (imgObjectUrlRef.current) {
      URL.revokeObjectURL(imgObjectUrlRef.current);
      imgObjectUrlRef.current = null;
    }

    if (file) {
      const obj = URL.createObjectURL(file);
      imgObjectUrlRef.current = obj;
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
      // revoke old preview if blob
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

  useEffect(() => {
    return () => {
      if (imgObjectUrlRef.current) URL.revokeObjectURL(imgObjectUrlRef.current);
      videoPreviews.forEach(u => { try { if (u && u.startsWith && u.startsWith('blob:')) URL.revokeObjectURL(u); } catch(_) {} });
    };
  }, []);

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
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

      // If user selected files, convert to data URLs (simulate upload)
      // If user selected files, convert to data URLs (simulate upload)
      const filesToUpload = [];
      if (imgFile) {
        const dataUrl = await fileToDataUrl(imgFile);
        dataToSend._tempImage = dataUrl;
        filesToUpload.push(imgFile);
      } else if (imgPreview) {
        // keep existing preview (could be remote url or data url)
        dataToSend._tempImage = imgPreview;
      }

      // handle multiple videos: convert selected files to data URLs, keep existing previews
      const videosToSave = [];
      for (let i=0;i<videoPreviews.length;i++) {
        const file = videoFiles[i];
        if (file) {
          const data = await fileToDataUrl(file);
          videosToSave.push(data);
          filesToUpload.push(file);
        } else if (videoPreviews[i]) {
          videosToSave.push(videoPreviews[i]);
        }
      }
      if (videosToSave.length) dataToSend._tempVideos = videosToSave;

      if (filesToUpload.length) dataToSend._files = filesToUpload;

      // include teacher-provided learn list
      dataToSend.whatYouWillLearn = learnList.filter(s => s && s.trim());

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
            {/* Заголовок */}
            <div className="mb-3">
              <label className="form-label">{t('course.titleLabel')}</label>
              <input name="title" className="form-control" value={formData.title} onChange={handleChange} required />
            </div>

            {/* Направление */}
            <div className="mb-3">
              <label className="form-label">Direction</label>
              <select name="direction" className="form-select" value={formData.direction} onChange={handleChange}>
                <option value="Programming">Programming</option>
                <option value="Game Dev">Game Dev</option>
                <option value="Data Science">Data Science</option>
                <option value="Design">Design</option>
              </select>
            </div>

            {/* Уровень */}
            <div className="mb-3">
              <label className="form-label">Level</label>
              <select name="level" className="form-select" value={formData.level} onChange={handleChange}>
                <option value="junior">Junior</option>
                <option value="middle">Middle</option>
                <option value="senior">Senior</option>
              </select>
            </div>

            {/* Цена */}
            <div className="mb-3">
              <label className="form-label">{t('course.priceLabel')}</label>
              <input type="number" name="price" className="form-control" value={formData.price} onChange={handleChange} required min="0" />
            </div>

            {/* Описание */}
            <div className="mb-3">
              <label className="form-label">{t('course.descriptionLabel')}</label>
              <textarea name="description" className="form-control" rows="4" value={formData.description} onChange={handleChange} />
            </div>

            {/* Links */}
            <div className="mb-4">
              <label className="form-label">Materials/Links (comma separated)</label>
              <input name="links" className="form-control" value={formData.links} onChange={handleChange} />
            </div>

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

            {/* Lesson videos (multiple) */}
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
            </div>

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
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/account')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}