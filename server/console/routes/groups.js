const router     = require('express').Router()
const passport   = require('passport')
const { validate } = require('../utils/utils')
const controller = require('../controllers/groups')

const jwtAuth  = passport.authenticate('jwt', { session: false })
const tutorVal = validate('tutor')

router.get('/',    jwtAuth, tutorVal,  controller.getBySession)
router.get('/:id', jwtAuth, jwtAuth,   controller.getById)   // members can also view
router.post('/',   jwtAuth, tutorVal,  controller.create)
router.delete('/:id', jwtAuth, tutorVal, controller.remove)

// Member management
router.post('/:id/members',                 jwtAuth, tutorVal, controller.addMember)
router.patch('/:id/members/:userId/status', jwtAuth, tutorVal, controller.updateMemberStatus)
router.delete('/:id/members/:userId',       jwtAuth, tutorVal, controller.removeMember)

module.exports = router
