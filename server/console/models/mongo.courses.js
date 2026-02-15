const mongoose = require('mongoose')
const Schema = mongoose.Schema

const courseSchema = new Schema({
    userId: {
        ref: 'users',
        type: Schema.Types.ObjectId,
        required: true
    },
    status: {
        type: String,
        required: false,
        default: 'editing'
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false,
        default: ''
    },
    skills: [{
        type: String,
        required: false
    }],
    direction: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    links: [{
        type: {
            type: String,
            required: false,
            enum: ['image', 'video', 'document', 'other']
        },
        url: {
            type: String,
            required: false,
            description: 'Full path including filename and extension (e.g., /api/manage/courses/456/thumbnail.jpg)'
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

module.exports = mongoose.model('courses', courseSchema)