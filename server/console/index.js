require('dotenv').config()

const express    = require('express')
const bodyParser = require('body-parser')
const passport   = require('passport')
const morgan     = require('morgan')
const cors       = require('cors')

const config      = require('./config/config')
const restRouter  = require('./routes/rest')
const { loadAPI, useAPI } = require('./utils/connectionHandler')
const logger      = require('./utils/logger')

global.appState = {
    server:    { status: 'ok' },
    db:        { status: 'ok' },
    launchTime: Date.now(),
    API: { name: '', config: '', module: null }
}

const app = express()

app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }))
app.use(passport.initialize())
require('./middleware/passport')(passport)
app.use(morgan('dev'))
app.use((req, _res, next) => { logger.logRequest(req); next() })
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

loadAPI()
useAPI()
global.appState.API.module.use()

app.use('/api', restRouter)

app.listen(config.PORT, () => {
    console.log(`REST Server started at http://localhost:${config.PORT}`)
})