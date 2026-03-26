const os = require('os')
const User = require('../models/mongo.users')
const Course = require('../models/mongo.courses')

module.exports.getStatusInfo = async (req, res) => {
    let courses = []
    let users = []

    if (global.db.status === 'connected') {
        courses = await Course.find({})
        users = await User.find({})
    }

    res.status(200).json({
        status: global.server.status,
        uptime: os.uptime(),
        launchTime: global.launchTime,
        courses,
        users,
        db_status: global.db.status
    })
}