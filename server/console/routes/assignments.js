const router       = require('express').Router()
const passport     = require('passport')
const { validate } = require('../utils/utils')
const controller   = require('../controllers/assignments')
const multer       = require('multer')
const path         = require('path')
const fs           = require('fs')

const jwtAuth  = passport.authenticate('jwt', { session: false })
const tutorVal = validate('tutor')

// Task file upload — temporary storage, controller moves to correct path
const tmpDir = path.join(__dirname, '../../storage/tmp');
fs.mkdirSync(tmpDir, { recursive: true });
const ALLOWED_INSTRUCTION_TYPES = [
    'text/plain',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-zip',
    'application/octet-stream', // some zips come through as this
];

const upload = multer({
    dest: tmpDir,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per instruction file
    fileFilter: (req, file, cb) => {
        const isAllowed =
            ALLOWED_INSTRUCTION_TYPES.includes(file.mimetype) ||
            file.originalname.match(/\.(txt|pdf|zip)$/i);
        if (!isAllowed) {
            return cb(new Error('Only .txt, .pdf and .zip files are allowed for assignment instructions'));
        }
        cb(null, true);
    }
});

router.get('/',                         jwtAuth, tutorVal, controller.getByGroup)
router.post('/',                        jwtAuth, tutorVal, upload.array('taskFiles'), controller.create)
router.patch('/:id',                    jwtAuth, tutorVal, upload.array('taskFiles'), controller.update)
router.patch('/:id/place',              jwtAuth, tutorVal, controller.place)
router.delete('/:id',                   jwtAuth, tutorVal, controller.remove)
router.delete('/:id/files/:filename',   jwtAuth, tutorVal, controller.removeTaskFile)

// Serve assignment instruction files statically
router.get('/files/:sessionId/:filename', jwtAuth, (req, res) => {
    const filePath = path.join(
        __dirname, '../../storage/data/assignments',
        req.params.sessionId, req.params.filename
    );
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });
    res.download(filePath, req.params.filename);
});

module.exports = router
