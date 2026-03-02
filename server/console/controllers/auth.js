const bcrypt = require('bcrypt')
const User = require('../models/mongo.users')
const Role = require('../models/mongo.roles')
const errorHandler = require('../utils/errorHandler')
const config = require('../config/cfg')
const utils = require('../utils/utils')

module.exports.login = async (req, res) => {

    const userDb = await User.findOne({ email: req.body.email })
    if (userDb) {
        const isRulePassw = bcrypt.compareSync(req.body.password, userDb.passwordHash)

        if (isRulePassw) {

            const token = utils.createToken(userDb, config.JWT_SECRET)

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

module.exports.extendToken = async (req, res) => {

    const token = await utils.extendToken(req)

    res.status(200).json({
        token: `${token}`,
        tokenType: 'Bearer'
    })
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

module.exports.validate = async (req,res) => {
    try {
        const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

        if (!token) {
            return errorHandler(res, 401, 'ERROR: No token was found');
        }

        const decoded = require('jsonwebtoken').verify(token, config.JWT_SECRET);
        const userDb = await User.findById(decoded.userId).populate('role');

        if (!userDb) {
            return errorHandler(res, 404, 'ERROR: ACCESS DENIED');
        }

        if (!userDb.role) {
            return errorHandler(res, 404, 'ERROR: ACCESS DENIED');
        }

        const accessLevelHierarchy = { 'default': 1, 'create': 2, 'manage': 3, 'admin': 4, 'root': 5 };
        const userLevel = accessLevelHierarchy[userDb.role.accessLevel] || 0;
        const requiredLevel = accessLevelHierarchy['manage'];

        if (userLevel >= requiredLevel) {
            res.status(200).json({ valid: true});
        } else {
            errorHandler(res, 403, `ERROR: ACCESS DENIED`);
        }
    }
    catch (e) {
        errorHandler(res, 500, e.message);
    }
}