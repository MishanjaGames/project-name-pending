const mongoose = require('mongoose')
const Schema = mongoose.Schema
 
const roleSchema = new Schema({
    levelName: {
        type: String,
        default: 'user',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('levels', roleSchema)