const fs = require('fs');
const path = require('path');
const fileHandler = require('../utils/fileHandler');
const errorHandler = require('../utils/errorHandler');

// ============================================================================
// USER PROFILE PICTURES
// ============================================================================

/**
 * GET - Download user profile picture
 * GET /api/files/users/:userId/:filename
 */
module.exports.getUserProfilePicture = (req, res) => {
    try {
        const { userId, filename } = req.params;

        if (!userId || !filename) {
            return res.status(400).json({
                success: false,
                message: 'User ID and filename are required'
            });
        }

        const filePath = path.join(fileHandler.paths.userProfiles, userId, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Profile picture not found'
            });
        }

        // Set cache headers for images
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.sendFile(filePath);

    } catch (error) {
        console.error('Error sending profile picture:', error);
        errorHandler(res, 500, error);
    }
};

/**
 * DELETE - Delete user profile picture
 * DELETE /api/files/users/:userId/:filename
 * Requires authentication
 */
module.exports.deleteUserProfilePicture = (req, res) => {
    try {
        const { userId, filename } = req.params;

        if (!userId || !filename) {
            return res.status(400).json({
                success: false,
                message: 'User ID and filename are required'
            });
        }

        const filePath = path.join(fileHandler.paths.userProfiles, userId, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        fs.unlinkSync(filePath);

        res.status(200).json({
            success: true,
            message: 'File deleted successfully',
            data: { userId, filename }
        });

    } catch (error) {
        console.error('Error deleting profile picture:', error);
        errorHandler(res, 500, error);
    }
};

// ============================================================================
// COURSE FILES
// ============================================================================

/**
 * GET - Download course file
 * GET /api/files/courses/:courseId/:filename
 */
module.exports.getCourseFile = (req, res) => {
    try {
        const { courseId, filename } = req.params;

        if (!courseId || !filename) {
            return res.status(400).json({
                success: false,
                message: 'Course ID and filename are required'
            });
        }

        const filePath = path.join(fileHandler.paths.courseFiles, courseId, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Check if download or inline display
        const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
        res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');

        res.sendFile(filePath);

    } catch (error) {
        console.error('Error sending course file:', error);
        errorHandler(res, 500, error);
    }
};

/**
 * DELETE - Delete course file
 * DELETE /api/files/courses/:courseId/:filename
 * Requires authentication
 */
module.exports.deleteCourseFile = (req, res) => {
    try {
        const { courseId, filename } = req.params;

        if (!courseId || !filename) {
            return res.status(400).json({
                success: false,
                message: 'Course ID and filename are required'
            });
        }

        const filePath = path.join(fileHandler.paths.courseFiles, courseId, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        fs.unlinkSync(filePath);

        res.status(200).json({
            success: true,
            message: 'File deleted successfully',
            data: { courseId, filename }
        });

    } catch (error) {
        console.error('Error deleting course file:', error);
        errorHandler(res, 500, error);
    }
};

/**
 * GET - List all files in course directory
 * GET /api/files/courses/:courseId/list
 */
module.exports.listCourseFiles = (req, res) => {
    try {
        const { courseId } = req.params;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'Course ID is required'
            });
        }

        const courseDir = path.join(fileHandler.paths.courseFiles, courseId);

        if (!fs.existsSync(courseDir)) {
            return res.status(200).json({
                success: true,
                courseId,
                count: 0,
                files: []
            });
        }

        const files = fs.readdirSync(courseDir).map(filename => {
            const filePath = path.join(courseDir, filename);
            const stats = fs.statSync(filePath);
            return {
                filename,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                url: `/api/files/courses/${courseId}/${filename}`
            };
        });

        res.status(200).json({
            success: true,
            courseId,
            count: files.length,
            files
        });

    } catch (error) {
        console.error('Error listing course files:', error);
        errorHandler(res, 500, error);
    }
};

/**
 * GET - List all files in user profile directory
 * GET /api/files/users/:userId/list
 */
module.exports.listUserFiles = (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const userDir = path.join(fileHandler.paths.userProfiles, userId);

        if (!fs.existsSync(userDir)) {
            return res.status(200).json({
                success: true,
                userId,
                count: 0,
                files: []
            });
        }

        const files = fs.readdirSync(userDir).map(filename => {
            const filePath = path.join(userDir, filename);
            const stats = fs.statSync(filePath);
            return {
                filename,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                url: `/api/files/users/${userId}/${filename}`
            };
        });

        res.status(200).json({
            success: true,
            userId,
            count: files.length,
            files
        });

    } catch (error) {
        console.error('Error listing user files:', error);
        errorHandler(res, 500, error);
    }
};
