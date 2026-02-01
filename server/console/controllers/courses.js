const utils = require('../utils/utils')
const Courses = require('../models/mongo.courses')
const errorHandler = require('../utils/errorHandler')

// module.exports.getCurrent = async (req, res) => {
//     const token = req.headers.authorization.split(" ")[1];
//     const data = await utils.parseToken(token);
//     return res.json({ user: data })
// }

module.exports.getAll = async (req, res) => {
    try {
        const course = await Courses.find({})
        res.status(200).json({ data: course })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.getById = async (req, res) => {

    try {
        const course = await Courses.findById(req.params.id)

        if (course) {
            res.status(200).json({ status: 'Course successfully found', data: course })
        } else {
            errorHandler(res, 404, e)
        }

    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.create = async (req, res) => {

    try {
        // const password = await utils.generatePasswordHash(req.body.password);
        // console.log(password.hash);
        const course = await new Courses({
            userId: req.body.userId,
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            level: req.body.level,
            direction: req.body.direction,
            links: req.body.links,
            createdAt: Date.now(),
            updatedAt: Date.now()
        })

        await course.save()

        res.status(201).json({
            message: 'Course created successfully',
            data: course
        })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.remove = async (req, res) => {
    try {
        await Courses.deleteOne({
            _id: req.params.id
        })

        res.status(200).json({
            message: 'Course deleted successfully', data: { _id: req.params.id }
        })
    } catch (e) {
        errorHandler(res, 500, e)
    }
}

module.exports.update = async (req, res) => {
    try {
        const updatedCourse = {
            userId: req.body.userId,
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            level: req.body.level,
            direction: req.body.direction,
            links: req.body.links,
            updatedAt: Date.now()
        }

        const course = await Courses.findByIdAndUpdate(
            {
                _id: req.params.id
            },
            {
                $set: updatedCourse
            },
            {
                new: true
            })

        res.status(200).json({ message: 'Course updated successfully', data: course })

    } catch (e) {
        errorHandler(res, 500, e)
    }
}