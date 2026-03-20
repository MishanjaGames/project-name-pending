const Sessions     = require('../models/mongo.sessions')
const Courses      = require('../models/mongo.courses')
const Levels       = require('../models/mongo.levels')
const Users        = require('../models/mongo.users')
const Roles        = require('../models/mongo.roles')
const fileHandler  = require('../utils/fileHandler')
const utils        = require('../utils/utils')
const errorHandler = require('../utils/errorHandler')

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function getRequester(req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    return utils.parseToken(token);
}

async function getAccessLevel(user) {
    const role = await Roles.findById(user.role);
    return role?.accessLevel || 'default';
}

const MANAGE_LEVELS = ['manage', 'admin', 'root'];

/**
 * Verify a user is a tutor (accessLevel === 'tutor') and check their sub-rank.
 * Returns { ok, reason } 
 */
async function checkTutorAccess(user, minRank = null) {
    const level = await getAccessLevel(user);
    if (level !== 'tutor' && !MANAGE_LEVELS.includes(level))
        return { ok: false, reason: 'Tutor access level required' };
    if (minRank && level === 'tutor') {
        if (!utils.checkTutorRank(user.tutorRank, minRank))
            return { ok: false, reason: `This course requires at least '${minRank}' sub-rank` };
    }
    return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/sessions
 * Returns sessions where requester is host or co-tutor.
 * manage+ sees all sessions.
 */
module.exports.getAll = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');
        const level = await getAccessLevel(requester);

        let query = {};
        if (!MANAGE_LEVELS.includes(level)) {
            query = {
                $or: [
                    { hostTutor: requester._id },
                    { 'coTutors.userId': requester._id }
                ]
            };
        }

        const sessions = await Sessions.find(query)
            .populate('courseId', 'trans base_lang level direction courseType isPrivateCopy')
            .populate('privateCopyId', 'trans base_lang')
            .populate('hostTutor', 'nickname email tutorRank')
            .populate('coTutors.userId', 'nickname email tutorRank')
            .sort({ createdAt: -1 });

        res.status(200).json({ data: sessions });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * GET /api/sessions/:id
 */
module.exports.getById = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const session = await Sessions.findById(req.params.id)
            .populate('courseId', 'trans base_lang level direction courseType isPrivateCopy links')
            .populate('privateCopyId', 'trans base_lang links')
            .populate('hostTutor', 'nickname email tutorRank')
            .populate('coTutors.userId', 'nickname email tutorRank');

        if (!session) return errorHandler(res, 404, 'Session not found');

        const level = await getAccessLevel(requester);
        const isHost  = session.hostTutor._id.toString() === requester._id.toString();
        const isCoTutor = session.coTutors.some(
            ct => ct.userId._id.toString() === requester._id.toString()
        );
        if (!isHost && !isCoTutor && !MANAGE_LEVELS.includes(level))
            return errorHandler(res, 403, 'Not authorized to view this session');

        res.status(200).json({ data: session });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * POST /api/sessions
 * Create a new session.
 * Tutor must meet the course level's minTutorRank unless restrictionIgnored.
 * Body: { courseId, courseType, coTutors[], restrictionIgnored? }
 */
module.exports.create = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const access = await checkTutorAccess(requester);
        if (!access.ok) return errorHandler(res, 403, access.reason);

        const { courseId, courseType, coTutors = [], restrictionIgnored = false } = req.body;
        if (!courseId) return errorHandler(res, 400, 'courseId is required');

        const course = await Courses.findById(courseId);
        if (!course) return errorHandler(res, 404, 'Course not found');

        const level = await getAccessLevel(requester);

        // Check minTutorRank against course's level (for the host tutor)
        let initialRankOverrides = [];
        if (level === 'tutor') {
            const levelDoc = await Levels.findOne({ levelName: course.level });
            if (levelDoc?.minTutorRank) {
                const rankOk = utils.checkTutorRank(requester.tutorRank, levelDoc.minTutorRank);
                if (!rankOk) {
                    // Check if caller requested override AND is manage+
                    if (restrictionIgnored && MANAGE_LEVELS.includes(level)) {
                        // manage+ requesting on behalf — record override for host
                        initialRankOverrides.push({
                            tutorId:      requester._id,
                            overriddenBy: requester._id,
                            overriddenAt: new Date()
                        });
                    } else if (restrictionIgnored) {
                        return errorHandler(res, 403, 'Only manage+ can override rank restrictions');
                    } else {
                        return errorHandler(res, 403,
                            `This course level requires at least '${levelDoc.minTutorRank}' sub-rank. ` +
                            `Your rank: '${requester.tutorRank || 'none'}'. ` +
                            `Ask a manage+ user to override your rank for this session.`
                        );
                    }
                }
            }
        }

        const session = await new Sessions({
            courseId,
            courseType:       courseType || course.courseType,
            hostTutor:        requester._id,
            coTutors:         (coTutors || []).map(ct => ({
                userId:      ct.userId,
                canGrade:    ct.canGrade    ?? true,
                canSchedule: ct.canSchedule ?? true,
                canEditCopy: ct.canEditCopy ?? false
            })),
            rankOverrides:         initialRankOverrides,
            restrictionIgnored:    initialRankOverrides.length > 0,
            restrictionOverrideBy: initialRankOverrides.length > 0 ? requester._id : null,
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date()
        }).save();

        res.status(201).json({ message: 'Session created', data: session });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * PATCH /api/sessions/:id
 * Update session settings: status, schedule, deadlines, coTutors, copyEditAllowed.
 * Host or manage+ only.
 */
module.exports.update = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const session = await Sessions.findById(req.params.id);
        if (!session) return errorHandler(res, 404, 'Session not found');

        const level = await getAccessLevel(requester);
        const isHost = session.hostTutor.toString() === requester._id.toString();
        if (!isHost && !MANAGE_LEVELS.includes(level))
            return errorHandler(res, 403, 'Only the host tutor or manage+ can update this session');

        const allowed = ['status', 'schedule', 'deadlines', 'coTutors', 'copyEditAllowed', 'courseType'];
        const update  = { updatedAt: new Date() };
        allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

        const updated = await Sessions.findByIdAndUpdate(
            req.params.id, { $set: update }, { new: true }
        );

        res.status(200).json({ message: 'Session updated', data: updated });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * POST /api/sessions/:id/override-rank
 * Grants a rank override to a SPECIFIC tutor in this session.
 * manage+ OR host tutor can grant.
 * Body: { tutorId }  — the user ID of the tutor to grant the override to.
 *
 * POST /api/sessions/:id/revoke-rank-override
 * Revokes a previously granted rank override for a specific tutor.
 * Body: { tutorId }
 */
module.exports.overrideRank = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const session = await Sessions.findById(req.params.id);
        if (!session) return errorHandler(res, 404, 'Session not found');

        const level  = await getAccessLevel(requester);
        const isHost = session.hostTutor.toString() === requester._id.toString();
        if (!isHost && !MANAGE_LEVELS.includes(level))
            return errorHandler(res, 403, 'Only host tutor or manage+ can grant rank overrides');

        const { tutorId } = req.body;
        if (!tutorId) return errorHandler(res, 400, 'tutorId is required — specify which tutor to override');

        // Verify the target is a tutor in this session
        const isTargetHost   = session.hostTutor.toString() === tutorId.toString();
        const isTargetCoTutor = session.coTutors.some(ct => ct.userId.toString() === tutorId.toString());
        if (!isTargetHost && !isTargetCoTutor)
            return errorHandler(res, 400, 'Target user is not a tutor in this session');

        // Avoid duplicate overrides
        const alreadyOverridden = (session.rankOverrides || []).some(
            ro => ro.tutorId.toString() === tutorId.toString()
        );
        if (alreadyOverridden)
            return errorHandler(res, 409, 'This tutor already has a rank override for this session');

        await Sessions.findByIdAndUpdate(req.params.id, {
            $push: {
                rankOverrides: {
                    tutorId,
                    overriddenBy: requester._id,
                    overriddenAt: new Date()
                }
            },
            $set: {
                restrictionIgnored:    true,
                restrictionOverrideBy: requester._id,
                updatedAt: new Date()
            }
        });

        res.status(200).json({ message: `Rank restriction overridden for tutor ${tutorId}` });
    } catch (e) { errorHandler(res, 500, e); }
};

