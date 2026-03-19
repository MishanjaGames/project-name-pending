const Groups       = require('../models/mongo.groups')
const Assignments  = require('../models/mongo.assignments')
const Sessions     = require('../models/mongo.sessions')
const Users        = require('../models/mongo.users')
const Roles        = require('../models/mongo.roles')
const fileHandler  = require('../utils/fileHandler')
const utils        = require('../utils/utils')
const errorHandler = require('../utils/errorHandler')
const path         = require('path')
const fs           = require('fs')

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

function isOverdue(dueAt) {
    // Overdue sanctions start at 00:00 of the day AFTER dueAt
    const sanctionStart = new Date(dueAt);
    sanctionStart.setDate(sanctionStart.getDate() + 1);
    sanctionStart.setHours(0, 0, 0, 0);
    return new Date() >= sanctionStart;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/submissions/:groupId/:assignmentId
 * Returns all submissions for an assignment within a group.
 * Tutors see all; students see only their own.
 */
module.exports.getSubmissions = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const { groupId, assignmentId } = req.params;
        const group = await Groups.findById(groupId);
        if (!group) return errorHandler(res, 404, 'Group not found');

        const session = await Sessions.findById(group.sessionId);
        const level   = await getAccessLevel(requester);

        const isTutor = MANAGE_LEVELS.includes(level) ||
            session.hostTutor.toString() === requester._id.toString() ||
            session.coTutors.some(ct => ct.userId.toString() === requester._id.toString());

        const entry = group.assignments.find(
            a => a.assignmentId.toString() === assignmentId
        );
        if (!entry) return errorHandler(res, 404, 'Assignment not in this group');

        let submissions = entry.submissions || [];

        if (!isTutor) {
            // Students only see their own submissions
            const isMember = group.members.some(
                m => m.userId.toString() === requester._id.toString()
            );
            if (!isMember) return errorHandler(res, 403, 'Not authorized');
            submissions = submissions.filter(
                s => s.studentId.toString() === requester._id.toString()
            );
        }

        res.status(200).json({ data: submissions });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * POST /api/submissions/:groupId/:assignmentId
 * Student submits a zip file.
 * Uses multer for the zip upload.
 * File is saved to: [studentId]/g/[groupId]/[courseId]/[assignmentNumber]_[nickname]-[studentId].zip
 *
 * Re-submission allowed if:
 *   - No previous submission, OR
 *   - Last submission was declined by tutor, OR
 *   - Deadline has not passed
 */
module.exports.submit = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const { groupId, assignmentId } = req.params;

        const group = await Groups.findById(groupId);
        if (!group) return errorHandler(res, 404, 'Group not found');

        const isMember = group.members.some(
            m => m.userId.toString() === requester._id.toString() && m.status === 'active'
        );
        if (!isMember) return errorHandler(res, 403, 'You are not an active member of this group');

        const assignment = await Assignments.findById(assignmentId);
        if (!assignment) return errorHandler(res, 404, 'Assignment not found');

        const entry = group.assignments.find(
            a => a.assignmentId.toString() === assignmentId
        );
        if (!entry) return errorHandler(res, 404, 'Assignment not in this group');

        // Check for existing non-declined submission
        const existing = (entry.submissions || []).find(
            s => s.studentId.toString() === requester._id.toString()
        );
        if (existing) {
            const beforeDeadline = new Date() <= assignment.dueAt;
            const wasDeclined    = existing.status === 'declined';
            if (!beforeDeadline && !wasDeclined)
                return errorHandler(res, 409,
                    'You already have a submission. Re-submission is only allowed before deadline or if your submission was declined.'
                );
        }

        if (!req.file)
            return errorHandler(res, 400, 'A zip file is required');

        const overdue = isOverdue(assignment.dueAt);
        const { dir, filename, fullPath } = fileHandler.buildSubmissionPath(
            requester._id.toString(),
            groupId,
            group.courseId.toString(),
            entry.assignmentNumber,
            requester.nickname
        );

        // Move uploaded file to correct path
        fs.renameSync(req.file.path, fullPath);

        const resubmitCount = existing ? (existing.resubmitCount || 0) + 1 : 0;

        const submission = {
            studentId:     requester._id,
            filePath:      fullPath,
            submittedAt:   new Date(),
            isOverdue:     overdue,
            resubmitCount,
            status:        'pending',
            mark:          null,
            feedback:      '',
            gradedBy:      null,
            gradedAt:      null
        };

        if (existing) {
            // Replace existing submission
            await Groups.findOneAndUpdate(
                { _id: groupId, 'assignments.assignmentId': assignmentId,
                  'assignments.submissions.studentId': requester._id },
                { $set: { 'assignments.$[a].submissions.$[s]': submission } },
                {
                    arrayFilters: [
                        { 'a.assignmentId': assignment._id },
                        { 's.studentId': requester._id }
                    ]
                }
            );
        } else {
            // Push new submission
            await Groups.findOneAndUpdate(
                { _id: groupId, 'assignments.assignmentId': assignmentId },
                {
                    $push: { 'assignments.$[a].submissions': submission },
                    $set:  { updatedAt: new Date() }
                },
                { arrayFilters: [{ 'a.assignmentId': assignment._id }] }
            );
        }

        res.status(201).json({
            message: overdue ? 'Submitted (overdue — mark may be reduced)' : 'Submitted successfully',
            data: { filePath: fullPath, isOverdue: overdue }
        });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * PATCH /api/submissions/:groupId/:assignmentId/:studentId/grade
 * Tutor grades a submission.
 * Body: { mark, feedback, status: 'approved'|'declined' }
 * canGrade check enforced for co-tutors.
 */
module.exports.grade = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const { groupId, assignmentId, studentId } = req.params;

        const group   = await Groups.findById(groupId);
        if (!group) return errorHandler(res, 404, 'Group not found');

        const session = await Sessions.findById(group.sessionId);
        const level   = await getAccessLevel(requester);

        const isHost  = session.hostTutor.toString() === requester._id.toString();
        const coEntry = session.coTutors.find(
            ct => ct.userId.toString() === requester._id.toString()
        );
        const canGrade = isHost || (coEntry?.canGrade) || MANAGE_LEVELS.includes(level);
        if (!canGrade) return errorHandler(res, 403, 'Not authorized to grade submissions');

        const { mark, feedback, status } = req.body;
        if (!['approved', 'declined'].includes(status))
            return errorHandler(res, 400, 'status must be approved or declined');

        const assignment = await Assignments.findById(assignmentId);
        if (!assignment) return errorHandler(res, 404, 'Assignment not found');

        // Apply overdue deduction if submission is overdue
        const entry      = group.assignments.find(
            a => a.assignmentId.toString() === assignmentId
        );
        const submission = entry?.submissions.find(
            s => s.studentId.toString() === studentId
        );
        if (!submission) return errorHandler(res, 404, 'Submission not found');

        let finalMark = parseFloat(mark);
        if (submission.isOverdue && status === 'approved') {
            const deducted = Math.max(0, finalMark - assignment.overdueDeduction);
            finalMark = deducted;
        }
        // Clamp to maxMark
        finalMark = Math.min(finalMark, assignment.maxMark);

        await Groups.findOneAndUpdate(
            {
                _id: groupId,
                'assignments.assignmentId': assignment._id,
                'assignments.submissions.studentId': requester._id.constructor(studentId)
            },
            {
                $set: {
                    'assignments.$[a].submissions.$[s].mark':     finalMark,
                    'assignments.$[a].submissions.$[s].feedback': feedback || '',
                    'assignments.$[a].submissions.$[s].status':   status,
                    'assignments.$[a].submissions.$[s].gradedBy': requester._id,
                    'assignments.$[a].submissions.$[s].gradedAt': new Date()
                }
            },
            {
                arrayFilters: [
                    { 'a.assignmentId': assignment._id },
                    { 's.studentId':    submission.studentId }
                ]
            }
        );

        res.status(200).json({
            message: `Submission ${status}`,
            data: { mark: finalMark, overdueDeduction: submission.isOverdue ? assignment.overdueDeduction : 0 }
        });
    } catch (e) { errorHandler(res, 500, e); }
};

