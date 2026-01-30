import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { getUser, clearUser, setUser as setUserStorage } from '../../utils/auth';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useCart } from '../../contexts/CartContext';

// Если курс не deployed - не показываем его в результатах поиска

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
  
  // Этот стейт теперь отвечает за ГЛАВНЫЙ поиск (по названию И автору)
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);
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

  // --- ХЕЛПЕРЫ ДЛЯ ЦВЕТОВ ---
  const getLevelBadgeClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'junior': return 'bg-success';
      case 'middle': return 'bg-warning text-dark';
      case 'senior': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'Programming': return 'bg-primary';
      case 'Data Science': return 'bg-info text-dark';
      case 'Game Dev': return 'bg-dark';
      default: return 'bg-secondary';
    }
  };

  const allCourses = [
    { id: 1, title: 'C++: Complete Guide', author: 'Yuri Popov', type: 'Programming', level: 'Junior', price: 10.99, img: 'https://th.bing.com/th/id/OIP.ViNMzZEPRvADF6WtX6rQsgHaDt?w=326&h=175&c=7&r=0&o=7&pid=1.7&rm=3' },
    { id: 2, title: 'Full JavaScript Course', author: 'Anna Ivanova', type: 'Programming', level: 'Middle', price: 9.99, img: 'https://miro.medium.com/v2/resize:fit:1200/1*LyZcwuLWv2FArOumCxobpA.png' },
    { id: 3, title: 'Python for Data Science', author: 'John Doe', type: 'Data Science', level: 'Senior', price: 12.99, img: 'https://media.geeksforgeeks.org/wp-content/cdn-uploads/20230318230239/Python-Data-Science-Tutorial.jpg' },
    { id: 4, title: 'Java Masterclass', author: 'Roman S', type: 'Programming', level: 'Junior', price: 9.99, img: 'https://delta-dev-software.fr/wp-content/uploads/2023/10/java-hd-wallpaper-java-images-1024x614.jpg' },
    { id: 5, title: 'Unreal Engine - C++', author: 'Yuri Popov', type: 'Game Dev', level: 'Middle', price: 10.99, img: 'https://tse2.mm.bing.net/th/id/OIP.xi-iuyaQmrP-0VFlB3mfZgHaEK?rs=1&pid=ImgDetMain&o=7&rm=3' },
    { id: 6, title: 'Unity 2D Platformer', author: 'Anvar Abdusatarov', type: 'Game Dev', level: 'Junior', price: 9.99, img: 'https://th.bing.com/th/id/R.3d74254da9870098646ac98726cd6924?rik=C7cRmg4v7F5iYA&pid=ImgRaw&r=0' }
  ];

  const maxDataPrice = Math.ceil(Math.max(...allCourses.map(c => c.price)));
  const DEFAULT_MAX = maxDataPrice > 0 ? maxDataPrice : 100;

  const [typeFilter, setTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sliderValues, setSliderValues] = useState([0, DEFAULT_MAX]);

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setLevelFilter('all');
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

  const nq = normalize(searchQuery);
  const tf = typeFilter;
  const lf = levelFilter;

  const matchDetails = allCourses.map(c => {
    const normalizedTitle = normalize(c.title || '');
    const normalizedAuthor = normalize(c.author || '');
    
    // ГЛАВНЫЙ ПОИСК: Ищет совпадение ИЛИ в названии, ИЛИ в авторе
    const searchMatch = nq === '' || normalizedTitle.includes(nq) || normalizedAuthor.includes(nq);
    
    const typeMatch = tf === 'all' || c.type === tf;
    const levelMatch = lf === 'all' || c.level === lf;
    
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    const minMatch = isNaN(min) ? true : c.price >= min;
    const maxMatch = isNaN(max) ? true : c.price <= max;
    
    const matched = searchMatch && typeMatch && levelMatch && minMatch && maxMatch;
    return { id: c.id, matched };
  });

  const filtered = matchDetails.filter(d => d.matched).map(d => allCourses.find(c => c.id === d.id));

  const handleCardClick = (courseId) => {
    navigate(`/course/${courseId}`); 
  };

  const handleEnroll = (e, course) => {   
    e.stopPropagation(); 
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

  const handleAddToCart = (e, course) => {
    e.stopPropagation(); 
    addItem({ id: course.id, title: course.title, price: course.price, img: course.img, description: course.title }, 1);
  };

  return (
    <div>
      <div className="container my-4">
        
        {/* --- НОВАЯ БОЛЬШАЯ СТРОКА ПОИСКА (Под навбаром) --- */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="input-group input-group-lg shadow-sm">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input 
                type="text" 
                className="form-control border-start-0" 
                placeholder={t('searchPlaceholder') || "Search by title or author..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        {/* -------------------------------------------------- */}

        <div className="row">
          
          {/* SIDEBAR: Только фильтры (без полей ввода текста) */}
          <aside className="col-12 col-md-4 col-lg-3 mb-4">
            <div className="card p-3 border-0 shadow-sm">
              <h6 className="mb-3 fw-bold text-uppercase text-muted small">{t('filters')}</h6>
              
              {/* УДАЛЕНЫ ПОЛЯ Title И Author ОТСЮДА */}

              <label className="form-label small fw-bold">{t('type')}</label>
              <select className="form-select mb-3" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">{t('all')}</option>
                <option value="Programming">Programming</option>
                <option value="Data Science">Data Science</option>
                <option value="Game Dev">Game Dev</option>
              </select>

              <label className="form-label small fw-bold">Level</label>
              <select className="form-select mb-3" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                <option value="all">{t('all')}</option>
                <option value="Junior">Junior</option>
                <option value="Middle">Middle</option>
                <option value="Senior">Senior</option>
              </select>

              <label className="form-label small fw-bold">{t('priceRange')}</label>
              <div className="px-2 mb-3 mt-1">
                <Slider
                  range
                  min={0}
                  max={DEFAULT_MAX}
                  value={sliderValues}
                  onChange={handleSliderChange}
                  trackStyle={[{ backgroundColor: '#0d6efd' }]}
                  handleStyle={[
                    { borderColor: '#0d6efd', backgroundColor: '#fff', opacity: 1 },
                    { borderColor: '#0d6efd', backgroundColor: '#fff', opacity: 1 }
                  ]}
                  railStyle={{ backgroundColor: 'var(--input-border)' }} 
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

              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted small align-self-center">{filtered.length} {t('results')}</div>
                <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>{t('clear')}</button>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="col-12 col-md-8 col-lg-9">
            <div className="mb-3 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0 fw-bold">{t('searchResults')}</h5>
                {searchQuery && <p className="text-muted small mb-0">for "{searchQuery}"</p>}
              </div>
              
              {/* View Toggle Buttons */}
              <div className="btn-group shadow-sm" role="group">
                <button 
                  type="button" 
                  className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary bg-white text-primary'}`} 
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <i className="bi bi-grid-fill"></i>
                </button>
                <button 
                  type="button" 
                  className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary bg-white text-primary'}`} 
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <i className="bi bi-list-ul"></i>
                </button>
              </div>
            </div>

            <div className="row g-4">
              {filtered.map(course => (
                <div key={course.id} className={viewMode === 'grid' ? "col-12 col-md-6 col-lg-4" : "col-12"}>
                  
                  {viewMode === 'grid' ? (
                    // GRID VIEW CARD
                    <div 
                      className="card h-100 course-card border-0 shadow-sm" 
                      onClick={() => handleCardClick(course.id)} 
                      style={{ cursor: 'pointer' }} 
                    >
                      <div className="position-relative">
                        <img src={course.img} className="card-img-top course-img" alt={course.title} style={gridImageStyle} />
                        <div className="position-absolute top-0 end-0 p-2">
                           <span className={`badge ${getLevelBadgeClass(course.level)} shadow-sm`}>{course.level}</span>
                        </div>
                      </div>
                      
                      <div className="card-body d-flex flex-column">
                        <h6 className="card-title fw-bold mb-1">{course.title}</h6>
                        <p className="text-muted small mb-2">{course.author}</p>
                        
                        <div className="mb-3">
                          <span className={`badge ${getTypeBadgeClass(course.type)}`}>{course.type}</span>
                        </div>
                        
                        <div className="mt-auto d-flex justify-content-between align-items-center">
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-primary rounded-pill px-3" onClick={(e) => handleEnroll(e, course)}>{t('enroll')}</button>
                            <button className="btn btn-sm btn-light rounded-circle border" onClick={(e) => handleAddToCart(e, course)}><i className="bi bi-cart-plus text-primary"></i></button>
                          </div>
                          <div className="fw-bold fs-5">${course.price.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // LIST VIEW CARD
                    <div 
                      className="card h-100 course-card border-0 shadow-sm"
                      onClick={() => handleCardClick(course.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="row g-0 h-100">
                        <div className="col-md-4 col-lg-3 position-relative">
                           <img src={course.img} alt={course.title} style={listImageStyle} className="rounded-start course-img" />
                           <div className="position-absolute top-0 start-0 p-2">
                              <span className={`badge ${getLevelBadgeClass(course.level)} shadow-sm`}>{course.level}</span>
                           </div>
                        </div>
                        <div className="col-md-8 col-lg-9">
                          <div className="card-body d-flex flex-column h-100">
                            <div className="d-flex justify-content-between align-items-start">
                               <div>
                                 <h5 className="card-title fw-bold mb-1">{course.title}</h5>
                                 <p className="text-muted small mb-2">{course.author}</p>
                                 <span className={`badge ${getTypeBadgeClass(course.type)}`}>{course.type}</span>
                               </div>
                               <div className="fw-bold fs-4 text-primary">${course.price.toFixed(2)}</div>
                            </div>

                            <p className="card-text text-muted mt-3 text-truncate">
                               Comprehensive course covering all aspects of {course.title}. Perfect for {course.level} developers looking to upgrade their skills.
                            </p>
                            
                            <div className="mt-auto d-flex gap-2">
                              <button className="btn btn-sm btn-primary rounded-pill px-4" onClick={(e) => handleEnroll(e, course)}>{t('enroll')}</button>
                              <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={(e) => handleAddToCart(e, course)}>Add to cart</button>
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
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-search fs-1 mb-3 d-block opacity-50"></i>
                    <h5>{t('noResults')}</h5>
                    <p>Try adjusting your search or filters.</p>
                    <button className="btn btn-outline-primary rounded-pill mt-2" onClick={clearFilters}>{t('clear')}</button>
                  </div>
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