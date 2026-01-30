import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useCart } from '../../contexts/CartContext';
import { getUser, setUser as setUserStorage } from '../../utils/auth';

function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useContext(SettingsContext);
  const { addItem } = useCart();
  
  // --- MOCK DATA (Имитация базы данных) ---
  // В реальности данные прилетали бы с сервера по ID
  const courseData = {
    id: parseInt(id),
    title: 'C++: Complete Guide', 
    description: 'Master C++ from scratch. Learn memory management, OOP, STL, and build high-performance applications.',
    author: 'Yuri Popov',
    rating: 4.8,
    students: 1240,
    lastUpdated: '12/2025',
    language: 'English',
    price: 10.99,
    level: 'Junior',
    img: 'https://th.bing.com/th/id/OIP.ViNMzZEPRvADF6WtX6rQsgHaDt?w=326&h=175&c=7&r=0&o=7&pid=1.7&rm=3', // Картинка побольше
    whatYouWillLearn: [
      'Understand the fundamentals of C++ programming',
      'Master Object-Oriented Programming (OOP) concepts',
      'Learn manual memory management and pointers',
      'Build real-world applications using STL'
    ],
    content: [
      { title: 'Introduction', duration: '10m' },
      { title: 'Variables & Types', duration: '45m' },
      { title: 'Pointers & References', duration: '1h 20m' },
      { title: 'OOP Deep Dive', duration: '2h 15m' },
    ]
  };

  // Если курс не найден (например, id кривой), можно показать лоадер или ошибку
  // Для теста мы всегда показываем courseData, но меняем заголовок, если id другой
  const course = { ...courseData, title: id == 1 ? courseData.title : `Course #${id} Placeholder Title` };

  // --- ЛОГИКА ---
  const handleEnroll = () => {
    const u = getUser();
    if (!u) { navigate('/login'); return; }
    u.enrolled = u.enrolled || [];
    if (!u.enrolled.find(x => x.id === course.id)) {
      u.enrolled.push({ id: course.id, title: course.title, author: course.author, img: course.img });
      setUserStorage(u);
      alert(t('enrolledIn') + course.title);
    } else {
      alert(t('alreadyEnrolled'));
    }
  };

  return (
    <div className="course-page-wrapper">
      
      {/* --- HERO HEADER (Темный фон всегда выглядит круто для шапки курса) --- */}
      <div className="bg-dark text-white py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              {/* Breadcrumb */}
              <div className="text-info small mb-3 fw-bold text-uppercase">
                Development &gt; Programming &gt; C++
              </div>
              <h1 className="display-5 fw-bold mb-3">{course.title}</h1>
              <p className="lead mb-4 opacity-75">{course.description}</p>
              
              <div className="d-flex align-items-center gap-3 mb-3 text-warning">
                <span className="fw-bold">{course.rating}</span>
                <div>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-half"></i>
                </div>
                <span className="text-white opacity-50 small">({course.students} students)</span>
              </div>

              <div className="small opacity-75">
                Created by <a href="#" className="text-info text-decoration-none">{course.author}</a> 
                <span className="mx-2">•</span> 
                Last updated {course.lastUpdated}
                <span className="mx-2">•</span>
                <i className="bi bi-globe me-1"></i> {course.language}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        <div className="row">
          
          {/* --- LEFT COLUMN (MAIN CONTENT) --- */}
          <div className="col-lg-8">
            
            {/* What you'll learn */}
            <div className="card border-0 shadow-sm mb-5">
              <div className="card-body p-4">
                <h4 className="fw-bold mb-4">What you'll learn</h4>
                <div className="row g-3">
                  {course.whatYouWillLearn.map((item, idx) => (
                    <div className="col-md-6 d-flex gap-2" key={idx}>
                      <i className="bi bi-check-lg text-success fs-5"></i>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Course Content */}
            <h4 className="fw-bold mb-3">Course Content</h4>
            <div className="card border-0 shadow-sm mb-5">
              <ul className="list-group list-group-flush">
                {course.content.map((module, idx) => (
                  <li className="list-group-item d-flex justify-content-between align-items-center py-3" key={idx}>
                    <div className="d-flex align-items-center gap-3">
                      <i className="bi bi-play-circle-fill text-primary fs-5"></i>
                      <span>{module.title}</span>
                    </div>
                    <span className="text-muted small">{module.duration}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Description */}
            <h4 className="fw-bold mb-3">Description</h4>
            <div className="card border-0 shadow-sm p-4 text-muted">
              <p>
                Whether you want to enter the game development industry, work on high-performance applications, or understand how computers work at a low level, C++ is the language to learn.
              </p>
              <p>
                This course covers everything from basic syntax to advanced topics like templates and lambda expressions.
              </p>
            </div>

          </div>

          {/* --- RIGHT COLUMN (STICKY SIDEBAR) --- */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-lg sticky-top" style={{ top: '20px', zIndex: 10 }}>
              {/* Preview Image/Video */}
              <div className="position-relative">
                <img src={course.img} alt={course.title} className="card-img-top" style={{ height: '200px', objectFit: 'cover' }} />
                {/* <div className="position-absolute top-50 start-50 translate-middle">
                  <div className="bg-white rounded-circle p-3 shadow" style={{ cursor: 'pointer', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-play-fill fs-1 text-dark ps-1"></i>
                  </div>
                </div> */}
              </div>

              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <h2 className="fw-bold mb-0 me-3">${course.price}</h2>
                  <span className="text-muted text-decoration-line-through">$99.99</span>
                  <span className="ms-auto badge bg-danger">89% OFF</span>
                </div>

                <div className="d-grid gap-2 mb-3">
                  <button className="btn btn-primary btn-lg fw-bold" onClick={() => addItem(course, 1)}>Add to Cart</button>
                  <button className="btn btn-outline-secondary btn-lg fw-bold" onClick={handleEnroll}>{t('enroll')}</button>
                </div>

                <p className="text-center text-muted small mb-4">14-Day Money-Back Guarantee</p>

                <h6 className="fw-bold small mb-2">This course includes:</h6>
                <ul className="list-unstyled small text-muted d-grid gap-2">
                  <li><i className="bi bi-camera-video me-2"></i> 24 hours on-demand video</li>
                  <li><i className="bi bi-file-earmark-text me-2"></i> 5 articles</li>
                  <li><i className="bi bi-code-square me-2"></i> 15 coding exercises</li>
                  <li><i className="bi bi-phone me-2"></i> Access on mobile and TV</li>
                  <li><i className="bi bi-trophy me-2"></i> Certificate of completion</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CoursePage;