module.exports.revokeRankOverride = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const session = await Sessions.findById(req.params.id);
        if (!session) return errorHandler(res, 404, 'Session not found');

        const level  = await getAccessLevel(requester);
        const isHost = session.hostTutor.toString() === requester._id.toString();
        if (!isHost && !MANAGE_LEVELS.includes(level))
            return errorHandler(res, 403, 'Only host tutor or manage+ can revoke rank overrides');

        const { tutorId } = req.body;
        if (!tutorId) return errorHandler(res, 400, 'tutorId is required');

        await Sessions.findByIdAndUpdate(req.params.id, {
            $pull: { rankOverrides: { tutorId } },
            $set:  { updatedAt: new Date() }
        });

        // Update restrictionIgnored to reflect current state
        const updated = await Sessions.findById(req.params.id);
        if ((updated.rankOverrides || []).length === 0) {
            await Sessions.findByIdAndUpdate(req.params.id, {
                $set: { restrictionIgnored: false, restrictionOverrideBy: null }
            });
        }

        res.status(200).json({ message: `Rank override revoked for tutor ${tutorId}` });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * POST /api/sessions/:id/private-copy
 * Creates a private copy of the session's course for this tutor.
 * - Tutor must OWN the course, OR copyEditAllowed must be true.
 * - Only tutor/professor sub-rank can create private copies.
 * - Files from the original course are physically copied to [tutorId]/p-c/[courseId]/
 */
