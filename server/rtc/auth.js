const jwt = require('jsonwebtoken')
const config = require('./config')

/**
 * Verify a Bearer token from the Authorization header or socket handshake.
 * Returns the decoded payload { userId, email, role } or null.
 */
async function verifyToken(token) {
    if (!token) return null
    try {
        // Strip "Bearer " prefix if present
        const raw = token.startsWith('Bearer ') ? token : `Bearer ${token}`
        return jwt.verify(raw, config.JWT_SECRET)
    } catch {
        return null
    }
}

/**
 * Socket.IO middleware — attaches user payload to socket.data.user
 * or disconnects with UNAUTHORIZED if token is invalid.
 */
function socketAuth(socket, next) {
    // Accept token from multiple places socket.io clients might send it
    const raw =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization ||
        socket.handshake.query?.token ||
        ''

    // Normalise — strip Bearer prefix if the client included it
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw

    if (!token) {
        console.warn('[auth] no token provided, ip:', socket.handshake.address)
        return next(new Error('UNAUTHORIZED'))
    }

    const user = verifyToken(token)
    if (!user) {
        console.warn('[auth] invalid token, ip:', socket.handshake.address, 'token prefix:', token.slice(0, 20))
        return next(new Error('UNAUTHORIZED'))
    }
    socket.data.user = user  // { userId, email, role }
    next()
}

module.exports = { verifyToken, socketAuth }