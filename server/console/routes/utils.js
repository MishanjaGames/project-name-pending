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

// ── SSE helpers ──────────────────────────────────────────────────────────────
function sseHeaders(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering if present
    res.flushHeaders();
}

function sseWrite(res, data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sseVerifyToken(token) {
    if (!token) return null;
    const tokenValue = token.includes(' ') ? token.split(' ')[1] : token;
    try {
        return jwt.verify(tokenValue, config.JWT_SECRET);
    } catch (e) {
        return null;
    }
}

/**
 * GET /api/utils/status/stream
 * SSE — pushes server + DB status every 5 seconds.
 * Auth: ?token=Bearer%20<jwt>  (query param, same as logs/stream)
 */
router.get('/status/stream', async (req, res) => {
    const decoded = sseVerifyToken(req.query.token || '');
    if (!decoded) return res.status(401).end();

    sseHeaders(res);

    const os = require('os');
    const Course = require('../models/mongo.courses');
    const User   = require('../models/mongo.users');

    const sendStatus = async () => {
        try {
            let userCount = 0, courseCount = 0, sessionCount = 0,
                activeSessionCount = 0, groupCount = 0, pendingSubmissionCount = 0,
                assignmentCount = 0, upcomingMeetings = [];

            if (global.db.status === 'connected') {
                const Session    = require('../models/mongo.sessions');
                const Group      = require('../models/mongo.groups');
                const Assignment = require('../models/mongo.assignments');

                const now  = new Date();
                const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // next 7 days

                [userCount, courseCount, sessionCount, activeSessionCount, groupCount, assignmentCount] =
                    await Promise.all([
                        User.countDocuments({}),
                        Course.countDocuments({}),
                        Session.countDocuments({}),
                        Session.countDocuments({ status: 'active' }),
                        Group.countDocuments({}),
                        Assignment.countDocuments({})
                    ]);

                // Count pending submissions across all groups
                const groupsWithSubs = await Group.find(
                    { 'assignments.submissions.status': 'pending' },
                    { 'assignments.submissions.$': 1 }
                ).lean();
                groupsWithSubs.forEach(g => {
                    (g.assignments || []).forEach(a => {
                        pendingSubmissionCount += (a.submissions || []).filter(s => s.status === 'pending').length;
                    });
                });

                // Upcoming meetings in the next 7 days
                const sessionsWithSchedule = await Session.find(
                    { status: 'active', 'schedule.datetime': { $gte: now, $lte: soon } },
                    { schedule: 1, courseId: 1 }
                ).populate('courseId', 'trans').lean();

                sessionsWithSchedule.forEach(s => {
                    (s.schedule || []).forEach(m => {
                        const d = new Date(m.datetime);
                        if (d >= now && d <= soon) {
                            upcomingMeetings.push({
                                title:       m.title,
                                datetime:    m.datetime,
                                durationMin: m.durationMin,
                                meetingLink: m.meetingLink,
                                courseTitle: s.courseId?.trans?.[0]?.title || '—'
                            });
                        }
                    });
                });
                upcomingMeetings.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
                upcomingMeetings = upcomingMeetings.slice(0, 5); // top 5
            }

            sseWrite(res, {
                status:                global.server.status,
                db_status:             global.db.status,
                uptime:                os.uptime(),
                launchTime:            global.launchTime,
                userCount,
                courseCount,
                sessionCount,
                activeSessionCount,
                groupCount,
                assignmentCount,
                pendingSubmissionCount,
                upcomingMeetings
            });
        } catch (e) {
            sseWrite(res, { error: e.message });
        }
    };

    // Send immediately, then every 5 s
    sendStatus();
    const interval = setInterval(sendStatus, 5000);
    req.on('close', () => clearInterval(interval));
});

/**
 * GET /api/utils/logs/stream
 * SSE — pushes latest log lines every 2 seconds.
 * Auth: ?token=Bearer%20<jwt>
 * Query params: date (default 'today'), lines (default 100)
 */
router.get('/logs/stream', (req, res) => {
    const decoded = sseVerifyToken(req.query.token || '');
    if (!decoded) return res.status(401).end();

    sseHeaders(res);

    const { date = 'today', lines = 100 } = req.query;
    const parsedLines = lines ? parseInt(lines) : 100;

    const sendLogs = () => {
        try {
            const logs = readLogs(date, parsedLines);
            sseWrite(res, { success: true, date, logs });
        } catch (e) {
            sseWrite(res, { success: false, error: e.message });
        }
    };

    sendLogs();
    const interval = setInterval(sendLogs, 2000);
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