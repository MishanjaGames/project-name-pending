import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUser, clearUser, setUser as setUserStorage } from '../../utils/auth';
import { SettingsContext } from '../../contexts/SettingsContext';

function SearchPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const { lang, setLang, theme, setTheme, t } = useContext(SettingsContext);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      navigate('/login');
    } else {
      setUser(u);
    }
  }, []);

  const location = useLocation();
  const [navQuery, setNavQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setTitleQuery(q);
    setNavQuery(q);
  }, [location.search]);

  const imageStyle = {
    width: '100%',
    height: '160px',
    objectFit: 'cover'
  };

  // sample dataset
  const allCourses = [
    { id: 1, title: 'C++: Complete Guide', author: 'Yuri Popov', type: 'Programming', price: 10.99, img: 'https://bigzoo.com.ua/image/cache/catalog/Animals/Popugai/malenkiye/volnistyye/volnistyy_goluboy1-750x750-product_thumb.jpg' },
    { id: 2, title: 'Full JavaScript Course', author: 'Anna Ivanova', type: 'Programming', price: 9.99, img: 'https://www.rodyna.in.ua/wp-content/uploads/2018/09/%D0%92%D1%96%D0%B4%D0%B2%D0%B0%D0%B6%D0%BD%D0%B0-%D0%BA%D0%B2%D1%96%D1%82%D0%BA%D0%B0_6_1.jpg' },
    { id: 3, title: 'Python for Data Science', author: 'John Doe', type: 'Data Science', price: 12.99, img: 'https://justzoo.com.ua/image/cache/catalog/image/cache/catalog/blog/a661e463c551a01ef4b1d01b4b22dfb6-890x0.webp' },
    { id: 4, title: 'Java Masterclass', author: 'Roman S', type: 'Programming', price: 9.99, img: 'https://bigzoo.com.ua/image/cache/catalog/Animals/Popugai/sredniye/Ozherelovyye/ozherelovyy_zelenyy_na_dokorm2-750x750-product_thumb.jpg' },
    { id: 5, title: 'Unreal Engine - C++', author: 'Yuri Popov', type: 'Game Dev', price: 10.99, img: 'https://images.unsplash.com/photo-1589578527966-26190b2be3f3?w=800' },
    { id: 6, title: 'Unity 2D Platformer', author: 'Anvar Abdusatarov', type: 'Game Dev', price: 9.99, img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800' }
  ];

  const [titleQuery, setTitleQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [authorQuery, setAuthorQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const clearFilters = () => {
    setTitleQuery('');
    setTypeFilter('all');
    setAuthorQuery('');
    setMinPrice('');
    setMaxPrice('');
  };

  // normalize inputs for robust matching (preserve plus sign for "C++")
  const normalize = (s) => {
    if (!s) return '';
    // keep letters, numbers and plus sign, replace other chars with space
    return String(s).toLowerCase().replace(/[^a-z0-9+]+/g, ' ').trim();
  };

  const nq = normalize(titleQuery);
  const aq = normalize(authorQuery);
  const tf = typeFilter;

  const matchDetails = allCourses.map(c => {
    const normalizedTitle = normalize(c.title || '');
    const normalizedAuthor = normalize(c.author || '');
    const titleMatch = nq === '' || normalizedTitle.includes(nq);
    const typeMatch = tf === 'all' || c.type === tf;
    const authorMatch = aq === '' || normalizedAuthor.includes(aq);
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    const minMatch = isNaN(min) ? true : c.price >= min;
    const maxMatch = isNaN(max) ? true : c.price <= max;
    const matched = titleMatch && typeMatch && authorMatch && minMatch && maxMatch;
    return { id: c.id, title: c.title, normalizedTitle, titleMatch, typeMatch, authorMatch, minMatch, maxMatch, matched };
  });

  const filtered = matchDetails.filter(d => d.matched).map(d => allCourses.find(c => c.id === d.id));

  // debug: log search state and match details
  useEffect(() => {
    console.debug('Search debug', { titleQuery, nq, navQuery, filteredCount: filtered.length, matchDetails });
  }, [titleQuery, navQuery, filtered.length]);

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light" style={{ backgroundColor: '#fafafa' }}>
        <div className="container-fluid">
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

            {user ? (
              <>
                <button className="btn btn-outline-secondary me-2" onClick={() => navigate('/account')}>{t('account')}</button>
                <button className="btn btn-danger" onClick={() => { clearUser(); navigate('/'); }}>{t('logout')}</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="btn btn-outline-primary me-3">{t('login')}</button>
                <button onClick={() => navigate('/register')} className="btn btn-primary">{t('signup')}</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container my-4">
        <div className="row">
          <aside className="col-12 col-md-4 col-lg-3 mb-4">
            <div className="card p-3">
              <h6 className="mb-3">{t('filters')}</h6>

              <label className="form-label">{t('title')}</label>
              <input className="form-control mb-2" placeholder={t('title')} value={titleQuery} onChange={(e) => setTitleQuery(e.target.value)} />

              <label className="form-label">{t('type')}</label>
              <select className="form-select mb-2" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">{t('all')}</option>
                <option value="Programming">Programming</option>
                <option value="Data Science">Data Science</option>
                <option value="Game Dev">Game Dev</option>
              </select>

              <label className="form-label">{t('author')}</label>
              <input className="form-control mb-2" placeholder={t('author')} value={authorQuery} onChange={(e) => setAuthorQuery(e.target.value)} />

              <label className="form-label">{t('priceRange')}</label>
              <div className="d-flex gap-2 mb-3">
                <input className="form-control" placeholder={t('min')} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <input className="form-control" placeholder={t('max')} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>

              <div className="d-flex justify-content-between">
                <button className="btn btn-outline-secondary" onClick={clearFilters}>{t('clear')}</button>
                <div className="text-muted align-self-center">{filtered.length} {t('results')}</div>
              </div>
            </div>
          </aside>

          <main className="col-12 col-md-8 col-lg-9">
            <div className="mb-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{t('searchResults')}</h5>
              <div className="text-muted">{t('showing')} <strong>{filtered.length}</strong> {t('results')} of {allCourses.length}</div>
            </div>

            <div className="row g-4">
              {filtered.map(course => (
                <div className="col-12 col-md-6 col-lg-4" key={course.id}>
                  <div className="card h-100">
                    <img src={course.img} className="card-img-top" alt={course.title} style={imageStyle} />
                    <div className="card-body d-flex flex-column">
                      <h6 className="card-title">{course.title}</h6>
                      <p className="mb-1 text-muted small">{course.author} · {course.type}</p>
                      <div className="mt-auto d-flex justify-content-between align-items-center">
                        <div>
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => navigate('/search')}>{t('preview')}</button>
                          <button className="btn btn-sm btn-primary me-2" onClick={() => {
                            const u = getUser();
                            if (!u) { navigate('/login'); return; }
                            u.enrolled = u.enrolled || [];
                            if (!u.enrolled.find(x => x.id === course.id)) {
                              u.enrolled.push({ id: course.id, title: course.title, author: course.author, img: course.img });
                              // update localStorage and local state
                              setUserStorage(u);
                              setUser(u);
                              alert(t('enrolledIn') + course.title);
                            } else {
                              alert(t('alreadyEnrolled'));
                            }
                          }}>{t('enroll')}</button>
                        </div>
                        <div className="fw-bold">${course.price.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="col-12">
                  <div className="alert alert-warning">{t('noResults')}</div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
