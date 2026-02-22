const mongoose = require('mongoose')
const Schema = mongoose.Schema
 
const roleSchema = new Schema({
    directionName: {
        type: String,
        default: 'user',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('directions', roleSchema)