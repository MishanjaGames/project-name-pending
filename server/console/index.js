const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const passport = require('passport')
const morgan = require('morgan')
const cors = require('cors')

const config = require('./config/config')
const restRouter = require('./routes/rest')

const app = express()

app.use(cors({
    origin: 'http://localhost:3000', // адрес фронтенда
    credentials: true                // разрешение кросс-доменных cookie
}));

app.use(passport.initialize())
require('./middleware/passport')(passport)

mongoose.connect(config.DB_URL, { dbName: "P_01" })
    .then(() => {
        console.log('DB_Module> STATUS: [CONNECTED]')
    })
    .catch(err => console.log('DB_Module> STATUS: ', err))

app.use(morgan('dev'))

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// {
// "email": "root@local.com",
// "password": "r00t5up3r53cr3tp4ss@cc3s5"
// }
// {
// "email": "user@local.com",
// "password": "b7g#d&iRyDVIdk!f"
// }
app.use('/api/', restRouter)

app.listen(config.PORT, () => {
    console.log(`REST Server started at http://localhost:${config.PORT}`)
})

