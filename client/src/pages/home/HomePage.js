import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useCart } from '../../contexts/CartContext';

function HomePage() {
  const navigate = useNavigate();
  const { t } = useContext(SettingsContext);
  const { addItem } = useCart();

  const imageStyle = {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  };

  const features = [
    { icon: 'bi-laptop', titleKey: 'feature1Title', descKey: 'feature1Desc', color: 'text-primary' },
    { icon: 'bi-people-fill', titleKey: 'feature2Title', descKey: 'feature2Desc', color: 'text-success' },
    { icon: 'bi-alarm', titleKey: 'feature3Title', descKey: 'feature3Desc', color: 'text-warning' }
  ];

  // Заменил попугаев на IT картинки
  const courses = [
    { id: 1, title: 'C++ Masterclass', img: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&q=80', price: 19.99 },
    { id: 2, title: 'Modern JavaScript', img: 'https://images.unsplash.com/photo-1627398242450-270fc0780444?w=500&q=80', price: 24.99 },
    { id: 3, title: 'Python for Data', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80', price: 22.99 },
    { id: 4, title: 'Java Enterprise', img: 'https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=500&q=80', price: 29.99 }
  ];

  return (
    <div className="homepage-wrapper">
      
      {/* HERO SECTION */}
      <header className="hero-section py-5 mb-5">
        <div className="container h-100">
          <div className="row align-items-center h-100">
            <div className="col-lg-6 my-4">
              <h1 className="display-4 fw-bold mb-3">{t('heroTitle')}</h1>
              <p className="lead mb-4 opacity-75">{t('heroLead')}</p>
              <div className="d-flex gap-3">
                <button className="btn btn-primary btn-lg px-4 shadow-sm" onClick={() => navigate('/search')}>{t('getStarted')}</button>
                <button className="btn btn-outline-dark btn-lg px-4" onClick={() => {
                  const el = document.getElementById('features');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}>{t('learnMore')}</button>
              </div>
            </div>
            <div className="col-lg-6">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80" 
                alt="Learning" 
                className="img-fluid rounded-4 shadow-lg hero-img" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* FEATURES SECTION */}
      <section id="features" className="py-5">
        <div className="container">
          <div className="row g-4 justify-content-center">
            {features.map((f, idx) => (
              <div className="col-md-4" key={idx}>
                <div className="card h-100 border-0 shadow-sm feature-card text-center p-4">
                  <div className={`mb-3 display-4 ${f.color}`}>
                    <i className={`bi ${f.icon}`}></i>
                  </div>
                  <h5 className="fw-bold">{t(f.titleKey)}</h5>
                  <p className="text-muted small">{t(f.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR COURSES */}
      <main className="py-5 bg-opacity-10">
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <h2 className="fw-bold mb-0">{t('popularCourses')}</h2>
            <button className="btn btn-link text-decoration-none" onClick={() => navigate('/search')}>{t('all')} &rarr;</button>
          </div>
          
          <div className="row g-4">
            {courses.map((c) => (
              <div className="col-12 col-md-6 col-lg-3" key={c.id}>
                <div className="card h-100 border-0 shadow-sm course-card">
                  <div className="position-relative overflow-hidden rounded-top">
                    <img src={c.img} className="card-img-top course-img" alt={c.title} style={imageStyle} />
                    <div className="course-overlay">
                      <button className="btn btn-light btn-sm rounded-pill" onClick={() => navigate('/search')}>{t('preview')}</button>
                    </div>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h6 className="card-title fw-bold">{c.title}</h6>
                    <p className="card-text text-muted small flex-grow-1">
                      {t('courseCardText').replace('{{title}}', c.title)}
                    </p>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <span className="fw-bold text-primary">${c.price}</span>
                      <button 
                        className="btn btn-sm btn-outline-primary rounded-pill" 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          addItem({ id: c.id, title: c.title, price: c.price, img: c.img }, 1); 
                        }}
                      >
                        <i className="bi bi-cart-plus me-1"></i> Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer py-5 mt-5 border-top">
        <div className="container text-center text-md-start">
          <div className="row">
            <div className="col-md-6 mb-3">
              <h5 className="fw-bold">Project Name</h5>
              <p className="text-muted small">Best platform to learn coding.</p>
            </div>
            <div className="col-md-6 text-md-end">
              <a href="#" className="text-muted text-decoration-none me-3">{t('privacy')}</a>
              <a href="#" className="text-muted text-decoration-none">{t('terms')}</a>
            </div>
          </div>
          <div className="text-center mt-4 text-muted small">
            © {new Date().getFullYear()} Project Name. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;