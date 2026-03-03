const mongoose = require('mongoose')
const Schema = mongoose.Schema
 
const levelSchema = new Schema({
    levelName: {
        type: String,
        default: 'default',
        required: true,
    },
    directionName: {
        type: String,
        default: 'default',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    updatedAt: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('levels', levelSchema)