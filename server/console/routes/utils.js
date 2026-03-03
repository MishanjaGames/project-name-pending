const router = require("express").Router();
const utils = require('../controllers/utils');
const { readLogs, getLogFiles } = require('../utils/logger');
const passport = require('passport')

router.get('/status', utils.getStatusInfo)

/**
 * GET /api/utils/logs - Get logs from today or specified date
 * Query params: date (YYYY-MM-DD or 'today'), lines (number of last lines to fetch)
 */
router.get('/logs', passport.authenticate('jwt', {session: false}), (req, res) => {
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

/**
 * GET /api/utils/logs/files - Get list of available log files
 */
router.get('/logs/files', passport.authenticate('jwt', {session: false}), (req, res) => {
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