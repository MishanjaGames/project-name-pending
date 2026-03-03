const router = require('express').Router();
const passport = require('passport');
const controller = require('../controllers/files');
const { validate } = require('../utils/utils');
const { registry } = require('../utils/fileHandler');

// ============================================================================
// USER PROFILE PICTURES - Public GET, Protected DELETE
// ============================================================================

// ─── Auth middleware placeholders ─────────────────────────────────────────────
// Replace these with your actual middleware.
const verifyToken  = (req, res, next) => next(); // TODO: replace

// ─── Per-request file-handler middleware ──────────────────────────────────────
// Resolves (or lazily creates) the EntityFileHandler for the requested formType
// and attaches it to `req` so route handlers can reference it if needed.
const attachHandler = (req, res, next) => {
    try {
        req.formHandler = registry.getOrCreate(`forms/${req.params.formType}`);
        next();
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/files/users/:userId/:filename
 * Download user profile picture
 * Public access (no authentication required)
 */
router.get('/users/:userId/:filename', controller.getUserProfilePicture);

/**
 * DELETE /api/files/users/:userId/:filename
 * Delete user profile picture
 * Requires: 'manage' or higher access level
 */
router.delete('/users/:userId/:filename', 
    passport.authenticate('jwt', { session: false }), 
    validate('manage'), 
    controller.deleteUserProfilePicture
);

/**
 * GET /api/files/users/:userId/list
 * List all files in user directory
 * Public access
 */
router.get('/users/:userId/list', controller.listUserFiles);

// ============================================================================
// COURSE FILES - Public GET, Protected DELETE
// ============================================================================

/**
 * GET /api/files/courses/:courseId/:filename
 * Download course file (image, video, document, etc.)
 * Public access (no authentication required)
 * Query params:
 *   ?download=true    - Force download as attachment instead of inline
 */
router.get('/courses/:courseId/:filename', controller.getCourseFile);

/**
 * DELETE /api/files/courses/:courseId/:filename
 * Delete specific course file
 * Requires: 'create' or higher access level
 */
router.delete('/courses/:courseId/:filename', 
    passport.authenticate('jwt', { session: false }), 
    validate('create'), 
    controller.deleteCourseFile
);

/**
 * GET /api/files/courses/:courseId/list
 * List all files in course directory
 * Public access
 */
router.get('/courses/:courseId/list', controller.listCourseFiles);

// ============================================================================
// FILE SERVING — stream files to the browser
// ============================================================================

/**
 * GET /api/forms/files/:formType/:id/:subdir/:filename
 * Serves a file from a skill sub-directory (e.g. skill-0/).
 */
router.get(
    '/forms/:formType/:id/:subdir/:filename',
    verifyToken,
    attachHandler,
    (req, res) => {
        const { id, subdir, filename } = req.params;
        const filePath = req.formHandler.getFilePath(id, filename, subdir);
        if (!filePath) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
        res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.sendFile(filePath);
    },
);

/**
 * GET /api/files/forms/:formType/:id/:filename
 * Serves a file from the submission root folder (no sub-directory).
 */
router.get(
    '/forms/:formType/:id/:filename',
    verifyToken,
    attachHandler,
    (req, res) => req.formHandler.sendFileHandler()(req, res),
);

module.exports = router;
