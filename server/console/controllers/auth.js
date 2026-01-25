const bcrypt = require('bcrypt')
const User = require('../models/users')
const errorHandler = require('../utils/errorHandler')
const config = require('../config/config')
const utils = require('../utils/utils')

module.exports.login = async (req, res) => {

    const userDb = await User.findOne({ email: req.body.email })
    if (userDb) {
        const isRulePassw = bcrypt.compareSync(req.body.password, userDb.passwordHash)

        if (isRulePassw) {

            const token = utils.createToken(userDb, config.JWT_SECRET, {expiresIn: 60*60*2})

            // const token = jwt.sign({
            //     userId: userDb._id,
            //     email: userDb.email,
            //     role: userDb.role
            // }, config.JWT_SECRET , {expiresIn: 60*60*2})

            res.status(200).json({
                token: `${token}`,
                tokenType: 'Bearer'
            })

        } else {
            errorHandler(res, 401, 'User password is not correct')
        }
    } else {
        errorHandler(res, 404, 'User not found')
    }
}

module.exports.register = async (req, res) => {

    const userDb = await User.findOne({ email: req.body.email })
    console.log(userDb)

    if (userDb) {
        errorHandler(res, 409, 'Error: wrong email address')
    } else  {

        const password = await utils.generatePasswordHash(req.body.password)

        const newUser = new User({
            email: req.body.email,
            passwordHash: password.hash,
            nickname: req.body.nickname || req.body.email.split('@')[0],
            login: req.body.login || req.body.email,
        })

        try {
            await newUser.save()
            res.status(201).json(newUser)
            
        } catch (e) {
            errorHandler(res, 500, e)
        }
    }
}