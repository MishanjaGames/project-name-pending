const router = require('express').Router()
const controller = require('../controllers/users')
const passport = require('passport')

router.get('/c', passport.authenticate('jwt', {session: false}), controller.getCurrent)
router.get('/', controller.getAll)
router.get('/:id', controller.getById)
router.post('/', passport.authenticate('jwt', {session: false}), controller.create)
router.delete('/:id', passport.authenticate('jwt', {session: false}), controller.remove)
router.patch('/:id', passport.authenticate('jwt', {session: false}), controller.update)

module.exports = router