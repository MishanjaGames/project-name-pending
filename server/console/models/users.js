const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema({
    nickname: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: false
    },
    lastName: {
        type: String,
        required: false
    },
    login: {
        type: String,
        required: false,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        ref: 'roles',
        type: Schema.Types.ObjectId,
        default: '6976a61c9ff34d288d8de7f1',
        required: false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: false
    },
    github: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('users', userSchema)