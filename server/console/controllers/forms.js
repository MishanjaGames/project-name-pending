'use strict';

const path     = require('path');
const fs       = require('fs');
const FormSubmission = require('../models/mongo.forms');
const { registry }   = require('../utils/fileHandler');

// ============================================================================
// HELPERS
// ============================================================================

/** Build the sub-directory name used for a given skill index */
const skillSubdir = (skillIndex) => `skill-${skillIndex}`;

/**
 * Get (or lazily register) the file handler for a given form type.
 * Falls back to sensible defaults if the form type was not pre-registered.
 */
const getHandler = (formType) => registry.getOrCreate(`forms/${formType}`);

/**
 * Write a memory-buffered file to disk and return a metadata object.
 * Used when multer is configured with memoryStorage (new submissions).
 */
const writeBufferFile = (buffer, originalname, mimetype, size, destDir, url) => {
    const ext  = path.extname(originalname);
    const stem = path.basename(originalname, ext).replace(/[^a-zA-Z0-9_\-.]/g, '_');
    const filename = `${stem}_${Date.now()}${ext}`;
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(path.join(destDir, filename), buffer);
    return { filename, originalName: originalname, url: `${url}/${filename}`, mimeType: mimetype, size };
};

// ============================================================================
// PUBLIC — submit a new application
// ============================================================================

/**
 * POST /api/forms/:formType
 *
 * Body (multipart/form-data):
 *   data            {JSON string}  all scalar form fields as a key-value object
 *   skills          {JSON string}  array of skill objects
 *                   Each skill: { type, subject, experience, source,
 *                                 examples: [{ kind:'link', name, url }] }
 *   cert_{n}[]      certificate file(s) for skill at index n
 *   example_{n}[]   example file(s)    for skill at index n
 *
 * multer.anyMemory() must have been applied as middleware before this handler.
 */
