const Groups       = require('../models/mongo.groups')
const Sessions     = require('../models/mongo.sessions')
const Users        = require('../models/mongo.users')
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

/**
 * Check that requester is host, co-tutor, or manage+ for a session.
 */
async function assertSessionAccess(session, requester, level) {
    if (MANAGE_LEVELS.includes(level)) return true;
    const isHost = session.hostTutor.toString() === requester._id.toString();
    const isCo   = session.coTutors.some(
        ct => ct.userId.toString() === requester._id.toString()
    );
    return isHost || isCo;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/groups?sessionId=...
 * Returns groups for a session. Tutor must be host/co-tutor.
 */
module.exports.getBySession = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const { sessionId } = req.query;
        if (!sessionId) return errorHandler(res, 400, 'sessionId query param required');

        const session = await Sessions.findById(sessionId);
        if (!session) return errorHandler(res, 404, 'Session not found');

        const level = await getAccessLevel(requester);
        const ok    = await assertSessionAccess(session, requester, level);
        if (!ok) return errorHandler(res, 403, 'Not authorized');

        const groups = await Groups.find({ sessionId })
            .populate('members.userId', 'nickname email tutorRank')
            .populate('members.addedBy', 'nickname')
            .populate('assignments.assignmentId', 'title dueAt markScale maxMark')
            .sort({ createdAt: -1 });

        res.status(200).json({ data: groups });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * GET /api/groups/:id
 */
module.exports.getById = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const group = await Groups.findById(req.params.id)
            .populate('members.userId', 'nickname email')
            .populate('members.addedBy', 'nickname')
            .populate('assignments.assignmentId', 'title description dueAt markScale maxMark overdueDeduction taskFiles');

        if (!group) return errorHandler(res, 404, 'Group not found');

        const session = await Sessions.findById(group.sessionId);
        const level   = await getAccessLevel(requester);
        const ok      = await assertSessionAccess(session, requester, level);

        // Students can also view their own group
        const isMember = group.members.some(
            m => m.userId._id?.toString() === requester._id.toString()
        );

        if (!ok && !isMember)
            return errorHandler(res, 403, 'Not authorized to view this group');

        res.status(200).json({ data: group });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * POST /api/groups
 * Create a group for a session.
 * Body: { sessionId, name }
 */
module.exports.create = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const { sessionId, name } = req.body;
        if (!sessionId || !name)
            return errorHandler(res, 400, 'sessionId and name are required');

        const session = await Sessions.findById(sessionId);
        if (!session) return errorHandler(res, 404, 'Session not found');

        const level = await getAccessLevel(requester);
        const ok    = await assertSessionAccess(session, requester, level);
        if (!ok) return errorHandler(res, 403, 'Not authorized');

        // Group uses private copy if it exists, otherwise original course
        const courseId = session.privateCopyId || session.courseId;

        const group = await new Groups({
            sessionId,
            courseId,
            name:     name.trim(),
            members:  [],
            assignments: [],
            createdAt: new Date(),
            updatedAt: new Date()
        }).save();

        res.status(201).json({ message: 'Group created', data: group });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * POST /api/groups/:id/members
 * Add a student to the group by searching email or nickname.
 * Body: { emailOrNickname }
 */
module.exports.addMember = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const group = await Groups.findById(req.params.id);
        if (!group) return errorHandler(res, 404, 'Group not found');

        const session = await Sessions.findById(group.sessionId);
        const level   = await getAccessLevel(requester);
        const ok      = await assertSessionAccess(session, requester, level);
        if (!ok) return errorHandler(res, 403, 'Not authorized');

        const { emailOrNickname } = req.body;
        if (!emailOrNickname)
            return errorHandler(res, 400, 'emailOrNickname is required');

        // Find student by email or nickname
        const student = await Users.findOne({
            $or: [
                { email:    emailOrNickname },
                { nickname: emailOrNickname }
            ]
        });
        if (!student) return errorHandler(res, 404, 'User not found');

        // Check not already a member
        const already = group.members.some(
            m => m.userId.toString() === student._id.toString()
        );
        if (already)
            return errorHandler(res, 409, 'User is already a member of this group');

        // For MENTORED / SELF_TAUGHT: student must own the course
        if (session.courseType !== 'HOSTED') {
            const originalCourseId = (session.courseId || '').toString();
            const owns = (student.courses || []).some(
                c => c._id.toString() === originalCourseId
            );
            if (!owns)
                return errorHandler(res, 403,
                    `This is a ${session.courseType} course — student must own it before joining`
                );
        }

        // Add to group
        await Groups.findByIdAndUpdate(req.params.id, {
            $push: {
                members: {
                    userId:   student._id,
                    addedBy:  requester._id,
                    status:   'active',
                    joinedAt: new Date()
                }
            },
            $set: { updatedAt: new Date() }
        });

        // Add group ID to student's user.groups[]
        await Users.findByIdAndUpdate(student._id, {
            $addToSet: { groups: group._id }
        });

        res.status(200).json({
            message: `${student.nickname} added to group`,
            data:    { userId: student._id, nickname: student.nickname }
        });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * PATCH /api/groups/:id/members/:userId/status
 * Change a member's status (active/dropped/completed).
 * Body: { status }
 */
module.exports.updateMemberStatus = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const group = await Groups.findById(req.params.id);
        if (!group) return errorHandler(res, 404, 'Group not found');

        const session = await Sessions.findById(group.sessionId);
        const level   = await getAccessLevel(requester);
        const ok      = await assertSessionAccess(session, requester, level);
        if (!ok) return errorHandler(res, 403, 'Not authorized');

        const { status } = req.body;
        if (!['active', 'dropped', 'completed'].includes(status))
            return errorHandler(res, 400, 'status must be active, dropped, or completed');

        await Groups.findOneAndUpdate(
            { _id: req.params.id, 'members.userId': req.params.userId },
            { $set: { 'members.$.status': status, updatedAt: new Date() } }
        );

        res.status(200).json({ message: 'Member status updated' });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * DELETE /api/groups/:id/members/:userId
 * Remove a student from the group.
 */
module.exports.removeMember = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const group = await Groups.findById(req.params.id);
        if (!group) return errorHandler(res, 404, 'Group not found');

        const session = await Sessions.findById(group.sessionId);
        const level   = await getAccessLevel(requester);
        const ok      = await assertSessionAccess(session, requester, level);
        if (!ok) return errorHandler(res, 403, 'Not authorized');

        await Groups.findByIdAndUpdate(req.params.id, {
            $pull: { members: { userId: req.params.userId } },
            $set:  { updatedAt: new Date() }
        });

        // Remove group ID from student's user.groups[]
        await Users.findByIdAndUpdate(req.params.userId, {
            $pull: { groups: group._id }
        });

        res.status(200).json({ message: 'Member removed from group' });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * DELETE /api/groups/:id
 * Host or manage+ only.
 */
module.exports.remove = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const group = await Groups.findById(req.params.id);
        if (!group) return errorHandler(res, 404, 'Group not found');

        const session = await Sessions.findById(group.sessionId);
        const level   = await getAccessLevel(requester);
        const isHost  = session.hostTutor.toString() === requester._id.toString();
        if (!isHost && !MANAGE_LEVELS.includes(level))
            return errorHandler(res, 403, 'Only host tutor or manage+ can delete a group');

        // Remove group ref from all members
        const memberIds = group.members.map(m => m.userId);
        if (memberIds.length > 0) {
            await Users.updateMany(
                { _id: { $in: memberIds } },
                { $pull: { groups: group._id } }
            );
        }

        await Groups.deleteOne({ _id: group._id });
        res.status(200).json({ message: 'Group deleted', data: { _id: group._id } });
    } catch (e) { errorHandler(res, 500, e); }
};
