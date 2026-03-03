const express = require('express');
const passport = require('passport');
const router = express.Router();
const authRouter = require('./auth');
const usersRouter = require('./users');
const coursesRouter = require('./courses');
const filesRouter = require('./files');
const formRouter = require('./forms');
const manageRouter = require('./manage');
const utilsRouter = require('./utils')
const levelsRouter = require('./levels');
const directionsRouter = require('./directions');

const utils = require('../utils/utils');


router.use('/auth', authRouter)
router.use('/files', filesRouter)
router.use('/forms', formRouter)
router.use('/manage', passport.authenticate('jwt', { session: false }), utils.validate('manage'), manageRouter)
router.use('/users', passport.authenticate('jwt', { session: false }), usersRouter)
router.use('/courses', coursesRouter)
router.use('/levels', levelsRouter)
router.use('/directions', directionsRouter)

router.get('/db/connect', utils.validate('admin'), (req, res) => {
    DB.open(config.DB_URL, { dbName: "P_01" })
    res.status(200).json({ res: 'Creating connection' })
})
router.get('/db/drop', utils.validate('admin'), (req, res) => {
    DB.close();
    res.status(200).json({ res: 'Dropping connection' })
})

router.use('/utils', passport.authenticate('jwt', { session: false }), utils.validate('manage'), utilsRouter)
module.exports = router