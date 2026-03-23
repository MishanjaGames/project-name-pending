import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useWishlist } from '../../contexts/WishlistContext';

function WishlistPage() {
  const navigate = useNavigate();
  const { wishlist, toggleWishlist } = useWishlist();
  const { theme } = useContext(SettingsContext);

  const isDark = theme === 'dark';

  return (
    <div className={`min-vh-100 py-5 ${isDark ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
      <div className="container">
        <h2 className="fw-bold mb-4">
          <i className="bi bi-heart-fill text-danger me-2"></i> 
          Мое Избранное (Wishlist)
        </h2>

        {wishlist.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-heartbreak text-muted" style={{ fontSize: '4rem' }}></i>
            <h4 className="mt-3">Ваш список желаний пуст</h4>
            <p className="text-muted">Сохраняйте сюда курсы, чтобы не потерять их!</p>
            <button className="btn btn-primary mt-3" onClick={() => navigate('/search')}>
              Искать курсы
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {wishlist.map(course => (
              <div key={course._id || course.id} className="col-md-6 col-lg-4">
                <div className={`card h-100 shadow-sm ${isDark ? 'bg-secondary text-light border-secondary' : ''}`}>
                  
                  {/* Картинка курса */}
                  <div className="position-relative">
                    <img 
                      src={course.thumbnail || 'https://via.placeholder.com/300x150'} 
                      className="card-img-top" 
                      alt={course.title} 
                      style={{ height: '180px', objectFit: 'cover' }}
                    />
                    {/* Кнопка УДАЛЕНИЯ из избранного */}
                    <button
                      className="btn btn-light rounded-circle shadow-sm position-absolute top-0 end-0 m-2"
                      onClick={() => toggleWishlist(course)}
                      title="Remove from Wishlist"
                    >
                      <i className="bi bi-heart-fill text-danger fs-5"></i>
                    </button>
                  </div>

                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold">{course.title}</h5>
                    <p className="card-text text-muted small mb-3">
                      {course.description ? course.description.substring(0, 80) + '...' : 'Описание курса...'}
                    </p>
                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-primary fs-5">${course.price || 'Free'}</span>
                      <button 
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => navigate(`/course/${course._id || course.id}`)}
                      >
                        Подробнее
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WishlistPage;