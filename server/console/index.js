const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const morgan = require('morgan')
const cors = require('cors')

const config = require('./config/cfg')
const restRouter = require('./routes/rest')
const { loadAPI, useAPI } = require('./utils/connectionHandler')

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

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//API Selector
loadAPI()
useAPI()
const DB = global.API.module
DB.use()

// {
// "email": "root@local.com",
// "password": "r00t5up3r53cr3tp4ss@cc3s5"
// }
// {
// "email": "user@local.com",
// "password": "b7g#d&iRyDVIdk!f"
// }

app.use('/api', restRouter)

app.listen(config.PORT, () => {
    console.log(`REST Server started at http://localhost:${config.PORT}`)
})