exports.submitApplication = async (req, res) => {
    try {
        const { formType } = req.params;
        if (!formType) {
            return res.status(400).json({ success: false, message: 'formType is required' });
        }

        // Parse the generic data blob
        let submissionData = {};
        try {
            submissionData = JSON.parse(req.body.data || '{}');
        } catch {
            return res.status(400).json({ success: false, message: 'Invalid data JSON' });
        }

        // Parse skills array
        let skills = [];
        try {
            skills = JSON.parse(req.body.skills || '[]');
        } catch {
            return res.status(400).json({ success: false, message: 'Invalid skills JSON' });
        }

        // Create the document first to obtain an _id for storage paths
        const submission = await FormSubmission.create({
            formType,
            userId: req.user?._id ?? null,
            data:   submissionData,
            skills,
            status: 'pending',
        });

        const submissionId = submission._id.toString();
        const handler      = getHandler(formType);

        // Group memory-buffered files by field name
        const files    = req.files ?? [];
        const byField  = files.reduce((acc, f) => {
            acc[f.fieldname] = acc[f.fieldname] ?? [];
            acc[f.fieldname].push(f);
            return acc;
        }, {});

        // Write buffered files to disk and attach metadata to each skill
        const updatedSkills = skills.map((skill, i) => {
            const subdir = skillSubdir(i);
            const destDir = handler.ensureDir(submissionId, subdir);
            const urlBase = `${handler.serveBasePath}/${submissionId}/${subdir}`;

            // Certificates
            const certFiles    = byField[`cert_${i}`] ?? [];
            const certificates = certFiles.map(f =>
                writeBufferFile(f.buffer, f.originalname, f.mimetype, f.size, destDir, urlBase)
            );

            // File examples
            const exampleFiles   = byField[`example_${i}`] ?? [];
            const fileExamples   = exampleFiles.map(f => ({
                kind: 'file',
                name: f.originalname,
                ...writeBufferFile(f.buffer, f.originalname, f.mimetype, f.size, destDir, urlBase),
            }));

            // Link examples already present in the skills JSON
            const linkExamples = (skill.examples ?? []).filter(e => e.kind === 'link');

            return { ...skill, certificates, examples: [...fileExamples, ...linkExamples] };
        });

        submission.skills = updatedSkills;
        await submission.save();

        res.status(201).json({
            success: true,
            message: 'Submission received',
            data:    { _id: submission._id, status: submission.status },
        });
    } catch (err) {
        console.error('[Forms] submitApplication:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ============================================================================
// ADMIN — list submissions for a form type
// ============================================================================

/**
 * GET /api/manage/forms/:formType
 * Query params: status, search (full-text against data fields)
 */
exports.getAll = async (req, res) => {
    try {
        const { formType } = req.params;
        const { status, search } = req.query;
        const filter = { formType };

        if (status) filter.status = status;

        if (search) {
            // Search across all leaf string values inside `data`
            const rx = new RegExp(search.trim(), 'i');
            filter.$or = [
                { 'data.firstName':   rx },
                { 'data.lastName':    rx },
                { 'data.name':        rx },
                { 'data.email':       rx },
                { 'data.subject':     rx },
                { 'data.description': rx },
                { 'data.about':       rx },
            ];
        }

        const submissions = await FormSubmission.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, count: submissions.length, data: submissions });
    } catch (err) {
        console.error('[Forms] getAll:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ============================================================================
// ADMIN — get a single submission
// ============================================================================

/**
 * GET /api/manage/forms/:formType/:id
 */
exports.getOne = async (req, res) => {
    try {
        const { formType, id } = req.params;
        const submission = await FormSubmission.findOne({ _id: id, formType }).lean();
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }
        res.json({ success: true, data: submission });
    } catch (err) {
        console.error('[Forms] getOne:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ============================================================================
// ADMIN — update status and/or review note
// ============================================================================

/**
 * PATCH /api/manage/forms/:formType/:id
 * Body: { status?, reviewNote? }
 */
exports.updateStatus = async (req, res) => {
    try {
        const { formType, id } = req.params;
        const { status, reviewNote } = req.body;

        const ALLOWED = ['pending', 'under-review', 'approved', 'rejected'];
        if (status && !ALLOWED.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${ALLOWED.join(', ')}`,
            });
        }

        const update = {};
        if (status) {
            update.status     = status;
            update.reviewedAt = new Date();
            update.reviewedBy = req.user?._id;
        }
        if (reviewNote !== undefined) update.reviewNote = reviewNote;

        const submission = await FormSubmission.findOneAndUpdate(
            { _id: id, formType },
            { $set: update },
            { new: true, runValidators: true }
        );
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        res.json({ success: true, message: 'Submission updated', data: submission });
    } catch (err) {
        console.error('[Forms] updateStatus:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ============================================================================
// ADMIN — delete a submission and all its files
// ============================================================================

/**
 * DELETE /api/manage/forms/:formType/:id
 */
exports.deleteSubmission = async (req, res) => {
    try {
        const { formType, id } = req.params;
        const submission = await FormSubmission.findOneAndDelete({ _id: id, formType });
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        getHandler(formType).deleteAllFiles(id);

        res.json({ success: true, message: 'Submission deleted' });
    } catch (err) {
        console.error('[Forms] deleteSubmission:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ============================================================================
// ADMIN — list files grouped by skill
// ============================================================================

/**
 * GET /api/manage/forms/:formType/:id/files
 */
exports.listFiles = async (req, res) => {
    try {
        const { formType, id } = req.params;
        const submission = await FormSubmission.findOne({ _id: id, formType }).lean();
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        const handler = getHandler(formType);
        const bySkill = (submission.skills ?? []).map((skill, i) => ({
            skillIndex: i,
            subject:    skill.subject,
            files:      handler.listFiles(id, skillSubdir(i)),
        }));

        res.json({ success: true, data: bySkill });
    } catch (err) {
        console.error('[Forms] listFiles:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ============================================================================
// ADMIN — delete a specific file from a submission
// ============================================================================

/**
 * DELETE /api/manage/forms/:formType/:id/files/:skillIndex/:filename
 */
exports.deleteFile = async (req, res) => {
    try {
        const { formType, id, skillIndex, filename } = req.params;
        const subdir  = skillSubdir(skillIndex);
        const deleted = getHandler(formType).deleteFile(id, filename, subdir);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        // Sync DB — remove the reference from the skill's arrays
        const submission = await FormSubmission.findOne({ _id: id, formType });
        if (submission?.skills?.[skillIndex]) {
            const skill          = submission.skills[skillIndex];
            skill.certificates   = skill.certificates.filter(c => c.filename !== filename);
            skill.examples       = skill.examples.filter(e => e.filename !== filename);
            await submission.save();
        }

        res.json({ success: true, message: 'File deleted' });
    } catch (err) {
        console.error('[Forms] deleteFile:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ============================================================================
// ADMIN — list ALL submissions across ALL form types
// ============================================================================

/**
 * GET /api/manage/forms
 * Query params: formType, status, search
 * Returns every submission regardless of form type, sorted newest-first.
 */
exports.getAllAny = async (req, res) => {
    try {
        const { formType, status, search } = req.query;
        const filter = {};

        if (formType) filter.formType = formType;
        if (status)   filter.status   = status;

        if (search) {
            const rx = new RegExp(search.trim(), 'i');
            filter.$or = [
                { 'data.firstName':   rx },
                { 'data.lastName':    rx },
                { 'data.name':        rx },
                { 'data.email':       rx },
                { 'data.subject':     rx },
                { 'data.description': rx },
                { 'data.about':       rx },
            ];
        }

        const submissions = await FormSubmission.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, count: submissions.length, data: submissions });
    } catch (err) {
        console.error('[Forms] getAllAny:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ============================================================================
// ADMIN — get a single submission by ID only (no formType required)
// ============================================================================

/**
 * GET  /api/manage/forms/detail/:id
 * PATCH /api/manage/forms/detail/:id   body: { status?, reviewNote? }
 * DELETE /api/manage/forms/detail/:id
 */
exports.getOneById = async (req, res) => {
    try {
        const submission = await FormSubmission.findById(req.params.id).lean();
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }
        res.json({ success: true, data: submission });
    } catch (err) {
        console.error('[Forms] getOneById:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.updateStatusById = async (req, res) => {
    try {
        const { status, reviewNote } = req.body;

        const ALLOWED = ['pending', 'under-review', 'approved', 'rejected'];
        if (status && !ALLOWED.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${ALLOWED.join(', ')}`,
            });
        }

        const update = {};
        if (status) {
            update.status     = status;
            update.reviewedAt = new Date();
            update.reviewedBy = req.user?._id;
        }
        if (reviewNote !== undefined) update.reviewNote = reviewNote;

        const submission = await FormSubmission.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            { new: true, runValidators: true }
        );
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        res.json({ success: true, message: 'Submission updated', data: submission });
    } catch (err) {
        console.error('[Forms] updateStatusById:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.deleteSubmissionById = async (req, res) => {
    try {
        const submission = await FormSubmission.findByIdAndDelete(req.params.id);
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }
        // Remove files using the submission's own formType
        getHandler(submission.formType).deleteAllFiles(req.params.id);
        res.json({ success: true, message: 'Submission deleted' });
    } catch (err) {
        console.error('[Forms] deleteSubmissionById:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.listFilesById = async (req, res) => {
    try {
        const submission = await FormSubmission.findById(req.params.id).lean();
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }
        const handler = getHandler(submission.formType);
        const bySkill = (submission.skills ?? []).map((skill, i) => ({
            skillIndex: i,
            subject:    skill.subject,
            files:      handler.listFiles(req.params.id, skillSubdir(i)),
        }));
        res.json({ success: true, data: bySkill });
    } catch (err) {
        console.error('[Forms] listFilesById:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.deleteFileById = async (req, res) => {
    try {
        const { id, skillIndex, filename } = req.params;
        const submission = await FormSubmission.findById(id);
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }
        const subdir  = skillSubdir(skillIndex);
        const deleted = getHandler(submission.formType).deleteFile(id, filename, subdir);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        if (submission.skills?.[skillIndex]) {
            const skill        = submission.skills[skillIndex];
            skill.certificates = skill.certificates.filter(c => c.filename !== filename);
            skill.examples     = skill.examples.filter(e => e.filename !== filename);
            await submission.save();
        }
        res.json({ success: true, message: 'File deleted' });
    } catch (err) {
        console.error('[Forms] deleteFileById:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};