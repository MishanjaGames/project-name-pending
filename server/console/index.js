const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const morgan = require('morgan')
const cors = require('cors')

const config = require('./config/cfg')
const restRouter = require('./routes/rest')
const { loadAPI, useAPI } = require('./utils/connectionHandler')
const logger = require('./utils/logger')

global = {
    server: {
        status: 'ok'
    },
    db:{
        status: 'ok',
    },
    launchTime: Date.now(),
    API: {
        name: '',
        config: '',
        module: null
    }
}

const app = express()

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:4000'], // адрес фронтенда
    credentials: true                // разрешение кросс-доменных cookie
}));

app.use(passport.initialize())
require('./middleware/passport')(passport)
app.use(morgan('dev'))

// Simple custom logging middleware
app.use((req, res, next) => {
    logger.logRequest(req)
    next()
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//API Selector
loadAPI()
useAPI()
const DB = global.API.module
DB.use()

app.use('/api', restRouter)

app.listen(config.PORT, () => {
    console.log(`REST Server started at http://localhost:${config.PORT}`)
})

