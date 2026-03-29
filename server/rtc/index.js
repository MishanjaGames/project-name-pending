require('dotenv').config()

const express    = require('express')
const http       = require('http')
const { Server } = require('socket.io')
const cors       = require('cors')

const config           = require('./config')
const { socketAuth }   = require('./auth')
const registerHandlers = require('./handlers')
const rooms            = require('./rooms')
const roomsRouter      = require('./routes.rooms')

const app    = express()
const server = http.createServer(app)

// ── MongoDB (optional) ────────────────────────────────────────────────────────
if (config.MONGO_URI) {
    const mongoose = require('mongoose')
    mongoose.connect(config.MONGO_URI)
        .then(() => console.log('[mongo] connected'))
        .catch(e => console.error('[mongo] connection error:', e.message))
}

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin:      config.ALLOWED_ORIGINS,
        methods:     ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
})

// JWT auth for every socket connection
io.use(socketAuth)

// Register all signaling event handlers
registerHandlers(io)

// ── REST ──────────────────────────────────────────────────────────────────────
app.use(cors({ origin: config.ALLOWED_ORIGINS, credentials: true }))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
    res.json({
        status:    'ok',
        uptime:    process.uptime(),
        rooms:     rooms.listAll(),
        timestamp: new Date().toISOString()
    })
})

// ICE server config (public — clients fetch before connecting)
app.get('/ice-config', (_req, res) => {
    res.json({ iceServers: config.ICE_SERVERS })
})

// Room management REST API
// POST   /rooms              — create / upsert a room (returns joinPath)
// GET    /rooms/:roomId      — get room settings
// PATCH  /rooms/:roomId      — update room settings
// GET    /rooms/by-session/:sessionId — look up room for a session
app.use('/rooms', roomsRouter)

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(config.PORT, () => {
    console.log(`RTC signaling server listening on port ${config.PORT}`)
    console.log(`Allowed origins: ${config.ALLOWED_ORIGINS.join(', ')}`)
    console.log(`Mongo: ${config.MONGO_URI ? 'enabled' : 'disabled (in-memory only)'}`)
})
