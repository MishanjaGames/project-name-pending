import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearUser } from '../../utils/auth';
import { SettingsContext } from '../../contexts/SettingsContext';
import { UtilityModal } from '../../components/UtilityModal';
import config from '../../config/config';

const API_URL = config.API_URL;
const BASE_URL = API_URL.replace('/api', '');
function AccountPage() {
  const navigate = useNavigate();
  const { t } = useContext(SettingsContext);
  
  const [user] = (function(){ try { return [getUser()]; } catch (e) { return [null]; } })();
  const [createdCourses, setCreatedCourses] = useState([]);
  const [stats, setStats] = useState({ courseCount: 0, linkCount: 0 });
  const [enrollments, setEnrollments] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null); // course to delete
  const [infoModal, setInfoModal] = useState({ show: false, title: '', message: '' });
  const hasTeacherRights = user && ['create', 'manage', 'admin', 'root'].includes(user.role);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    if (['teacher', 'admin', 'manage', 'create', 'root'].includes(user.role)) {
      fetch(`${API_URL}/courses`, { headers })
        .then(res => res.json())
        .then(res => {
          const allCourses = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          const myCourses = allCourses.filter(c => {
            const courseOwnerId = String(c.userId?._id || c.userId || '');
            const currentUserId = String(user.id || user._id || user.email || '');
            const courseOwnerNick = String(c.userId?.nickname || '').toLowerCase();
            const userName = String(user.name || '').toLowerCase();
            return (courseOwnerId && courseOwnerId === currentUserId) || (courseOwnerNick && courseOwnerNick === userName);
          });
          setCreatedCourses(myCourses);
          setStats({ courseCount: myCourses.length, linkCount: myCourses.reduce((sum, c) => sum + (c.links?.length || 0), 0) });
        })
        .catch(err => console.error("Error fetching courses:", err));
    }

    if (user.enrolled?.length > 0) {
      Promise.all(
        user.enrolled.map(el =>
          fetch(`${API_URL}/courses/${el._id}`, { headers }).then(res => res.json()).then(res => res.data)
        )
      ).then(courses => setEnrollments(courses.filter(Boolean)));
    }
  }, []); // empty deps — runs once on mount

  const handleDeleteCourse = async (c) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/manage/courses/${c._id || c.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setCreatedCourses(prev => prev.filter(item => (item._id || item.id) !== (c._id || c.id)));
      } else {
        const errorData = await response.json();
        setInfoModal({ show: true, title: t('accountPage.deleteFailed') || 'Delete failed', message: errorData.message || t('accountPage.accessDenied') || 'Access denied.' });
      }
    } catch {
      setInfoModal({ show: true, title: 'Error', message: t('accountPage.serverErrorDelete') || 'Server error while deleting.' });
    }
    setDeleteTarget(null);
  };

  if (!user) {
    setTimeout(() => navigate('/login'), 0);
    return null;
  }

  const handleLogout = () => {
    clearUser();
    navigate('/');
  };

  return (
    <div className="container py-5" style={{ maxWidth: '1100px' }}>
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">{t('accountPage.title')}</h2>
          <p className="text-muted mb-0">{t('accountPage.welcome')}, {user.name}!</p>
        </div>
        <button className="btn btn-outline-secondary rounded-pill px-4 shadow-sm" onClick={() => navigate('/settings')}>
          <i className="bi bi-gear me-2"></i> {t('settings')}
        </button>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm mb-4 overflow-hidden">
            <div className="card-body p-4 text-center bg-primary bg-opacity-10">
              <div className="bg-white rounded-circle shadow-sm mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-person-circle fs-1 text-primary"></i>
              </div>
              <h5 className="fw-bold mb-1">{user.name}</h5>
              <p className="text-muted small mb-0">{user.email}</p>
              <div className="mt-2">
                <span className={`badge rounded-pill px-3 py-2 ${hasTeacherRights ? 'bg-success' : 'bg-primary'}`}>
                  {user.role === 'default' ? t('accountPage.student') : (t(`accountPage.${user.role}`) || user.role.toUpperCase())}
                </span>
              </div>
            </div>
            
            <div className="card-footer bg-white border-0 p-3 d-flex justify-content-around">
               <div className="text-center">
                 <div className="fw-bold fs-5">{enrollments.length}</div>
                 <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{t('accountPage.enrolled')}</div>
               </div>
               {hasTeacherRights && (
                 <div className="text-center">
                   <div className="fw-bold fs-5">{stats.courseCount}</div>
                   <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{t('accountPage.created')}</div>
                 </div>
               )}
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="d-grid gap-2">
                {!hasTeacherRights && (
                  <button className="btn btn-light text-start p-3 rounded-3 d-flex align-items-center" onClick={() => navigate('/apply-teacher')}>
                    <i className="bi bi-person-video3 me-3 fs-5 text-primary"></i>
                    <div>
                        <div className="fw-bold">{t('teacher.applyButton')}</div>
                    </div>
                  </button>
                )}

                {!hasTeacherRights && <hr className="my-2 opacity-50"/>}
                
                <button className="btn btn-danger border-0 text-start p-3 rounded-3 d-flex align-items-center shadow-sm" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-3 fs-5 text-white"></i>
                  <span className="fw-bold text-white">{t('logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          {hasTeacherRights && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent border-0 pt-4 px-4">
                 <h5 className="fw-bold mb-0 text-success">
                   <i className="bi bi-easel2 me-2"></i> {t('accountPage.createdCourses')}
                 </h5>
              </div>
              <div className="card-body p-4">
                {createdCourses.length === 0 ? (
                   <div className="text-center py-4 text-muted border rounded bg-light">
                     <p className="mb-2">{t('accountPage.noCreatedCourses')}</p>
                     <button className="btn btn-sm btn-success" onClick={() => navigate('/add-course')}>{t('accountPage.createFirstCourse')}</button>
                   </div>
                ) : (
                  <div className="d-grid gap-3">
                    {createdCourses.map(c => {
                      let imgSrc = 'https://placehold.co/60x45?text=No+Img';
                      if (c.links && c.links.length > 0 && c.links[0].url) {
                        let cleanUrl = c.links[0].url.replace(/\\/g, '/');
                        cleanUrl = cleanUrl.replace('/api/manage/courses', '/api/courses');
                        imgSrc = cleanUrl.startsWith('http') ? cleanUrl : `${BASE_URL}${cleanUrl}`;
                      } else if (c.img) {
                        imgSrc = c.img;
                      } else if (c._tempImage) {
                        imgSrc = c._tempImage;
                      }

                      return (
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
                              src={imgSrc} 
                              alt={c.title} 
                              className="rounded-3 shadow-sm me-3"
                              style={{ width: '60px', height: '45px', objectFit: 'cover' }} 
                              onError={(e) => { e.target.src = 'https://placehold.co/60x45?text=No+Img'; }}
                            />
                            <div className="flex-grow-1">
                              <h6 className="fw-bold mb-0 text-truncate">{c.trans[0].title}</h6>
                              <div className="small text-muted">
                                 <span className="badge bg-secondary me-2">{c.status === 'editing' ? t('accountPage.draft') : c.status}</span>
                                 <span>${c.price}</span>
                              </div>
                            </div>
                            <div className="d-flex gap-2">
                              {/* КНОПКА MANAGE */}
                              <button 
                                className="btn btn-sm btn-primary shadow-sm fw-bold" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  navigate(`/manage/session/${c._id || c.id}`);
                                }}
                                title={t('common.manageSession')}
                              >
                                 <i className="bi bi-kanban me-1"></i> {t('accountPage.manage')}
                              </button>

                              <button 
                                className="btn btn-sm btn-outline-secondary" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  navigate(`/instructor/edit-course/${c._id || c.id}`);
                                }}
                              >
                                 <i className="bi bi-pencil"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  setDeleteTarget(c);
                                }}
                                title={t('accountPage.deleteCourse')}
                              >
                                <i className="bi bi-trash"></i>
                              </button> 
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card border-0 shadow-sm">
             <div className="card-header bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                   <h5 className="fw-bold mb-0">{t('accountPage.myLearning')}</h5>
                   {/* КНОПКА REDEEM */}
                   <button 
                     className="btn btn-sm btn-outline-primary fw-bold px-3 rounded-pill" 
                     onClick={() => navigate('/redeem')}
                   >
                     <i className="bi bi-key-fill me-1"></i> {t('accountPage.redeem')}
                   </button>
                </div>
                <button className="btn btn-link text-decoration-none small" onClick={() => navigate('/search')}>{t('accountPage.browseMore')}</button>
             </div>
             <div className="card-body p-4">
                {enrollments.length === 0 ? (
                  <div className="text-center py-5">
                     <i className="bi bi-journal-x fs-1 text-muted mb-3 d-block"></i>
                     <h6 className="fw-bold">{t('accountPage.noEnrolledCourses')}</h6>
                     <p className="text-muted small mb-4">{t('accountPage.startLearning')}</p>
                     <button className="btn btn-primary rounded-pill px-4" onClick={() => navigate('/search')}>{t('accountPage.exploreCourses')}</button>
                  </div>
                ) : (
                  <div className="d-grid gap-3">
                    {enrollments.map(c => (
                      <div className="card border-0 bg-light p-2 course-item-hover" key={c._id} style={{ transition: '0.2s', cursor: 'pointer' }} onClick={() => navigate(`/course/${c._id}`)}>
                        <div className="d-flex align-items-center">
                          <img 
                            src={c.img || 'https://placehold.co/80x60?text=Course'} 
                            alt={c.title} 
                            className="rounded-3 shadow-sm me-3"
                            style={{ width: '80px', height: '60px', objectFit: 'cover' }} 
                            onError={(e) => { e.target.src = 'https://placehold.co/80x60?text=Course'; }}
                          />
                          <div className="flex-grow-1">
                            <h6 className="fw-bold mb-1 text-truncate">{c.trans[0].title}</h6>
                            <div className="text-muted small">
                              <i className="bi bi-person me-1"></i> {c.userId}
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
      <UtilityModal
        show={!!deleteTarget}
        type="confirm"
        danger
        title={t('accountPage.deleteConfirm') || 'Delete course?'}
        message={deleteTarget ? `"${deleteTarget.trans?.[0]?.title || deleteTarget.title}" will be permanently deleted.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => handleDeleteCourse(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
      <UtilityModal
        show={infoModal.show}
        type="info"
        title={infoModal.title}
        message={infoModal.message}
        onClose={() => setInfoModal({ show: false, title: '', message: '' })}
      />
    </div>
  );
}

export default AccountPage;