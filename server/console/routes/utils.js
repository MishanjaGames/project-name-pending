const router = require("express").Router();
const utils = require('../controllers/utils')

router.get('/status', utils.getStatusInfo)
router.post('/send', utils.loadData)

module.exports = router