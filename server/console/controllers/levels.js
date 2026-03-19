const utils = require('../utils/utils')
const Levels = require('../models/mongo.levels')
const errorHandler = require('../utils/errorHandler')

// module.exports.getCurrent = async (req, res) => {
//     const token = req.headers.authorization.split(" ")[1];
//     const data = await utils.parseToken(token);
//     return res.json({ user: data })
// }

module.exports.getAll = async (req, res) => {
    try {
        const level = await Levels.find({})
        res.status(200).json({ data: level })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.getById = async (req, res) => {

    try {
        const level = await Levels.findById(req.params.id)

        if (level) {
            res.status(200).json({ status: 'Level successfully found', data: level })
        } else {
            errorHandler(res, 404, e)
        }

    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.create = async (req, res) => {

    try {
        const level = await new Levels({
            levelName:    req.body.levelName,
            directionName: req.body.directionName,
            minTutorRank: req.body.minTutorRank || 'assistant',
            createdAt: Date.now(),
            updatedAt: Date.now()
        })

        await level.save()

        res.status(201).json({
            message: 'Level created successfully',
            data: level
        })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.remove = async (req, res) => {
    try {
        await Levels.deleteOne({
            _id: req.params.id
        })

        res.status(200).json({
            message: 'Level deleted successfully', data: { _id: req.params.id }
        })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.update = async (req, res) => {
    try {
        const updatedLevel = {
            levelName:    req.body.levelName,
            directionName: req.body.directionName,
            minTutorRank: req.body.minTutorRank || 'assistant',
            updatedAt: Date.now()
        }

        const level = await Levels.findByIdAndUpdate(
            {
                _id: req.params.id
            },
            {
                $set: updatedLevel
            },
            {
                new: true
            })

        res.status(200).json({ message: 'Level updated successfully', data: level })

    } catch (e) {
        errorHandler(res, 500, e)
    }
}