const utils = require('../utils/utils')
const fileHandler = require('../utils/fileHandler')
const linkFilter = require('../utils/linkFilter')
const Courses = require('../models/mongo.courses')
const errorHandler = require('../utils/errorHandler')
const Users = require('../models/mongo.users');
const Roles = require('../models/mongo.roles');

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
        const base_lang  = req.body.base_lang  || 'en';
        const add_langs  = Array.isArray(req.body.add_langs) ? req.body.add_langs : [];

        // Build trans array — one entry per language (base first, then additional)
        let trans = [];
        if (Array.isArray(req.body.trans) && req.body.trans.length > 0) {
            trans = req.body.trans.map(t => ({
                title:       t.title       || '',
                description: t.description || '',
                skills:      Array.isArray(t.skills) ? t.skills : []
            }));
        } else {
            // Fallback: build a single entry from flat fields (backwards compat)
            const baseTitle = req.body.title || '';
            const defaultSkills = baseTitle
                ? [`Master the core concepts of ${baseTitle.toLowerCase()}`, 'Learn and build real-world projects']
                : [];
            trans = [{
                title:       baseTitle,
                description: req.body.description || '',
                skills:      [...defaultSkills, ...(Array.isArray(req.body.skills) ? req.body.skills : [])]
            }];
            // Pad with empty entries for each additional language
            add_langs.forEach(() => trans.push({ title: '', description: '', skills: [] }));
        }

        const course = await new Courses({
            userId:    req.body.userId,
            base_lang,
            add_langs,
            trans,
            price:     req.body.price     || 0,
            ratings:   req.body.ratings   || 0,
            followers: 0,
            level:     req.body.level,
            direction: req.body.direction,
            volumes:   [],
            links:     [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        });

        await course.save();

        res.status(201).json({
            message: 'Course created successfully',
            data: course
        });
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
            userId:    req.body.userId,
            status:    req.body.status,
            courseType:req.body.courseType,
            direction: req.body.direction,
            level:     req.body.level,
            base_lang: req.body.base_lang,
            add_langs: Array.isArray(req.body.add_langs) ? req.body.add_langs : [],
            trans:     Array.isArray(req.body.trans)
                ? req.body.trans.map(t => ({
                    title:       t.title       || '',
                    description: t.description || '',
                    skills:      Array.isArray(t.skills) ? t.skills : []
                  }))
                : [],
            ratings:   req.body.ratings,
            followers: req.body.followers,
            price:     req.body.price,
            volumes:   req.body.volumes,
            links:     req.body.links,
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
// ============================================================================
// RATING ROUTES
// ============================================================================

/**
 * GET  /api/courses/:id/rating
 * Returns the authenticated user's current rating for this course (or null).
 * Requires JWT auth.
 */
module.exports.getMyRating = async (req, res) => {
    try {
        const token = req.headers.authorization
            ? req.headers.authorization.split(' ')[1]
            : null;

        if (!token) return errorHandler(res, 401, 'Authentication required');

        const requester = await utils.parseToken(token);
        if (!requester) return errorHandler(res, 401, 'Invalid token');

        const course = await Courses.findById(req.params.id);
        if (!course) return errorHandler(res, 404, 'Course not found');

        const entry = (course.ratingsList || []).find(
            r => r.userId.toString() === requester._id.toString()
        );

        res.status(200).json({
            data: {
                courseId:   course._id,
                avgRating:  course.ratings || 0,
                totalVotes: (course.ratingsList || []).length,
                myRating:   entry ? entry.value : null
            }
        });
    } catch (e) {
        errorHandler(res, 500, e);
    }
};

/**
 * POST /api/courses/:id/rating
 * Submit or update the authenticated user's rating for this course.
 * Only users who own the course (it appears in user.courses[]) may rate it.
 *
 * Body: { value: 1|2|3|4|5 }
 */
module.exports.rateById = async (req, res) => {
    try {
        const token = req.headers.authorization
            ? req.headers.authorization.split(' ')[1]
            : null;

        if (!token) return errorHandler(res, 401, 'Authentication required');

        const requester = await utils.parseToken(token);
        if (!requester) return errorHandler(res, 401, 'Invalid token');

        // Validate rating value
        const value = parseInt(req.body.value, 10);
        if (isNaN(value) || value < 1 || value > 5) {
            return errorHandler(res, 400, 'Rating value must be an integer between 1 and 5');
        }

        const course = await Courses.findById(req.params.id);
        if (!course) return errorHandler(res, 404, 'Course not found');

        // Check that the user has purchased / owns this course
        const UsersModel = require('../models/mongo.users');
        const user  = await UsersModel.findById(requester._id);
        if (!user)  return errorHandler(res, 404, 'User not found');

        const hasBought = (user.courses || []).some(
            c => c._id && c._id.toString() === course._id.toString()
        );
        if (!hasBought) {
            return errorHandler(res, 403, 'You must own this course to rate it');
        }

        // Upsert: update existing entry or push a new one
        const ratingsList = course.ratingsList || [];
        const existingIdx = ratingsList.findIndex(
            r => r.userId.toString() === requester._id.toString()
        );

        if (existingIdx >= 0) {
            ratingsList[existingIdx].value     = value;
            ratingsList[existingIdx].createdAt = new Date();
        } else {
            ratingsList.push({
                userId:    requester._id,
                value,
                createdAt: new Date()
            });
        }

        // Recalculate average (round to 2 dp)
        const avgRating = parseFloat(
            (ratingsList.reduce((sum, r) => sum + r.value, 0) / ratingsList.length).toFixed(2)
        );

        await Courses.findByIdAndUpdate(
            { _id: course._id },
            { $set: { ratingsList, ratings: avgRating } }
        );

        res.status(200).json({
            message: existingIdx >= 0 ? 'Rating updated' : 'Rating submitted',
            data: {
                courseId:   course._id,
                myRating:   value,
                avgRating,
                totalVotes: ratingsList.length
            }
        });
    } catch (e) {
        errorHandler(res, 500, e);
    }
};

// ============================================================================
// COMMENT ROUTES
// ============================================================================

/**
 * GET /api/courses/:id/comments
 * Public. Returns all comments for a course with resolved nicknames.
 * Response shape per comment: { _id, userId, nickname, date, text }
 */
module.exports.getComments = async (req, res) => {
    try {
        const course = await Courses.findById(req.params.id);
        if (!course) return errorHandler(res, 404, 'Course not found');

        const comments = course.comments || [];

        // Resolve nicknames in bulk (one query for all unique authors)
        const uniqueIds = [...new Set(comments.map(c => c.userId.toString()))];
        const users = await Users.find({ _id: { $in: uniqueIds } }).select('_id nickname');
        const nicknameMap = {};
        users.forEach(u => { nicknameMap[u._id.toString()] = u.nickname; });

        const enriched = comments.map(c => ({
            _id:      c._id,
            userId:   c.userId,
            nickname: nicknameMap[c.userId.toString()] || 'Unknown user',
            date:     c.date,
            text:     c.text
        }));

        res.status(200).json({ data: enriched });
    } catch (e) {
        errorHandler(res, 500, e);
    }
};

/**
 * POST /api/courses/:id/comments
 * JWT required. User must own (have bought) the course or be its creator.
 * Body: { text: string }
 */
module.exports.addComment = async (req, res) => {
    try {
        const token = req.headers.authorization
            ? req.headers.authorization.split(' ')[1]
            : null;
        if (!token) return errorHandler(res, 401, 'Authentication required');

        const requester = await utils.parseToken(token);
        if (!requester) return errorHandler(res, 401, 'Invalid token');

        const text = (req.body.text || '').trim();
        if (!text) return errorHandler(res, 400, 'Comment text is required');
        if (text.length > 4000) return errorHandler(res, 400, 'Comment must be 4000 characters or fewer');

        const course = await Courses.findById(req.params.id);
        if (!course) return errorHandler(res, 404, 'Course not found');

        // Allow: course creator OR anyone who owns the course
        const isCreator = course.userId.toString() === requester._id.toString();
        const hasBought = (requester.courses || []).some(
            c => c._id && c._id.toString() === course._id.toString()
        );
        if (!isCreator && !hasBought) {
            return errorHandler(res, 403, 'You must own this course to post a comment');
        }

        const comment = {
            userId: requester._id,
            date:   new Date(),
            text
        };

        const updated = await Courses.findByIdAndUpdate(
            { _id: course._id },
            { $push: { comments: comment } },
            { new: true }
        );

        // Return the newly created comment with nickname resolved
        const newComment = updated.comments[updated.comments.length - 1];
        res.status(201).json({
            message: 'Comment added',
            data: {
                _id:      newComment._id,
                userId:   newComment.userId,
                nickname: requester.nickname,
                date:     newComment.date,
                text:     newComment.text
            }
        });
    } catch (e) {
        errorHandler(res, 500, e);
    }
};

/**
 * DELETE /api/courses/:id/comments/:commentId
 * JWT required. Only the comment author or a user with manage+ role may delete.
 */
module.exports.deleteComment = async (req, res) => {
    try {
        const token = req.headers.authorization
            ? req.headers.authorization.split(' ')[1]
            : null;
        if (!token) return errorHandler(res, 401, 'Authentication required');

        const requester = await utils.parseToken(token);
        if (!requester) return errorHandler(res, 401, 'Invalid token');

        const course = await Courses.findById(req.params.id);
        if (!course) return errorHandler(res, 404, 'Course not found');

        const comment = (course.comments || []).find(
            c => c._id.toString() === req.params.commentId
        );
        if (!comment) return errorHandler(res, 404, 'Comment not found');

        // Check permissions: author or manage+
        const isAuthor = comment.userId.toString() === requester._id.toString();
        if (!isAuthor) {
            const role = await Roles.findById(requester.role);
            const level = role?.accessLevel || 'default';
            const canManage = ['manage', 'admin', 'root'].includes(level);
            if (!canManage) {
                return errorHandler(res, 403, 'You can only delete your own comments');
            }
        }

        await Courses.findByIdAndUpdate(
            { _id: course._id },
            { $pull: { comments: { _id: comment._id } } }
        );

        res.status(200).json({ message: 'Comment deleted', data: { _id: comment._id } });
    } catch (e) {
        errorHandler(res, 500, e);
    }
};
