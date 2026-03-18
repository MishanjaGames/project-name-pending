const router     = require('express').Router()
const passport   = require('passport')
const { validate } = require('../utils/utils')
const controller = require('../controllers/promos')

const jwtAuth = passport.authenticate('jwt', { session: false })

// Any authenticated user — validate/apply promos during purchase
router.post('/validate', jwtAuth, controller.validate)
router.post('/apply',    jwtAuth, controller.apply)

// create+ — creators and above can list/create/toggle/delete their own promos
router.get('/',          jwtAuth, validate('create'), controller.listAll)
router.post('/',         jwtAuth, validate('create'), controller.create)
router.patch('/:id/toggle', jwtAuth, validate('create'), controller.toggle)
router.delete('/:id',    jwtAuth, validate('create'), controller.deletePromo)

module.exports = router
