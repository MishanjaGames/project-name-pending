const express = require('express')
const mongoose = require('mongoose')
// const bodyParser = require('body-parser')
// const passport = require('passport')

const CONFIG = require('./config/cfg')

const app = express()
// app.use(passport.initialize())
// require('./middleware/passport')(passport)
// app.use(bodyParser.urlencoded())
// app.use(bodyParser.json())

// {
//     "email":"admin@local.com",
//     "password":"5upp3r53cr3tp4ss"
// }

mongoose.connect(CONFIG.DB_URL, {dbName: "PROJ_01"})
            .then( () => {
                console.log('MongoDB connected')
            })
            .catch( err => console.log(err))

app.get('/', (req, res) => {
    res.json({ message: "Hello my API" })
})

//app.use('/api/auth', authRouter)
//app.use('/api/category', categoryRouter)


app.listen(CONFIG.PORT, () => { console.log(`Server started at :${CONFIG.PORT}`) })

