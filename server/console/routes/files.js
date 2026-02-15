const router = require('express').Router();
const passport = require('passport');
const controller = require('../controllers/files');
const { validate } = require('../utils/utils');

// ============================================================================
// USER PROFILE PICTURES - Public GET, Protected DELETE
// ============================================================================

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

module.exports = router;
