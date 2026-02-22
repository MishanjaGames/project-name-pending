const fs = require('fs');
const path = require('path');
const multer = require('multer');

// ============================================================================
// CONFIGURATION
// ============================================================================

const UPLOAD_PATHS = {
    userProfiles: path.join(__dirname, '../../storage/data/u'),
    courseFiles: path.join(__dirname, '../../storage/data/c')
};

const FILE_LIMITS = {
    profilePicture: 5 * 1024 * 1024,  // 5MB
    courseFile: 50 * 1024 * 1024       // 50MB
};

const ALLOWED_TYPES = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ],
    videos: ['video/mp4', 'video/webm', 'video/ogg']
};

// ============================================================================
// DIRECTORY MANAGEMENT
// ============================================================================

/**
 * Ensure base directories exist
 */
function initializeBaseDirs() {
    if (!fs.existsSync(UPLOAD_PATHS.userProfiles)) {
        fs.mkdirSync(UPLOAD_PATHS.userProfiles, { recursive: true });
    }
    if (!fs.existsSync(UPLOAD_PATHS.courseFiles)) {
        fs.mkdirSync(UPLOAD_PATHS.courseFiles, { recursive: true });
    }
}

initializeBaseDirs();

/**
 * Ensure directory for specific ID exists
 * @param {string} basePath - Base path (userProfiles or courseFiles)
 * @param {string} id - User or Course ID
 */
function ensureIdDirectory(basePath, id) {
    const dirPath = path.join(basePath, id);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
}

/**
 * Get directory path for specific ID
 * @param {string} type - 'user' or 'course'
 * @param {string} id - User or Course ID
 */
function getIdDirectory(type, id) {
    const basePath = type === 'user' ? UPLOAD_PATHS.userProfiles : UPLOAD_PATHS.courseFiles;
    return ensureIdDirectory(basePath, id);
}

// ============================================================================
// MULTER STORAGE CONFIGURATIONS
// ============================================================================

/**
 * Dynamic storage that uses ID from req.params
 */
