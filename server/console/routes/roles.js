const router = require('express').Router()
const controller = require('../controllers/roles')
const passport = require('passport')
const { validate } = require('../utils/utils')

router.get('/', passport.authenticate('jwt', { session: false }), validate('manage'), controller.getAll)
router.get('/:id', passport.authenticate('jwt', { session: false }), validate('manage'), controller.getById)
router.post('/', passport.authenticate('jwt', { session: false }), validate('manage'), controller.create)
router.put('/:id', passport.authenticate('jwt', { session: false }), validate('manage'), controller.update)
router.delete('/:id', passport.authenticate('jwt', { session: false }), validate('manage'), controller.remove)

module.exports = router