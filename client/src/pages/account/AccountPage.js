import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearUser, promoteToTeacher } from '../../utils/auth';
import { SettingsContext } from '../../contexts/SettingsContext';

function AccountPage() {
  const navigate = useNavigate();
  const { t } = useContext(SettingsContext);
  
  // Безопасное получение пользователя
  const [user] = (function(){ try { return [getUser()]; } catch { return [null]; } })();

  // Редирект, если не залогинен
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
        
        {/* --- LEFT COLUMN: PROFILE & MENU --- */}
        <div className="col-12 col-lg-4">
          
          {/* Profile Card */}
          <div className="card border-0 shadow-sm mb-4 overflow-hidden">
            <div className="card-body p-4 text-center bg-primary bg-opacity-10">
              <div className="bg-white rounded-circle shadow-sm mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-person-circle fs-1 text-primary"></i>
              </div>
              <h5 className="fw-bold mb-1">{user.name}</h5>
              <p className="text-muted small mb-0">{user.email}</p>
              <div className="mt-2">
                <span className="badge bg-primary rounded-pill px-3 py-2">
                  {user.role === 'teacher' || user.isTeacher ? 'Instructor' : 'Student'}
                </span>
              </div>
            </div>
            {/* Quick Stats */}
            <div className="card-footer bg-white border-0 p-3 d-flex justify-content-around">
               <div className="text-center">
                 <div className="fw-bold fs-5">{enrollments.length}</div>
                 <div className="text-muted small" style={{ fontSize: '0.75rem' }}>COURSES</div>
               </div>
               <div className="text-center">
                 <div className="fw-bold fs-5">0</div>
                 <div className="text-muted small" style={{ fontSize: '0.75rem' }}>COMPLETED</div>
               </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
              <h6 className="fw-bold text-uppercase text-muted small mb-0">Menu</h6>
            </div>
            <div className="card-body p-3">
              <div className="d-grid gap-2">
                
                {/* Teacher Actions */}
                {(user.role === 'teacher' || user.isTeacher) ? (
                  <button className="btn btn-light text-success border-0 text-start p-3 rounded-3 d-flex align-items-center" onClick={() => navigate('/instructor/add-course')}>
                    <i className="bi bi-plus-circle-fill me-3 fs-5"></i>
                    <div>
                      <div className="fw-bold">{t('course.addCourseButton')}</div>
                      <div className="small opacity-75">Create new content</div>
                    </div>
                  </button>
                ) : (
                  <>
                    <button className="btn btn-light text-start p-3 rounded-3 d-flex align-items-center" onClick={() => navigate('/apply-teacher')}>
                      <i className="bi bi-person-video3 me-3 fs-5 text-primary"></i>
                      <div>
                         <div className="fw-bold">{t('teacher.applyButton')}</div>
                         <div className="small text-muted">Join our team</div>
                      </div>
                    </button>
                    
                    <button className="btn btn-light text-start p-3 rounded-3 d-flex align-items-center" onClick={() => {
                        if (!window.confirm(t('teacher.confirmGrant'))) return;
                        try { promoteToTeacher(); window.location.reload(); } catch (e) { alert(e.message || 'Error'); }
                      }}>
                      <i className="bi bi-bug me-3 fs-5 text-warning"></i>
                      <div>
                         <div className="fw-bold">{t('teacher.grantDev')}</div>
                         <div className="small text-muted">Dev Only</div>
                      </div>
                    </button>
                  </>
                )}

                <hr className="my-2 opacity-10"/>

                {/* ИСПРАВЛЕННАЯ КНОПКА ВЫХОДА */}
                {/* Было: btn-danger (красный фон) + text-danger (красный текст) */}
                {/* Стало: btn-light (фон) + text-danger (красный текст) */}
                <button className="btn btn-light text-danger border-0 text-start p-3 rounded-3 d-flex align-items-center" onClick={handleLogout}>
                   <i className="bi bi-box-arrow-right me-3 fs-5"></i>
                   <span className="fw-bold">{t('logout')}</span>
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: DASHBOARD CONTENT --- */}
        <div className="col-12 col-lg-8">
          
          {/* Statistics Widgets */}
          <div className="row g-3 mb-4">
             <div className="col-md-6">
               <div className="card border-0 shadow-sm h-100 p-3">
                 <div className="d-flex align-items-center">
                   <div className="rounded-3 bg-primary bg-opacity-10 p-3 me-3 text-primary">
                     <i className="bi bi-journal-bookmark-fill fs-4"></i>
                   </div>
                   <div>
                     <h6 className="text-muted small mb-1 text-uppercase">{t('coursesEnrolled')}</h6>
                     <h3 className="fw-bold mb-0">{enrollments.length}</h3>
                   </div>
                 </div>
               </div>
             </div>
             <div className="col-md-6">
               <div className="card border-0 shadow-sm h-100 p-3">
                 <div className="d-flex align-items-center">
                   <div className="rounded-3 bg-success bg-opacity-10 p-3 me-3 text-success">
                     <i className="bi bi-graph-up-arrow fs-4"></i>
                   </div>
                   <div>
                     <h6 className="text-muted small mb-1 text-uppercase">{t('progress')}</h6>
                     <h3 className="fw-bold mb-0">0%</h3>
                   </div>
                 </div>
               </div>
             </div>
          </div>

          {/* Enrolled Courses List */}
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
                     <p className="text-muted small mb-4">It looks empty here. Start learning today!</p>
                     <button className="btn btn-primary rounded-pill px-4" onClick={() => navigate('/search')}>Explore Courses</button>
                  </div>
                ) : (
                  <div className="d-grid gap-3">
                    {enrollments.map(c => (
                      <div className="card border-0 bg-light p-2 course-item-hover" key={c.id} style={{ transition: '0.2s' }}>
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
                             <button className="btn btn-sm btn-white border shadow-sm rounded-circle" title="Continue">
                               <i className="bi bi-play-fill"></i>
                             </button>
                          </div>
                        </div>
                        {/* Progress bar simulation */}
                        <div className="progress mt-2" style={{ height: '4px' }}>
                          <div className="progress-bar bg-primary" role="progressbar" style={{ width: '0%' }}></div>
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