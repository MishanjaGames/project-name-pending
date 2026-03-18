import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import './CoursePreview.css';
import { UtilityModal } from '../components/UtilityModal';

// Mock user data - replace with your actual auth
const MOCK_USER = {
  nickname: 'Admin User',
  email: 'admin@example.com',
  role: 'admin'
};

function CoursePreview() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [editMode, setEditMode] = useState(false);

    const [modal, setModal] = useState({ show: false, type: 'info', title: '', message: '', onConfirm: null, onCancel: null, danger: false });
    const closeModal  = () => setModal(p => ({ ...p, show: false }));
    const showInfo    = (title, message) => setModal({ show: true, type: 'info', title, message, onClose: closeModal });
    const showConfirm = (title, message, onConfirm, danger = false) => setModal({ show: true, type: 'confirm', danger, title, message, onConfirm, onCancel: closeModal });
  const [chapters, setChapters] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedChapter, setDraggedChapter] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  
  // Editable course fields
  const [editableCourse, setEditableCourse] = useState(null);
  const [showAddItemModal, setShowAddItemModal] = useState(null); // {chapterIndex, type}
  const [showTextEditor, setShowTextEditor] = useState(null);
  const [showSyntaxHelp, setShowSyntaxHelp] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockCourse = {
        _id: id || '1',
        title: 'Unity 2D Platformer',
        description: 'Create your first 2D platformer game with Unity. Learn game development fundamentals and build a complete game from scratch.',
        direction: 'GAME DEVELOPMENT',
        level: 'JUNIOR',
        price: 9.99,
        rating: 4.8,
        ratingCount: 91,
        thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=250&fit=crop',
        author: {
          nickname: 'Amar Abdurazakov'
        },
        updatedAt: '2026-02-18T14:30:00Z',
        whatYouWillLearn: [
          'Master the core concepts of Unity 2D Platformer',
          'Build real-world projects',
          'Understand game physics and mechanics',
          'Create engaging player controls'
        ],
        chapters: [
          {
            id: 'chapter-1',
            title: 'Chapter 1: Introduction',
            items: [
              {
                id: 'video-1',
                type: 'video',
                title: 'Welcome to the Course',
                url: 'https://www.w3schools.com/html/mov_bbb.mp4'
              },
              {
                id: 'link-1',
                type: 'link',
                title: 'Course Setup Guide',
                url: 'https://unity.com/learn'
              }
            ]
          },
          {
            id: 'chapter-2',
            title: 'Chapter 2: Getting Started with Unity',
            items: [
              {
                id: 'video-2',
                type: 'video',
                title: 'Installing Unity',
                url: 'https://www.w3schools.com/html/movie.mp4'
              }
            ]
          }
        ]
      };
      
      setCourse(mockCourse);
      setEditableCourse({...mockCourse});
      setChapters(mockCourse.chapters);
      setLoading(false);
    }, 500);
  }, [id]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const handleCourseFieldChange = (field, value) => {
    setEditableCourse(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSkillChange = (index, value) => {
    const newSkills = [...editableCourse.whatYouWillLearn];
    newSkills[index] = value;
    setEditableCourse(prev => ({
      ...prev,
      whatYouWillLearn: newSkills
    }));
    setHasChanges(true);
  };

  const addSkill = () => {
    setEditableCourse(prev => ({
      ...prev,
      whatYouWillLearn: [...prev.whatYouWillLearn, '']
    }));
    setHasChanges(true);
  };

  const removeSkill = (index) => {
    const newSkills = editableCourse.whatYouWillLearn.filter((_, i) => i !== index);
    setEditableCourse(prev => ({
      ...prev,
      whatYouWillLearn: newSkills
    }));
    setHasChanges(true);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditableCourse(prev => ({
          ...prev,
          thumbnail: reader.result
        }));
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Chapter drag & drop
  const handleChapterDragStart = (e, index) => {
    if (!editMode) return;
    setDraggedChapter(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleChapterDragOver = (e) => {
    if (!editMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleChapterDrop = (e, targetIndex) => {
    if (!editMode || draggedChapter === null) return;
    e.preventDefault();

    const newChapters = [...chapters];
    const [movedChapter] = newChapters.splice(draggedChapter, 1);
    newChapters.splice(targetIndex, 0, movedChapter);
    
    setChapters(newChapters);
    setDraggedChapter(null);
    setHasChanges(true);
  };

  // Item drag & drop
  const handleItemDragStart = (e, chapterIndex, itemIndex) => {
    if (!editMode) return;
    setDraggedItem({ chapterIndex, itemIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemDrop = (e, targetChapterIndex, targetItemIndex) => {
    if (!editMode || !draggedItem) return;
    e.preventDefault();

    const newChapters = [...chapters];
    const sourceChapter = newChapters[draggedItem.chapterIndex];
    const targetChapter = newChapters[targetChapterIndex];
    
    const [movedItem] = sourceChapter.items.splice(draggedItem.itemIndex, 1);
    targetChapter.items.splice(targetItemIndex, 0, movedItem);
    
    setChapters(newChapters);
    setDraggedItem(null);
    setHasChanges(true);
  };

  const addContentItem = (chapterIndex, type) => {
    setShowAddItemModal({ chapterIndex, type });
  };

  const saveContentItem = (chapterIndex, itemData) => {
    const newChapters = [...chapters];
    const newItem = {
      id: `item-${Date.now()}`,
      ...itemData
    };
    newChapters[chapterIndex].items.push(newItem);
    setChapters(newChapters);
    setShowAddItemModal(null);
    setHasChanges(true);
  };

  const deleteContentItem = (chapterIndex, itemIndex) => {
    showConfirm('Delete Item', 'Are you sure you want to delete this item?', () => {
    const newChapters = [...chapters];
    newChapters[chapterIndex].items.splice(itemIndex, 1);
    setChapters(newChapters);
    setHasChanges(true);
  };

  const parseTextSyntax = (text) => {
    let html = text;
    
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Paragraphs
    html = html.replace(/`([^}]+)`/g, '<p>$1</p>');
    
    // Links
    html = html.replace(/@([^@]+)@/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return html;
  };

  const handleSaveChanges = async () => {
    try {
      // TODO: Implement actual API call
      // await fetch(`/api/courses/${id}`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ ...editableCourse, chapters })
      // });
      
      setCourse({...editableCourse});
      setHasChanges(false);
      showInfo('Saved', 'Changes saved successfully!');
    } catch (err) {
      console.error('Error saving:', err);
      showInfo('Error', 'Failed to save changes');
    }
  };

  const handleAddToCart = () => {
    showInfo('Cart', `Added "${course.title}" to cart!`);
  };

  const handleEnroll = () => {
    showInfo('Enrolled', `Enrolled in "${course.title}"!`);
  };

  const handleLogout = () => {
    showInfo('Info', 'Logout clicked');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={i} className="bi bi-star-fill text-warning"></i>);
    }
    if (hasHalfStar) {
      stars.push(<i key="half" className="bi bi-star-half text-warning"></i>);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="bi bi-star text-warning"></i>);
    }
    return stars;
  };

  if (loading) {
    return (
      <>
        <Navbar data={MOCK_USER} onLogout={handleLogout} />
        <div className="course-preview-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Navbar data={MOCK_USER} onLogout={handleLogout} />
        <div className="course-preview-error">
          <h3>Course not found</h3>
        </div>
      </>
    );
  }

  const isAdmin = MOCK_USER && ['admin', 'root', 'manager'].includes(MOCK_USER.role);

  return (
    <>
      <Navbar data={MOCK_USER} onLogout={handleLogout} />
      
      <div className="course-preview-page">
        <div className="course-preview-container">
          
          {/* Top Section: Course Info + Purchase Card */}
          <div className="content-wrapper">
            
            {/* Left Column - Course Info Only */}
            <div className="course-info-section">
              
              {/* Mobile Thumbnail */}
              <div className="mobile-thumbnail">
                {editMode ? (
                  <div className="thumbnail-upload">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleThumbnailChange}
                      id="mobile-thumbnail-upload"
                      style={{display: 'none'}}
                    />
                    <label htmlFor="mobile-thumbnail-upload" className="thumbnail-upload-label">
                      <img src={editableCourse.thumbnail} alt={editableCourse.title} />
                      <div className="thumbnail-overlay">
                        <i className="bi bi-camera"></i>
                        <span>Change Photo</span>
                      </div>
                    </label>
                  </div>
                ) : (
                  <img src={course.thumbnail} alt={course.title} />
                )}
              </div>

              {/* Title and Price Row */}
              <div className="title-price-row">
                {editMode ? (
                  <input 
                    type="text"
                    className="form-control course-title-input"
                    value={editableCourse.title}
                    onChange={(e) => handleCourseFieldChange('title', e.target.value)}
                  />
                ) : (
                  <h1 className="course-title">{course.title}</h1>
                )}
                <div className="mobile-price">
                  ${editMode ? (
                    <input 
                      type="number"
                      className="form-control price-input"
                      value={editableCourse.price}
                      onChange={(e) => handleCourseFieldChange('price', parseFloat(e.target.value))}
                      step="0.01"
                      min="0"
                    />
                  ) : course.price}
                </div>
              </div>
              
              {/* Direction and Level Badges */}
              <div className="badges-row">
                {editMode ? (
                  <>
                    <input 
                      type="text"
                      className="form-control badge-input"
                      value={editableCourse.direction}
                      onChange={(e) => handleCourseFieldChange('direction', e.target.value)}
                      placeholder="Direction"
                    />
                    <input 
                      type="text"
                      className="form-control badge-input"
                      value={editableCourse.level}
                      onChange={(e) => handleCourseFieldChange('level', e.target.value)}
                      placeholder="Level"
                    />
                  </>
                ) : (
                  <>
                    <span className="badge badge-direction">{course.direction}</span>
                    <span className="badge badge-level">{course.level}</span>
                  </>
                )}
              </div>
              
              {/* Description Box */}
              <div className="description-box">
                {editMode ? (
                  <textarea 
                    className="form-control"
                    value={editableCourse.description}
                    onChange={(e) => handleCourseFieldChange('description', e.target.value)}
                    rows="3"
                  />
                ) : (
                  <p>{course.description}</p>
                )}
              </div>

              {/* Mobile Skills */}
              <div className="mobile-skills">
                <h4 className="section-title">What you'll learn</h4>
                <div className="skills-grid">
                  {editMode ? (
                    <>
                      {editableCourse.whatYouWillLearn.map((skill, idx) => (
                        <div className="skill-item-edit" key={idx}>
                          <input 
                            type="text"
                            className="form-control skill-input"
                            value={skill}
                            onChange={(e) => handleSkillChange(idx, e.target.value)}
                          />
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => removeSkill(idx)}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      ))}
                      <button className="btn btn-sm btn-primary" onClick={addSkill}>
                        <i className="bi bi-plus"></i> Add Skill
                      </button>
                    </>
                  ) : (
                    course.whatYouWillLearn.map((item, idx) => (
                      <div className="skill-item" key={idx}>
                        <i className="bi bi-check-circle-fill text-success"></i>
                        <span>{item}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Ratings */}
              <div className="ratings-section">
                <span className="rating-number">{course.rating}</span>
                <div className="stars">{renderStars(course.rating)}</div>
                <span className="students-count">({course.ratingCount} students)</span>
              </div>
              
              {/* Meta Info */}
              <div className="course-meta">
                <span className="meta-item">
                  Created by <strong>{course.author.nickname}</strong>
                </span>
                <span className="meta-divider">•</span>
                <span className="meta-item">
                  Last updated {formatDate(course.updatedAt)}
                </span>
              </div>

              {/* Mobile Buttons */}
              <div className="mobile-buttons">
                <button className="btn btn-primary btn-lg w-100 mb-2" onClick={handleAddToCart}>
                  Add to Cart
                </button>
                <button className="btn btn-outline-secondary btn-lg w-100" onClick={handleEnroll}>
                  Enroll Now
                </button>
                <p className="guarantee-text">30-Day Money-Back Guarantee</p>
              </div>

              {/* Desktop Skills */}
              <div className="desktop-skills section-card">
                <h4 className="section-title">What you'll learn</h4>
                <div className="skills-grid">
                  {editMode ? (
                    <>
                      {editableCourse.whatYouWillLearn.map((skill, idx) => (
                        <div className="skill-item-edit" key={idx}>
                          <input 
                            type="text"
                            className="form-control skill-input"
                            value={skill}
                            onChange={(e) => handleSkillChange(idx, e.target.value)}
                          />
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => removeSkill(idx)}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      ))}
                      <button className="btn btn-sm btn-primary mt-2" onClick={addSkill}>
                        <i className="bi bi-plus"></i> Add Skill
                      </button>
                    </>
                  ) : (
                    course.whatYouWillLearn.map((item, idx) => (
                      <div className="skill-item" key={idx}>
                        <i className="bi bi-check-circle-fill text-success"></i>
                        <span>{item}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Column - Purchase Card */}
            <div className="purchase-card-column">
              <div className="purchase-card">
                <div className="course-thumbnail">
                  {editMode ? (
                    <div className="thumbnail-upload">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleThumbnailChange}
                        id="desktop-thumbnail-upload"
                        style={{display: 'none'}}
                      />
                      <label htmlFor="desktop-thumbnail-upload" className="thumbnail-upload-label">
                        <img src={editableCourse.thumbnail} alt={editableCourse.title} />
                        <div className="thumbnail-overlay">
                          <i className="bi bi-camera"></i>
                          <span>Change Photo</span>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <img src={course.thumbnail} alt={course.title} />
                  )}
                </div>

                <div className="purchase-card-body">
                  <div className="price-section">
                    <h2 className="price">
                      ${editMode ? (
                        <input 
                          type="number"
                          className="form-control price-input-desktop"
                          value={editableCourse.price}
                          onChange={(e) => handleCourseFieldChange('price', parseFloat(e.target.value))}
                          step="0.01"
                          min="0"
                        />
                      ) : course.price}
                    </h2>
                  </div>

                  <div className="purchase-buttons">
                    <button className="btn btn-primary btn-lg w-100 mb-2" onClick={handleAddToCart}>
                      Add to Cart
                    </button>
                    <button className="btn btn-outline-secondary btn-lg w-100" onClick={handleEnroll}>
                      Enroll Now
                    </button>
                  </div>

                  <p className="guarantee-text">30-Day Money-Back Guarantee</p>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Section: Course Content */}
          <div className="course-content-section">
            
            {/* Admin Controls */}
            {isAdmin && (
              <div className="admin-controls">
                <button 
                  className={`btn ${editMode ? 'btn-warning' : 'btn-outline-primary'}`}
                  onClick={() => setEditMode(!editMode)}
                >
                  <i className="bi bi-pencil-square me-1"></i>
                  {editMode ? 'Exit Edit Mode' : 'Edit Course'}
                </button>
                {hasChanges && (
                  <button className="btn btn-success ms-2" onClick={handleSaveChanges}>
                    <i className="bi bi-save me-1"></i>
                    Save Changes
                  </button>
                )}
              </div>
            )}

            {/* Course Content */}
            <div className="section-card">
              <h4 className="section-title">Course Content</h4>
              
              <div className="chapters-list">
                {chapters.map((chapter, chapterIndex) => (
                  <div 
                    key={chapter.id}
                    className={`chapter-item ${editMode ? 'draggable' : ''}`}
                    draggable={editMode}
                    onDragStart={(e) => handleChapterDragStart(e, chapterIndex)}
                    onDragOver={handleChapterDragOver}
                    onDrop={(e) => handleChapterDrop(e, chapterIndex)}
                  >
                    <div 
                      className="chapter-header"
                      onClick={() => !editMode && toggleChapter(chapter.id)}
                    >
                      {editMode ? (
                        <i className="bi bi-grip-vertical drag-handle me-2"></i>
                      ) : (
                        <i className={`bi bi-chevron-${expandedChapters[chapter.id] ? 'down' : 'right'} me-2`}></i>
                      )}
                      <span className="chapter-title-text">{chapter.title}</span>
                      <span className="chapter-count">{chapter.items.length} items</span>
                    </div>
                    
                    {(expandedChapters[chapter.id] || editMode) && (
                      <div className="chapter-content">
                        {chapter.items.map((item, itemIndex) => (
                          <div
                            key={item.id}
                            className={`content-item ${editMode ? 'draggable' : ''}`}
                            draggable={editMode}
                            onDragStart={(e) => handleItemDragStart(e, chapterIndex, itemIndex)}
                            onDragOver={handleChapterDragOver}
                            onDrop={(e) => handleItemDrop(e, chapterIndex, itemIndex)}
                          >
                            {editMode && (
                              <div className="item-controls">
                                <i className="bi bi-grip-vertical drag-handle"></i>
                                <button 
                                  className="btn btn-sm btn-danger ms-auto"
                                  onClick={() => deleteContentItem(chapterIndex, itemIndex)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            )}
                            
                            {item.type === 'video' ? (
                              <div className="video-item">
                                <div className="video-header">
                                  <i className="bi bi-play-circle me-2"></i>
                                  <span>{item.title}</span>
                                </div>
                                <video src={item.url} controls className="video-player" />
                              </div>
                            ) : item.type === 'link' ? (
                              <div className="link-item">
                                <i className="bi bi-link-45deg me-2"></i>
                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                  {item.title}
                                </a>
                              </div>
                            ) : item.type === 'text' ? (
                              <div className="text-item">
                                <h5>{item.title}</h5>
                                <div dangerouslySetInnerHTML={{ __html: parseTextSyntax(item.content) }} />
                              </div>
                            ) : null}
                          </div>
                        ))}
                        
                        {editMode && (
                          <div className="add-item-buttons">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => addContentItem(chapterIndex, 'text')}
                            >
                              <i className="bi bi-file-text me-1"></i> Add Text
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => addContentItem(chapterIndex, 'image')}
                            >
                              <i className="bi bi-image me-1"></i> Add Image
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => addContentItem(chapterIndex, 'video')}
                            >
                              <i className="bi bi-camera-video me-1"></i> Add Video
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <AddItemModal 
          type={showAddItemModal.type}
          onSave={(itemData) => saveContentItem(showAddItemModal.chapterIndex, itemData)}
          onClose={() => setShowAddItemModal(null)}
          parseTextSyntax={parseTextSyntax}
        />
      )}
    </>
  );
}

// Add Item Modal Component
function AddItemModal({ type, onSave, onClose, parseTextSyntax }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [preview, setPreview] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = type === 'image' ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] : 
                       type === 'video' ? ['video/mp4', 'video/webm', 'video/ogg'] : [];
    
    if (!validTypes.includes(selectedFile.type)) {
      showInfo('Invalid File', `Please select a ${type} file.`);
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fakeEvent = { target: { files: [droppedFile] } };
      handleFileChange(fakeEvent);
    }
  };

  const handleSave = () => {
    if (!title) {
      showInfo('Validation', 'Please enter a title');
      return;
    }

    const itemData = {
      type,
      title,
      url: preview || url,
      content: type === 'text' ? content : undefined
    };

    onSave(itemData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5>Add {type.charAt(0).toUpperCase() + type.slice(1)}</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input 
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
            />
          </div>

          {type === 'text' ? (
            <>
              <div className="mb-2">
                <button 
                  className="btn btn-sm btn-link"
                  onClick={() => setShowHelp(!showHelp)}
                >
                  <i className="bi bi-question-circle me-1"></i>
                  Syntax Help
                </button>
              </div>
              {showHelp && (
                <div className="alert alert-info">
                  <strong>Text Formatting:</strong><br/>
                  <code># Heading 1</code><br/>
                  <code>## Heading 2</code><br/>
                  <code>### Heading 3</code><br/>
                  <code>`text`</code> for paragraphs<br/>
                  <code>@url@</code> for links
                </div>
              )}
              <div className="mb-3">
                <label className="form-label">Content</label>
                <textarea 
                  className="form-control"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows="10"
                  placeholder="Enter your content with syntax..."
                />
              </div>
              {content && (
                <div className="mb-3">
                  <label className="form-label">Preview:</label>
                  <div 
                    className="content-preview"
                    dangerouslySetInnerHTML={{ __html: parseTextSyntax(content) }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div 
                className="file-upload-area mb-3"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input 
                  type="file"
                  accept={type === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleFileChange}
                  id="file-input"
                  style={{display: 'none'}}
                />
                <label htmlFor="file-input" className="file-upload-label">
                  <i className={`bi bi-${type === 'image' ? 'image' : 'camera-video'} upload-icon`}></i>
                  <p>Drag content or click to select</p>
                </label>
              </div>

              <div className="mb-3">
                <label className="form-label">Or enter URL:</label>
                <input 
                  type="url"
                  className="form-control"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/media.jpg"
                />
              </div>

              {preview && (
                <div className="mb-3">
                  <label className="form-label">Preview:</label>
                  {type === 'image' ? (
                    <img src={preview} alt="Preview" className="img-preview" />
                  ) : (
                    <video src={preview} controls className="video-preview" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default CoursePreview;