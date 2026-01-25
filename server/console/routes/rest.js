const express = require('express');
const passport = require('passport');
const router = express.Router();
const authRouter = require('./auth');
const usersRouter = require('./users');
const rolesRouter = require('./roles');
const coursesRouter = require('./courses');
const manageRouter = require('./manage');
const { validate } = require('../utils/utils');

router.use('/auth', authRouter)
router.use('/manage', validate('manage'), manageRouter)
router.use('/users', passport.authenticate('jwt', {session: false}), usersRouter)
//router.use('/courses', passport.authenticate('jwt', {session: false}), coursesRouter)

module.exports = router