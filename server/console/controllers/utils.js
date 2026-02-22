const os = require('os')

const User = require('../models/mongo.users')
const Course = require('../models/mongo.courses')
const config = require('../config/cfg')

module.exports.getStatusInfo = async (req, res) => {
    let c = []
    let u = []
    if (global.db.status === 'connected') {
        c = await Course.find({})
        u = await User.find({})
    }
    res.status(200).json({
        status: global.server.status,
        uptime: os.uptime(),
        launchTime: global.launchTime,
        courses: c,
        users: u,
        db_status: global.db.status
    })
}