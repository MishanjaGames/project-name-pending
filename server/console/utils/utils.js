const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const User = require('../models/mongo.users')
const Role = require('../models/mongo.roles')
const config = require('../config/config')

const errorHandler = require('./errorHandler')

module.exports.createToken = (payload, secret, expiresIn, useTemplate = true) => {
    if (useTemplate) {
        return jwt.sign({
            userId: payload._id,
            email: payload.email,
            role: payload.role
        }, secret, expiresIn || { expiresIn: 60 * 60 * 4 }) // 60 * 60 * 4
    }
    else {
        return jwt.sign({
            _: payload
        }, secret, expiresIn || { expiresIn: 60 * 60 * 4 }) // 60 * 60 * 4
    }
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

module.exports.extendToken = async (req) => {
    try {
        const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

        let userId;
        if (token && token !== 'undefined') {
            const decoded = jwt.verify(token, config.JWT_SECRET,
                { ignoreExpiration: true });
            userId = decoded.userId;
        }
        else if (req.body?.data?._id) {
            userId = req.body.data._id;
        }
        else {
            return 'No token or userId provided';
        }

        const userDb = await User.findById(userId);
        if (!userDb) {
            return 'User not found';
        }

        const newToken = jwt.sign(
            {
                userId: userDb._id,
                email: userDb.email,
                role: userDb.role
            },
            config.JWT_SECRET,
            { expiresIn: 60 * 60 * 4 } //60 * 60 * 4
        );

        return newToken;

    } catch (e) {
        console.error('Token extension error:', e.message);
        return undefined;
    }
};

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
    // Hierarchy: default < create < tutor < quality < manage < admin < root
    const LEVELS = ['default', 'create', 'tutor', 'quality', 'manage', 'admin', 'root'];
    const ai = LEVELS.indexOf(accessLevel);
    const pi = LEVELS.indexOf(permission);
    if (ai === -1 || pi === -1) return accessLevel === permission;
    return ai >= pi;
}

// Tutor sub-rank hierarchy (ascending)
const TUTOR_RANKS = ['assistant', 'teacher', 'lecturer', 'instructor', 'tutor', 'professor'];

/**
 * Check if a tutorRank meets or exceeds a required minimum rank.
 * Returns true if userRank >= minRank in TUTOR_RANKS order.
 */
module.exports.checkTutorRank = (userRank, minRank) => {
    if (!userRank || !minRank) return false;
    const ui = TUTOR_RANKS.indexOf(userRank);
    const mi = TUTOR_RANKS.indexOf(minRank);
    if (ui === -1 || mi === -1) return false;
    return ui >= mi;
};

module.exports.TUTOR_RANKS = TUTOR_RANKS;

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
