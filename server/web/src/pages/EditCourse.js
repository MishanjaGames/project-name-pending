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
    const [existingFiles, setExistingFiles] = useState([]); // Existing uploaded files from server
    const [loadingFiles, setLoadingFiles] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            const headers = {
                'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                'Content-Type': 'application/json'
            };

            const fetchCourse = async () => {
                try {
                    const response = await fetch(`http://localhost:4040/api/manage/courses/${id}`, {
                        method: 'GET',
                        headers
                    });
                    if (response.ok) {
                        const res = await response.json();
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
                } catch (error) {
                    console.error('Error fetching course:', error);
                    alert('Error loading course details');
                    navigate('/manage/courses');
                } finally {
                    setLoading(false);
                }
            };

            const fetchUsers = async () => {
                try {
                    const response = await fetch('http://localhost:4040/api/manage/users', {
                        method: 'GET',
                        headers
                    });
                    if (response.ok) {
                        const res = await response.json();
                        setUsers(res.data || res);
                    }
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            };

            const fetchFiles = async () => {
                setLoadingFiles(true);
                try {
                    const response = await fetch(`http://localhost:4040/api/manage/courses/${id}/files`, {
                        method: 'GET',
                        headers
                    });
                    if (response.ok) {
                        const res = await response.json();
                        // Filter out thumbnail (index 0) to show only course files
                        const files = (res.data || res.files || []).filter((file, idx) => idx !== 0);
                        setExistingFiles(files);
                    }
                } catch (error) {
                    console.error('Error fetching files:', error);
                } finally {
                    setLoadingFiles(false);
                }
            };

            fetchCourse();
            fetchUsers();
            fetchFiles();
        }
    }, [id, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
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
            if (file.size > 50 * 1024 * 1024) {
                newErrors.push(`${file.name} exceeds 50MB limit`);
                return;
            }
            validFiles.push(file);
        });

        if (newErrors.length > 0) {
            setErrors(prev => ({ ...prev, courseFiles: newErrors.join(', ') }));
        } else {
            setErrors(prev => ({ ...prev, courseFiles: '' }));
        }

        setCourseFiles(validFiles);
        setCourseFilesPreview(validFiles.map(f => ({ name: f.name, size: (f.size / (1024 * 1024)).toFixed(2) })));
    };

    const removeCourseFile = (index) => {
        setCourseFiles(prev => prev.filter((_, i) => i !== index));
        setCourseFilesPreview(prev => prev.filter((_, i) => i !== index));
    };

    const deleteExistingFile = async (fileIndex) => {
        if (!window.confirm('Are you sure you want to delete this file?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `${token.split(' ')[0]} ${token.split(' ')[1]}`,
                'Content-Type': 'application/json'
            };

            // Add 1 to fileIndex because thumbnail is at index 0
            const actualIndex = fileIndex + 1;

            const response = await fetch(`http://localhost:4040/api/manage/courses/${id}/files/${actualIndex}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                // Remove from local state
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
            const token = localStorage.getItem('token');
            const headers = {
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
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
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
                thumbnailFormData.append('isThumbnail', 'true');

                const thumbnailResponse = await fetch(`http://localhost:4040/api/manage/courses/${id}/files?thumbnail=true`, {
                    method: 'POST',
                    headers,
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
                    headers,
                    body: filesFormData
                });

                if (!filesResponse.ok) {
                    const errorData = await filesResponse.json();
                    console.error('Course files upload failed:', errorData);
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
                                    {/* Course Icon Preview and Thumbnail Upload */}
                                    <div className="text-center mb-4">
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

                                        {/* Button Logic: Show Upload button when no thumbnail, Show Change/Delete when thumbnail exists */}
                                        <div className="mb-2 d-flex justify-content-center gap-2">
                                            <input
                                                type="file"
                                                id="thumbnail"
                                                className="d-none"
                                                accept="image/*"
                                                onChange={handleThumbnailChange}
                                            />

                                            {!thumbnailPreview && !(formData.links && formData.links.length > 0 && formData.links[0] && formData.links[0].url) ? (
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
                                            {formData.userId && (
                                                <small className="text-muted">
                                                    Selected: <span className="fw-semibold">{getUserInfo(formData.userId).nickname}</span>
                                                </small>
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
                                            <small className="text-muted">
                                                Provide a detailed description of what students will learn
                                            </small>
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
                                                    placeholder="Type a skill and press Enter or click Add"
                                                />
                                                <button
                                                    className="btn btn-outline-primary"
                                                    type="button"
                                                    onClick={handleAddSkill}
                                                >
                                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                                                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                                                    </svg>
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
                                            <small className="text-muted">
                                                Add skills that students will learn in this course
                                            </small>
                                        </div>

                                        

                                        {/* Direction Field */}
                                        <div className="col-12 col-md-4">
                                            <label htmlFor="direction" className="form-label fw-semibold">
                                                Direction <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.direction ? 'is-invalid' : ''}`}
                                                id="direction"
                                                name="direction"
                                                value={formData.direction}
                                                onChange={handleChange}
                                                placeholder="e.g., Programming, Design"
                                            />
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
                                                <option value="Junior">Beginner</option>
                                                <option value="Middle">Intermediate</option>
                                                <option value="Senior">Advanced</option>
                                                <option value="Guru">Expert</option>
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
                                                {errors.price && (
                                                    <div className="invalid-feedback">{errors.price}</div>
                                                )}
                                            </div>
                                            <small className="text-muted">
                                                Leave empty or 0 for free courses
                                            </small>
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

                        {/* Help Card */}
                        <div className="card border-0 bg-light mt-3">
                            <div className="card-body p-3">
                                <h6 className="fw-semibold mb-2 small">
                                    <svg width="14" height="14" fill="currentColor" className="me-1" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                    </svg>
                                    Course Status Guide
                                </h6>
                                <ul className="small text-muted mb-0 ps-3">
                                    <li><strong>Editing:</strong> Course is being created or modified</li>
                                    <li><strong>On Check:</strong> Course is under review for approval</li>
                                    <li><strong>Deployed:</strong> Course is published and available to students</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default EditCourse;