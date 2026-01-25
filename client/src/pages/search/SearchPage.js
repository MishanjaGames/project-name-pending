import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { getUser, clearUser, setUser as setUserStorage } from '../../utils/auth';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useCart } from '../../contexts/CartContext';

function SearchPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const { lang, setLang, theme, setTheme, t } = useContext(SettingsContext);
  const { addItem } = useCart();

  // State for view mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState('grid');

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

  // Styles
  const gridImageStyle = {
    width: '100%',
    height: '160px',
    objectFit: 'cover'
  };

  const listImageStyle = {
    width: '100%',
    height: '100%',
    minHeight: '180px',
    objectFit: 'cover'
  };

  const allCourses = [
    { id: 1, title: 'C++: Complete Guide', author: 'Yuri Popov', type: 'Programming', level: 'Junior', price: 10.99, img: 'https://bigzoo.com.ua/image/cache/catalog/Animals/Popugai/malenkiye/volnistyye/volnistyy_goluboy1-750x750-product_thumb.jpg' },
    { id: 2, title: 'Full JavaScript Course', author: 'Anna Ivanova', type: 'Programming', level: 'Middle', price: 9.99, img: 'https://www.rodyna.in.ua/wp-content/uploads/2018/09/%D0%92%D1%96%D0%B4%D0%B2%D0%B0%D0%B6%D0%BD%D0%B0-%D0%BA%D0%B2%D1%96%D1%82%D0%BA%D0%B0_6_1.jpg' },
    { id: 3, title: 'Python for Data Science', author: 'John Doe', type: 'Data Science', level: 'Senior', price: 12.99, img: 'https://justzoo.com.ua/image/cache/catalog/image/cache/catalog/blog/a661e463c551a01ef4b1d01b4b22dfb6-890x0.webp' },
    { id: 4, title: 'Java Masterclass', author: 'Roman S', type: 'Programming', level: 'Junior', price: 9.99, img: 'https://bigzoo.com.ua/image/cache/catalog/Animals/Popugai/sredniye/Ozherelovyye/ozherelovyy_zelenyy_na_dokorm2-750x750-product_thumb.jpg' },
    { id: 5, title: 'Unreal Engine - C++', author: 'Yuri Popov', type: 'Game Dev', level: 'Middle', price: 10.99, img: 'https://images.unsplash.com/photo-1589578527966-26190b2be3f3?w=800' },
    { id: 6, title: 'Unity 2D Platformer', author: 'Anvar Abdusatarov', type: 'Game Dev', level: 'Junior', price: 9.99, img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800' }
  ];

  const maxDataPrice = Math.ceil(Math.max(...allCourses.map(c => c.price)));
  const DEFAULT_MAX = maxDataPrice > 0 ? maxDataPrice : 100;

  const [titleQuery, setTitleQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [authorQuery, setAuthorQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sliderValues, setSliderValues] = useState([0, DEFAULT_MAX]);

  const clearFilters = () => {
    setTitleQuery('');
    setTypeFilter('all');
    setLevelFilter('all');
    setAuthorQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSliderValues([0, DEFAULT_MAX]);
  };

  const handleSliderChange = (values) => {
    setSliderValues(values);
    setMinPrice(values[0]);
    setMaxPrice(values[1]);
  };

  const normalize = (s) => {
    if (!s) return '';
    return String(s).toLowerCase().replace(/[^a-z0-9+]+/g, ' ').trim();
  };

  const nq = normalize(titleQuery);
  const aq = normalize(authorQuery);
  const tf = typeFilter;
  const lf = levelFilter;

  const matchDetails = allCourses.map(c => {
    const normalizedTitle = normalize(c.title || '');
    const normalizedAuthor = normalize(c.author || '');
    
    // Updated logic: Search checks BOTH title AND author
    const titleMatch = nq === '' || normalizedTitle.includes(nq) || normalizedAuthor.includes(nq);
    
    const typeMatch = tf === 'all' || c.type === tf;
    const levelMatch = lf === 'all' || c.level === lf;
    const authorMatch = aq === '' || normalizedAuthor.includes(aq);
    
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    const minMatch = isNaN(min) ? true : c.price >= min;
    const maxMatch = isNaN(max) ? true : c.price <= max;
    
    const matched = titleMatch && typeMatch && levelMatch && authorMatch && minMatch && maxMatch;
    return { id: c.id, matched };
  });

  const filtered = matchDetails.filter(d => d.matched).map(d => allCourses.find(c => c.id === d.id));

  // Helper to handle Enroll click
  const handleEnroll = (course) => {
    const u = getUser();
    if (!u) { navigate('/login'); return; }
    u.enrolled = u.enrolled || [];
    if (!u.enrolled.find(x => x.id === course.id)) {
      u.enrolled.push({ id: course.id, title: course.title, author: course.author, img: course.img });
      setUserStorage(u);
      setUser(u);
      alert(t('enrolledIn') + course.title);
    } else {
      alert(t('alreadyEnrolled'));
    }
  };

  return (
    <div>
      <div className="container my-4">
        <div className="row">
          <aside className="col-12 col-md-4 col-lg-3 mb-4">
            <div className="card p-3">
              <h6 className="mb-3">{t('filters')}</h6>
              
              {/* Main search input (Title/Author) */}
              <label className="form-label">{t('title')}</label>
              <input className="form-control mb-2" placeholder={t('title')} value={titleQuery} onChange={(e) => setTitleQuery(e.target.value)} />

              <label className="form-label">{t('type')}</label>
              <select className="form-select mb-2" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">{t('all')}</option>
                <option value="Programming">Programming</option>
                <option value="Data Science">Data Science</option>
                <option value="Game Dev">Game Dev</option>
              </select>

              <label className="form-label">Level</label>
              <select className="form-select mb-2" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                <option value="all">{t('all')}</option>
                <option value="Junior">Junior</option>
                <option value="Middle">Middle</option>
                <option value="Senior">Senior</option>
              </select>

              <label className="form-label">{t('author')}</label>
              <input className="form-control mb-2" placeholder={t('author')} value={authorQuery} onChange={(e) => setAuthorQuery(e.target.value)} />

              <label className="form-label">{t('priceRange')}</label>
              <div className="px-2 mb-3 mt-1">
                <Slider
                  range
                  min={0}
                  max={DEFAULT_MAX}
                  value={sliderValues}
                  onChange={handleSliderChange}
                  trackStyle={[{ backgroundColor: '#0d6efd' }]}
                  handleStyle={[
                    { borderColor: '#0d6efd', backgroundColor: '#fff' },
                    { borderColor: '#0d6efd', backgroundColor: '#fff' }
                  ]}
                />
              </div>

              <div className="d-flex gap-2 mb-3">
                <input 
                  className="form-control" 
                  type="number" 
                  placeholder={t('min')} 
                  value={minPrice} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setMinPrice(val);
                    if(val !== '') setSliderValues([Number(val), sliderValues[1]]);
                  }} 
                />
                <input 
                  className="form-control" 
                  type="number" 
                  placeholder={t('max')} 
                  value={maxPrice} 
                  onChange={(e) => {
                     const val = e.target.value;
                     setMaxPrice(val);
                     if(val !== '') setSliderValues([sliderValues[0], Number(val)]);
                  }} 
                />
              </div>

              <div className="d-flex justify-content-between">
                <button className="btn btn-outline-secondary" onClick={clearFilters}>{t('clear')}</button>
                <div className="text-muted align-self-center">{filtered.length} {t('results')}</div>
              </div>
            </div>
          </aside>

          <main className="col-12 col-md-8 col-lg-9">
            <div className="mb-3 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">{t('searchResults')}</h5>
                <div className="text-muted small">{t('showing')} <strong>{filtered.length}</strong> {t('results')} of {allCourses.length}</div>
              </div>
              
              {/* View Toggle Buttons */}
              <div className="btn-group" role="group">
                <button 
                  type="button" 
                  className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`} 
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z"/>
                  </svg>
                </button>
                <button 
                  type="button" 
                  className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`} 
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="row g-4">
              {filtered.map(course => (
                <div key={course.id} className={viewMode === 'grid' ? "col-12 col-md-6 col-lg-4" : "col-12"}>
                  
                  {viewMode === 'grid' ? (
                    // GRID VIEW CARD
                    <div className="card h-100">
                      <img src={course.img} className="card-img-top" alt={course.title} style={gridImageStyle} />
                      <div className="card-body d-flex flex-column">
                        <h6 className="card-title">{course.title}</h6>
                        <p className="mb-1 text-muted small">
                          {course.author} · {course.type} · <span className="badge bg-secondary">{course.level}</span>
                        </p>
                        <div className="mt-auto d-flex justify-content-between align-items-center">
                          <div>
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => navigate('/search')}>{t('preview')}</button>
                            <button className="btn btn-sm btn-primary me-2" onClick={() => handleEnroll(course)}>{t('enroll')}</button>
                            <button className="btn btn-sm btn-outline-success me-2" onClick={() => addItem({ id: course.id, title: course.title, price: course.price, img: course.img, description: course.title }, 1)}><i className="bi bi-cart"></i> +</button>
                          </div>
                          <div className="fw-bold">${course.price.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // LIST VIEW CARD
                    <div className="card h-100">
                      <div className="row g-0 h-100">
                        <div className="col-md-3">
                           <img src={course.img} alt={course.title} style={listImageStyle} className="rounded-start" />
                        </div>
                        <div className="col-md-9">
                          <div className="card-body d-flex flex-column h-100">
                            <div className="d-flex justify-content-between">
                               <h5 className="card-title">{course.title}</h5>
                               <div className="fw-bold fs-5">${course.price.toFixed(2)}</div>
                            </div>
                            <p className="text-muted mb-2">
                              {course.author} | {course.type} | <span className="badge bg-secondary">{course.level}</span>
                            </p>
                            <p className="card-text text-truncate">
                               Description of the course content goes here...
                            </p>
                            <div className="mt-auto">
                              <button className="btn btn-sm btn-outline-primary me-2" onClick={() => navigate('/search')}>{t('preview')}</button>
                              <button className="btn btn-sm btn-primary me-2" onClick={() => handleEnroll(course)}>{t('enroll')}</button>
                              <button className="btn btn-sm btn-outline-success" onClick={() => addItem({ id: course.id, title: course.title, price: course.price, img: course.img, description: course.title }, 1)}>Add to cart</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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