module.exports.createPrivateCopy = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const session = await Sessions.findById(req.params.id);
        if (!session) return errorHandler(res, 404, 'Session not found');

        const level  = await getAccessLevel(requester);
        const isHost = session.hostTutor.toString() === requester._id.toString();
        const isCoTutor = session.coTutors.some(
            ct => ct.userId.toString() === requester._id.toString() && ct.canEditCopy
        );

        if (!isHost && !isCoTutor && !MANAGE_LEVELS.includes(level))
            return errorHandler(res, 403, 'Not authorized to create a private copy for this session');

        // Sub-rank check: only tutor/professor may create copies
        if (level === 'tutor') {
            const canCreate = utils.checkTutorRank(requester.tutorRank, 'tutor');
            if (!canCreate)
                return errorHandler(res, 403, 'Only tutor/professor sub-rank can create private copies');
        }

        const originalCourse = await Courses.findById(session.courseId);
        if (!originalCourse) return errorHandler(res, 404, 'Original course not found');

        const ownerCheck = originalCourse.userId.toString() === requester._id.toString();
        if (!ownerCheck && !session.copyEditAllowed)
            return errorHandler(res, 403,
                'You must own this course to create a private copy, or the host must enable copyEditAllowed');

        if (session.privateCopyId)
            return errorHandler(res, 409, 'A private copy already exists for this session');

        // Create new Course document as private copy
        const copyData = originalCourse.toObject();
        delete copyData._id;
        copyData.isPrivateCopy   = true;
        copyData.original        = {
            courseId: originalCourse._id,
            ownedBy:  originalCourse.userId
        };
        copyData.userId          = requester._id;
        copyData.status          = 'editing';
        copyData.comments        = [];   // private copies never show comments
        copyData.ratingsList     = [];
        copyData.ratings         = 0;
        copyData.createdAt       = new Date();
        copyData.updatedAt       = new Date();

        const privateCopy = await new Courses(copyData).save();

        // Copy files physically
        const copyResult = fileHandler.copyCourseTutor(
            originalCourse._id.toString(),
            requester._id.toString()
        );

        // Link private copy to session
        await Sessions.findByIdAndUpdate(req.params.id, {
            $set: { privateCopyId: privateCopy._id, updatedAt: new Date() }
        });

        res.status(201).json({
            message: `Private copy created (${copyResult.copied} file(s) copied)`,
            data: { privateCopyId: privateCopy._id }
        });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * PATCH /api/sessions/:id/archive
 * Archive a session. Host or manage+ only. Works on any non-archived session.
 */
module.exports.archive = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const session = await Sessions.findById(req.params.id);
        if (!session) return errorHandler(res, 404, 'Session not found');

        const level  = await getAccessLevel(requester);
        const isHost = session.hostTutor.toString() === requester._id.toString();
        if (!isHost && !MANAGE_LEVELS.includes(level))
            return errorHandler(res, 403, 'Only host tutor or manage+ can archive this session');

        if (session.status === 'archived')
            return errorHandler(res, 409, 'Session is already archived');

        await Sessions.findByIdAndUpdate(req.params.id, {
            $set: { status: 'archived', updatedAt: new Date() }
        });

        res.status(200).json({ message: 'Session archived', data: { _id: session._id } });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * DELETE /api/sessions/:id
 * Permanently delete a session.
 * Host or manage+ only.
 * ONLY allowed when session status === 'completed'.
 * Cascades: deletes all associated Groups and Assignments.
 */
