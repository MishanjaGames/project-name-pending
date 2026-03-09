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
    direction: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    ratings: {
        type: Number,
        required: false
    },
    followers: {
        type: Number,
        required: false
    },
    price: {
        type: Number,
        required: true
    },
    base_lang: {
        type: String,
        required: true,
        enum: ['en', 'ua']
    },
    add_langs:[{
        type: String,
        required: true
    }],
    trans: [{
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
    }],
    volumes: [{
        vid: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: false,
            enum: ['container', 'image', 'video', 'audio', 'document', 'archive', 'other']
        },
        url: {
            type: String,
            required: false,
            description: 'Full path (e.g., /api/manage/courses/456/thumbnail.jpg)'
        },
        chapters: [{
            cid: {
                type: String,
                required: true,
            },
            title: {
                type: String,
                required: true,
            },
            type: {
                type: String,
                required: false,
                enum: ['container', 'image', 'video', 'audio', 'document', 'archive', 'other']
            },
            url: {
                type: String,
                required: false,
                description: 'Full path (e.g., /api/manage/courses/456/thumbnail.jpg)'
            },
            items: [{
                iid: {
                    type: String,
                    required: true,
                },
                title: {
                    type: String,
                    required: true,
                },
                type: {
                    type: String,
                    required: false,
                    enum: ['image', 'video', 'audio', 'document', 'archive', 'other']
                },
                url: {
                    type: String,
                    required: false,
                    description: 'Full path (e.g., /api/manage/courses/456/thumbnail.jpg)'
                }
            }]
        }]
    }],
    links: [{
        type: {
            type: String,
            required: false,
            enum: ['image', 'video', 'audio', 'document', 'archive', 'other']
        },
        url: {
            type: String,
            required: false,
            description: 'Full path (e.g., /api/manage/courses/456/thumbnail.jpg)'
        },
        filename: {
            type: String,
            required: false,
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