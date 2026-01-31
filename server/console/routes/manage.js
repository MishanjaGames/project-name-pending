const router = require('express').Router()
const userRouter = require('./users')
const coursesRouter = require('./courses')
const roleRouter = require('./roles')
const passport = require('passport')
const { validate } = require('../utils/utils')

router.use('/courses', passport.authenticate('jwt', {session: false}), validate('create'), coursesRouter)
router.use('/users', passport.authenticate('jwt', {session: false}), validate('manage'), userRouter)
router.use('/roles', passport.authenticate('jwt', {session: false}), validate('manage'), roleRouter)

module.exports = router