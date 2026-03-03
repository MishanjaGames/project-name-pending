const mongo = require('mongoose')
const config = require('../config/config')

module.exports.use = () => {
    // mongo.createConnection(config.DB_URL, { dbName: "P_01" })
    console.log('DB_Module> LAUNCHING')
    this.open();
    mongo.connection.on('connected', () => {
        console.log('DB_Module> STATUS: [CONNECTED]')
    })
    mongo.connection.on('open', () => {
        console.log('DB_Module> STATUS: [READY]')
        global.db.status = 'connected'
    })
    mongo.connection.on('disconnected', () => {
        if (config.DO_RECONNECT) {
            console.log('DB_Module> STATUS: [DISCONNECTED]\n' +
                'DB_Module> STATUS: [CONNECTING...]')
            global.db.status = 'reconnecting'
            this.open();
        }
        else {
            console.log('DB_Module> STATUS: [DISCONNECTED]')
        }
    })
    mongo.connection.on('close', () => {
        if (!config.DO_RECONNECT) {
            console.log('DB_Module> STATUS: [DROPPED]')
            global.db.status = 'disconnected'
        }
    })
}

module.exports.open = (url = config.DB_URL, options = { dbName: "P_01" }) => {
    mongo.connect(url, options)
        .catch(err => console.log('DB_Module> STATUS: ', err))
}

module.exports.close = () => {
    mongo.connection.close()
}