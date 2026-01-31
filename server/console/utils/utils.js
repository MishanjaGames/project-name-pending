const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const os = require('os')

const User = require('../models/users')
const UserControl = require('../controllers/users')
const Role = require('../models/roles')
const RoleControl = require('../controllers/roles')
const Course = require('../models/courses')
const CourseControl = require('../controllers/courses')
const config = require('../config/config')

const errorHandler = require('./errorHandler')

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

module.exports.createToken = (payload, secret, expiresIn) => {
    return jwt.sign({
        userId: payload._id,
        email: payload.email,
        role: payload.role
    }, secret, expiresIn || { expiresIn: 60 * 60 * 2 })
}

module.exports.parseToken = async (token) => {
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const userDb = await User.findById(decoded.userId);
        if (userDb) {
            return userDb;
        }
        else {
            return 'Error';
        }
    } catch (e) {
        console.log(e.message);
    }
}

module.exports.generatePasswordHash = async (password) => {
    if (!password) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        password = '';
        for (let i = 0; i < config.PASSWORD_LENGTH; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    const salt = bcrypt.genSaltSync(2056);
    const hash = bcrypt.hashSync(password, salt)
    return { hash, password };
}

const comparePermission = (accessLevel, permission) => {
    if (!accessLevel) return false;
    else {
        if (accessLevel === permission) return true;
        else if (accessLevel === 'root') return true;
        else if (accessLevel === 'admin' && (permission === 'manage' || permission === 'create' || permission === 'default')) return true;
        else if (accessLevel === 'manage' && (permission === 'create' || permission === 'default')) return true;
        else if (accessLevel === 'create' && permission === 'default') return true;
        else return false;
    }
}

module.exports.validate = (permission) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

            if (!token) {
                return errorHandler(res, 401, 'No token provided');
            }

            const decoded = jwt.verify(token, config.JWT_SECRET);
            const userDb = await User.findById(decoded.userId);

            if (!userDb) {
                return errorHandler(res, 404, 'ACCESS DENIED: User not found');
            }

            const roleDb = await Role.findById(userDb.role);

            if (!roleDb) {
                return errorHandler(res, 404, 'ACCESS DENIED: Role not found');
            }

            if (comparePermission(roleDb.accessLevel, permission)) {
                next();
            } else {
                errorHandler(res, 403, `ACCESS DENIED: Permission '${permission}' denied`);
            }
        }
        catch (e) {
            errorHandler(res, 500, e.message);
        }
    }
}

module.exports.fillDatabase = async () => {
    const roles = await Role.find({});
    console.log(roles.length);
    // if (!roles || roles.length < 4){
    //     Role.deleteMany({})
    //     RoleControl.create(req={
    //         body:{
    //             roleName: 'root',
    //             accessLevel: 'root'
    //         }
    //     });
    //     RoleControl.create(req={
    //         body:{
    //             roleName: 'admin',
    //             accessLevel: 'admin'
    //         }
    //     });
    //     RoleControl.create(req={
    //         body:{
    //             roleName: 'manager',
    //             accessLevel: 'manage'
    //         }
    //     });
    //     RoleControl.create(req={
    //         body:{
    //             roleName: 'creator',
    //             accessLevel: 'create'
    //         }
    //     });
    //     RoleControl.create(req={
    //         body:{
    //             roleName: 'user',
    //             accessLevel: 'default'
    //         }
    //     });
    //     console.log('DB_Module> MESSAGE: Table \'Roles\' has been rewritten')
    // }
    const users = await User.find({});
    console.log(await Role.findOne({ roleName: 'root' }));
    console.log(users);
    // if (!users || users.length < 2) {
    //     User.deleteMany({})
    //     UserControl.create({
    //         body:{
    //             email: 'root@local.com',
    //             password: 'r00t5up3r53cr3tp4ss@cc3s5',
    //             role: await Role.find({roleName === 'root'})._id,
    //             nickname: 'console'
    //         }
    //     });
    //     UserControl.create({
    //         body:{
    //             email: 'user@local.com',
    //             password: 'b7g#d&iRyDVIdk!f',
    //             nickname: 'preview'
    //         }
    //     });
    //     console.log('DB_Module> MESSAGE: Table \'Users\' has been rewritten')
    // }

    console.log('DB_Module> MESSAGE: Database is Up to Date')
}