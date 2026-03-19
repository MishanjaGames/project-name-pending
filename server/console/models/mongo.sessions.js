const mongoose = require('mongoose')
const Schema = mongoose.Schema

/**
 * Session — a tutor-led run of a course for a specific group.
 *
 * A session ties together:
 *   - which course is being taught (original or private copy)
 *   - who the host and co-tutors are
 *   - the schedule of live meetings
 *   - per-item deadlines with optional locking
 *   - restriction override flag (allows bypassing level's minTutorRank)
 */
const sessionSchema = new Schema({
    // The course being taught (may be a private copy)
    courseId: {
        ref: 'courses',
        type: Schema.Types.ObjectId,
        required: true
    },
    // If a private copy was created for this session, its ID goes here
    privateCopyId: {
        ref: 'courses',
        type: Schema.Types.ObjectId,
        default: null
    },
    // Course delivery type — mirrors course.courseType
    courseType: {
        type: String,
        required: true,
        enum: ['SELF_TAUGHT', 'MENTORED', 'HOSTED']
    },
    // Host tutor
    hostTutor: {
        ref: 'users',
        type: Schema.Types.ObjectId,
        required: true
    },
    // Co-tutors with granular permissions
    coTutors: [{
        userId: {
            ref: 'users',
            type: Schema.Types.ObjectId,
            required: true
        },
        canGrade:      { type: Boolean, default: true },
        canSchedule:   { type: Boolean, default: true },
        // Host controls whether co-tutors may edit the private copy
        canEditCopy:   { type: Boolean, default: false }
    }],
    // Whether the level's minTutorRank check was bypassed
    restrictionIgnored: {
        type: Boolean,
        default: false
    },
    restrictionOverrideBy: {
        ref: 'users',
        type: Schema.Types.ObjectId,
        default: null
    },
    // Host-controlled: whether private-copy editing is permitted at all
    copyEditAllowed: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        required: false,
        default: 'draft',
        enum: ['draft', 'active', 'completed', 'archived']
    },
    // Live-session schedule entries
    schedule: [{
        title:       { type: String, required: true },
        datetime:    { type: Date,   required: true },
        durationMin: { type: Number, default: 60 },
        meetingLink: { type: String, default: '' },  // Zoom/Teams/Meet/Classroom link
        notes:       { type: String, default: '' }
    }],
    // Per-item deadlines (volumes, chapters, items, or assignments)
    deadlines: [{
        targetType: {
            type: String,
            required: true,
            enum: ['volume', 'chapter', 'item', 'assignment']
        },
        targetId:    { type: String, required: true },  // vid / cid / iid / assignmentId
        dueAt:       { type: Date,   required: true },
        description: { type: String, default: '' },
        // If true, content is locked for students after deadline
        lockAfterDue: { type: Boolean, default: false }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('sessions', sessionSchema)
