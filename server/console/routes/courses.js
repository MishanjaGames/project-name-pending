const router = require('express').Router()
const passport = require('passport')
const controller = require('../controllers/courses')
const { validate } = require('../utils/utils')

router.get('/', controller.getAll)
router.get('/:id', controller.getById)
router.post('/', passport.authenticate('jwt', { session: false }), validate('create'), controller.create)
router.put('/:id', passport.authenticate('jwt', { session: false }), validate('create'), controller.update)
router.delete('/:id', passport.authenticate('jwt', { session: false }), validate('create'), controller.remove)

module.exports = router