const mongoose = require('mongoose')
const Schema = mongoose.Schema

const courseSchema = new Schema({
    userId: {
        ref: 'users',
        type: Schema.Types.ObjectId,
        required: true
    },
    status:{
        type: String,
        enum: ['editing','on-check','deployed'],
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
    direction: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['junior', 'middle', 'senior'],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    links: [{
        type: String,
        required: false
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