module.exports.remove = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const session = await Sessions.findById(req.params.id);
        if (!session) return errorHandler(res, 404, 'Session not found');

        const level  = await getAccessLevel(requester);
        const isHost = session.hostTutor.toString() === requester._id.toString();
        if (!isHost && !MANAGE_LEVELS.includes(level))
            return errorHandler(res, 403, 'Only host tutor or manage+ can delete this session');

        if (session.status !== 'completed')
            return errorHandler(res, 409,
                `Session must be completed before it can be permanently deleted. ` +
                `Current status: '${session.status}'. Session can be archieved ONLY when its complete.`
            );

        const Groups      = require('../models/mongo.groups');
        const Assignments = require('../models/mongo.assignments');

        // Find all groups in this session
        const groups = await Groups.find({ sessionId: session._id });
        const groupIds = groups.map(g => g._id);

        // Remove all assignments belonging to those groups
        if (groupIds.length > 0) {
            await Assignments.deleteMany({ groupId: { $in: groupIds } });
        }

        // Remove all groups
        await Groups.deleteMany({ sessionId: session._id });

        // Remove the session itself
        await Sessions.deleteOne({ _id: session._id });

        res.status(200).json({
            message: 'Session permanently deleted',
            data: {
                _id:            session._id,
                groupsDeleted:  groups.length,
            }
        });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * GET /api/sessions/:id/schedule/expanded
 * Returns the session schedule with recurring entries expanded into
 * individual concrete occurrences up to 6 months ahead (or recurrence.endDate).
 * Each occurrence is a plain object: { ...scheduleEntry, occurrenceDate, isRecurring }.
 */
module.exports.getExpandedSchedule = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const session = await Sessions.findById(req.params.id);
        if (!session) return errorHandler(res, 404, 'Session not found');

        const level     = await getAccessLevel(requester);
        const isHost    = session.hostTutor.toString() === requester._id.toString();
        const isCoTutor = session.coTutors.some(ct => ct.userId.toString() === requester._id.toString());
        if (!isHost && !isCoTutor && !MANAGE_LEVELS.includes(level))
            return errorHandler(res, 403, 'Not authorized');

        const now = new Date();
        const horizon = new Date(now);
        horizon.setMonth(horizon.getMonth() + 6);  // look 6 months ahead

        const expanded = [];

        for (const entry of session.schedule) {
            const base = entry.toObject ? entry.toObject() : { ...entry };

            if (!entry.isRecurring) {
                // One-time meeting — include as-is
                expanded.push({ ...base, occurrenceDate: entry.datetime, isExpanded: false });
                continue;
            }

            // Generate occurrences
            const { frequency, daysOfWeek, endDate, maxOccurrences } = entry.recurrence || {};
            const limit = endDate ? new Date(endDate) : horizon;
            let cursor = new Date(entry.datetime);
            let count  = 0;
            const maxCount = maxOccurrences || 52; // safety cap

            while (cursor <= limit && count < maxCount) {
                expanded.push({
                    ...base,
                    occurrenceDate: new Date(cursor),
                    isExpanded: true
                });
                count++;

                // Advance cursor
                switch (frequency) {
                    case 'daily':
                        cursor.setDate(cursor.getDate() + 1);
                        break;
                    case 'weekly':
                        cursor.setDate(cursor.getDate() + 7);
                        break;
                    case 'biweekly':
                        cursor.setDate(cursor.getDate() + 14);
                        break;
                    case 'monthly':
                        cursor.setMonth(cursor.getMonth() + 1);
                        break;
                    default:
                        cursor.setDate(cursor.getDate() + 7);
                }
            }
        }

        // Sort by occurrenceDate ascending
        expanded.sort((a, b) => new Date(a.occurrenceDate) - new Date(b.occurrenceDate));

        res.status(200).json({ data: expanded });
    } catch (e) { errorHandler(res, 500, e); }
};
