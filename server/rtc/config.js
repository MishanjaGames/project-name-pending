require('dotenv').config();

module.exports = {
    PORT:            parseInt(process.env.PORT, 10) || 5050,
    JWT_SECRET:      process.env.JWT_SECRET || 'Z3H@u8E#375Q[hKxAprDFGmERb05',
    ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim()),
    MONGO_URI:       process.env.MONGO_URI || null,
    ICE_SERVERS: [
        ...((process.env.STUN_URLS || 'stun:stun.l.google.com:19302').split(',').map(url => ({ urls: url.trim() }))),
        ...(process.env.TURN_URL ? [{
            urls:       process.env.TURN_URL,
            username:   process.env.TURN_USERNAME || '',
            credential: process.env.TURN_CREDENTIAL || ''
        }] : [])
    ]
};
