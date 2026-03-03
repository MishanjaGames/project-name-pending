const utils = require('../utils/utils')
const Roles = require('../models/mongo.roles')
const errorHandler = require('../utils/errorHandler')

// module.exports.getCurrent = async (req, res) => {
//     const token = req.headers.authorization.split(" ")[1];
//     const data = await utils.parseToken(token);
//     return res.json({ user: data })
// }

module.exports.getAll = async (req, res) => {
    try {
        const role = await Roles.find({})
        res.status(200).json({ data: role })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.getById = async (req, res) => {

    try {
        const role = await Roles.findById(req.params.id)

        if (role) {
            res.status(200).json({ status: 'Role successfully found', data: role })
        } else {
            errorHandler(res, 404, e)
        }

    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.create = async (req, res) => {

    try {
        const role = await new Roles({
            roleName: req.body.roleName,
            accessLevel: req.body.accessLevel,
            createdAt: Date.now(),
            updatedAt: Date.now()
        })

        await role.save()

        res.status(201).json({
            message: 'Role created successfully',
            data: role
        })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.remove = async (req, res) => {
    try {
        await Roles.deleteOne({
            _id: req.params.id
        })

        res.status(200).json({
            message: 'Role deleted successfully', data: { _id: req.params.id }
        })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.update = async (req, res) => {
    try {
        const updatedRole = {
            roleName: req.body.roleName,
            accessLevel: req.body.accessLevel,
            updatedAt: Date.now()
        }

        const role = await Roles.findByIdAndUpdate(
            {
                _id: req.params.id
            },
            {
                $set: updatedRole
            },
            {
                new: true
            })

        res.status(200).json({ message: 'Role updated successfully', data: role })

    } catch (e) {
        errorHandler(res, 500, e)
    }
}