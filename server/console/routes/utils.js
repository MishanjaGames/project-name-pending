const router = require("express").Router();
const utilC = require('../controllers/utils');
const utils = require('../utils/utils');
const { readLogs, getLogFiles } = require('../utils/logger');
const passport = require('passport')
const jwt = require('jsonwebtoken')
const config = require('../config/config')

router.get('/status', passport.authenticate('jwt', { session: false }), utils.validate('manage'), utilC.getStatusInfo)

/**
 * GET /api/utils/logs - Get logs from today or specified date
 * Query params: date (YYYY-MM-DD or 'today'), lines (number of last lines to fetch)
 */
router.get('/logs', passport.authenticate('jwt', { session: false }), utils.validate('manage'), (req, res) => {
    try {
        const { date = 'today', lines = null } = req.query;
        const parsedLines = lines ? parseInt(lines) : null;

        const logs = readLogs(date, parsedLines);

        res.json({
            success: true,
            date,
            logs
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching logs'
        });
    }
});

router.get('/logs/stream', (req, res) => {
    const token = req.query['token'] || '';
    console.log('>'+ token)
    const tokenValue = token ? token.split(' ')[1] : token;
    if (!token || !tokenValue) return res.status(401).end();

    // verify however you normally do it
    try {
        const decoded = jwt.verify(tokenValue, config.JWT_SECRET);
        console.log(decoded.role)
    } catch (e) {
        return res.status(401).json(e.message).end();
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { date = 'today', lines = null } = req.query;
    const parsedLines = lines ? parseInt(lines) : null;

    const logs = readLogs(date, parsedLines);

    const send = data => res.write(`${JSON.stringify(data)}`);
    const interval = setInterval(() => send({success: true, date, logs}), 1000);
    req.on('close', () => clearInterval(interval));
});

/**
 * GET /api/utils/logs/files - Get list of available log files
 */
router.get('/logs/files', passport.authenticate('jwt', { session: false }), utils.validate('manage'), (req, res) => {
    try {
        const files = getLogFiles();

        res.json({
            success: true,
            files
        });
    } catch (error) {
        console.error('Error fetching log files:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching log files'
        });
    }
});

module.exports = router