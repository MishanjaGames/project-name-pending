const mongoose = require('mongoose');
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
    courses: [{
        ref: 'courses',
        type: Schema.Types.ObjectId,
        required: false
    }],
    links: [{
        type: {
            type: String,
            required: false,
            enum: ['image', 'video', 'document', 'other']
        },
        url: {
            type: String,
            required: false,
            description: 'Full path including filename and extension (e.g., /api/files/users/123/avatar.jpg)'
        },
        filename: {
            type: String,
            required: false,
            description: 'Original filename with extension'
        },
        accessLevel: {
            type: String,
            required: false,
            enum: ['default', 'create', 'manage', 'admin', 'root'],
            default: 'default',
            description: 'Minimum access level required to view this link'
        },
        description: {
            type: String,
            required: false
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    updatedAt: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('users', userSchema)