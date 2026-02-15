const utils = require('../utils/utils')
const fileHandler = require('../utils/fileHandler')
const linkFilter = require('../utils/linkFilter')
const Courses = require('../models/mongo.courses')
const errorHandler = require('../utils/errorHandler')

module.exports.getAll = async (req, res) => {
    try {
        // Get requester's access level
        const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
        let requesterAccessLevel = 'default';
        
        if (token) {
            try {
                const requester = await utils.parseToken(token);
                if (requester && requester.role) {
                    const requesterRole = await require('../models/mongo.roles').findById(requester.role);
                    if (requesterRole) {
                        requesterAccessLevel = requesterRole.accessLevel || 'default';
                    }
                }
            } catch (e) {
                // Token parsing failed, use default level
            }
        }
        
        const courses = await Courses.find({});
        const filteredCourses = linkFilter.filterCoursesData(courses, requesterAccessLevel);
        
        res.status(200).json({ data: filteredCourses })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.getById = async (req, res) => {
    try {
        // Get requester's access level
        const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
        let requesterAccessLevel = 'default';
        
        if (token) {
            try {
                const requester = await utils.parseToken(token);
                if (requester && requester.role) {
                    const requesterRole = await require('../models/mongo.roles').findById(requester.role);
                    if (requesterRole) {
                        requesterAccessLevel = requesterRole.accessLevel || 'default';
                    }
                }
            } catch (e) {
                // Token parsing failed, use default level
            }
        }
        
        const course = await Courses.findById(req.params.id);

        if (course) {
            const filteredCourse = linkFilter.filterCourseData(course, requesterAccessLevel);
            res.status(200).json({ status: 'Course successfully found', data: filteredCourse })
        } else {
            errorHandler(res, 404, 'Course not found')
        }

    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.create = async (req, res) => {
    try {
        const skils = [`Master the core concepts of ${req.body.title}`, 'Learn and build real-world projects']
        
        const course = await new Courses({
            userId: req.body.userId,
            title: req.body.title,
            description: req.body.description,
            skills: [...skils, ...req.body.skills],
            price: req.body.price,
            level: req.body.level,
            direction: req.body.direction,
            links: [], // Initialize as empty array - thumbnail and files will be added when uploaded
            createdAt: Date.now(),
            updatedAt: Date.now()
        })

        await course.save()

        res.status(201).json({
            message: 'Course created successfully',
            data: course
        })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.remove = async (req, res) => {
    try {
        // Delete entire course directory (all files)
        fileHandler.deleteCourseDirectory(req.params.id);
        
        // Delete course from database
        await Courses.deleteOne({
            _id: req.params.id
        })

        res.status(200).json({
            message: 'Course deleted successfully', 
            data: { _id: req.params.id }
        })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.update = async (req, res) => {
    try {
        const updatedCourse = {
            userId: req.body.userId,
            status: req.body.status,
            title: req.body.title,
            description: req.body.description,
            skills: req.body.skills,
            price: req.body.price,
            level: req.body.level,
            direction: req.body.direction,
            links: req.body.links,
            updatedAt: Date.now()
        }

        const course = await Courses.findByIdAndUpdate(
            {
                _id: req.params.id
            },
            {
                $set: updatedCourse
            },
            {
                new: true
            })

        res.status(200).json({ message: 'Course updated successfully', data: course })

    } catch (e) {
        errorHandler(res, 500, e)
    }
}

// ============================================================================
// COURSE FILES ROUTES
// ============================================================================

/**
 * GET - List all course files
 * GET /api/courses/:id/files
 * 
 * Route setup:
 * router.get('/:id/files', courses.listCourseFiles);
 */
module.exports.listCourseFiles = (req, res) => {
    fileHandler.listCourseFiles(req, res);
};

/**
 * GET - Download specific course file
 * GET /api/courses/:id/files/:filename
 * 
 * Route setup:
 * router.get('/:id/files/:filename', courses.getCourseFile);
 */
module.exports.getCourseFile = (req, res) => {
    fileHandler.sendCourseFile(req, res);
};

/**
 * POST - Upload single course file
 * POST /api/courses/:id/files
 * Contains multer middleware + controller logic
 * 
 * Route setup (just reference the function):
 * router.post('/:id/files', courses.uploadCourseFile);
 */
module.exports.uploadCourseFile = [
    fileHandler.uploadCourseFile,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Verify course exists
            const course = await Courses.findById(req.params.id);
            if (!course) {
                // Clean up uploaded file
                fileHandler.deleteCourseFile(req.params.id, req.file.filename);
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            // Check if this is a thumbnail (indicated by query param or file type)
            const isThumbnail = req.query.thumbnail === 'true' || req.body.isThumbnail === 'true';
            let linkObject = null;

            // If thumbnail, rename it and build link object
            if (isThumbnail) {
                const renamedFile = fileHandler.renameThumbnail(req.params.id, req.file.filename);
                if (!renamedFile) {
                    fileHandler.deleteCourseFile(req.params.id, req.file.filename);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to process thumbnail'
                    });
                }
                linkObject = fileHandler.buildThumbnailLink(req.params.id);

                // Update course links with thumbnail at position 0
                // Keep all links EXCEPT course thumbnails
                const otherLinks = (course.links || []).filter(link => {
                    if (link.type !== 'image') return true;
                    if (!link.description) return true;
                    return link.description.toLowerCase() !== 'course thumbnail';
                });
                const updatedLinks = [linkObject, ...otherLinks];
                
                await Courses.findByIdAndUpdate(
                    { _id: req.params.id },
                    { $set: { links: updatedLinks } }
                );
            } else {
                // Regular file - build link object and add to links
                linkObject = {
                    type: fileHandler.getFileType(req.file.mimetype),
                    url: `/api/manage/courses/${req.params.id}/files/${req.file.filename}`,
                    filename: req.file.filename,
                    accessLevel: 'default',
                    description: req.file.originalname
                };
                
                const currentLinks = course.links || [];
                const newLinks = [...currentLinks, linkObject];
                
                await Courses.findByIdAndUpdate(
                    { _id: req.params.id },
                    { $set: { links: newLinks } }
                );
            }

            res.status(200).json({
                success: true,
                message: 'File uploaded successfully',
                data: {
                    courseId: course._id,
                    filename: req.file.filename,
                    link: linkObject
                }
            });

        } catch (e) {
            // Clean up on error
            if (req.file && req.params.id) {
                fileHandler.deleteCourseFile(req.params.id, req.file.filename);
            }
            errorHandler(res, 500, e);
        }
    },
    fileHandler.handleUploadError
];

/**
 * POST - Upload multiple course files
 * POST /api/courses/:id/files/multiple
 * Contains multer middleware + controller logic
 * 
 * Route setup (just reference the function):
 * router.post('/:id/files/multiple', courses.uploadCourseFiles);
 */
module.exports.uploadCourseFiles = [
    fileHandler.uploadCourseFiles,
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }

            // Verify course exists
            const course = await Courses.findById(req.params.id);
            if (!course) {
                // Clean up uploaded files
                req.files.forEach(file => {
                    fileHandler.deleteCourseFile(req.params.id, file.filename);
                });
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            // Process files and create link objects
            const uploadedFiles = req.files.map(file => ({
                filename: file.filename,
                originalName: file.originalname,
                size: file.size
            }));

            // Build link objects for all files
            const fileLinks = req.files.map(file => ({
                type: fileHandler.getFileType(file.mimetype),
                url: `/api/manage/courses/${req.params.id}/files/${file.filename}`,
                filename: file.filename,
                accessLevel: 'default',
                description: file.originalname
            }));
            
            const currentLinks = course.links || [];
            const newLinks = [...currentLinks, ...fileLinks];

            await Courses.findByIdAndUpdate(
                { _id: req.params.id },
                { $set: { links: newLinks } }
            );

            res.status(200).json({
                success: true,
                message: `${req.files.length} files uploaded successfully`,
                data: {
                    courseId: course._id,
                    files: uploadedFiles,
                    links: newLinks
                }
            });

        } catch (e) {
            // Clean up on error
            if (req.files && req.params.id) {
                req.files.forEach(file => {
                    fileHandler.deleteCourseFile(req.params.id, file.filename);
                });
            }
            errorHandler(res, 500, e);
        }
    },
    fileHandler.handleUploadError
];

/**
 * PUT - Update/replace specific course file
 * PUT /api/courses/:id/files/:filename
 * Contains multer middleware + controller logic
 * 
 * Route setup (just reference the function):
 * router.put('/:id/files/:filename', courses.updateCourseFile);
 */
module.exports.updateCourseFile = [
    fileHandler.uploadCourseFile,
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Verify course exists
            const course = await Courses.findById(req.params.id);
            if (!course) {
                // Clean up uploaded file
                fileHandler.deleteCourseFile(req.params.id, req.file.filename);
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }

            // Delete old file if it exists (different from new filename)
            const oldFilename = req.params.filename;
            if (oldFilename && oldFilename !== req.file.filename) {
                fileHandler.deleteCourseFile(req.params.id, oldFilename);
            }

            res.status(200).json({
                success: true,
                message: 'File updated successfully',
                data: {
                    courseId: course._id,
                    oldFilename: oldFilename,
                    newFilename: req.file.filename,
                    originalName: req.file.originalname,
                    size: req.file.size
                }
            });

        } catch (e) {
            // Clean up on error
            if (req.file && req.params.id) {
                fileHandler.deleteCourseFile(req.params.id, req.file.filename);
            }
            errorHandler(res, 500, e);
        }
    },
    fileHandler.handleUploadError
];

/**
 * DELETE - Delete specific course file
 * DELETE /api/courses/:id/files/:filename
 * 
 * Route setup:
 * router.delete('/:id/files/:filename', courses.deleteCourseFile);
 */
module.exports.deleteCourseFile = async (req, res) => {
    try {
        // Verify course exists
        const course = await Courses.findById(req.params.id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const filename = req.params.filename;
        const deleted = fileHandler.deleteCourseFile(req.params.id, filename);

        if (deleted) {
            // Remove file link from links array (filter by filename or URL)
            const updatedLinks = (course.links || []).filter(link => {
                if (typeof link === 'string') {
                    // For backward compatibility with old string-based links
                    return !link.includes(filename);
                } else if (link && link.filename) {
                    // For new object-based links
                    return link.filename !== filename;
                }
                return true;
            });

            await Courses.findByIdAndUpdate(
                { _id: req.params.id },
                { $set: { links: updatedLinks } }
            );

            res.status(200).json({
                success: true,
                message: 'File deleted successfully',
                data: {
                    courseId: course._id,
                    filename: filename
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

    } catch (e) {
        errorHandler(res, 500, e);
    }
};

/**
 * DELETE - Delete all course files
 * DELETE /api/courses/:id/files
 * 
 * Route setup:
 * router.delete('/:id/files', courses.deleteAllCourseFiles);
 */
module.exports.deleteAllCourseFiles = async (req, res) => {
    try {
        // Verify course exists
        const course = await Courses.findById(req.params.id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const deleted = fileHandler.deleteCourseDirectory(req.params.id);

        if (deleted) {
            // Clear all links when deleting all files
            await Courses.findByIdAndUpdate(
                { _id: req.params.id },
                { $set: { links: [] } }
            );

            res.status(200).json({
                success: true,
                message: 'All course files deleted successfully',
                data: { courseId: course._id }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'No files found to delete'
            });
        }

    } catch (e) {
        errorHandler(res, 500, e);
    }
};