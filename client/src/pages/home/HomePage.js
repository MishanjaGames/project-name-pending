import { useNavigate } from 'react-router-dom';
import { getUser, clearUser } from '../../utils/auth';
import { useState, useContext } from 'react';
import { SettingsContext } from '../../contexts/SettingsContext';

function HomePage() {
  const navigate = useNavigate();
  const { lang, setLang, theme, setTheme, t } = useContext(SettingsContext);
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
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container">
          <a className="navbar-brand" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            <img src="https://getbootstrap.com/docs/4.0/assets/brand/bootstrap-solid.svg" width="30" height="30" className="d-inline-block align-top me-2" alt="" />
            Project Name
          </a>

          <div className="d-flex align-items-center ms-auto">
            <button className="btn btn-link me-3 text-decoration-none" onClick={() => navigate('/search')}>{t('courses')}</button>

            <form className="d-flex me-3" onSubmit={(e) => { e.preventDefault(); navigate(`/search?q=${encodeURIComponent(navQuery)}`); }}>
              <input className="form-control me-2" type="search" placeholder={t('searchPlaceholder')} value={navQuery} onChange={(e) => setNavQuery(e.target.value)} />
              <button className="btn btn-outline-success" type="submit">{t('search')}</button>
            </form>

            <div className="me-3 d-flex align-items-center">
              <select className="form-select form-select-sm me-2" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
                <option value="en">EN</option>
                <option value="uk">UA</option>
              </select>
            </div>

            {(() => {
              const u = getUser();
              return u ? (
                <>
                  <button className="btn btn-outline-secondary me-2" onClick={() => navigate('/account')}>{t('account')}</button>
                  <button className="btn btn-danger" onClick={() => { clearUser(); navigate('/'); }}>{t('logout')}</button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/login')} className="btn btn-outline-primary me-2">{t('login')}</button>
                  <button onClick={() => navigate('/register')} className="btn btn-primary">{t('signup')}</button>
                </>
              );
            })()}
          </div>
        </div>
      </nav>

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
                    <a href="#" className="btn btn-primary mt-auto">{t('goToCourse')}</a>
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