/**
 * GET /api/submissions/:groupId/:assignmentId/:studentId/file
 * Download a student's submission zip.
 * Accessible by the student themselves, or any tutor in the session.
 */
module.exports.downloadSubmission = async (req, res) => {
    try {
        const requester = await getRequester(req);
        if (!requester) return errorHandler(res, 401, 'Authentication required');

        const { groupId, assignmentId, studentId } = req.params;

        const group = await Groups.findById(groupId);
        if (!group) return errorHandler(res, 404, 'Group not found');

        const session = await Sessions.findById(group.sessionId);
        const level   = await getAccessLevel(requester);

        const isTutor = MANAGE_LEVELS.includes(level) ||
            session.hostTutor.toString() === requester._id.toString() ||
            session.coTutors.some(ct => ct.userId.toString() === requester._id.toString());
        const isSelf  = requester._id.toString() === studentId;

        if (!isTutor && !isSelf)
            return errorHandler(res, 403, 'Not authorized to download this submission');

        const entry = group.assignments.find(
            a => a.assignmentId.toString() === assignmentId
        );
        const sub = entry?.submissions.find(
            s => s.studentId.toString() === studentId
        );
        if (!sub) return errorHandler(res, 404, 'Submission not found');
        if (!fs.existsSync(sub.filePath))
            return errorHandler(res, 404, 'Submission file not found on disk');

        res.download(sub.filePath, path.basename(sub.filePath));
    } catch (e) { errorHandler(res, 500, e); }
};
