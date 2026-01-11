const router = require('express').Router()
const authController = require('../controllers/auth')

router.post('/login', (req,res)=>{
    res.status(200).json({
        command: 'login'
    })
})
router.post('/register', (req,res)=>{
    res.status(200).json({
        command: 'register'
    })
})

//router.post('/login', authController.login)
//router.post('/register', authController.register)

module.exports = router