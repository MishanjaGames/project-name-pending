const router     = require('express').Router()
const passport   = require('passport')
const { validate } = require('../utils/utils')
const controller = require('../controllers/keys')

const jwtAuth = passport.authenticate('jwt', { session: false })

// ── Any authenticated user ────────────────────────────────────────────────────
router.post('/redeem', jwtAuth, controller.redeem)
router.get('/mine',   jwtAuth, controller.getMyKeys)

// ── manage+ only ──────────────────────────────────────────────────────────────
router.get('/',    jwtAuth, validate('manage'), controller.listAll)
router.post('/',   jwtAuth, validate('manage'), controller.generate)
router.delete('/:id', jwtAuth, validate('manage'), controller.deleteKey)

module.exports = router
