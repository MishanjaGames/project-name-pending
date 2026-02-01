const utils = require('../utils/utils')
const Users = require('../models/mongo.users')
const errorHandler = require('../utils/errorHandler')

module.exports.getCurrent = async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const data = await utils.parseToken(token);
    return res.json({ user: data })
}

module.exports.getAll = async (req, res) => {
    try {
        const user = await Users.find({})
        res.status(200).json({ data: user })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.getById = async (req, res) => {

    try {
        const user = await Users.findById(req.params.id)

        if (user) {
            res.status(200).json({ status: 'User successfully found', data: user })
        } else {
            errorHandler(res, 404, e)
        }

    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.create = async (req, res) => {

    try {
        const password = await utils.generatePasswordHash(req.body.password);
        const user = await new Users({
            email: req.body.email,
            passwordHash: password.hash,
            nickname: req.body.nickname || req.body.email.split('@')[0],
            login: req.body.login || req.body.email,
        })

        await user.save()

        res.status(201).json({
            message: 'User created successfully',
            login: { email: req.body.email, password: password.password },
            data: user
        })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.remove = async (req, res) => {
    try {
        await Users.deleteOne({
            _id: req.params.id
        })

        res.status(200).json({
            message: 'User deleted successfully', data: { _id: req.params.id }
        })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.update = async (req, res) => {
    try {
        const updatedUser = {
            nickname: req.body.nickname,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            login: req.body.login || req.body.email,
            passwordHash: req.body.passwordHash,
            role: req.body.role,
            email: req.body.email,
            phone: req.body.phone,
            github: req.body.github,
            courses: req.body.courses,
            updatedAt: Date.now()
        }

        const user = await Users.findByIdAndUpdate(
            {
                _id: req.params.id
            },
            {
                $set: updatedUser
            },
            {
                new: true
            }
        )

        res.status(200).json({ message: 'User updated successfully', data: user })

    } catch (e) {
        errorHandler(res, 500, e)
    }
}