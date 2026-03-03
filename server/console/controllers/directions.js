const utils = require('../utils/utils')
const Directions = require('../models/mongo.directions')
const errorHandler = require('../utils/errorHandler')

// module.exports.getCurrent = async (req, res) => {
//     const token = req.headers.authorization.split(" ")[1];
//     const data = await utils.parseToken(token);
//     return res.json({ user: data })
// }

module.exports.getAll = async (req, res) => {
    try {
        const direction = await Directions.find({})
        res.status(200).json({ data: direction })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.getById = async (req, res) => {

    try {
        const direction = await Directions.findById(req.params.id)

        if (direction) {
            res.status(200).json({ status: 'Direction successfully found', data: direction })
        } else {
            errorHandler(res, 404, e)
        }

    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.create = async (req, res) => {

    try {
        const direction = await new Directions({
            directionName: req.body.directionName,
            createdAt: Date.now(),
            updatedAt: Date.now()
        })

        await direction.save()

        res.status(201).json({
            message: 'Direction created successfully',
            data: direction
        })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.remove = async (req, res) => {
    try {
        await Directions.deleteOne({
            _id: req.params.id
        })

        res.status(200).json({
            message: 'Direction deleted successfully', data: { _id: req.params.id }
        })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.update = async (req, res) => {
    try {
        const updatedDirection = {
            directionName: req.body.directionName,
            updatedAt: Date.now()
        }

        const direction = await Directions.findByIdAndUpdate(
            {
                _id: req.params.id
            },
            {
                $set: updatedDirection
            },
            {
                new: true
            })

        res.status(200).json({ message: 'Direction updated successfully', data: direction })

    } catch (e) {
        errorHandler(res, 500, e)
    }
}