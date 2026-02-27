import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";

function CreateCourse({ data, onLogout }) {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [users, setUsers] = useState([]);
    const [directions, setDirections] = useState([]);
    const [levels, setLevels] = useState([]);
    const [formData, setFormData] = useState({
        userId: '',
        status: 'editing',
        title: '',
        description: '',
        skills: [],
        direction: '',
        level: '',
        price: ''
    });
    const [skillInput, setSkillInput] = useState('');
    const [errors, setErrors] = useState({});

    // File states
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [contentFiles, setContentFiles] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            const fetchUsers = async () => {
                try {
                    const response = await fetch('http://localhost:4040/api/manage/users', {
                        method: 'GET',
                        headers: {
                            'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.ok) {
                        const res = await response.json();
                        setUsers(res.data || res);
                    }
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            };

            fetchUsers();
        }

        // Fetch directions
        const fetchDirections = async () => {
            try {
                const response = await fetch('http://localhost:4040/api/directions', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const res = await response.json();
                    setDirections(res.data || []);
                }
            } catch (error) {
                console.error('Error fetching directions:', error);
            }
        };

        // Fetch levels
        const fetchLevels = async () => {
            try {
                const response = await fetch('http://localhost:4040/api/levels', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const res = await response.json();
                    setLevels(res.data || []);
                }
            } catch (error) {
                console.error('Error fetching levels:', error);
            }
        };

        fetchDirections();
        fetchLevels();
    }, []);

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

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        console.log(file)
        if (file) {
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({ ...prev, thumbnail: 'Please select an image file' }));
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, thumbnail: 'Image must be less than 5MB' }));
                return;
            }
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, thumbnail: '' }));
        }
    };

    const handleContentFilesChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = [];

        for (const file of files) {
            if (file.size > 50 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Maximum size is 50MB.`);
                continue;
            }
            validFiles.push(file);
        }

        setContentFiles(prev => [...prev, ...validFiles]);
    };

    const removeContentFile = (index) => {
        setContentFiles(prev => prev.filter((_, i) => i !== index));
    };

    const renameFile = (file, newName) => {
        const blob = file.slice(0, file.size, file.type);
        return new File([blob], newName, { type: file.type });
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

    const validateForm = () => {
        const newErrors = {};

        if (!formData.userId) newErrors.userId = 'Owner is required';
        if (!formData.status) newErrors.status = 'Status is required';
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.direction.trim()) newErrors.direction = 'Direction is required';
        if (!formData.level.trim()) newErrors.level = 'Level is required';
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
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                'Content-Type': 'application/json'
            };

            // Step 1: Create course
            const response = await fetch('http://localhost:4040/api/manage/courses', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userId: formData.userId,
                    status: formData.status,
                    title: formData.title,
                    description: formData.description,
                    skills: formData.skills,
                    direction: formData.direction,
                    level: formData.level,
                    price: formData.price ? parseFloat(formData.price) : 0
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Failed to create course: ${errorData.message || 'Unknown error'}`);
                setSaving(false);
                return;
            }

            const { data: courseData } = await response.json();
            const courseId = courseData._id;

            // Step 2: Upload thumbnail if provided
            if (thumbnailFile) {
                const fileExtension = thumbnailFile.name.split('.').pop();
                const renamedFile = renameFile(thumbnailFile, `thumbnail.${fileExtension}`);
                console.log(renamedFile)
                const thumbnailFormData = new FormData();
                thumbnailFormData.append('file', renamedFile);

                await fetch(`http://localhost:4040/api/manage/courses/${courseId}/files`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`
                    },
                    body: thumbnailFormData
                });
            }

            // Step 3: Upload content files if provided
            if (contentFiles.length > 0) {
                const contentFormData = new FormData();
                contentFiles.forEach(file => {
                    contentFormData.append('files', file);
                });

                await fetch(`http://localhost:4040/api/manage/courses/${courseId}/files/multiple`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`
                    },
                    body: contentFormData
                });
            }

            alert('Course created successfully!');
            navigate('/manage/courses');
        } catch (error) {
            console.error('Error creating course:', error);
            alert('Error creating course. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to cancel? All entered data will be lost.')) {
            navigate('/manage/courses');
        }
    };

    const getUserInfo = (userId) => {
        const found = users.find((u) => u._id === userId);
        return found ? { nickname: found.nickname, email: found.email } : { nickname: 'Unknown', email: '—' };
    };

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
                        <h1 className="h3 fw-bold text-dark mb-1">Create Course</h1>
                        <p className="text-muted mb-0 small">Add a new course with files and content</p>
                    </div>
                </div>

                {/* Create Form */}
                <div className="row">
                    <div className="col-12 col-lg-10 col-xl-8">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-4">
                                <form onSubmit={handleSubmit}>
                                    {/* Course Icon Preview */}
                                    <div className="text-center mb-4">
                                        {thumbnailPreview ? (
                                            <img
                                                src={thumbnailPreview}
                                                alt="Thumbnail preview"
                                                className="rounded mb-2"
                                                style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div className="rounded bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary mx-auto mb-2"
                                                style={{ width: '120px', height: '120px' }}>
                                                <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 6.464V13.5a.5.5 0 0 0 1 0V6.236a.5.5 0 0 0-.053-.224l-7.5-3.5z" />
                                                    <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466 4.176 9.032z" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* Button Logic: Show Upload button when no thumbnail, Show Change/Delete when thumbnail exists */}
                                        <div className="mb-2 d-flex justify-content-center gap-2">
                                            <input
                                                type="file"
                                                id="thumbnail"
                                                className="d-none"
                                                accept="image/*"
                                                onChange={handleThumbnailChange}
                                            />

                                            {!thumbnailPreview ? (
                                                // No thumbnail - show only Upload button
                                                <label htmlFor="thumbnail" className="btn btn-sm btn-primary">
                                                    <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                                                        <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
                                                    </svg>
                                                    Upload Thumbnail
                                                </label>
                                            ) : (
                                                // Thumbnail exists - show Change and Delete buttons
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
                                                            setThumbnailFile(null);
                                                            setThumbnailPreview(null);
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
                                        <small className="text-muted">Recommended: 800x600px, max 5MB</small>
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
                                        {/* <div className="col-12 col-md-6">
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
                                                <option value="editing">Editing</option>
                                                <option value="on-check">On Check</option>
                                                <option value="deployed">Deployed</option>
                                            </select>
                                            {errors.status && (
                                                <div className="invalid-feedback">{errors.status}</div>
                                            )}
                                        </div> */}

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
                                            <label className="form-label fw-semibold">Skills</label>
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
                                                onChange={handleChange}
                                            >
                                                <option value="">Select direction</option>
                                                {directions.map((dir) => (
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
                                            >
                                                <option value="">Select level</option>
                                                {levels.map((lvl) => (
                                                    <option key={lvl._id} value={lvl.levelName}>
                                                        {lvl.levelName}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.level && (
                                                <div className="invalid-feedback">{errors.level}</div>
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
                                            </div>
                                        </div>

                                        {/* Course Content Files - IMPROVED VERSION */}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                Course Content Files
                                                <span className="text-muted ms-2">(Videos, PDFs, Documents, Images)</span>
                                            </label>
                                            <div className="border rounded p-3 bg-light">
                                                {/* Upload Button */}
                                                <div className="mb-3">
                                                    <input
                                                        type="file"
                                                        id="contentFiles"
                                                        className="d-none"
                                                        multiple
                                                        onChange={handleContentFilesChange}
                                                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
                                                    />
                                                    <label htmlFor="contentFiles" className="btn btn-outline-primary">
                                                        <svg width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                                                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                                                            <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
                                                        </svg>
                                                        <i className="bi bi-upload me-1"></i>
                                                        Choose Files to Upload
                                                    </label>
                                                </div>

                                                <small className="text-muted d-block mb-3">
                                                    <i className="bi bi-info-circle me-1"></i>
                                                    These files will be available to use in your course content (volumes/chapters).
                                                    Max 50MB per file. Supported: Videos, Audio, Images, PDFs, Documents.
                                                </small>

                                                {/* Selected Files Display */}
                                                {contentFiles.length > 0 && (
                                                    <div className="mt-3">
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <strong className="small">
                                                                <i className="bi bi-files me-1"></i>
                                                                Files to Upload ({contentFiles.length})
                                                            </strong>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => setContentFiles([])}
                                                            >
                                                                <i className="bi bi-trash me-1"></i>
                                                                Clear All
                                                            </button>
                                                        </div>

                                                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                            {contentFiles.map((file, idx) => {
                                                                const isImage = file.type.startsWith('image/');
                                                                const isVideo = file.type.startsWith('video/');
                                                                const isAudio = file.type.startsWith('audio/');
                                                                const isPDF = file.type === 'application/pdf';

                                                                let icon = 'file-earmark';
                                                                let iconColor = 'text-secondary';

                                                                if (isImage) {
                                                                    icon = 'image';
                                                                    iconColor = 'text-primary';
                                                                } else if (isVideo) {
                                                                    icon = 'camera-video';
                                                                    iconColor = 'text-danger';
                                                                } else if (isAudio) {
                                                                    icon = 'music-note';
                                                                    iconColor = 'text-success';
                                                                } else if (isPDF) {
                                                                    icon = 'file-pdf';
                                                                    iconColor = 'text-danger';
                                                                }

                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className="d-flex justify-content-between align-items-center bg-white p-2 rounded mb-2 border"
                                                                    >
                                                                        <div className="d-flex align-items-center flex-grow-1">
                                                                            <i className={`bi bi-${icon} ${iconColor} me-2`} style={{ fontSize: '1.25rem' }}></i>
                                                                            <div className="flex-grow-1">
                                                                                <div className="small fw-semibold text-truncate" style={{ maxWidth: '400px' }}>
                                                                                    {file.name}
                                                                                </div>
                                                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                                                    <span className="ms-2">•</span>
                                                                                    <span className="ms-2">
                                                                                        {isImage ? 'Image' : isVideo ? 'Video' : isAudio ? 'Audio' : isPDF ? 'PDF' : 'Document'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-outline-danger"
                                                                            onClick={() => removeContentFile(idx)}
                                                                            title="Remove file"
                                                                        >
                                                                            <i className="bi bi-x-lg"></i>
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Empty State */}
                                                {contentFiles.length === 0 && (
                                                    <div className="text-center py-4 text-muted">
                                                        <i className="bi bi-cloud-upload" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                                                        <p className="mb-0 mt-2 small">No files selected yet</p>
                                                        <p className="mb-0 small">Upload course materials that you'll use in your lessons</p>
                                                    </div>
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
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="16" height="16" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                                                    </svg>
                                                    Create Course
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

export default CreateCourse;