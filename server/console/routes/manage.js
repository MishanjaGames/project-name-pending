const router = require('express').Router()
const userRouter = require('./users')
const coursesRouter = require('./courses')
const passport = require('passport')
const { validate } = require('../utils/utils')

router.use('/users', passport.authenticate('jwt', {session: false}), validate('manage'), userRouter)
router.use('/courses', passport.authenticate('jwt', {session: false}), validate('create'), coursesRouter)

module.exports = router