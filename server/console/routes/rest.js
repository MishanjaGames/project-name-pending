const express = require('express');
const passport = require('passport');
const router = express.Router();
const authRouter = require('./auth');
const usersRouter = require('./users');
const rolesRouter = require('./roles');
const coursesRouter = require('./courses');
const manageRouter = require('./manage');
const utils = require('../utils/utils');

router.get('/status', utils.getStatusInfo)
router.use('/auth', authRouter)
router.use('/manage', passport.authenticate('jwt', { session: false }), utils.validate('manage'), manageRouter)
router.use('/users', passport.authenticate('jwt', { session: false }), usersRouter)
router.use('/courses', coursesRouter)
module.exports = router