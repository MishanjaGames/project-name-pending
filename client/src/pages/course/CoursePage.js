import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useCart } from '../../contexts/CartContext';
import { getUser, setUser as setUserStorage } from '../../utils/auth';
import { courseService } from '../../api/courseService'; // <--- Импортируем сервис

function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useContext(SettingsContext);
  const { addItem } = useCart();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // ЗАГРУЗКА ДАННЫХ ИЗ СЕРВИСА
  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const foundCourse = await courseService.getById(id); // Или Number(id), если id числовые
        setCourse(foundCourse);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleEnroll = () => {
    const u = getUser();
    if (!u) { navigate('/login'); return; }
    
    // Проверка на null (на всякий случай)
    if (!course) return;

    u.enrolled = u.enrolled || [];
    // Сравниваем по ID (приводим к строке для надежности)
    if (!u.enrolled.find(x => String(x.id) === String(course._id || course.id))) {
      u.enrolled.push({ 
        id: course._id || course.id, 
        title: course.title, 
        author: course.userId?.nickname || 'Unknown', 
        img: course.img || course._tempImage 
      });
      setUserStorage(u);
      alert(t('enrolledIn') + course.title);
    } else {
      alert(t('alreadyEnrolled'));
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
  }

  if (!course) {
    return (
      <div className="text-center py-5">
        <h3>Course not found</h3>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/search')}>Back to Catalog</button>
      </div>
    );
  }

  return (
    <div className="course-page-wrapper">
      
      {/* HERO HEADER */}
      <div className="bg-dark text-white py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <div className="text-info small mb-3 fw-bold text-uppercase">
                Development &gt; {course.direction || 'General'} &gt; {course.level || 'All Levels'}
              </div>
              <h1 className="display-5 fw-bold mb-3">{course.title}</h1>
              <p className="lead mb-4 opacity-75">{course.description}</p>
              
              <div className="d-flex align-items-center gap-3 mb-3 text-warning">
                <span className="fw-bold">4.8</span>
                <div>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-half"></i>
                </div>
                {/* Если поле students есть в базе, показываем, иначе хардкод */}
                <span className="text-white opacity-50 small">({course.students || 0} students)</span>
              </div>

              <div className="small opacity-75">
                Created by <span className="text-info">{course.userId?.nickname || 'Unknown Author'}</span> 
                <span className="mx-2">•</span> 
                Last updated {new Date(course.updatedAt || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        <div className="row">
          
          {/* LEFT COLUMN */}
          <div className="col-lg-8">
            
            {/* What you'll learn (Пока статика, т.к. в базе этого поля нет) */}
            <div className="card border-0 shadow-sm mb-5">
              <div className="card-body p-4">
                <h4 className="fw-bold mb-4">What you'll learn</h4>
                <div className="row g-3">
                  <div className="col-md-6 d-flex gap-2">
                    <i className="bi bi-check-lg text-success fs-5"></i>
                    <span>Master the core concepts of {course.title}</span>
                  </div>
                  <div className="col-md-6 d-flex gap-2">
                    <i className="bi bi-check-lg text-success fs-5"></i>
                    <span>Build real-world projects</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Content (Берем из links) */}
            <h4 className="fw-bold mb-3">Course Materials</h4>
            <div className="card border-0 shadow-sm mb-5">
              <ul className="list-group list-group-flush">
                {course.links && course.links.length > 0 ? (
                  course.links.map((link, idx) => (
                    <li className="list-group-item d-flex justify-content-between align-items-center py-3" key={idx}>
                      <div className="d-flex align-items-center gap-3">
                        <i className="bi bi-link-45deg text-primary fs-4"></i>
                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-dark">
                          Material #{idx + 1}: {link}
                        </a>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="list-group-item py-3 text-muted">No links provided for this course.</li>
                )}
              </ul>
            </div>

            {/* Description */}
            <h4 className="fw-bold mb-3">Description</h4>
            <div className="card border-0 shadow-sm p-4 text-muted">
              <p>{course.description}</p>
            </div>

          </div>

          {/* RIGHT COLUMN (STICKY) */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-lg sticky-top" style={{ top: '20px', zIndex: 10 }}>
              <div className="position-relative">
                {/* Картинка из базы или заглушка */}
                <img 
                  src={course.img || course._tempImage || 'https://via.placeholder.com/400x200'} 
                  alt={course.title} 
                  className="card-img-top" 
                  style={{ height: '200px', objectFit: 'cover' }} 
                />
              </div>

              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <h2 className="fw-bold mb-0 me-3">${course.price}</h2>
                </div>

                <div className="d-grid gap-2 mb-3">
                  <button 
                    className="btn btn-primary btn-lg fw-bold" 
                    onClick={() => addItem({ id: course._id || course.id, title: course.title, price: course.price, img: course.img || course._tempImage }, 1)}
                  >
                    Add to Cart
                  </button>
                  <button className="btn btn-outline-secondary btn-lg fw-bold" onClick={handleEnroll}>{t('enroll')}</button>
                </div>

                <p className="text-center text-muted small mb-4">30-Day Money-Back Guarantee</p>
                
                {/* Скрываем для создателя курса или показываем кнопки редактирования */}
                {/* TODO: Можно добавить кнопки Edit/Delete здесь, если user.id === course.userId._id */}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CoursePage;