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
        required: false,
        default: 0,
        description: 'Computed average rating (0-5), auto-recalculated on each vote'
    },
    ratingsList: [{
        userId: {
            ref: 'users',
            type: require('mongoose').Schema.Types.ObjectId,
            required: true
        },
        value: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
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
        _id:{
            type: Schema.Types.ObjectId,
            required: false
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
    comments: [{
        userId: {
            ref: 'users',
            type: require('mongoose').Schema.Types.ObjectId,
            required: true
        },
        date: {
            type: Date,
            default: Date.now,
            required: true
        },
        text: {
            type: String,
            required: true,
            maxlength: 4000
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