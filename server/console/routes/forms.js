'use strict';

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/forms');
const { registry } = require('../utils/fileHandler');

// ─── Auth middleware placeholders ─────────────────────────────────────────────
// Replace these with your actual middleware.
const verifyToken  = (req, res, next) => next(); // TODO: replace
const requireAdmin = (req, res, next) => next(); // TODO: replace

// ─── Per-request file-handler middleware ──────────────────────────────────────
// Resolves (or lazily creates) the EntityFileHandler for the requested formType
// and attaches it to `req` so route handlers can reference it if needed.
const attachHandler = (req, res, next) => {
    try {
        req.formHandler = registry.getOrCreate(`forms/${req.params.formType}`);
        next();
    } catch (err) {
        next(err);
    }
};

// ─── Memory-upload middleware factory ────────────────────────────────────────
// Uses memoryStorage so no :id is needed upfront — the controller writes
// buffers to disk after creating the submission document.
const memoryUpload = (req, res, next) => {
    const handler = registry.getOrCreate(`forms/${req.params.formType}`);
    handler.anyMemory()(req, res, (err) => handler.handleError(err, req, res, next));
};

// ============================================================================
// PUBLIC — applicant submits a form
// ============================================================================

/**
 * POST /api/forms/:formType
 *
 * Accepts multipart/form-data:
 *   data          — JSON-encoded object with all scalar field values
 *   skills        — JSON-encoded skills array
 *   cert_{n}[]    — certificate file(s) for skill index n
 *   example_{n}[] — example file(s)    for skill index n
 *
 * Works for ANY form type — the server stores whatever is inside `data`.
 * Apply your own required-field validation per form type in the controller
 * or via a config-driven validator middleware.
 */
router.post(
    '/apply/:formType',
    verifyToken,
    attachHandler,
    memoryUpload,
    ctrl.submitApplication,
);

// ============================================================================
// ADMIN — cross-type endpoints (no formType required)
// ============================================================================

/**
 * GET /api/manage/forms
 * Lists ALL submissions across every form type.
 * Optional query params: ?formType=creator-application  &status=pending  &search=alice
 */
router.get(
    '/',
    verifyToken,
    requireAdmin,
    ctrl.getAllAny,
);

/**
 * GET    /api/manage/forms/detail/:id
 * PATCH  /api/manage/forms/detail/:id   body: { status?, reviewNote? }
 * DELETE /api/manage/forms/detail/:id
 */
router.get(
    '/detail/:id',
    verifyToken,
    requireAdmin,
    ctrl.getOneById,
);

router.patch(
    '/detail/:id',
    verifyToken,
    requireAdmin,
    ctrl.updateStatusById,
);

router.delete(
    '/detail/:id',
    verifyToken,
    requireAdmin,
    ctrl.deleteSubmissionById,
);

router.get(
    '/detail/:id/files',
    verifyToken,
    requireAdmin,
    ctrl.listFilesById,
);

router.delete(
    '/detail/:id/files/:skillIndex/:filename',
    verifyToken,
    requireAdmin,
    ctrl.deleteFileById,
);

// ============================================================================
// ADMIN — manage submissions (per form type)
// ============================================================================

/**
 * GET /api/manage/forms/:formType
 * Query: ?status=pending|under-review|approved|rejected  &search=<text>
 */
router.get(
    '/:formType',
    verifyToken,
    requireAdmin,
    ctrl.getAll,
);

/**
 * GET /api/manage/forms/:formType/:id
 */
router.get(
    '/:formType/:id',
    verifyToken,
    requireAdmin,
    ctrl.getOne,
);

/**
 * PATCH /api/manage/forms/:formType/:id
 * Body: { status?, reviewNote? }
 */
router.patch(
    '/:formType/:id',
    verifyToken,
    requireAdmin,
    ctrl.updateStatus,
);

/**
 * DELETE /api/manage/forms/:formType/:id
 */
router.delete(
    '/:formType/:id',
    verifyToken,
    requireAdmin,
    ctrl.deleteSubmission,
);

// ============================================================================
// ADMIN — file management within a submission
// ============================================================================

/**
 * GET /api/manage/forms/:formType/:id/files
 */
router.get(
    '/:formType/:id/files',
    verifyToken,
    requireAdmin,
    ctrl.listFiles,
);

/**
 * DELETE /api/manage/forms/:formType/:id/files/:skillIndex/:filename
 */
router.delete(
    '/:formType/:id/files/:skillIndex/:filename',
    verifyToken,
    requireAdmin,
    ctrl.deleteFile,
);

// ============================================================================
// FILE SERVING — stream files to the browser
// ============================================================================

/**
 * GET /api/forms/files/:formType/:id/:subdir/:filename
 * Serves a file from a skill sub-directory (e.g. skill-0/).
 */
router.get(
    '/files/:formType/:id/:subdir/:filename',
    verifyToken,
    attachHandler,
    (req, res) => {
        const { id, subdir, filename } = req.params;
        const filePath = req.formHandler.getFilePath(id, filename, subdir);
        if (!filePath) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
        res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.sendFile(filePath);
    },
);

/**
 * GET /api/files/forms/:formType/:id/:filename
 * Serves a file from the submission root folder (no sub-directory).
 */
router.get(
    '/files/forms/:formType/:id/:filename',
    verifyToken,
    attachHandler,
    (req, res) => req.formHandler.sendFileHandler()(req, res),
);

// ============================================================================
// HOW TO MOUNT in app.js / server.js:
//
//   const formRoutes = require('./routes/forms.routes');
//   app.use('/api', formRoutes);
//
// This yields (for any formType, e.g. "creator-application"):
//
//   POST   /api/forms/creator-application
//   GET    /api/manage/forms/creator-application
//   GET    /api/manage/forms/creator-application/:id
//   PATCH  /api/manage/forms/creator-application/:id
//   DELETE /api/manage/forms/creator-application/:id
//   GET    /api/manage/forms/creator-application/:id/files
//   DELETE /api/manage/forms/creator-application/:id/files/:skillIndex/:filename
//   GET    /api/files/forms/creator-application/:id/:subdir/:filename
//   GET    /api/files/forms/creator-application/:id/:filename
//
// Adding a new form type requires ZERO backend changes — just add a
// config in formConfigs.js on the frontend and start posting to the new slug.
// ============================================================================

module.exports = router;