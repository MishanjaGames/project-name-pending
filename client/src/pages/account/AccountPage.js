import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearUser, promoteToTeacher } from '../../utils/auth';
import { SettingsContext } from '../../contexts/SettingsContext';
import { courseService } from '../../api/courseService';

function AccountPage() {
  const navigate = useNavigate();
  const { t } = useContext(SettingsContext);
  
  const [user] = (function(){ try { return [getUser()]; } catch (e) { return [null]; } })();
  const [createdCourses, setCreatedCourses] = useState([]);
  const [stats, setStats] = useState({ courseCount: 0, linkCount: 0 }); // Стейт для статистики

  // Загружаем созданные курсы и считаем статистику, если юзер учитель
  useEffect(() => {
    if (user && (user.role === 'teacher' || user.isTeacher)) {
      courseService.getAll().then(allCourses => {
        // Фильтруем курсы текущего пользователя.
        // Сопоставляем по id (если есть) или по nickname (для старых записей).
        const myCourses = allCourses.filter(c => {
          const courseOwnerId = String(c.userId?._id || c.userId || '');
          const currentUserId = String(user._id || user.id || user.email || '');
          const sameById = courseOwnerId && courseOwnerId === currentUserId;
          const courseOwnerNick = String(c.userId?.nickname || '').toLowerCase();
          const userName = String(user.name || '').toLowerCase();
          const sameByNick = courseOwnerNick && courseOwnerNick === userName;
          return sameById || sameByNick;
        });
        setCreatedCourses(myCourses);

        // Считаем количество уроков (ссылок) во всех курсах автора
        const totalLinks = myCourses.reduce((sum, course) => sum + (course.links?.length || 0), 0);
        setStats({
          courseCount: myCourses.length,
          linkCount: totalLinks
        });
      });
    }
  }, [user]);

  if (!user) {
    setTimeout(() => navigate('/login'), 0);
    return null;
  }

  const enrollments = user.enrolled || [];

  const handleLogout = () => {
    clearUser();
    navigate('/');
  };

  return (
    <div className="container py-5" style={{ maxWidth: '1100px' }}>
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">{t('account')}</h2>
          <p className="text-muted mb-0">Welcome back, {user.name}!</p>
        </div>
        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => navigate('/settings')}>
          <i className="bi bi-gear me-2"></i> {t('settings')}
        </button>
      </div>

      <div className="row g-4">
        
        {/* LEFT COLUMN */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm mb-4 overflow-hidden">
            <div className="card-body p-4 text-center bg-primary bg-opacity-10">
              <div className="bg-white rounded-circle shadow-sm mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-person-circle fs-1 text-primary"></i>
              </div>
              <h5 className="fw-bold mb-1">{user.name}</h5>
              <p className="text-muted small mb-0">{user.email}</p>
              <div className="mt-2">
                <span className={`badge rounded-pill px-3 py-2 ${user.role === 'teacher' ? 'bg-success' : 'bg-primary'}`}>
                  {user.role === 'teacher' || user.isTeacher ? 'Instructor' : 'Student'}
                </span>
              </div>
            </div>
            {/* Основная статистика (Enrolled/Created) */}
            <div className="card-footer bg-white border-0 p-3 d-flex justify-content-around">
               <div className="text-center">
                 <div className="fw-bold fs-5">{enrollments.length}</div>
                 <div className="text-muted small" style={{ fontSize: '0.75rem' }}>ENROLLED</div>
               </div>
               {(user.role === 'teacher' || user.isTeacher) && (
                 <div className="text-center">
                   <div className="fw-bold fs-5">{stats.courseCount}</div>
                   <div className="text-muted small" style={{ fontSize: '0.75rem' }}>CREATED</div>
                 </div>
               )}
            </div>
          </div>

          {/* Menu */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="d-grid gap-2">
                {(user.role === 'teacher' || user.isTeacher) ? (
                  <button className="btn btn-success border-0 text-start p-3 rounded-3 d-flex align-items-center shadow-sm" onClick={() => navigate('/instructor/add-course')}>
                    <i className="bi bi-plus-circle-fill me-3 fs-5 text-white"></i>
                    <div className="text-white">
                      <div className="fw-bold">{t('course.addCourseButton')}</div>
                      <div className="small text-white-50">Create new content</div>
                    </div>
                  </button>
                ) : (
                  <button className="btn btn-light text-start p-3 rounded-3 d-flex align-items-center" onClick={() => navigate('/apply-teacher')}>
                    <i className="bi bi-person-video3 me-3 fs-5 text-primary"></i>
                    <div>
                        <div className="fw-bold">{t('teacher.applyButton')}</div>
                        <div className="small text-muted">Join our team</div>
                    </div>
                  </button>
                )}
                
                {/* Кнопка для разработчика */}
                {user.role !== 'teacher' && (
                  <button className="btn btn-light text-start p-3 rounded-3 d-flex align-items-center" onClick={() => {
                      if (!window.confirm(t('teacher.confirmGrant'))) return;
                      try { promoteToTeacher(); window.location.reload(); } catch (e) { alert(e.message || 'Error'); }
                    }}>
                    <i className="bi bi-bug me-3 fs-5 text-warning"></i>
                    <div className="small text-muted ms-2">Dev: Give Teacher Role</div>
                  </button>
                )}

                <hr className="my-2 opacity-50"/>
                <button className="btn btn-danger border-0 text-start p-3 rounded-3 d-flex align-items-center shadow-sm" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-3 fs-5 text-white"></i>
                  <span className="fw-bold text-white">{t('logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-12 col-lg-8">
          
          {/* Блок созданных курсов */}
          {(user.role === 'teacher' || user.isTeacher) && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent border-0 pt-4 px-4">
                 <h5 className="fw-bold mb-0 text-success">
                   <i className="bi bi-easel2 me-2"></i> Created by Me
                 </h5>
              </div>
              <div className="card-body p-4">
                {createdCourses.length === 0 ? (
                   <div className="text-center py-4 text-muted border rounded bg-light">
                     <p className="mb-2">You haven't created any courses yet.</p>
                     <button className="btn btn-sm btn-success" onClick={() => navigate('/instructor/add-course')}>Create First Course</button>
                   </div>
                ) : (
                  <div className="d-grid gap-3">
                    {createdCourses.map(c => (
                      <div 
                        className="card border-0 bg-light p-3" 
                        key={c._id || c.id}
                        onClick={() => navigate(`/course/${c._id || c.id}`)}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}  
                      >
                        <div className="d-flex align-items-center">
                          <img 
                            src={c.img || c._tempImage} 
                            alt={c.title} 
                            className="rounded-3 shadow-sm me-3"
                            style={{ width: '60px', height: '45px', objectFit: 'cover' }} 
                          />
                          <div className="flex-grow-1">
                            <h6 className="fw-bold mb-0 text-truncate">{c.title}</h6>
                            <div className="small text-muted">
                               <span className="badge bg-secondary me-2">{c.status || 'Draft'}</span>
                               <span>${c.price}</span>
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-sm btn-outline-secondary" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                navigate(`/instructor/edit-course/${c._id || c.id}`);
                              }}
                              title="Edit Course"
                            >
                               <i className="bi bi-pencil"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger" 
                              onClick={(e) => { 
                                e.stopPropagation();
                                if(window.confirm('Delete this course?')) {
                                  courseService.delete(c._id || c.id).then(() => {
                                    setCreatedCourses(prev => prev.filter(item => item._id !== c._id && item.id !== c.id));
                                  });
                                }
                              }}
                              title="Delete Course"
                            >
                               <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Блок купленных курсов */}
          <div className="card border-0 shadow-sm">
             <div className="card-header bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">My Learning</h5>
                <button className="btn btn-link text-decoration-none small" onClick={() => navigate('/search')}>Browse more</button>
             </div>
             <div className="card-body p-4">
                {enrollments.length === 0 ? (
                  <div className="text-center py-5">
                     <i className="bi bi-journal-x fs-1 text-muted mb-3 d-block"></i>
                     <h6 className="fw-bold">{t('youHaveNoEnrolled')}</h6>
                     <p className="text-muted small mb-4">Start learning today!</p>
                     <button className="btn btn-primary rounded-pill px-4" onClick={() => navigate('/search')}>Explore Courses</button>
                  </div>
                ) : (
                  <div className="d-grid gap-3">
                    {enrollments.map(c => (
                      <div className="card border-0 bg-light p-2 course-item-hover" key={c.id} style={{ transition: '0.2s', cursor: 'pointer' }} onClick={() => navigate(`/course/${c.id}`)}>
                        <div className="d-flex align-items-center">
                          <img 
                            src={c.img} 
                            alt={c.title} 
                            className="rounded-3 shadow-sm me-3"
                            style={{ width: '80px', height: '60px', objectFit: 'cover' }} 
                          />
                          <div className="flex-grow-1">
                            <h6 className="fw-bold mb-1 text-truncate">{c.title}</h6>
                            <div className="text-muted small">
                              <i className="bi bi-person me-1"></i> {c.author}
                            </div>
                          </div>
                          <div className="ms-3 pe-2">
                             <i className="bi bi-play-circle-fill text-primary fs-3"></i>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AccountPage;