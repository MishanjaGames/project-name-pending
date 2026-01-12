import { useNavigate } from 'react-router-dom';
import { getUser, clearUser } from '../../utils/auth';
import { useState, useContext } from 'react';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useCart } from '../../contexts/CartContext';

function HomePage() {
  const navigate = useNavigate();
  const { lang, setLang, theme, setTheme, t } = useContext(SettingsContext);
  const { totalItems, addItem } = useCart();
  const [navQuery, setNavQuery] = useState('');

  const imageStyle = {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  };

  const features = [
    { titleKey: 'feature1Title', descKey: 'feature1Desc' },
    { titleKey: 'feature2Title', descKey: 'feature2Desc' },
    { titleKey: 'feature3Title', descKey: 'feature3Desc' }
  ];

  const courses = [
    { title: 'C++', img: 'https://bigzoo.com.ua/image/cache/catalog/Animals/Popugai/malenkiye/volnistyye/volnistyy_goluboy1-750x750-product_thumb.jpg' },
    { title: 'JavaScript', img: 'https://www.rodyna.in.ua/wp-content/uploads/2018/09/%D0%92%D1%96%D0%B4%D0%B2%D0%B0%D0%B6%D0%BD%D0%B0-%D0%BA%D0%B2%D1%96%D1%82%D0%BA%D0%B0_6_1.jpg' },
    { title: 'Python', img: 'https://justzoo.com.ua/image/cache/catalog/image/cache/catalog/blog/a661e463c551a01ef4b1d01b4b22dfb6-890x0.webp' },
    { title: 'Java', img: 'https://bigzoo.com.ua/image/cache/catalog/Animals/Popugai/sredniye/Ozherelovyye/ozherelovyy_zelenyy_na_dokorm2-750x750-product_thumb.jpg' }
  ];

  return (
    <div>

      <header className="hero py-5">
        <div className="container d-flex flex-column flex-md-row align-items-center">
          <div className="hero-text me-md-5">
            <h1 className="hero-title">{t('heroTitle')}</h1>
            <p className="lead text-muted">{t('heroLead')}</p>
            <div className="mt-4">
              <button className="btn btn-primary btn-lg me-3" onClick={() => navigate('/register')}>{t('getStarted')}</button>
              <a href="#features" className="btn btn-outline-secondary btn-lg">{t('learnMore')}</a>
            </div>
          </div>

          <div className="hero-media mt-4 mt-md-0 flex-fill">
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80&auto=format&fit=crop" alt="Learning" className="img-fluid rounded shadow" />
          </div>
        </div>
      </header>

      <section id="features" className="py-5 bg-light">
        <div className="container">
          <div className="row text-center">
            {features.map((f, idx) => (
              <div className="col-12 col-md-4 mb-4" key={idx}>
                <div className="p-4 feature-card h-100 rounded shadow-sm">
                  <h5>{t(f.titleKey)}</h5>
                  <p className="text-muted">{t(f.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="py-5">
        <div className="container">
          <h2 className="mb-4">{t('popularCourses')}</h2>
          <div className="row g-4">
            {courses.map((c, idx) => (
              <div className="col-12 col-md-6 col-lg-3" key={idx}>
                <div className="card h-100">
                  <img src={c.img} className="card-img-top" alt={`${c.title} Course`} style={imageStyle} />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{c.title}</h5>
                    <p className="card-text">{t('courseCardText').replace('{title}', c.title)}</p>
                    <div className="mt-auto d-flex gap-2">
                      <a href="#" className="btn btn-primary">{t('goToCourse')}</a>
                      <button className="btn btn-outline-success" onClick={(e) => { e.preventDefault(); addItem({ id: c.title, title: c.title, price: 19.99, img: c.img, description: `${c.title} course` }, 1); }}>Add to cart</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="footer bg-dark text-light py-4">
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
          <div>© {new Date().getFullYear()} Project Name</div>
          <div>
            <a href="#" className="text-light me-3">{t('privacy')}</a>
            <a href="#" className="text-light">{t('terms')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;