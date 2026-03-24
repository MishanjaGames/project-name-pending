const router       = require('express').Router()
const passport     = require('passport')
const { validate } = require('../utils/utils')
const controller   = require('../controllers/submissions')
const multer       = require('multer')
const path         = require('path')
const fs           = require('fs')

const jwtAuth  = passport.authenticate('jwt', { session: false })
const tutorVal = validate('tutor')

// Student submission upload — zip only, up to 200 MB
const tmpDir = path.join(__dirname, '../../storage/tmp');
fs.mkdirSync(tmpDir, { recursive: true });
const upload = multer({
    dest: tmpDir,
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const isAllowed = file.originalname.match(/\.(zip|txt)$/i);
        cb(isAllowed ? null : new Error('Only .zip files allowed'), isAllowed);
    }
});

// Get all submissions for an assignment in a group (tutors) or own (students)
router.get('/:groupId/:assignmentId',               jwtAuth, controller.getSubmissions)
// Submit
router.post('/:groupId/:assignmentId',              jwtAuth, upload.single('submission'), controller.submit)
// Grade
router.patch('/:groupId/:assignmentId/:studentId/grade', jwtAuth, tutorVal, controller.grade)
// Download
router.get('/:groupId/:assignmentId/:studentId/file',    jwtAuth, controller.downloadSubmission)

module.exports = router
