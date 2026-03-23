import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import AuthImage from "../components/AuthImage";

function EditCourse({ data, onLogout }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState([]);
    const [directions, setDirections] = useState([]);
    const [levels, setLevels] = useState([]);
    const [formData, setFormData] = useState({
        userId: '',
        status: '',
        title: '',
        description: '',
        skills: [],
        direction: '',
        level: '',
        price: '',
        links: []
    });
    const [skillInput, setSkillInput] = useState('');
    const [errors, setErrors] = useState({});

    // File upload states
    const [thumbnail, setThumbnail] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [courseFiles, setCourseFiles] = useState([]);
    const [courseFilesPreview, setCourseFilesPreview] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]); // Existing uploaded files from server (EXCLUDING thumbnail and system text files)
    const [loadingFiles, setLoadingFiles] = useState(false);

    const token = localStorage.getItem('token');

    // Helper function to check if file is a system-generated text file
    const isSystemTextFile = (filename) => {
        // Pattern: vol-{timestamp}-ch-{timestamp}-item-{timestamp}-{timestamp}.txt
        return /^vol-\d+-ch-\d+-item-\d+-\d+\.txt$/i.test(filename);
    };

    useEffect(() => {
        if (token) {
            const headers = {
                'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                'Content-Type': 'application/json'
            };

            const fetchData = async () => {
                try {
                    // Fetch course, users, directions, levels, and files in parallel
                    const [courseRes, usersRes, directionsRes, levelsRes, filesRes] = await Promise.all([
                        fetch(`http://localhost:4040/api/manage/courses/${id}`, { method: 'GET', headers }),
                        fetch('http://localhost:4040/api/manage/users', { method: 'GET', headers }),
                        fetch('http://localhost:4040/api/directions', { method: 'GET', headers }),
                        fetch('http://localhost:4040/api/levels', { method: 'GET', headers }),
                        fetch(`http://localhost:4040/api/manage/courses/${id}/files`, { method: 'GET', headers })
                    ]);

                    // Handle course data
                    if (courseRes.ok) {
                        const res = await courseRes.json();
                        const course = res.data || res;
                        setFormData({
                            userId: course.userId || '',
                            status: course.status || '',
                            title: course.title || '',
                            description: course.description || '',
                            skills: course.skills || [],
                            direction: course.direction || '',
                            level: course.level || '',
                            price: course.price?.toString() || '',
                            links: course.links || []
                        });
                    } else {
                        alert('Failed to fetch course details');
                        navigate('/manage/courses');
                    }

                    // Handle users data
                    if (usersRes.ok) {
                        const res = await usersRes.json();
                        setUsers(res.data || res);
                    }

                    // Handle directions data
                    if (directionsRes.ok) {
                        const directionsData = await directionsRes.json();
                        if (Array.isArray(directionsData.data)) {
                            setDirections(directionsData.data);
                        }
                    }

                    // Handle levels data
                    if (levelsRes.ok) {
                        const levelsData = await levelsRes.json();
                        if (Array.isArray(levelsData.data)) {
                            setLevels(levelsData.data);
                        }
                    }

                    // Handle files data - EXCLUDE THUMBNAIL AND SYSTEM TEXT FILES
                    if (filesRes.ok) {
                        const res = await filesRes.json();
                        const allFiles = res.data || res.files || [];

                        // Filter out:
                        // 1. Thumbnail files (contains 'thumbnail' in name or first image file)
                        // 2. System-generated text files (pattern: vol-*-ch-*-item-*-*.txt)
                        const files = allFiles.filter((file) => {
                            const fileName = (file.originalName || file.filename || '').toLowerCase();

                            // Exclude thumbnails
                            const isThumbnail = fileName.includes('thumbnail') ||
                                (fileName.endsWith('.png') && allFiles.indexOf(file) === 0 && file.mimetype?.startsWith('image/'));

                            // Exclude system text files
                            const isSystemText = isSystemTextFile(file.originalName || file.filename || '');

                            return !isThumbnail && !isSystemText;
                        });

                        setExistingFiles(files);
                    }

                } catch (error) {
                    console.error('Error fetching data:', error);
                    alert('Error loading course details');
                    navigate('/manage/courses');
                } finally {
                    setLoading(false);
                    setLoadingFiles(false);
                }
            };

            fetchData();
        }
    }, [id, navigate, token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleAddSkill = () => {
        const trimmedSkill = skillInput.trim();
        if (trimmedSkill && !formData.skills.includes(trimmedSkill)) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, trimmedSkill]
            }));
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
    };

    const handleSkillInputKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({ ...prev, thumbnail: 'Please select an image file' }));
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, thumbnail: 'Thumbnail must be less than 5MB' }));
                return;
            }
            setThumbnail(file);
            setThumbnailPreview(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, thumbnail: '' }));
        }
    };

    const handleCourseFilesChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = [];
        const newErrors = [];

        files.forEach(file => {
            // Server limit is 512MB per file
            if (file.size > 512 * 1024 * 1024) {
                newErrors.push(`${file.name} exceeds 512MB limit (size: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
                return;
            }
            validFiles.push(file);
        });

        if (newErrors.length > 0) {
            setErrors(prev => ({ ...prev, courseFiles: newErrors.join('; ') }));
        } else {
            setErrors(prev => ({ ...prev, courseFiles: '' }));
        }

        // Add to existing files instead of replacing
        setCourseFiles(prev => [...prev, ...validFiles]);
        setCourseFilesPreview(prev => [...prev, ...validFiles.map(f => ({ name: f.name, size: (f.size / (1024 * 1024)).toFixed(2) }))]);
    };

    const removeCourseFile = (index) => {
        setCourseFiles(prev => prev.filter((_, i) => i !== index));
        setCourseFilesPreview(prev => prev.filter((_, i) => i !== index));
    };

    const deleteExistingFile = async (fileIndex) => {
        const file = existingFiles[fileIndex];
        if (!window.confirm(`Are you sure you want to delete "${file.originalName || file.filename}"?`)) {
            return;
        }

        try {
            const headers = {
                'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                'Content-Type': 'application/json'
            };

            // Use the actual filename to identify which file to delete
            const fileIdentifier = file.filename || file.originalName;

            const response = await fetch(`http://localhost:4040/api/manage/courses/${id}/files/${fileIdentifier}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                setExistingFiles(prev => prev.filter((_, i) => i !== fileIndex));
                alert('File deleted successfully');
            } else {
                alert('Failed to delete file');
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Error deleting file');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.userId) {
            newErrors.userId = 'Owner is required';
        }

        if (!formData.status) {
            newErrors.status = 'Status is required';
        }

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.direction.trim()) {
            newErrors.direction = 'Direction is required';
        }

        if (!formData.level.trim()) {
            newErrors.level = 'Level is required';
        }

        if (formData.price && isNaN(parseFloat(formData.price))) {
            newErrors.price = 'Price must be a valid number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            const jsonHeaders = {
                'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                'Content-Type': 'application/json'
            };

            const multipartHeaders = {
                'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`
            };

            // Step 1: Update course data
            const updatePayload = {
                userId: formData.userId,
                status: formData.status,
                title: formData.title,
                description: formData.description,
                skills: formData.skills,
                direction: formData.direction,
                level: formData.level,
                price: formData.price ? parseFloat(formData.price) : 0
            };

            const response = await fetch(`http://localhost:4040/api/manage/courses/${id}`, {
                method: 'PATCH',
                headers: jsonHeaders,
                body: JSON.stringify(updatePayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Failed to update course: ${errorData.message || 'Unknown error'}`);
                setSaving(false);
                return;
            }

            // Step 2: Upload thumbnail if provided
            if (thumbnail) {
                const thumbnailFormData = new FormData();
                thumbnailFormData.append('file', thumbnail);

                const thumbnailResponse = await fetch(`http://localhost:4040/api/manage/courses/${id}/files?thumbnail=true`, {
                    method: 'POST',
                    headers: multipartHeaders,
                    body: thumbnailFormData
                });

                if (!thumbnailResponse.ok) {
                    const errorData = await thumbnailResponse.json();
                    console.error('Thumbnail upload failed:', errorData);
                }
            }

            // Step 3: Upload course files if provided
            if (courseFiles.length > 0) {
                const filesFormData = new FormData();
                courseFiles.forEach(file => {
                    filesFormData.append('files', file);
                });

                const filesResponse = await fetch(`http://localhost:4040/api/manage/courses/${id}/files/multiple`, {
                    method: 'POST',
                    headers: multipartHeaders,
                    body: filesFormData
                });

                if (!filesResponse.ok) {
                    const errorData = await filesResponse.json();
                    console.error('Course files upload failed:', errorData);
                    alert(`Failed to upload some files: ${errorData.message || 'Unknown error'}`);
                } else {
                    // Refresh the files list after successful upload
                    try {
                        const filesRes = await fetch(`http://localhost:4040/api/manage/courses/${id}/files`, {
                            method: 'GET',
                            headers: jsonHeaders
                        });
                        if (filesRes.ok) {
                            const res = await filesRes.json();
                            const allFiles = res.data || res.files || [];

                            // Apply same filtering as initial load
                            const files = allFiles.filter((file) => {
                                const fileName = (file.originalName || file.filename || '').toLowerCase();
                                const isThumbnail = fileName.includes('thumbnail') ||
                                    (fileName.endsWith('.png') && allFiles.indexOf(file) === 0 && file.mimetype?.startsWith('image/'));
                                const isSystemText = isSystemTextFile(file.originalName || file.filename || '');
                                return !isThumbnail && !isSystemText;
                            });

                            setExistingFiles(files);
                        }
                    } catch (err) {
                        console.error('Error refreshing files list:', err);
                    }
                }
            }

            alert('Course updated successfully!');
            setThumbnail(null);
            setThumbnailPreview(null);
            setCourseFiles([]);
            setCourseFilesPreview([]);
            navigate('/manage/courses');
        } catch (error) {
            console.error('Error updating course:', error);
            alert('Error updating course. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            navigate('/manage/courses');
        }
    };

    const getUserInfo = (userId) => {
        const found = users.find((u) => u._id === userId);
        return found ? { nickname: found.nickname, email: found.email } : { nickname: 'Unknown', email: '—' };
    };

    const getStatusBadgeColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'deployed':
                return 'bg-success';
            case 'on-check':
                return 'bg-warning text-dark';
            case 'editing':
                return 'bg-secondary';
            default:
                return 'bg-light text-dark';
        }
    };

    if (loading) {
        return (
            <>
                <Navbar data={data} onLogout={onLogout} />
                <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted">Loading course details...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar data={data} onLogout={onLogout} />

            <div className="flex-grow-1 p-3 p-md-4" style={{ minWidth: 0 }}>
                {/* Page Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <button
                                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                                onClick={() => navigate('/manage/courses')}
                            >
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
                                </svg>
                                Back to Courses
                            </button>
                        </div>
                        <h1 className="h3 fw-bold text-dark mb-1">Edit Course</h1>
                        <p className="text-muted mb-0 small">Update course information and settings</p>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="row">
                    <div className="col-12 col-lg-10 col-xl-8">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-4">
                                <form onSubmit={handleSubmit}>
                                    {/* Course Thumbnail */}
                                    <div className="text-center mb-4">
                                        <label className="form-label fw-semibold d-block mb-3">
                                            Course Thumbnail
                                            <span className="text-muted ms-2">(Main course image)</span>
                                        </label>

                                        {thumbnailPreview ? (
                                            <img
                                                src={thumbnailPreview}
                                                alt="Thumbnail preview"
                                                className="rounded mb-2"
                                                style={{ maxWidth: '100%', height: '150px', objectFit: 'cover' }}
                                            />
                                        ) : formData.links && formData.links.length > 0 && formData.links[0] && formData.links[0].url ? (
                                            <AuthImage
                                                src={formData.links[0].url}
                                                alt="Current thumbnail"
                                                className="rounded mb-2"
                                                style={{ maxWidth: '100%', height: '150px', objectFit: 'cover' }}
                                                fallback={
                                                    <div className="rounded bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary mx-auto mb-2"
                                                        style={{ width: '150px', height: '150px' }}>
                                                        <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                                                            <path d="M.5 1a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5v-12a.5.5 0 0 0-.5-.5H.5zm15 1v10.5H1V2h14.5z" />
                                                            <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 1 1-.708-.708L9.172 8l-2.726-2.854a.5.5 0 0 1 .708-.708l3 3z" />
                                                        </svg>
                                                    </div>
                                                }
                                            />
                                        ) : (
                                            <div className="rounded bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary mx-auto mb-2"
                                                style={{ width: '150px', height: '150px' }}>
                                                <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M.5 1a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5v-12a.5.5 0 0 0-.5-.5H.5zm15 1v10.5H1V2h14.5z" />
                                                    <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 1 1-.708-.708L9.172 8l-2.726-2.854a.5.5 0 0 1 .708-.708l3 3z" />
                                                </svg>
                                            </div>
                                        )}

                                        <div className="mb-2 d-flex justify-content-center gap-2">
                                            <input
                                                type="file"
                                                id="thumbnail"
                                                className="d-none"
                                                accept="image/*"
                                                onChange={handleThumbnailChange}
                                            />

                                            {!thumbnailPreview && !(formData.links && formData.links.length > 0 && formData.links[0] && formData.links[0].url) ? (
                                                <label htmlFor="thumbnail" className="btn btn-sm btn-primary">
                                                    <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                                                        <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
                                                    </svg>
                                                    Upload Thumbnail
                                                </label>
                                            ) : (
                                                <>
                                                    <label htmlFor="thumbnail" className="btn btn-sm btn-warning">
                                                        <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.203.134l-6 2a.5.5 0 0 1-.633-.633l2-6a.5.5 0 0 1 .134-.203l10-10z" />
                                                        </svg>
                                                        Change Thumbnail
                                                    </label>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => {
                                                            setThumbnail(null);
                                                            setThumbnailPreview(null);
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                links: []
                                                            }));
                                                        }}
                                                    >
                                                        <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                                            <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5z" />
                                                            <path d="M5 0 4.5.5l-.5 1H2a1 1 0 0 0-1 1v1h12V2.5a1 1 0 0 0-1-1H10.5l-.5-1L9.5 0h-5zM3 14.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4H3v10.5zM4.5 3h7L11 2H5l-.5 1z" />
                                                        </svg>
                                                        Delete Thumbnail
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        {errors.thumbnail && (
                                            <small className="text-danger d-block">{errors.thumbnail}</small>
                                        )}
                                        <small className="text-muted">Optional course thumbnail (max 5MB)</small>
                                        {formData.status && (
                                            <div className="mt-2">
                                                <span className={`badge rounded-pill ${getStatusBadgeColor(formData.status)}`}>
                                                    {formData.status}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="row g-3">
                                        {/* Owner Field */}
                                        <div className="col-12 col-md-6">
                                            <label htmlFor="userId" className="form-label fw-semibold">
                                                Course Owner <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className={`form-select ${errors.userId ? 'is-invalid' : ''}`}
                                                id="userId"
                                                name="userId"
                                                value={formData.userId}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select an owner</option>
                                                {users.map((u) => (
                                                    <option key={u._id} value={u._id}>
                                                        {u.nickname} ({u.email})
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.userId && (
                                                <div className="invalid-feedback">{errors.userId}</div>
                                            )}
                                        </div>

                                        {/* Status Field */}
                                        <div className="col-12 col-md-6">
                                            <label htmlFor="status" className="form-label fw-semibold">
                                                Status <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                                id="status"
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select status</option>
                                                <option value="editing">Editing</option>
                                                <option value="on-check">On Check</option>
                                                <option value="deployed">Deployed</option>
                                            </select>
                                            {errors.status && (
                                                <div className="invalid-feedback">{errors.status}</div>
                                            )}
                                        </div>

                                        {/* Title Field */}
                                        <div className="col-12">
                                            <label htmlFor="title" className="form-label fw-semibold">
                                                Course Title <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                                id="title"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                placeholder="Enter course title"
                                            />
                                            {errors.title && (
                                                <div className="invalid-feedback">{errors.title}</div>
                                            )}
                                        </div>

                                        {/* Description Field */}
                                        <div className="col-12">
                                            <label htmlFor="description" className="form-label fw-semibold">
                                                Description
                                            </label>
                                            <textarea
                                                className="form-control"
                                                id="description"
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                placeholder="Enter course description"
                                                rows="4"
                                            />
                                        </div>

                                        {/* Skills Field */}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Skills
                                            </label>
                                            <div className="input-group mb-2">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={skillInput}
                                                    onChange={(e) => setSkillInput(e.target.value)}
                                                    onKeyPress={handleSkillInputKeyPress}
                                                    placeholder="Type a skill and press Enter"
                                                />
                                                <button
                                                    className="btn btn-outline-primary"
                                                    type="button"
                                                    onClick={handleAddSkill}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            {formData.skills.length > 0 && (
                                                <div className="d-flex flex-wrap gap-2 mb-2">
                                                    {formData.skills.map((skill, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="badge bg-primary d-flex align-items-center gap-1"
                                                            style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                                                        >
                                                            {skill}
                                                            <svg
                                                                width="14"
                                                                height="14"
                                                                fill="currentColor"
                                                                viewBox="0 0 16 16"
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={() => handleRemoveSkill(skill)}
                                                            >
                                                                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
                                                            </svg>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Course Files Section */}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Course Files
                                                <span className="text-muted ms-2">(Content files for volumes/chapters)</span>
                                            </label>

                                            {/* Display Existing Course Files (EXCLUDING thumbnail and system text files) */}
                                            {existingFiles && existingFiles.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <div className="small fw-semibold">
                                                            <svg width="14" height="14" fill="currentColor" className="me-1 text-success" viewBox="0 0 16 16">
                                                                <path d="M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z" />
                                                                <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1zm3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4h-3.5z" />
                                                            </svg>
                                                            Uploaded Course Files ({existingFiles.length})
                                                        </div>
                                                        <small className="text-muted">
                                                            <svg width="12" height="12" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                                            </svg>
                                                            Available in course content
                                                        </small>
                                                    </div>

                                                    {loadingFiles ? (
                                                        <div className="text-center py-3">
                                                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                                <span className="visually-hidden">Loading files...</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="border rounded p-2 bg-light"
                                                            style={{ maxHeight: '400px', overflowY: 'auto' }}
                                                        >
                                                            {existingFiles.map((file, idx) => {
                                                                const fileName = file.originalName || file.filename || `File ${idx + 1}`;
                                                                const fileSize = file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown size';
                                                                const mimeType = file.mimetype || file.mimeType || '';

                                                                // Determine file type and icon
                                                                let icon = 'file-earmark';
                                                                let iconColor = 'text-secondary';
                                                                let fileType = 'File';

                                                                if (mimeType.startsWith('image/')) {
                                                                    icon = 'image';
                                                                    iconColor = 'text-primary';
                                                                    fileType = 'Image';
                                                                } else if (mimeType.startsWith('video/')) {
                                                                    icon = 'camera-video';
                                                                    iconColor = 'text-danger';
                                                                    fileType = 'Video';
                                                                } else if (mimeType.startsWith('audio/')) {
                                                                    icon = 'music-note';
                                                                    iconColor = 'text-success';
                                                                    fileType = 'Audio';
                                                                } else if (mimeType === 'application/pdf') {
                                                                    icon = 'file-pdf';
                                                                    iconColor = 'text-danger';
                                                                    fileType = 'PDF';
                                                                } else if (mimeType.includes('document') || mimeType.includes('word')) {
                                                                    icon = 'file-word';
                                                                    iconColor = 'text-primary';
                                                                    fileType = 'Document';
                                                                }

                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className="d-flex justify-content-between align-items-center bg-white p-3 rounded mb-2 shadow-sm border"
                                                                    >
                                                                        <div className="d-flex align-items-center flex-grow-1">
                                                                            <i
                                                                                className={`bi bi-${icon} ${iconColor} me-3`}
                                                                                style={{ fontSize: '1.5rem' }}
                                                                            ></i>
                                                                            <div className="flex-grow-1">
                                                                                <div className="fw-semibold small text-truncate" style={{ maxWidth: '500px' }}>
                                                                                    {fileName}
                                                                                </div>
                                                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                                                    <span className="badge bg-light text-dark me-2">
                                                                                        {fileType}
                                                                                    </span>
                                                                                    <svg width="12" height="12" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                                                                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.758 2.855L15 11.114v-5.73zm-.034 6.878L9.271 8.82 8 9.583 6.728 8.82l-5.694 3.44A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.739zM1 11.114l4.758-2.876L1 5.383v5.73z" />
                                                                                    </svg>
                                                                                    {fileSize}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="d-flex gap-2">
                                                                            <a
                                                                                href={`http://localhost:4040${file.url || file.path}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="btn btn-sm btn-outline-info"
                                                                                title="Download file"
                                                                            >
                                                                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                                                                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                                                                                </svg>
                                                                            </a>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-outline-danger"
                                                                                onClick={() => deleteExistingFile(idx)}
                                                                                title="Delete file"
                                                                            >
                                                                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                                                    <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                                                                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                    <small className="text-muted d-block mt-2">
                                                        <svg width="12" height="12" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                                            <path d="M9.5 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-1 2.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
                                                            <path d="M7 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V2zM6 8.5v2A1.5 1.5 0 0 0 7.5 12h2a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 0-.5.5z" />
                                                        </svg>
                                                        Tip: These files can be used in volumes/chapters/items
                                                    </small>
                                                </div>
                                            )}

                                            {/* Separator */}
                                            <div className="text-center my-3">
                                                <span className="badge bg-light text-secondary">OR</span>
                                            </div>

                                            {/* Upload New Files */}
                                            <div className="mb-3">
                                                <label htmlFor="courseFiles" className="btn btn-success btn-lg w-100 d-flex align-items-center justify-content-center gap-2" style={{ cursor: 'pointer' }}>
                                                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                                                        <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
                                                    </svg>
                                                    <span>Upload Course Files (Images, Videos, PDFs, Docs)</span>
                                                </label>
                                                <input
                                                    type="file"
                                                    id="courseFiles"
                                                    className="d-none"
                                                    multiple
                                                    onChange={handleCourseFilesChange}
                                                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls"
                                                />
                                                <small className="text-muted d-block mt-2">
                                                    ✓ Max 512MB per file | Select multiple files at once | Supports: Images, Videos, PDFs, Documents
                                                </small>
                                                {errors.courseFiles && (
                                                    <small className="text-danger d-block mt-1">
                                                        <strong>⚠ Error:</strong> {errors.courseFiles}
                                                    </small>
                                                )}
                                            </div>

                                            {/* New Files Preview */}
                                            {courseFilesPreview.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <strong className="small text-success">
                                                            <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                                                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                                                                <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
                                                            </svg>
                                                            New Files to Upload ({courseFilesPreview.length})
                                                        </strong>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => {
                                                                setCourseFiles([]);
                                                                setCourseFilesPreview([]);
                                                            }}
                                                        >
                                                            <svg width="12" height="12" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                                                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
                                                            </svg>
                                                            Clear All
                                                        </button>
                                                    </div>
                                                    <div className="border rounded p-2 bg-success bg-opacity-10">
                                                        {courseFilesPreview.map((fileInfo, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="d-flex justify-content-between align-items-center bg-white p-2 rounded mb-2 border border-success"
                                                            >
                                                                <span className="small">
                                                                    <svg width="14" height="14" fill="currentColor" className="me-2 text-success" viewBox="0 0 16 16">
                                                                        <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" />
                                                                    </svg>
                                                                    <strong>{fileInfo.name}</strong>
                                                                    <span className="text-muted ms-2">({fileInfo.size} MB)</span>
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => removeCourseFile(idx)}
                                                                >
                                                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <small className="text-success d-block mt-1">
                                                        <svg width="12" height="12" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                                                        </svg>
                                                        Will be uploaded on save
                                                    </small>
                                                </div>
                                            )}
                                        </div>

                                        {/* Direction Field */}
                                        <div className="col-12 col-md-4">
                                            <label htmlFor="direction" className="form-label fw-semibold">
                                                Direction <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className={`form-select ${errors.direction ? 'is-invalid' : ''}`}
                                                id="direction"
                                                name="direction"
                                                value={formData.direction}
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    setFormData(prev => ({ ...prev, level: '' }));
                                                }}
                                            >
                                                <option value="">Select direction</option>
                                                {directions.map(dir => (
                                                    <option key={dir._id} value={dir.directionName}>
                                                        {dir.directionName}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.direction && (
                                                <div className="invalid-feedback">{errors.direction}</div>
                                            )}
                                        </div>

                                        {/* Level Field */}
                                        <div className="col-12 col-md-4">
                                            <label htmlFor="level" className="form-label fw-semibold">
                                                Level <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className={`form-select ${errors.level ? 'is-invalid' : ''}`}
                                                id="level"
                                                name="level"
                                                value={formData.level}
                                                onChange={handleChange}
                                                disabled={!formData.direction}
                                            >
                                                <option value="">Select level</option>
                                                {levels
                                                    .filter(level => level.directionName === formData.direction)
                                                    .map(level => (
                                                        <option key={level._id} value={level.levelName}>
                                                            {level.levelName}
                                                        </option>
                                                    ))}
                                            </select>
                                            {errors.level && (
                                                <div className="invalid-feedback">{errors.level}</div>
                                            )}
                                            {!formData.direction && (
                                                <small className="text-muted">Select direction first</small>
                                            )}
                                        </div>

                                        {/* Price Field */}
                                        <div className="col-12 col-md-4">
                                            <label htmlFor="price" className="form-label fw-semibold">
                                                Price (USD)
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text">$</span>
                                                <input
                                                    type="number"
                                                    className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                                                    id="price"
                                                    name="price"
                                                    value={formData.price}
                                                    onChange={handleChange}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                />
                                                {errors.price && (
                                                    <div className="invalid-feedback">{errors.price}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Actions */}
                                    <div className="d-flex gap-2 justify-content-end pt-4 mt-3 border-top">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={handleCancel}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="16" height="16" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                                        <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z" />
                                                    </svg>
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default EditCourse;