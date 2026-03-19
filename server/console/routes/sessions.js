const router     = require('express').Router()
const passport   = require('passport')
const { validate } = require('../utils/utils')
const controller = require('../controllers/sessions')
const multer     = require('multer')

const jwtAuth  = passport.authenticate('jwt', { session: false })
const tutorVal = validate('tutor')   // tutor+
const manageVal = validate('manage') // manage+

// List / get
router.get('/',    jwtAuth, tutorVal,  controller.getAll)
router.get('/:id', jwtAuth, tutorVal,  controller.getById)

// Create / update / delete
router.post('/',              jwtAuth, tutorVal,  controller.create)
router.patch('/:id',          jwtAuth, tutorVal,  controller.update)
router.delete('/:id',         jwtAuth, tutorVal,  controller.remove)

// Special actions
router.post('/:id/override-rank',  jwtAuth, tutorVal,  controller.overrideRank)
router.post('/:id/private-copy',   jwtAuth, tutorVal,  controller.createPrivateCopy)

module.exports = router
