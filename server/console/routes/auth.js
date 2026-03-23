const router = require('express').Router()
const controller = require('../controllers/auth')

// router.post('/login', (req,res)=>{
//     res.status(200).json({
//         command: 'login'
//     })
// })
// router.post('/register', (req,res)=>{
//     res.status(200).json({
//         command: 'register'
//     })
// })

router.post('/login', controller.login)
router.post('/register', controller.register)
router.post('/validate', controller.validate)
router.post('/ext-session', controller.extendToken)

module.exports = router