const Assignments  = require('../models/mongo.assignments')
const Groups       = require('../models/mongo.groups')
const Sessions     = require('../models/mongo.sessions')
const Courses      = require('../models/mongo.courses')
const Roles        = require('../models/mongo.roles')
const utils        = require('../utils/utils')
const errorHandler = require('../utils/errorHandler')

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function computeOverdueDeduction(markScale) {
    return ['12', '100'].includes(markScale) ? 2 : 1;
}

async function assertSessionTutor(session, requester, level) {
    if (MANAGE_LEVELS.includes(level)) return true;
    const isHost = session.hostTutor.toString() === requester._id.toString();
    const isCo   = session.coTutors.some(
        ct => ct.userId.toString() === requester._id.toString()
    );
    return isHost || isCo;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/assignments?groupId=...
 * Returns assignments for a group. Tutors and group members may access.
 */
module.exports.getByGroup = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const { groupId } = req.query;
        if (!groupId) return errorHandler(res, 400, 'groupId query param required');

        const group = await Groups.findById(groupId);
        if (!group) return errorHandler(res, 404, 'Group not found');

        const session = await Sessions.findById(group.sessionId);
        const level   = await getAccessLevel(requester);
        const isTutor = await assertSessionTutor(session, requester, level);
        const isMember = group.members.some(
            m => m.userId.toString() === requester._id.toString()
        );

        if (!isTutor && !isMember)
            return errorHandler(res, 403, 'Not authorized');

        const assignments = await Assignments.find({ groupId })
            .populate('createdBy', 'nickname')
            .sort({ createdAt: 1 });

        res.status(200).json({ data: assignments });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * POST /api/assignments
 * Any tutor sub-rank can create an assignment definition.
 * Body: { sessionId, groupId, courseId, title, description, dueAt, markScale, maxMark, taskFiles? }
 */
module.exports.create = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const level = await getAccessLevel(requester);
        if (level !== 'tutor' && !MANAGE_LEVELS.includes(level))
            return errorHandler(res, 403, 'Tutor access level required');

        const { sessionId, groupId, courseId, title, description,
                dueAt, markScale, maxMark, taskFiles = [] } = req.body;

        if (!sessionId || !groupId || !courseId || !title || !dueAt || !markScale || !maxMark)
            return errorHandler(res, 400, 'sessionId, groupId, courseId, title, dueAt, markScale, maxMark are required');

        const session = await Sessions.findById(sessionId);
        if (!session) return errorHandler(res, 404, 'Session not found');

        const ok = await assertSessionTutor(session, requester, level);
        if (!ok) return errorHandler(res, 403, 'Not a tutor in this session');

        const group = await Groups.findById(groupId);
        if (!group) return errorHandler(res, 404, 'Group not found');

        if (!['5', '12', '100', 'custom'].includes(markScale))
            return errorHandler(res, 400, 'markScale must be 5, 12, 100, or custom');

        const overdueDeduction = computeOverdueDeduction(markScale);

        const assignment = await new Assignments({
            sessionId, groupId, courseId,
            title:     title.trim(),
            description: description || '',
            taskFiles,
            dueAt:     new Date(dueAt),
            markScale,
            maxMark:   parseFloat(maxMark),
            overdueDeduction,
            createdBy: requester._id,
            createdAt: new Date(),
            updatedAt: new Date()
        }).save();

        // Add assignment entry to group (with empty submissions array)
        const assignmentNumber = group.assignments.length + 1;
        await Groups.findByIdAndUpdate(groupId, {
            $push: {
                assignments: {
                    assignmentId:     assignment._id,
                    assignmentNumber,
                    submissions:      []
                }
            },
            $set: { updatedAt: new Date() }
        });

        res.status(201).json({ message: 'Assignment created', data: assignment });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * PATCH /api/assignments/:id
 * Update assignment definition (title, description, dueAt, taskFiles).
 * Host/co-tutor only. Cannot change markScale or maxMark after submissions exist.
 */
module.exports.update = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const assignment = await Assignments.findById(req.params.id);
        if (!assignment) return errorHandler(res, 404, 'Assignment not found');

        const session = await Sessions.findById(assignment.sessionId);
        const level   = await getAccessLevel(requester);
        const ok      = await assertSessionTutor(session, requester, level);
        if (!ok) return errorHandler(res, 403, 'Not authorized');

        const group    = await Groups.findById(assignment.groupId);
        const entry    = group?.assignments.find(
            a => a.assignmentId.toString() === assignment._id.toString()
        );
        const hasSubmissions = (entry?.submissions?.length || 0) > 0;

        const update = { updatedAt: new Date() };
        ['title', 'description', 'dueAt', 'taskFiles'].forEach(f => {
            if (req.body[f] !== undefined) update[f] = req.body[f];
        });
        // Prevent mark scale changes if submissions already exist
        if (!hasSubmissions) {
            if (req.body.markScale) {
                update.markScale        = req.body.markScale;
                update.overdueDeduction = computeOverdueDeduction(req.body.markScale);
            }
            if (req.body.maxMark !== undefined) update.maxMark = parseFloat(req.body.maxMark);
        }

        const updated = await Assignments.findByIdAndUpdate(
            req.params.id, { $set: update }, { new: true }
        );

        res.status(200).json({ message: 'Assignment updated', data: updated });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * PATCH /api/assignments/:id/place
 * Place assignment inside course content.
 * Requires tutorRank >= 'tutor' (i.e., 'tutor' or 'professor').
 * Body: { type: 'volume'|'chapter'|'item', targetId }
 */
module.exports.place = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const level = await getAccessLevel(requester);
        if (level === 'tutor') {
            const canPlace = utils.checkTutorRank(requester.tutorRank, 'tutor');
            if (!canPlace)
                return errorHandler(res, 403, 'Only tutor/professor sub-rank can place assignments in course content');
        } else if (!MANAGE_LEVELS.includes(level)) {
            return errorHandler(res, 403, 'Not authorized');
        }

        const assignment = await Assignments.findById(req.params.id);
        if (!assignment) return errorHandler(res, 404, 'Assignment not found');

        const session = await Sessions.findById(assignment.sessionId);
        const ok      = await assertSessionTutor(session, requester, level);
        if (!ok) return errorHandler(res, 403, 'Not a tutor in this session');

        const { type, targetId } = req.body;
        if (!type || !targetId)
            return errorHandler(res, 400, 'type and targetId are required');

        await Assignments.findByIdAndUpdate(req.params.id, {
            $set: { 'placedIn.type': type, 'placedIn.targetId': targetId, updatedAt: new Date() }
        });

        res.status(200).json({ message: 'Assignment placed in course content' });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * DELETE /api/assignments/:id
 * Host/manage+ only. Cannot delete if approved submissions exist.
 */
module.exports.remove = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const assignment = await Assignments.findById(req.params.id);
        if (!assignment) return errorHandler(res, 404, 'Assignment not found');

        const session = await Sessions.findById(assignment.sessionId);
        const level   = await getAccessLevel(requester);
        const isHost  = session.hostTutor.toString() === requester._id.toString();
        if (!isHost && !MANAGE_LEVELS.includes(level))
            return errorHandler(res, 403, 'Only host tutor or manage+ can delete assignments');

        // Remove from group
        await Groups.findByIdAndUpdate(assignment.groupId, {
            $pull: { assignments: { assignmentId: assignment._id } },
            $set:  { updatedAt: new Date() }
        });

        await Assignments.deleteOne({ _id: assignment._id });
        res.status(200).json({ message: 'Assignment deleted', data: { _id: assignment._id } });
    } catch (e) { errorHandler(res, 500, e); }
};