const dynamicStorage = (fileType) => multer.diskStorage({
    destination: (req, file, cb) => {
        const id = req.params.id;
        if (!id) {
            return cb(new Error('ID parameter is required'), null);
        }
        
        const basePath = fileType === 'profile' ? UPLOAD_PATHS.userProfiles : UPLOAD_PATHS.courseFiles;
        const dirPath = ensureIdDirectory(basePath, id);
        cb(null, dirPath);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${nameWithoutExt}-${timestamp}${ext}`);
    }
});

// ============================================================================
// FILE FILTERS
// ============================================================================

const imageFilter = (req, file, cb) => {
    if (ALLOWED_TYPES.images.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
    }
};

const courseFileFilter = (req, file, cb) => {
    const allAllowed = [
        ...ALLOWED_TYPES.images,
        ...ALLOWED_TYPES.documents,
        ...ALLOWED_TYPES.videos
    ];
    
    if (allAllowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File type not allowed'), false);
    }
};

// ============================================================================
// MULTER INSTANCES
// ============================================================================

const profileUpload = multer({
    storage: dynamicStorage('profile'),
    limits: { fileSize: FILE_LIMITS.profilePicture },
    fileFilter: imageFilter
});

const courseUpload = multer({
    storage: dynamicStorage('course'),
    limits: { fileSize: FILE_LIMITS.courseFile },
    fileFilter: courseFileFilter
});

// ============================================================================
// MIDDLEWARE EXPORTS
// ============================================================================

module.exports.uploadProfilePicture = profileUpload.single('profilePicture');
module.exports.uploadCourseFile = courseUpload.single('file');
module.exports.uploadCourseFiles = courseUpload.array('files', 10);

// ============================================================================
// FILE OPERATIONS - USER PROFILE PICTURES
// ============================================================================

/**
 * Get user's profile picture path
 * Returns first image file found in user's directory
 */
module.exports.getUserProfilePicture = (userId) => {
    const userDir = path.join(UPLOAD_PATHS.userProfiles, userId);
    
    if (!fs.existsSync(userDir)) {
        return null;
    }
    
    const files = fs.readdirSync(userDir);
    const imageFile = files.find(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    return imageFile ? path.join(userDir, imageFile) : null;
};

/**
 * Delete user's profile picture
 * Deletes the first image found (assuming one profile pic per user)
 */
module.exports.deleteUserProfilePicture = (userId) => {
    const userDir = path.join(UPLOAD_PATHS.userProfiles, userId);
    
    if (!fs.existsSync(userDir)) {
        return false;
    }
    
    const files = fs.readdirSync(userDir);
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    // Delete all images (clean up old ones if multiple exist)
    imageFiles.forEach(file => {
        const filePath = path.join(userDir, file);
        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error(`Error deleting ${filePath}:`, error);
        }
    });
    
    return imageFiles.length > 0;
};

/**
 * Rename uploaded profile picture to profile_main{extension}
 * Returns the new filename and path
 */
module.exports.renameProfilePicture = (userId, uploadedFilename) => {
    try {
        const userDir = path.join(UPLOAD_PATHS.userProfiles, userId);
        const uploadedPath = path.join(userDir, uploadedFilename);
        
        if (!fs.existsSync(uploadedPath)) {
            return null;
        }
        
        const ext = path.extname(uploadedFilename);
        const newFilename = `profile_main${ext}`;
        const newPath = path.join(userDir, newFilename);
        
        // Delete old profile_main if exists
        if (fs.existsSync(newPath)) {
            fs.unlinkSync(newPath);
        }
        
        // Rename the uploaded file
        fs.renameSync(uploadedPath, newPath);
        
        return {
            filename: newFilename,
            path: `/api/manage/users/${userId}/profile-picture`,
            fullPath: newPath
        };
    } catch (error) {
        console.error('Error renaming profile picture:', error);
        return null;
    }
};

/**
 * Get profile picture URL path (for backward compatibility)
 */
module.exports.getProfilePictureLink = (userId) => {
    const link = module.exports.buildProfilePictureLink(userId);
    return link ? link.url : null;
};

/**
 * Delete entire user directory with all files
 */
module.exports.deleteUserDirectory = (userId) => {
    const userDir = path.join(UPLOAD_PATHS.userProfiles, userId);
    
    if (!fs.existsSync(userDir)) {
        return false;
    }
    
    try {
        fs.rmSync(userDir, { recursive: true, force: true });
        return true;
    } catch (error) {
        console.error(`Error deleting user directory ${userDir}:`, error);
        return false;
    }
};

// ============================================================================
// FILE OPERATIONS - COURSE FILES
// ============================================================================

/**
 * Get all files in course directory
 * Returns array of file info objects
 */
module.exports.getCourseFiles = (courseId) => {
    const courseDir = path.join(UPLOAD_PATHS.courseFiles, courseId);
    
    if (!fs.existsSync(courseDir)) {
        return [];
    }
    
    const files = fs.readdirSync(courseDir);
    return files.map(filename => {
        const filePath = path.join(courseDir, filename);
        const stats = fs.statSync(filePath);
        return {
            filename: filename,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
        };
    });
};

/**
 * Rename uploaded course file to thumbnail{extension} if it's the thumbnail
 * Returns the new filename and path
 */
module.exports.renameThumbnail = (courseId, uploadedFilename) => {
    try {
        const courseDir = path.join(UPLOAD_PATHS.courseFiles, courseId);
        const uploadedPath = path.join(courseDir, uploadedFilename);
        
        if (!fs.existsSync(uploadedPath)) {
            return null;
        }
        
        const ext = path.extname(uploadedFilename);
        const newFilename = `thumbnail${ext}`;
        const newPath = path.join(courseDir, newFilename);
        
        // Delete old thumbnail if exists
        if (fs.existsSync(newPath)) {
            fs.unlinkSync(newPath);
        }
        
        // Rename the uploaded file
        fs.renameSync(uploadedPath, newPath);
        
        return {
            filename: newFilename,
            path: `/api/manage/courses/${courseId}/files/${newFilename}`,
            fullPath: newPath
        };
    } catch (error) {
        console.error('Error renaming thumbnail:', error);
        return null;
    }
};

/**
 * Get thumbnail URL path (for backward compatibility)
 */
module.exports.getThumbnailLink = (courseId) => {
    const link = module.exports.buildThumbnailLink(courseId);
    return link ? link.url : null;
};

/**
 * Get all course file links (excluding thumbnail which is at position 0)
 */
module.exports.getCourseFileLinks = (courseId) => {
    const courseDir = path.join(UPLOAD_PATHS.courseFiles, courseId);
    
    if (!fs.existsSync(courseDir)) {
        return [];
    }
    
    const files = fs.readdirSync(courseDir)
        .filter(file => !file.startsWith('thumbnail'));
    
    return files.map(file => `/api/manage/courses/${courseId}/files/${file}`);
};

/**
 * Build complete links array for course [thumbnail at 0, followed by other files]
 */
module.exports.buildCourseLinks = (courseId) => {
    const links = [];
    
    // Add thumbnail at position 0
    const thumbnail = module.exports.getThumbnailLink(courseId);
    if (thumbnail) {
        links.push(thumbnail);
    }
    
    // Add other files
    const otherFiles = module.exports.getCourseFileLinks(courseId);
    links.push(...otherFiles);
    
    return links;
};

/**
 * Get specific course file path
 */
module.exports.getCourseFilePath = (courseId, filename) => {
    const filePath = path.join(UPLOAD_PATHS.courseFiles, courseId, filename);
    return fs.existsSync(filePath) ? filePath : null;
};

/**
 * Delete specific course file
 */
module.exports.deleteCourseFile = (courseId, filename) => {
    const filePath = path.join(UPLOAD_PATHS.courseFiles, courseId, filename);
    
    if (!fs.existsSync(filePath)) {
        return false;
    }
    
    try {
        fs.unlinkSync(filePath);
        return true;
    } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
        return false;
    }
};

/**
 * Delete entire course directory with all files
 */
module.exports.deleteCourseDirectory = (courseId) => {
    const courseDir = path.join(UPLOAD_PATHS.courseFiles, courseId);
    
    if (!fs.existsSync(courseDir)) {
        return false;
    }
    
    try {
        fs.rmSync(courseDir, { recursive: true, force: true });
        return true;
    } catch (error) {
        console.error(`Error deleting course directory ${courseDir}:`, error);
        return false;
    }
};

// ============================================================================
// FILE SENDING (GET requests)
// ============================================================================

/**
 * Send user profile picture to client
 * Use in GET /api/users/:id/profile-picture/:filename
 */
module.exports.sendUserProfilePicture = (req, res) => {
    try {
        const userId = req.params.id;
        const filename = req.params.filename;
        
        let filePath;
        
        // If filename is provided, use it directly
        if (filename) {
            filePath = path.join(UPLOAD_PATHS.userProfiles, userId, filename);
        } else {
            // Otherwise find the first profile picture
            filePath = module.exports.getUserProfilePicture(userId);
        }
        
        if (!filePath || !fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Profile picture not found'
            });
        }
        
        // Set cache headers
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.sendFile(filePath);
        
    } catch (error) {
        console.error('Error sending profile picture:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving profile picture'
        });
    }
};

/**
 * Send course file to client
 * Use in GET /api/courses/:id/files/:filename
 */
module.exports.sendCourseFile = (req, res) => {
    try {
        const courseId = req.params.id;
        const filename = req.params.filename;
        const filePath = module.exports.getCourseFilePath(courseId, filename);
        
        if (!filePath) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
        
        // Check if download or inline
        const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
        res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
        res.setHeader('Cache-Control', 'private, max-age=3600');
        
        res.sendFile(filePath);
        
    } catch (error) {
        console.error('Error sending course file:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving file'
        });
    }
};

/**
 * List all course files (GET without specific filename)
 * Use in GET /api/courses/:id/files
 */
module.exports.listCourseFiles = (req, res) => {
    try {
        const courseId = req.params.id;
        const files = module.exports.getCourseFiles(courseId);
        
        res.status(200).json({
            success: true,
            courseId: courseId,
            count: files.length,
            files: files
        });
        
    } catch (error) {
        console.error('Error listing course files:', error);
        res.status(500).json({
            success: false,
            message: 'Error listing files'
        });
    }
};

// ============================================================================
// ERROR HANDLER
// ============================================================================

module.exports.handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Upload error: ' + err.message
        });
    }
    
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'Upload error'
        });
    }
    
    next();
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if user has profile picture
 */
module.exports.hasUserProfilePicture = (userId) => {
    return module.exports.getUserProfilePicture(userId) !== null;
};

/**
 * Get course file count
 */
module.exports.getCourseFileCount = (courseId) => {
    return module.exports.getCourseFiles(courseId).length;
};

// ============================================================================
// LINK OBJECT BUILDERS - Create proper link objects with full paths
// ============================================================================

/**
 * Build a link object for profile picture with full path
 * @param {string} userId - User ID
 * @returns {Object|null} Link object with full path and metadata
 */
module.exports.buildProfilePictureLink = (userId) => {
    const userDir = path.join(UPLOAD_PATHS.userProfiles, userId);
    
    if (!fs.existsSync(userDir)) {
        return null;
    }
    
    const files = fs.readdirSync(userDir);
    const profileFile = files.find(file => file.startsWith('profile_main'));
    
    if (!profileFile) {
        return null;
    }
    
    return {
        type: 'image',
        url: `/api/files/users/${userId}/${profileFile}`,
        filename: profileFile,
        accessLevel: 'default',
        description: 'Profile picture'
    };
};

/**
 * Build a link object for course thumbnail with full path
 * @param {string} courseId - Course ID
 * @returns {Object|null} Link object with full path and metadata
 */
module.exports.buildThumbnailLink = (courseId) => {
    const courseDir = path.join(UPLOAD_PATHS.courseFiles, courseId);
    
    if (!fs.existsSync(courseDir)) {
        return null;
    }
    
    const files = fs.readdirSync(courseDir);
    const thumbnailFile = files.find(file => file.startsWith('thumbnail'));
    
    if (!thumbnailFile) {
        return null;
    }
    
    return {
        type: 'image',
        url: `/api/files/courses/${courseId}/${thumbnailFile}`,
        filename: thumbnailFile,
        accessLevel: 'default',
        description: 'Course thumbnail'
    };
};

/**
 * Build link objects for all course files (non-thumbnail)
 * @param {string} courseId - Course ID
 * @param {string} accessLevel - Minimum access level for these files (default: 'default')
 * @returns {Array} Array of link objects with full paths
 */
module.exports.buildCourseFileLinks = (courseId, accessLevel = 'default') => {
    const courseDir = path.join(UPLOAD_PATHS.courseFiles, courseId);
    
    if (!fs.existsSync(courseDir)) {
        return [];
    }
    
    const files = fs.readdirSync(courseDir)
        .filter(file => !file.startsWith('thumbnail'));
    
    return files.map(file => {
        const ext = path.extname(file).toLowerCase();
        let type = 'document';
        
        // Determine file type
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
            type = 'image';
        } else if (['.mp4', '.webm', '.ogg', '.mov', '.avi'].includes(ext)) {
            type = 'video';
        } else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'].includes(ext)) {
            type = 'document';
        }
        
        return {
            type: type,
            url: `/api/files/courses/${courseId}/${file}`,
            filename: file,
            accessLevel: accessLevel,
            description: file
        };
    });
};

/**
 * Determine file type based on MIME type
 * @param {string} mimetype - MIME type from uploaded file
 * @returns {string} File type (image, video, document, other)
 */
module.exports.getFileType = (mimetype) => {
    if (ALLOWED_TYPES.images.includes(mimetype)) return 'image';
    if (ALLOWED_TYPES.videos.includes(mimetype)) return 'video';
    if (ALLOWED_TYPES.documents.includes(mimetype)) return 'document';
    return 'other';
};

// Export paths for reference
module.exports.paths = UPLOAD_PATHS;