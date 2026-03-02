const mongoose = require('mongoose')
const Schema = mongoose.Schema
 
const formSchema = new Schema({
    purpose: {
        type: String,
        default: 'default',
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: false,
        description: 'Full path (e.g., /api/manage/courses/456/thumbnail.jpg)'
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('forms', formSchema)