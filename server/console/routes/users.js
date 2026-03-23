const router = require('express').Router()
const controller = require('../controllers/users')
const passport = require('passport')
const { validate } = require('../utils/utils')

router.get('/c', passport.authenticate('jwt', {session: false}), controller.getCurrent)
router.get('/', controller.getAll)
router.get('/:id', controller.getById)
router.post('/', passport.authenticate('jwt', {session: false}), validate('admin'), controller.create)
router.delete('/:id', passport.authenticate('jwt', {session: false}), validate('admin'), controller.remove)
router.patch('/:id', passport.authenticate('jwt', {session: false}), validate('admin'), controller.update)

router.get('/:id/profile-picture/:filename', controller.getProfilePicture)
router.post('/:id/profile-picture', passport.authenticate('jwt', {session: false}), validate('manage'), controller.uploadProfilePicture)
router.put('/:id/profile-picture', passport.authenticate('jwt', {session: false}), validate('manage'), controller.updateProfilePicture)
router.delete('/:id/profile-picture', passport.authenticate('jwt', {session: false}), validate('manage'), controller.deleteProfilePicture)

router.post('',()=>{})

module.exports = router