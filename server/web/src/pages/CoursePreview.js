import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import './CoursePreview.css';

function CoursePreview({ data, onLogout }) {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [author, setAuthor] = useState({});
  const [role, setRole] = useState({})
  const [loading, setLoading] = useState(true);
  const [expandedVolumes, setExpandedVolumes] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [volumes, setVolumes] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [directions, setDirections] = useState([]);
  const [levels, setLevels] = useState([]);

  const [draggedVolume, setDraggedVolume] = useState(null);
  const [draggedChapter, setDraggedChapter] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  const [editableCourse, setEditableCourse] = useState(null);
  const [showAddItemModal, setShowAddItemModal] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [editingTitle, setEditingTitle] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [textFilesToUpload, setTextFilesToUpload] = useState({});
  const [loadingTextContent, setLoadingTextContent] = useState({});
  // ① incremented after "Save Changes" — forces TextItemDisplay to re-fetch from server
  const [textRefreshKey, setTextRefreshKey] = useState(0);
  // local content cache: { [iid]: string } — holds unsaved edits so the display is instant
  const [localTextContent, setLocalTextContent] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate()

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
    setRole(data.role)
  }, [id]);

  useEffect(() => {
    if (course) {
      fetchUserData();
    }
  }, [course?.userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [courseRes, directionsRes, levelsRes, filesRes] = await Promise.all([
        fetch(`http://localhost:4040/api/courses/${id}`).catch(() => null),
        fetch('http://localhost:4040/api/directions').catch(() => null),
        fetch('http://localhost:4040/api/levels').catch(() => null),
        fetch(`http://localhost:4040/api/manage/courses/${id}/files`, {
          headers: {
            'Authorization': token ? `${token.split(' ')[0]} ${token.split(' ')[1]}` : '',
            'Content-Type': 'application/json'
          }
        }).catch(() => null),
      ]);

      if (courseRes && courseRes.ok) {
        const courseData = await courseRes.json();
        if (courseData.data) {
          setCourse(courseData.data);
          setEditableCourse({ ...courseData.data });
          setVolumes(courseData.data.volumes || []);
        }
      }

      if (directionsRes && directionsRes.ok) {
        const directionsData = await directionsRes.json();
        if (Array.isArray(directionsData.data)) {
          setDirections(directionsData.data);
        }
      }

      if (levelsRes && levelsRes.ok) {
        const levelsData = await levelsRes.json();
        if (Array.isArray(levelsData.data)) {
          setLevels(levelsData.data);
        }
      }

      if (filesRes && filesRes.ok) {
        const filesData = await filesRes.json();
        const allFiles = filesData.data || filesData.files || [];
        const contentFiles = allFiles.filter((file) => {
          const fileName = (file.originalName || file.filename || '').toLowerCase();
          const isThumbnail = fileName.includes('thumbnail') ||
            (fileName.endsWith('.png') && allFiles.indexOf(file) === 0 && file.mimetype?.startsWith('image/'));
          const isSystemText = isSystemTextFile(file.originalName || file.filename || '');
          return !isThumbnail && !isSystemText;
        });
        setUploadedFiles(contentFiles);
      }

      setLoading(false);
    } catch (err) {
      console.error(`${err}`)
    }
  };

  const fetchUserData = async () => {
    try {
      if (!course?.userId) return;
      const response = await fetch(`http://localhost:4040/api/manage/users/${course.userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
          'Content-Type': 'application/json'
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAuthor({
          nickname: data.data.nickname,
          email: data.data.email,
          firstName: data.data.firstName,
          lastName: data.data.lastName
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes!';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const isSystemTextFile = (filename) => {
    return /^vol-\d+-ch-\d+-item-\d+-\d+\.txt$/i.test(filename);
  };

  const toggleVolume = (volumeId) => {
    setExpandedVolumes(prev => ({ ...prev, [volumeId]: !prev[volumeId] }));
  };

  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const handleCourseFieldChange = (field, value) => {
    setEditableCourse(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSkillChange = (index, value) => {
    const newSkills = [...editableCourse.skills];
    newSkills[index] = value;
    setEditableCourse(prev => ({ ...prev, skills: newSkills }));
    setHasChanges(true);
  };

  const addSkill = () => {
    setEditableCourse(prev => ({ ...prev, skills: [...prev.skills, ''] }));
    setHasChanges(true);
  };

  const removeSkill = (index) => {
    const newSkills = editableCourse.skills.filter((_, i) => i !== index);
    setEditableCourse(prev => ({ ...prev, skills: newSkills }));
    setHasChanges(true);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditableCourse(prev => ({ ...prev, thumbnail: reader.result }));
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const addVolume = () => {
    const newVolume = { vid: `vol-${Date.now()}`, title: 'New Volume', chapters: [] };
    setVolumes([...volumes, newVolume]);
    setHasChanges(true);
  };

  const deleteVolume = (volumeIndex) => {
    const volume = volumes[volumeIndex];
    const userInput = prompt(`To delete this volume, please type its title:\n"${volume.title}"`);
    if (userInput === volume.title) {
      setVolumes(volumes.filter((_, i) => i !== volumeIndex));
      setHasChanges(true);
      alert('Volume deleted successfully');
    } else if (userInput !== null) {
      alert('Title does not match. Deletion cancelled.');
    }
  };

  const updateVolumeTitle = (volumeIndex, newTitle) => {
    const newVolumes = [...volumes];
    newVolumes[volumeIndex].title = newTitle;
    setVolumes(newVolumes);
    setHasChanges(true);
  };

  const addChapter = (volumeIndex) => {
    const newChapter = { cid: `ch-${Date.now()}`, title: 'New Chapter', items: [] };
    const newVolumes = [...volumes];
    newVolumes[volumeIndex].chapters.push(newChapter);
    setVolumes(newVolumes);
    setHasChanges(true);
  };

  const deleteChapter = (volumeIndex, chapterIndex) => {
    const chapter = volumes[volumeIndex].chapters[chapterIndex];
    const userInput = prompt(`To delete this chapter, please type its title:\n"${chapter.title}"`);
    if (userInput === chapter.title) {
      const newVolumes = [...volumes];
      newVolumes[volumeIndex].chapters = newVolumes[volumeIndex].chapters.filter((_, i) => i !== chapterIndex);
      setVolumes(newVolumes);
      setHasChanges(true);
      alert('Chapter deleted successfully');
    } else if (userInput !== null) {
      alert('Title does not match. Deletion cancelled.');
    }
  };

  const updateChapterTitle = (volumeIndex, chapterIndex, newTitle) => {
    const newVolumes = [...volumes];
    newVolumes[volumeIndex].chapters[chapterIndex].title = newTitle;
    setVolumes(newVolumes);
    setHasChanges(true);
  };

  const addContentItem = (volumeIndex, chapterIndex, type) => {
    setShowAddItemModal({ volumeIndex, chapterIndex, type });
  };

  const saveContentItem = (volumeIndex, chapterIndex, itemData) => {
    const newVolumes = [...volumes];
    const newItem = {
      iid: `item-${Date.now()}`,
      type: itemData.type,
      title: itemData.title,
      url: itemData.url || ''
    };
    newVolumes[volumeIndex].chapters[chapterIndex].items.push(newItem);
    setVolumes(newVolumes);

    if (itemData.type === 'text' && itemData.content) {
      const fileKey = `${newVolumes[volumeIndex].vid}-${newVolumes[volumeIndex].chapters[chapterIndex].cid}-${newItem.iid}`;
      const textBlob = new Blob([itemData.content], { type: 'text/plain' });
      const textFile = new File([textBlob], `${fileKey}.txt`, { type: 'text/plain' });
      setTextFilesToUpload(prev => ({ ...prev, [fileKey]: { file: textFile, itemId: newItem.iid, volumeIndex, chapterIndex } }));
    }

    setShowAddItemModal(null);
    setHasChanges(true);
  };

  const editContentItem = (volumeIndex, chapterIndex, itemIndex) => {
    const item = volumes[volumeIndex].chapters[chapterIndex].items[itemIndex];
    setEditingItem({ volumeIndex, chapterIndex, itemIndex, item });
  };

  const updateContentItem = (volumeIndex, chapterIndex, itemIndex, itemData) => {
    const newVolumes = [...volumes];
    const updatedItem = {
      ...newVolumes[volumeIndex].chapters[chapterIndex].items[itemIndex],
      type: itemData.type,
      title: itemData.title,
      url: itemData.url || newVolumes[volumeIndex].chapters[chapterIndex].items[itemIndex].url || ''
    };
    newVolumes[volumeIndex].chapters[chapterIndex].items[itemIndex] = updatedItem;
    setVolumes(newVolumes);

    if (itemData.type === 'text' && itemData.content) {
      const fileKey = `${newVolumes[volumeIndex].vid}-${newVolumes[volumeIndex].chapters[chapterIndex].cid}-${updatedItem.iid}`;
      const textBlob = new Blob([itemData.content], { type: 'text/plain' });
      const textFile = new File([textBlob], `${fileKey}.txt`, { type: 'text/plain' });
      setTextFilesToUpload(prev => ({ ...prev, [fileKey]: { file: textFile, itemId: updatedItem.iid, volumeIndex, chapterIndex } }));
    }

    setEditingItem(null);
    setHasChanges(true);
    // ② cache the new content locally so TextItemDisplay shows it instantly,
    // without waiting for the file to be uploaded to the server
    if (itemData.type === 'text' && itemData.content !== undefined) {
      setLocalTextContent(prev => ({ ...prev, [updatedItem.iid]: itemData.content }));
    }
  };

  const deleteContentItem = (volumeIndex, chapterIndex, itemIndex) => {
    if (!window.confirm('Delete this item?')) return;
    const newVolumes = [...volumes];
    newVolumes[volumeIndex].chapters[chapterIndex].items.splice(itemIndex, 1);
    setVolumes(newVolumes);
    setHasChanges(true);
  };

  const updateItemTitle = (volumeIndex, chapterIndex, itemIndex, newTitle) => {
    const newVolumes = [...volumes];
    newVolumes[volumeIndex].chapters[chapterIndex].items[itemIndex].title = newTitle;
    setVolumes(newVolumes);
    setHasChanges(true);
  };

  const handleVolumeDragStart = (e, index) => {
    if (!editMode) return;
    setDraggedVolume(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleVolumeDrop = (e, targetIndex) => {
    if (!editMode || draggedVolume === null) return;
    e.preventDefault();
    const newVolumes = [...volumes];
    const [moved] = newVolumes.splice(draggedVolume, 1);
    newVolumes.splice(targetIndex, 0, moved);
    setVolumes(newVolumes);
    setDraggedVolume(null);
    setHasChanges(true);
  };

  const handleChapterDragStart = (e, volumeIndex, chapterIndex) => {
    if (!editMode) return;
    setDraggedChapter({ volumeIndex, chapterIndex });
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };

  const handleChapterDrop = (e, targetVolumeIndex, targetChapterIndex) => {
    if (!editMode || !draggedChapter) return;
    e.preventDefault();
    e.stopPropagation();
    const newVolumes = [...volumes];
    const [moved] = newVolumes[draggedChapter.volumeIndex].chapters.splice(draggedChapter.chapterIndex, 1);
    newVolumes[targetVolumeIndex].chapters.splice(targetChapterIndex, 0, moved);
    setVolumes(newVolumes);
    setDraggedChapter(null);
    setHasChanges(true);
  };

  const handleItemDragStart = (e, volumeIndex, chapterIndex, itemIndex) => {
    if (!editMode) return;
    setDraggedItem({ volumeIndex, chapterIndex, itemIndex });
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };

  const handleItemDrop = (e, targetVolumeIndex, targetChapterIndex, targetItemIndex) => {
    if (!editMode || !draggedItem) return;
    e.preventDefault();
    e.stopPropagation();
    const newVolumes = [...volumes];
    const [moved] = newVolumes[draggedItem.volumeIndex].chapters[draggedItem.chapterIndex].items.splice(draggedItem.itemIndex, 1);
    newVolumes[targetVolumeIndex].chapters[targetChapterIndex].items.splice(targetItemIndex, 0, moved);
    setVolumes(newVolumes);
    setDraggedItem(null);
    setHasChanges(true);
  };

  const handleDragOver = (e) => {
    if (!editMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const parseTextSyntax = (text) => {
    if (!text) return '';

    let html = text;

    html = html.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    html = html.replace(/`\{([^}]+)\}`/g, '<p>$1</p>');

    html = html.replace(/\{([^}]+)\}/g, '<video src="$1" class="video-player" controls></video>');

    html = html.replace(/\(([^)]+)\)/g, (_, rawUrl) => {
      const toEmbedUrl = (url) => {
        if (url.includes('youtube.com/embed/')) return url;
        const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
        if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
        const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
        const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
        return url;
      };
      const embedUrl = toEmbedUrl(rawUrl.trim());
      return `<iframe src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    });

    html = html.replace(/!\[([^\|]+)\|([^\]]+)\]!/g, '<a href="$2" download class="text-download-link"><i class="bi bi-download"></i> $1</a>');
    html = html.replace(/@([^@]+)@/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/#([^#]+)#/g, '<img alt="$1" class="content-image" src="$1">');

    html = html.replace(/^(\d+)\.\s(.+)$/gm, '<li class="numbered-item">$2</li>');
    html = html.replace(/(<li class="numbered-item">.*?<\/li>\n?)+/gs, '<ol>$&</ol>');
    html = html.replace(/^[•\-\*]\s(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>\n?)+/gs, '<ul>$&</ul>');

    html = html.replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    html = html.replace(/\\n/g, '<br>');

    return html;
  };

  const resetUnsavedState = () => {
    setTextFilesToUpload({});
    setLocalTextContent({});
    setHasChanges(false);
    setTextRefreshKey(k => k + 1);
  };

  const handleSaveChanges = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const token = localStorage.getItem('token');

    try {
      // ── Step 1: upload all pending text files ──────────────────────────────
      const urlUpdates = {};

      if (Object.keys(textFilesToUpload).length > 0) {
        const uploadResults = await Promise.all(
          Object.entries(textFilesToUpload).map(async ([fileKey, fileData]) => {
            const formData = new FormData();
            formData.append('file', fileData.file);
            try {
              const res = await fetch(`http://localhost:4040/api/manage/courses/${id}/files`, {
                method: 'POST',
                headers: { 'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}` },
                body: formData
              });
              if (res.ok) {
                const result = await res.json();
                const fileUrl = result.data?.link?.url || result.data?.url || result.url;
                if (fileUrl) urlUpdates[fileKey] = { url: fileUrl, ...fileData };
              }
              return res.ok;
            } catch {
              return false;
            }
          })
        );

        if (uploadResults.some(ok => !ok)) {
          alert('Some files failed to upload. Unsaved changes have been discarded — reloading last saved version.');
          resetUnsavedState();
          await fetchData();
          return;
        }
      }

      // ── Step 2: patch volumes with the freshly uploaded file URLs ──────────
      const newVolumes = volumes.map(vol => ({
        ...vol,
        chapters: vol.chapters.map(ch => ({
          ...ch,
          items: ch.items.map(item => {
            const matchKey = Object.keys(urlUpdates).find(k => urlUpdates[k].itemId === item.iid);
            return matchKey ? { ...item, url: urlUpdates[matchKey].url } : item;
          })
        }))
      }));

      // ── Step 3: persist the full course ───────────────────────────────────
      const response = await fetch(`http://localhost:4040/api/manage/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...editableCourse, volumes: newVolumes })
      });

      if (response.ok) {
        // Success — sync state, then re-fetch everything fresh from the server
        setCourse({ ...editableCourse, volumes: newVolumes });
        setEditableCourse({ ...editableCourse, volumes: newVolumes });
        setVolumes(newVolumes);
        resetUnsavedState();
        setEditMode(false)
        await fetchData();
        alert('Changes saved successfully!');
      } else {
        // PUT failed — discard pending local changes and reload server state
        alert(`Failed to save (server error ${response.status}). Unsaved changes have been discarded — reloading last saved version.`);
        resetUnsavedState();
        await fetchData();
      }
    } catch (err) {
      // Network / unexpected error — same recovery
      alert(`Failed to save: ${err.message}. Unsaved changes have been discarded — reloading last saved version.`);
      resetUnsavedState();
      await fetchData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCart = () => alert(`Added "${course.title}" to cart!`);
  const handleEnroll = () => alert(`Enrolled in "${course.title}"!`);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderStars = (ratings) => {
    const stars = [];
    const fullStars = Math.floor(ratings);
    const hasHalfStar = ratings % 1 !== 0;
    for (let i = 0; i < fullStars; i++) stars.push(<i key={i} className="bi bi-star-fill text-warning"></i>);
    if (hasHalfStar) stars.push(<i key="half" className="bi bi-star-half text-warning"></i>);
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) stars.push(<i key={`empty-${i}`} className="bi bi-star text-warning"></i>);
    return stars;
  };

  if (loading) {
    return (
      <>
        <Navbar data={data} onLogout={onLogout} />
        <div className="course-preview-loading">
          <div className="spinner-border text-primary"></div>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Navbar data={data} onLogout={onLogout} />
        <div className="course-preview-page">
          <div className="row mb-1">
            <div className="col-12">
              <div className="d-flex align-items-center gap-3 mb-2">
                <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={() => navigate('/manage/courses')}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
                  </svg>
                  Back to Courses
                </button>
              </div>
            </div>
          </div>
          <div className="course-preview-error"><h3>Course not found</h3></div>
        </div>
      </>
    );
  }

  const isAdmin = data.role && ['admin', 'root', 'manager', 'create'].includes(role.roleName);
  const hasContent = volumes.length > 0;

  return (
    <>
      <Navbar data={data} onLogout={onLogout} />

      <div className="course-preview-page">
        <div className="row mb-1">
          <div className="col-12">
            <div className="d-flex align-items-center gap-3 mb-2">
              <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={() => navigate('/manage/courses')}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
                </svg>
                Back to Courses
              </button>
            </div>
          </div>
        </div>

        <div className="course-preview-container">
          <div className="content-wrapper">
            <div className="course-info-section">
              <div className="mobile-thumbnail">
                {editMode ? (
                  <div className="thumbnail-upload">
                    <input type="file" accept="image/*" onChange={handleThumbnailChange} id="mobile-thumbnail-upload" style={{ display: 'none' }} />
                    <label htmlFor="mobile-thumbnail-upload" className="thumbnail-upload-label">
                      <img src={'http://localhost:4040' + editableCourse.links[0].url} alt={editableCourse.links[0].description} />
                      <div className="thumbnail-overlay"><i className="bi bi-camera"></i><span>Change Photo</span></div>
                    </label>
                  </div>
                ) : (
                  <img src={'http://localhost:4040' + editableCourse.links[0].url} alt={editableCourse.links[0].description} />
                )}
              </div>

              <div className="title-price-row">
                {editMode ? (
                  <input type="text" className="form-control course-title-input" value={editableCourse.title} onChange={(e) => handleCourseFieldChange('title', e.target.value)} />
                ) : (
                  <h1 className="course-title">{course.title}</h1>
                )}
                <div className="mobile-price">
                  {editMode ? (
                    <input type="number" className="form-control price-input" value={editableCourse.price} onChange={(e) => handleCourseFieldChange('price', parseFloat(e.target.value))} step="0.01" min="0" />
                  ) : (course.price > 0) ? '$' + course.price : 'Free'}
                </div>
              </div>

              <div className="badges-row">
                {editMode ? (
                  <>
                    <select className="form-select badge-input" value={editableCourse.direction} onChange={(e) => handleCourseFieldChange('direction', e.target.value)}>
                      <option value="">Select Direction</option>
                      {directions.map((dir) => <option key={dir._id} value={dir.directionName}>{dir.directionName}</option>)}
                    </select>
                    <select className="form-select badge-input" value={editableCourse.level} onChange={(e) => handleCourseFieldChange('level', e.target.value)}>
                      <option value="">Select Level</option>
                      {levels.filter(level => level.directionName === editableCourse.direction).map((level) => (
                        <option key={level._id} value={level.levelName}>{level.levelName}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <span className="badge badge-direction">{course.direction}</span>
                    <span className="badge badge-level">{course.level}</span>
                  </>
                )}
              </div>

              <div className="description-box">
                {editMode ? (
                  <textarea className="form-control" value={editableCourse.description} onChange={(e) => handleCourseFieldChange('description', e.target.value)} rows="3" />
                ) : (
                  <p>{course.description}</p>
                )}
              </div>

              <div className="mobile-skills">
                <h4 className="section-title">What you'll learn</h4>
                <div className="skills-grid">
                  {editMode ? (
                    <>
                      {editableCourse.skills.map((skill, idx) => (
                        <div className="skill-item-edit" key={idx}>
                          <input type="text" className="form-control skill-input" value={skill} onChange={(e) => handleSkillChange(idx, e.target.value)} />
                          <button className="btn btn-sm btn-danger" onClick={() => removeSkill(idx)}><i className="bi bi-x"></i></button>
                        </div>
                      ))}
                      <button className="btn btn-sm btn-primary" onClick={addSkill}><i className="bi bi-plus"></i> Add Skill</button>
                    </>
                  ) : (
                    course.skills.map((item, idx) => (
                      <div className="skill-item" key={idx}>
                        <i className="bi bi-check-circle-fill text-success"></i>
                        <span>{item}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="ratings-section">
                <span className="rating-number">{course.ratings}</span>
                <div className="stars">{renderStars(course.ratings)}</div>
                <span className="students-count">({course.ratingsCount} students)</span>
              </div>

              <div className="course-meta">
                <span className="meta-item">
                  Created by <strong>{(author.firstName !== 'undefined' || author.lastName !== 'undefined') ? author.nickname : author.firstName + ' ' + author.lastName}</strong>
                </span>
                <span className="meta-divider">•</span>
                <span className="meta-item">Last updated {formatDate(course.updatedAt)}</span>
              </div>

              <div className="mobile-buttons">
                <button className="btn btn-primary btn-lg w-100 mb-2 disabled" onClick={handleAddToCart}>Add to Cart</button>
                <button className="btn btn-outline-secondary btn-lg w-100 disabled" onClick={handleEnroll}>Enroll Now</button>
                <p className="guarantee-text">30-Day Money-Back Guarantee</p>
              </div>

              <div className="desktop-skills section-card">
                <h4 className="section-title">What you'll learn</h4>
                <div className="skills-grid">
                  {editMode ? (
                    <>
                      {editableCourse.skills.map((skill, idx) => (
                        <div className="skill-item-edit" key={idx}>
                          <input type="text" className="form-control skill-input" value={skill} onChange={(e) => handleSkillChange(idx, e.target.value)} />
                          <button className="btn btn-sm btn-danger" onClick={() => removeSkill(idx)}><i className="bi bi-x"></i></button>
                        </div>
                      ))}
                      <button className="btn btn-sm btn-primary mt-2" onClick={addSkill}><i className="bi bi-plus"></i> Add Skill</button>
                    </>
                  ) : (
                    course.skills.map((item, idx) => (
                      <div className="skill-item" key={idx}>
                        <i className="bi bi-check-circle-fill text-success"></i>
                        <span>{item}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="purchase-card-column">
              <div className="purchase-card">
                <div className="course-thumbnail">
                  {editMode ? (
                    <div className="thumbnail-upload">
                      <input type="file" accept="image/*" onChange={handleThumbnailChange} id="desktop-thumbnail-upload" style={{ display: 'none' }} />
                      <label htmlFor="desktop-thumbnail-upload" className="thumbnail-upload-label">
                        <img src={'http://localhost:4040' + editableCourse.links[0].url} alt={editableCourse.links[0].description} />
                        <div className="thumbnail-overlay"><i className="bi bi-camera"></i><span>Change Photo</span></div>
                      </label>
                    </div>
                  ) : (
                    <img src={'http://localhost:4040' + editableCourse.links[0].url} alt={editableCourse.links[0].description} />
                  )}
                </div>
                <div className="purchase-card-body">
                  <div className="price-section">
                    <h2 className="price">
                      {editMode ? (
                        <input type="number" className="form-control price-input-desktop" value={editableCourse.price} onChange={(e) => handleCourseFieldChange('price', parseFloat(e.target.value))} step="0.01" min="0" />
                      ) : (course.price > 0) ? '$' + course.price : 'Free'}
                    </h2>
                  </div>
                  <div className="purchase-buttons">
                    <button className="btn btn-primary btn-lg w-100 mb-2 disabled" onClick={handleAddToCart}>Add to Cart</button>
                    <button className="btn btn-outline-secondary btn-lg w-100 disabled" onClick={handleEnroll}>Enroll Now</button>
                  </div>
                  <p className="guarantee-text">30-Day Money-Back Guarantee</p>
                </div>
              </div>
            </div>
          </div>

          <div className="course-content-section">
            {isAdmin && (
              <div className="admin-controls">
                <button className={`btn ${editMode ? 'btn-warning' : 'btn-outline-primary'}`} onClick={() => setEditMode(!editMode)}>
                  <i className="bi bi-pencil-square me-1"></i>
                  {editMode ? 'Exit Edit Mode' : 'Edit Course'}
                </button>
                {hasChanges && (
                  <button className="btn btn-success ms-2" onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving
                      ? <><span className="spinner-border spinner-border-sm me-1" role="status"></span>Saving…</>
                      : <><i className="bi bi-save me-1"></i>Save Changes</>
                    }
                  </button>
                )}
              </div>
            )}

            <div className="section-card">
              <div className="section-header">
                <h4 className="section-title">Course Content</h4>
                {editMode && hasContent && (
                  <button className="btn btn-sm btn-primary" onClick={addVolume}>
                    <i className="bi bi-folder-plus me-1"></i>Add Volume
                  </button>
                )}
              </div>

              {!hasContent ? (
                <div className="no-content">
                  <i className="bi bi-inbox"></i>
                  <p>No content found/loaded</p>
                  {editMode && (
                    <button className="btn btn-primary" onClick={addVolume}>
                      <i className="bi bi-folder-plus me-1"></i>Add First Volume
                    </button>
                  )}
                </div>
              ) : (
                <div className="volumes-list">
                  {volumes.map((volume, volumeIndex) => (
                    <div
                      key={volume.vid}
                      className={`volume-item ${editMode ? 'draggable' : ''}`}
                      draggable={editMode}
                      onDragStart={(e) => handleVolumeDragStart(e, volumeIndex)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleVolumeDrop(e, volumeIndex)}
                    >
                      <div className="volume-header" onClick={() => !editMode && toggleVolume(volume.vid)}>
                        {editMode ? <i className="bi bi-grip-vertical drag-handle me-2"></i> : <i className={`bi bi-chevron-${expandedVolumes[volume.vid] ? 'down' : 'right'} me-2`}></i>}
                        {editMode && editingTitle?.type === 'volume' && editingTitle?.volumeIndex === volumeIndex ? (
                          <input type="text" className="form-control title-edit-input" value={volume.title} onChange={(e) => updateVolumeTitle(volumeIndex, e.target.value)} onBlur={() => setEditingTitle(null)} onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitle(null); }} autoFocus onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <span className="volume-title-text">{volume.title}</span>
                        )}
                        <span className="volume-count">{volume.chapters.length} {volume.chapters.length === 1 ? 'chapter' : 'chapters'}</span>
                        {editMode && (
                          <div className="header-actions" onClick={(e) => e.stopPropagation()}>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => setEditingTitle({ type: 'volume', volumeIndex })} title="Edit title"><i className="bi bi-pencil"></i></button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteVolume(volumeIndex)} title="Delete volume"><i className="bi bi-trash"></i></button>
                          </div>
                        )}
                      </div>

                      {(expandedVolumes[volume.vid] || editMode) && (
                        <div className="volume-content">
                          {volume.chapters.length === 0 ? (
                            <div className="no-content-small">
                              <p>No chapters in this volume</p>
                              {editMode && <button className="btn btn-sm btn-primary" onClick={() => addChapter(volumeIndex)}><i className="bi bi-plus"></i> Add Chapter</button>}
                            </div>
                          ) : (
                            <div className="chapters-list">
                              {volume.chapters.map((chapter, chapterIndex) => (
                                <div
                                  key={chapter.cid}
                                  className={`chapter-item ${editMode ? 'draggable' : ''}`}
                                  draggable={editMode}
                                  onDragStart={(e) => handleChapterDragStart(e, volumeIndex, chapterIndex)}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleChapterDrop(e, volumeIndex, chapterIndex)}
                                >
                                  <div className="chapter-header" onClick={() => !editMode && toggleChapter(chapter.cid)}>
                                    {editMode ? <i className="bi bi-grip-vertical drag-handle me-2"></i> : <i className={`bi bi-chevron-${expandedChapters[chapter.cid] ? 'down' : 'right'} me-2`}></i>}
                                    {editMode && editingTitle?.type === 'chapter' && editingTitle?.volumeIndex === volumeIndex && editingTitle?.chapterIndex === chapterIndex ? (
                                      <input type="text" className="form-control title-edit-input" value={chapter.title} onChange={(e) => updateChapterTitle(volumeIndex, chapterIndex, e.target.value)} onBlur={() => setEditingTitle(null)} onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitle(null); }} autoFocus onClick={(e) => e.stopPropagation()} />
                                    ) : (
                                      <span className="chapter-title-text">{chapter.title}</span>
                                    )}
                                    <span className="chapter-count">{chapter.items.length} {chapter.items.length === 1 ? 'item' : 'items'}</span>
                                    {editMode && (
                                      <div className="header-actions" onClick={(e) => e.stopPropagation()}>
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => setEditingTitle({ type: 'chapter', volumeIndex, chapterIndex })} title="Edit title"><i className="bi bi-pencil"></i></button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteChapter(volumeIndex, chapterIndex)} title="Delete chapter"><i className="bi bi-trash"></i></button>
                                      </div>
                                    )}
                                  </div>

                                  {(expandedChapters[chapter.cid] || editMode) && (
                                    <div className="chapter-content">
                                      {chapter.items.length === 0 ? (
                                        <div className="no-content-small"><p>No content in this chapter</p></div>
                                      ) : (
                                        chapter.items.map((item, itemIndex) => (
                                          <div
                                            key={item.iid}
                                            className={`content-item ${editMode ? 'draggable' : ''}`}
                                            draggable={editMode}
                                            onDragStart={(e) => handleItemDragStart(e, volumeIndex, chapterIndex, itemIndex)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleItemDrop(e, volumeIndex, chapterIndex, itemIndex)}
                                          >
                                            {editMode && (
                                              <div className="item-controls">
                                                <i className="bi bi-grip-vertical drag-handle"></i>
                                                {editingTitle?.type === 'item' && editingTitle?.volumeIndex === volumeIndex && editingTitle?.chapterIndex === chapterIndex && editingTitle?.itemIndex === itemIndex ? (
                                                  <input type="text" className="form-control title-edit-input flex-1" value={item.title} onChange={(e) => updateItemTitle(volumeIndex, chapterIndex, itemIndex, e.target.value)} onBlur={() => setEditingTitle(null)} onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitle(null); }} autoFocus />
                                                ) : (
                                                  <span className="item-title flex-1">{item.title}</span>
                                                )}
                                                <button className="btn btn-sm btn-outline-info" onClick={() => editContentItem(volumeIndex, chapterIndex, itemIndex)} title="Edit content"><i className="bi bi-pencil-fill"></i></button>
                                                <button className="btn btn-sm btn-danger" onClick={() => deleteContentItem(volumeIndex, chapterIndex, itemIndex)}><i className="bi bi-trash"></i></button>
                                              </div>
                                            )}

                                            {!editMode && item.title && <h5 className="content-item-title">{item.title}</h5>}

                                            {item.type === 'video' ? (
                                              <div className="video-item"><video src={item.url} controls className="video-player" /></div>
                                            ) : item.type === 'image' ? (
                                              <div className="image-item"><img src={item.url} alt={item.title} className="content-image" /></div>
                                            ) : item.type === 'audio' ? (
                                              <div className="audio-item"><audio src={item.url} controls className="audio-player" /></div>
                                            ) : item.type === 'document' ? (
                                              <div className="document-item">
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info">
                                                  <i className="bi bi-file-pdf me-1"></i> Open Document
                                                </a>
                                              </div>
                                            ) : item.type === 'archive' ? (
                                              <div className="archive-item">
                                                <a href={item.url} download className="btn btn-sm btn-outline-info">
                                                  <i className="bi bi-file-zip me-1"></i> Download Archive
                                                </a>
                                              </div>
                                            ) : item.type === 'text' ? (
                                              // ④ key includes refreshKey — React unmounts+remounts on change, guaranteeing a fresh fetch
                                              <TextItemDisplay
                                                key={`${item.iid}-${textRefreshKey}`}
                                                url={item.url}
                                                parseTextSyntax={parseTextSyntax}
                                                refreshKey={textRefreshKey}
                                                localContent={localTextContent[item.iid]}
                                              />
                                            ) : null}
                                          </div>
                                        ))
                                      )}

                                      {editMode && (
                                        <div className="add-item-buttons">
                                          <button className="btn btn-sm btn-outline-primary" onClick={() => addContentItem(volumeIndex, chapterIndex, 'text')}><i className="bi bi-file-text me-1"></i> Text</button>
                                          <button className="btn btn-sm btn-outline-primary" onClick={() => addContentItem(volumeIndex, chapterIndex, 'image')}><i className="bi bi-image me-1"></i> Image</button>
                                          <button className="btn btn-sm btn-outline-primary" onClick={() => addContentItem(volumeIndex, chapterIndex, 'audio')}><i className="bi bi-music-note me-1"></i> Audio</button>
                                          <button className="btn btn-sm btn-outline-primary" onClick={() => addContentItem(volumeIndex, chapterIndex, 'video')}><i className="bi bi-camera-video me-1"></i> Video</button>
                                          <button className="btn btn-sm btn-outline-primary" onClick={() => addContentItem(volumeIndex, chapterIndex, 'document')}><i className="bi bi-file-pdf me-1"></i> Document</button>
                                          <button className="btn btn-sm btn-outline-primary" onClick={() => addContentItem(volumeIndex, chapterIndex, 'archive')}><i className="bi bi-file-zip me-1"></i> Archive</button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {editMode && (
                            <button className="btn btn-sm btn-outline-primary mt-2" onClick={() => addChapter(volumeIndex)}>
                              <i className="bi bi-plus"></i> Add Chapter
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddItemModal && (
        <AddItemModal
          type={showAddItemModal.type}
          onSave={(itemData) => saveContentItem(showAddItemModal.volumeIndex, showAddItemModal.chapterIndex, itemData)}
          onClose={() => setShowAddItemModal(null)}
          parseTextSyntax={parseTextSyntax}
          uploadedFiles={uploadedFiles}
        />
      )}

      {editingItem && (
        <AddItemModal
          type={editingItem.item.type}
          isEditing={true}
          initialData={editingItem.item}
          onSave={(itemData) => updateContentItem(editingItem.volumeIndex, editingItem.chapterIndex, editingItem.itemIndex, itemData)}
          onClose={() => setEditingItem(null)}
          parseTextSyntax={parseTextSyntax}
          uploadedFiles={uploadedFiles}
        />
      )}
    </>
  );
}

// ─── Text Item Display ────────────────────────────────────────────────────────
// localContent: if set, render it directly without fetching (used for unsaved edits).
// refreshKey:   when it changes, React remounts this component (via the key prop at
//               the call site) and adds a cache-buster to the fetch URL, ensuring
//               stale browser cache doesn't mask the newly uploaded file.
function TextItemDisplay({ url, parseTextSyntax, refreshKey, localContent }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    // If a local (unsaved) edit exists, show it immediately — no network call needed
    if (localContent !== undefined) {
      setContent(localContent);
      setLoading(false);
      setError(null);
      return;
    }

    if (!url) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const fetchContent = async () => {
      try {
        const cacheBust = `?_=${refreshKey || Date.now()}`;
        const response = await fetch(`http://localhost:4040${url}${cacheBust}`, {
          headers: { 'Authorization': token ? `${token.split(' ')[0]} ${token.split(' ')[1]}` : '' }
        });
        if (response.ok) {
          setContent(await response.text());
        } else {
          setError('Could not load content');
        }
      } catch (err) {
        setError('Error loading content: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [url, refreshKey, localContent]);

  if (loading) return <div className="text-item"><p><em>Loading content...</em></p></div>;
  if (error) return <div className="text-item"><p style={{ color: 'red' }}>{error}</p></div>;
  return <div className="text-item"><div dangerouslySetInnerHTML={{ __html: parseTextSyntax(content) }} /></div>;
}

// ─── Syntax Help Data ─────────────────────────────────────────────────────────
const SYNTAX_GROUPS = [
  {
    label: 'Text & Structure',
    icon: 'bi-text-left',
    rows: [
      { format: 'Heading 1',     syntax: '# Text' },
      { format: 'Heading 2',     syntax: '## Text' },
      { format: 'Heading 3',     syntax: '### Text' },
      { format: 'Paragraph',     syntax: '`{text}`' },
      { format: 'Numbered list', syntax: '1. Item' },
      { format: 'Bullet list',   syntax: '- Item  or  • Item' },
      { format: 'Line break',    syntax: '\\n' },
      { format: 'Indentation',   syntax: '\\t' },
    ]
  },
  {
    label: 'Media',
    icon: 'bi-play-circle',
    rows: [
      { format: 'Image',        syntax: '#https://image-url#',                    note: 'Renders inline image' },
      { format: 'Video (file)', syntax: '{https://video-url.mp4}',                note: 'HTML5 video player' },
      { format: 'YouTube',      syntax: '(https://youtube.com/watch?v=VIDEO_ID)', note: 'Also accepts youtu.be/ and /shorts/ links' },
    ]
  },
  {
    label: 'Links & Downloads',
    icon: 'bi-link-45deg',
    rows: [
      { format: 'Link',          syntax: '@https://url@',              note: 'Opens in new tab' },
      { format: 'Download file', syntax: '![Label|https://file-url]!', note: 'Renders a download button' },
    ]
  },
];

// ─── Add / Edit Item Modal ────────────────────────────────────────────────────
function AddItemModal({ type, isEditing, initialData, onSave, onClose, parseTextSyntax, uploadedFiles = [] }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [file, setFile] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [activeHelpGroup, setActiveHelpGroup] = useState(0);
  const [preview, setPreview] = useState(initialData?.url || initialData?.content || '');
  const [useExistingFile, setUseExistingFile] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [loadingTextContent, setLoadingTextContent] = useState(false);
  const [textContentError, setTextContentError] = useState(null);

  const token = localStorage.getItem('token');

  const getFilteredFiles = () => {
    if (type === 'text') return [];
    const fileTypeMapping = { image: ['image'], video: ['video'], audio: ['audio'], document: ['document'], archive: ['archive'] };
    const acceptedFileTypes = fileTypeMapping[type] || [];
    if (!uploadedFiles || uploadedFiles.length === 0) return [];
    return uploadedFiles.filter(file => {
      if (acceptedFileTypes.includes(file.type || '')) return true;
      const filename = (file.originalName || file.filename || '').toLowerCase();
      if (type === 'image'    && /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) return true;
      if (type === 'video'    && /\.(mp4|webm|ogg|mov|avi)$/i.test(filename))  return true;
      if (type === 'audio'    && /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(filename)) return true;
      if (type === 'document' && /\.(pdf|doc|docx)$/i.test(filename))           return true;
      if (type === 'archive'  && /\.(zip|rar|7z)$/i.test(filename))             return true;
      return false;
    });
  };

  const filteredFiles = getFilteredFiles();

  useEffect(() => {
    if (isEditing && type === 'text' && initialData?.url && !content) {
      setLoadingTextContent(true);
      setTextContentError(null);
      const load = async () => {
        try {
          const res = await fetch(`http://localhost:4040${initialData.url}?_=${Date.now()}`, {
            headers: { 'Authorization': token ? `${token.split(' ')[0]} ${token.split(' ')[1]}` : '' }
          });
          if (res.ok) { setContent(await res.text()); }
          else { setTextContentError('Could not load text content'); }
        } catch (err) {
          setTextContentError('Error loading content: ' + err.message);
        } finally {
          setLoadingTextContent(false);
        }
      };
      load();
    }
  }, [isEditing, type, initialData?.url, content, token]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    const validTypes = {
      image:    ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video:    ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-mpeg'],
      audio:    ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/x-m4a', 'audio/webm'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      archive:  ['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/x-7z-compressed']
    };
    if (type !== 'text' && validTypes[type] && !validTypes[type].includes(selectedFile.type)) {
      alert(`Invalid file type. Please select a ${type} file.`);
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => { setPreview(reader.result); setUrl(''); };
    reader.readAsDataURL(selectedFile);
    setUseExistingFile(false);
    setSelectedFileId('');
  };

  const handleExistingFileSelect = (e) => {
    const fileId = e.target.value;
    setSelectedFileId(fileId);
    if (fileId) {
      const selectedFile = uploadedFiles.find(f => f.path === fileId || f.url === fileId);
      if (selectedFile) {
        const filePath = selectedFile.url || selectedFile.path || '';
        const fileUrl = filePath.startsWith('http') ? filePath : `http://localhost:4040${filePath}`;
        setUrl(fileUrl); setPreview(fileUrl); setUseExistingFile(true); setFile(null);
      } else {
        alert('Could not find selected file. Please try again or upload a new file.');
      }
    } else {
      setUrl(''); setPreview(''); setUseExistingFile(false);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileChange({ target: { files: [droppedFile] } });
  };

  const handleSave = () => {
    if (!title.trim()) { alert('Please enter a title'); return; }
    if (type === 'text') { onSave({ type, title, content }); return; }
    if (!file && !url && !preview) { alert('Please upload a file, select from existing files, or enter a URL'); return; }
    onSave({ type, title, url: url || preview || '', content: undefined });
  };

  const typeIcon = (t) => ({ image: 'bi-image', video: 'bi-camera-video', audio: 'bi-music-note', document: 'bi-file-pdf', archive: 'bi-file-zip' }[t] || 'bi-file-earmark');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5>{isEditing ? 'Edit' : 'Add'} {type === 'file' ? 'File' : type.charAt(0).toUpperCase() + type.slice(1)}</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" />
          </div>

          {type === 'text' ? (
            <>
              {loadingTextContent && (
                <div className="alert alert-info mb-3">
                  <div className="spinner-border spinner-border-sm me-2" role="status" style={{ display: 'inline-block' }}><span className="visually-hidden">Loading...</span></div>
                  Loading text content...
                </div>
              )}
              {textContentError && <div className="alert alert-danger mb-3">{textContentError}</div>}

              <div className="mb-2">
                <button className="btn btn-sm btn-link px-0" onClick={() => setShowHelp(!showHelp)}>
                  <i className={`bi bi-${showHelp ? 'chevron-up' : 'question-circle'} me-1`}></i>
                  {showHelp ? 'Hide syntax help' : 'Syntax help'}
                </button>
              </div>

              {showHelp && (
                <div className="syntax-help-panel mb-3">
                  <div className="syntax-tabs">
                    {SYNTAX_GROUPS.map((group, gi) => (
                      <button key={gi} className={`syntax-tab${activeHelpGroup === gi ? ' active' : ''}`} onClick={() => setActiveHelpGroup(gi)}>
                        <i className={`bi ${group.icon} me-1`}></i>
                        {group.label}
                      </button>
                    ))}
                  </div>
                  <table className="syntax-table">
                    <thead>
                      <tr><th>Format</th><th>Syntax</th><th>Note</th></tr>
                    </thead>
                    <tbody>
                      {SYNTAX_GROUPS[activeHelpGroup].rows.map((row, ri) => (
                        <tr key={ri}>
                          <td>{row.format}</td>
                          <td><code>{row.syntax}</code></td>
                          <td className="syntax-note">{row.note || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {activeHelpGroup === 2 && (
                    <div className="syntax-examples">
                      <p className="syntax-examples-title">Result preview</p>
                      <div className="syntax-example-row">
                        <code>![Course PDF|https://example.com/course.pdf]!</code>
                        <span>→</span>
                        <span className="text-download-link-demo"><i className="bi bi-download"></i> Course PDF</span>
                      </div>
                    </div>
                  )}
                  {activeHelpGroup === 1 && (
                    <div className="syntax-examples">
                      <p className="syntax-examples-title">Result preview</p>
                      <div className="syntax-example-row">
                        <code>#https://picsum.photos/300/80#</code>
                        <span>→</span>
                        <img src="https://picsum.photos/300/80" alt="example" style={{ height: 36, borderRadius: 4, border: '1px solid #dee2e6' }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Content</label>
                <textarea className="form-control" value={content} onChange={(e) => setContent(e.target.value)} rows="10" placeholder="Enter your content with syntax..." disabled={loadingTextContent} />
              </div>

              {content && (
                <div className="mb-3">
                  <label className="form-label">Preview</label>
                  <div className="content-preview" dangerouslySetInnerHTML={{ __html: parseTextSyntax(content) }} />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-3">
                <label className="form-label"><i className={`bi ${typeIcon(type)} me-1`}></i>Select from uploaded files:</label>
                {filteredFiles.length > 0 ? (
                  <>
                    <select className="form-select" value={selectedFileId} onChange={handleExistingFileSelect}>
                      <option value="">-- Choose a file --</option>
                      {filteredFiles.map((file) => {
                        const filename = file.originalName || file.filename || 'Unnamed file';
                        const sizeStr = file.size ? ` (${(file.size / (1024 * 1024)).toFixed(2)} MB)` : '';
                        return <option key={filteredFiles.indexOf(file)} value={file.url}>{filename}{sizeStr}</option>;
                      })}
                    </select>
                    <small className="text-muted d-block mt-1">{filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'} available</small>
                  </>
                ) : (
                  <div className="alert alert-info mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    <small>No {type === 'document' ? 'PDF/DOCX' : type === 'archive' ? 'ZIP' : type} files found.{uploadedFiles.length > 0 ? ` You have ${uploadedFiles.length} file(s) uploaded, but none match this type.` : ''} Upload a new one below.</small>
                  </div>
                )}
              </div>

              {filteredFiles.length > 0 && <div className="text-center my-2"><small className="text-muted">— OR —</small></div>}

              <div className="file-upload-area mb-3" onDragOver={handleDragOver} onDrop={handleDrop}>
                <input type="file" accept={type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : type === 'audio' ? 'audio/*' : type === 'document' ? '.pdf,.doc,.docx' : type === 'archive' ? '.zip' : '*/*'} onChange={handleFileChange} id="file-input" style={{ display: 'none' }} />
                <label htmlFor="file-input" className="file-upload-label">
                  <i className={`bi ${typeIcon(type)} upload-icon`}></i>
                  <p>Drag {type} or click to select</p>
                </label>
              </div>

              <div className="text-center my-2"><small className="text-muted">— OR —</small></div>

              <div className="mb-3">
                <label className="form-label">Enter URL:</label>
                <input type="url" className="form-control" value={url} onChange={(e) => { const v = e.target.value; setUrl(v); setPreview(v); setUseExistingFile(false); setSelectedFileId(''); setFile(null); }} placeholder={`https://example.com/${type}.${type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'mp3'}`} />
              </div>

              {preview && (
                <div className="mb-3">
                  <label className="form-label">Preview:</label>
                  {type === 'image' ? <img src={preview} alt="Preview" className="img-preview" /> :
                   type === 'video' ? <video src={preview} controls className="video-preview" /> :
                   type === 'audio' ? <audio src={preview} controls className="audio-preview" /> : (
                    <div className="alert alert-info"><i className={`bi ${typeIcon(type)} me-2`}></i>File selected: {preview.split('/').pop()}</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{isEditing ? 'Update' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

export default CoursePreview;