const router = require('express').Router()
const passport = require('passport')
const controller = require('../controllers/courses')
const { validate } = require('../utils/utils')

router.get('/', controller.getAll)
router.get('/:id', controller.getById)
router.post('/', passport.authenticate('jwt', { session: false }), validate('create'), controller.create)
router.patch('/:id', passport.authenticate('jwt', { session: false }), validate('create'), controller.update)
router.delete('/:id', passport.authenticate('jwt', { session: false }), validate('create'), controller.remove)

// Course file routes
// GET routes are public (needed for img/video/file display) - no auth required
router.get('/:id/files', controller.listCourseFiles)
router.get('/:id/files/:filename', controller.getCourseFile)
// POST/PUT/DELETE routes require authentication
router.post('/:id/files', passport.authenticate('jwt', { session: false }), validate('create'), controller.uploadCourseFile)
router.post('/:id/files/multiple', passport.authenticate('jwt', { session: false }), validate('create'), controller.uploadCourseFiles)
router.put('/:id/files/:filename', passport.authenticate('jwt', { session: false }), validate('create'), controller.updateCourseFile)
router.delete('/:id/files/:filename', passport.authenticate('jwt', { session: false }), validate('create'), controller.deleteCourseFile)

module.exports = router