const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const fileHandler = require('../../utils/fileHandler');
const errorHandler = require('../../utils/errorHandler');

// ============================================================================
// AUTHENTICATED FILE MANAGEMENT (under /api/manage/files)
// ============================================================================

/**
 * GET /api/manage/files/users/:userId/list
 * List all files in user directory (requires authentication)
 */
router.get('/users/:userId/list', (req, res) => {
    try {
        const userId = req.params.userId;
        const userDir = path.join(fileHandler.paths.userProfiles, userId);
        
        if (!fs.existsSync(userDir)) {
            return res.status(200).json({
                success: true,
                userId: userId,
                files: []
            });
        }
        
        const files = fs.readdirSync(userDir).map(filename => {
            const filePath = path.join(userDir, filename);
            const stats = fs.statSync(filePath);
            return {
                filename: filename,
                size: stats.size,
                sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
                created: stats.birthtime,
                modified: stats.mtime,
                url: `/api/files/users/${userId}/${filename}`
            };
        });
        
        res.status(200).json({
            success: true,
            userId: userId,
            count: files.length,
            files: files
        });
    } catch (error) {
        errorHandler(res, 500, error);
    }
});

/**
 * DELETE /api/manage/files/users/:userId/:filename
 * Delete specific file from user directory
 */
router.delete('/users/:userId/:filename', (req, res) => {
    try {
        const { userId, filename } = req.params;
        const filePath = path.join(fileHandler.paths.userProfiles, userId, filename);
        
        // Security: prevent directory traversal
        const realPath = path.resolve(filePath);
        const basePath = path.resolve(fileHandler.paths.userProfiles, userId);
        
        if (!realPath.startsWith(basePath)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
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
        errorHandler(res, 500, error);
    }
});

/**
 * GET /api/manage/files/courses/:courseId/list
 * List all files in course directory (requires authentication)
 */
router.get('/courses/:courseId/list', (req, res) => {
    try {
        const courseId = req.params.courseId;
        const courseDir = path.join(fileHandler.paths.courseFiles, courseId);
        
        if (!fs.existsSync(courseDir)) {
            return res.status(200).json({
                success: true,
                courseId: courseId,
                files: []
            });
        }
        
        const files = fs.readdirSync(courseDir).map(filename => {
            const filePath = path.join(courseDir, filename);
            const stats = fs.statSync(filePath);
            const isThumbnail = filename.startsWith('thumbnail');
            
            return {
                filename: filename,
                size: stats.size,
                sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
                created: stats.birthtime,
                modified: stats.mtime,
                isThumbnail: isThumbnail,
                type: isThumbnail ? 'thumbnail' : 'file',
                url: `/api/files/courses/${courseId}/${filename}`
            };
        });
        
        res.status(200).json({
            success: true,
            courseId: courseId,
            count: files.length,
            files: files
        });
    } catch (error) {
        errorHandler(res, 500, error);
    }
});

/**
 * DELETE /api/manage/files/courses/:courseId/:filename
 * Delete specific file from course directory
 */
router.delete('/courses/:courseId/:filename', (req, res) => {
    try {
        const { courseId, filename } = req.params;
        const filePath = path.join(fileHandler.paths.courseFiles, courseId, filename);
        
        // Security: prevent directory traversal
        const realPath = path.resolve(filePath);
        const basePath = path.resolve(fileHandler.paths.courseFiles, courseId);
        
        if (!realPath.startsWith(basePath)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
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
        errorHandler(res, 500, error);
    }
});

module.exports = router;
