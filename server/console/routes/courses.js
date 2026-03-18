const router = require('express').Router()
const passport = require('passport')
const controller = require('../controllers/courses')
const { validate } = require('../utils/utils')

router.get('/', controller.getAll)
router.get('/:id', controller.getById)
router.post('/', passport.authenticate('jwt', { session: false }), validate('create'), controller.create)
router.put('/:id', passport.authenticate('jwt', { session: false }), validate('create'), controller.update)
router.patch('/:id', passport.authenticate('jwt', { session: false }), validate('create'), controller.update)
router.delete('/:id', passport.authenticate('jwt', { session: false }), validate('create'), controller.remove)

// Rating routes — available to authenticated users who own the course
router.get('/:id/rating', passport.authenticate('jwt', { session: false }), controller.getMyRating)
router.post('/:id/rating', passport.authenticate('jwt', { session: false }), controller.rateById)

// Comment routes
router.get('/:id/comments', controller.getComments)
router.post('/:id/comments', passport.authenticate('jwt', { session: false }), controller.addComment)
router.delete('/:id/comments/:commentId', passport.authenticate('jwt', { session: false }), controller.deleteComment)

router.get('/:id/files', controller.listCourseFiles)
router.get('/:id/files/:filename', controller.getCourseFile)
router.post('/:id/files', passport.authenticate('jwt', { session: false }), validate('create'), controller.uploadCourseFile)
router.post('/:id/files/multiple', passport.authenticate('jwt', { session: false }), validate('create'), controller.uploadCourseFiles)
router.put('/:id/files/:filename', passport.authenticate('jwt', { session: false }), validate('create'), controller.updateCourseFile)
router.delete('/:id/files/:filename', passport.authenticate('jwt', { session: false }), validate('create'), controller.deleteCourseFile)

module.exports = router