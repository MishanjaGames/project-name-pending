const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const User = require('../models/mongo.users')
const Role = require('../models/mongo.roles')
const config = require('../config/config')

const errorHandler = require('./errorHandler')

module.exports.createToken = (payload, secret, expiresIn) => {
    return jwt.sign({
        userId: payload._id,
        email: payload.email,
        role: payload.role
    }, secret, expiresIn || { expiresIn: 60 * 60 * 4 }) // 60 * 60 * 4
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
    else {
        if (accessLevel === permission) return true;
        else if (accessLevel === 'root') return true;
        else if (accessLevel === 'admin' && (permission === 'manage' || permission === 'quality' || permission === 'create' || permission === 'default')) return true;
        else if (accessLevel === 'manage' && (permission === 'quality' || permission === 'create' || permission === 'default')) return true;
        else if (accessLevel === 'quality' && (permission === 'create' || permission === 'default')) return true;
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
