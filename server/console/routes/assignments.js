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
const upload = multer({
    dest: tmpDir,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB per task file
    fileFilter: (req, file, cb) => {
        // Allow any file type for task materials
        cb(null, true);
    }
});

router.get('/',           jwtAuth, tutorVal, controller.getByGroup)
router.post('/',          jwtAuth, tutorVal, upload.array('taskFiles'), controller.create)
router.patch('/:id',      jwtAuth, tutorVal, controller.update)
router.patch('/:id/place',jwtAuth, tutorVal, controller.place)
router.delete('/:id',     jwtAuth, tutorVal, controller.remove)

module.exports = router
