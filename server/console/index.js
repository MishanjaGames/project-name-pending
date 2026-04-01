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

app.use(cors({ origin: true, credentials: true }))
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

const protocol = config.USE_HTTPS ? 'HTTPS' : 'HTTP';
const url = config.USE_HTTPS 
    ? `https://localhost:${config.PORT}`
    : `http://localhost:${config.PORT}`;

app.listen(config.PORT, () => {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`REST Server started at ${url}`);
    console.log(`Protocol: ${protocol} | Port: ${config.PORT}`);
    console.log(`API URL: ${config.SERVICE_URLS.API}`);
    console.log(`RTC URL: ${config.SERVICE_URLS.RTC}`);
    console.log(`WEB URL: ${config.SERVICE_URLS.WEB}`);
    console.log(`${'═'.repeat(70)}\n`);
})