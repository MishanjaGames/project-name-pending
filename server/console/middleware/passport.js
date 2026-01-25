const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt

const config = require('../config/config')

const mongoose = require('mongoose')
const User = mongoose.model('users')
 
const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.JWT_SECRET//key.jwt
}
 
module.exports = passport => {
    passport.use(
        new JwtStrategy(options, async (payLoad, done) => {
            try{
                const user = await (await User.findById(payLoad.userId)).isSelected('email id')
 
                if (user){
                    done(null, user)
                } else {
                    done(null, false)
                }
            }
            catch(e){
                console.log(e)
            }
        })
    )
}