const express  = require('express')
const crypto   = require('crypto')
const config   = require('./config')
const { verifyToken } = require('./auth')

const router = express.Router()

// Lazy-load the Mongoose model only when Mongo is configured
let RtcRoom = null
function getModel() {
    if (RtcRoom) return RtcRoom
    if (!config.MONGO_URI) return null
    RtcRoom = require('./rtcRoom.model')
    return RtcRoom
}

// ── Auth middleware for REST ──────────────────────────────────────────────────
function restAuth(req, res, next) {
    const header = req.headers.authorization || ''
    const token  = header.startsWith('Bearer ') ? header.slice(7) : header
    const user   = verifyToken(token)
    if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' })
    req.user = user
    next()
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateSlug() {
    return crypto.randomBytes(6).toString('hex') // e.g. "a3f9c12b4e67"
}

function roomResponse(room) {
    return {
        roomId:      room.roomId,
        sessionId:   room.sessionId,
        displayName: room.displayName,
        settings:    room.settings,
        status:      room.status,
        createdAt:   room.createdAt,
        // Convenience: full joinable URL (front-end base URL not known here,
        // so we return just the path; front-end builds the full URL)
        joinPath:    `/room/${room.roomId}`
    }
}

// ── POST /rooms — create a new room ──────────────────────────────────────────
/**
 * Body (all optional):
 *   sessionId   — tie room to an existing session (_id)
 *   displayName — human-readable label
 *   settings    — { maxParticipants, lobbyEnabled, joinMuted, joinVideoOff }
 *
 * If sessionId is provided the roomId is set to "session:<sessionId>".
 * Otherwise a random slug is generated.
 * Re-posting with the same sessionId returns the existing room (upsert).
 */
router.post('/', restAuth, async (req, res) => {
    const { sessionId, displayName = '', settings = {} } = req.body

    const roomId = sessionId ? `session:${sessionId}` : generateSlug()

    const Model = getModel()

    if (Model) {
        try {
            const room = await Model.findOneAndUpdate(
                { roomId },
                {
                    $setOnInsert: { roomId, createdBy: req.user.userId },
                    $set: {
                        sessionId:   sessionId || null,
                        displayName: displayName || roomId,
                        updatedAt:   new Date(),
                        status:      'active',
                        settings: {
                            allowGuests:     false,
                            maxParticipants: settings.maxParticipants  ?? 0,
                            lobbyEnabled:    settings.lobbyEnabled     ?? false,
                            joinMuted:       settings.joinMuted        ?? true,
                            joinVideoOff:    settings.joinVideoOff     ?? true
                        }
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            )
            return res.json(roomResponse(room))
        } catch (e) {
            console.error('[rooms] create error', e)
            return res.status(500).json({ error: 'Database error' })
        }
    }

    // Mongo not configured — return in-memory room stub
    return res.json({
        roomId,
        sessionId:   sessionId || null,
        displayName: displayName || roomId,
        settings:    { allowGuests: false, maxParticipants: 0, lobbyEnabled: false, joinMuted: true, joinVideoOff: true },
        status:      'active',
        createdAt:   new Date(),
        joinPath:    `/room/${roomId}`
    })
})

// ── GET /rooms/:roomId — fetch room settings ──────────────────────────────────
router.get('/:roomId', restAuth, async (req, res) => {
    const { roomId } = req.params
    const Model = getModel()

    if (Model) {
        try {
            const room = await Model.findOne({ roomId })
            if (!room) return res.status(404).json({ error: 'Room not found' })
            return res.json(roomResponse(room))
        } catch (e) {
            console.error('[rooms] get error', e)
            return res.status(500).json({ error: 'Database error' })
        }
    }

    // Mongo not configured — return minimal stub so the client can still join
    return res.json({
        roomId,
        sessionId:   null,
        displayName: roomId,
        settings:    { allowGuests: false, maxParticipants: 0, lobbyEnabled: false, joinMuted: true, joinVideoOff: true },
        status:      'active',
        createdAt:   null,
        joinPath:    `/room/${roomId}`
    })
})

// ── PATCH /rooms/:roomId — update settings ────────────────────────────────────
router.patch('/:roomId', restAuth, async (req, res) => {
    const { roomId } = req.params
    const { displayName, settings = {}, status } = req.body
    const Model = getModel()
    if (!Model) return res.status(503).json({ error: 'Mongo not configured' })

    try {
        const update = { updatedAt: new Date() }
        if (displayName !== undefined) update.displayName = displayName
        if (status      !== undefined) update.status      = status
        if (settings.maxParticipants  !== undefined) update['settings.maxParticipants']  = settings.maxParticipants
        if (settings.lobbyEnabled     !== undefined) update['settings.lobbyEnabled']     = settings.lobbyEnabled
        if (settings.joinMuted        !== undefined) update['settings.joinMuted']        = settings.joinMuted
        if (settings.joinVideoOff     !== undefined) update['settings.joinVideoOff']     = settings.joinVideoOff

        const room = await RtcRoom.findOneAndUpdate({ roomId }, { $set: update }, { new: true })
        if (!room) return res.status(404).json({ error: 'Room not found' })
        return res.json(roomResponse(room))
    } catch (e) {
        console.error('[rooms] patch error', e)
        return res.status(500).json({ error: 'Database error' })
    }
})

// ── GET /rooms/by-session/:sessionId ─────────────────────────────────────────
router.get('/by-session/:sessionId', restAuth, async (req, res) => {
    const Model = getModel()
    if (!Model) {
        const roomId = `session:${req.params.sessionId}`
        return res.json({ roomId, joinPath: `/room/${roomId}` })
    }
    try {
        const room = await Model.findOne({ sessionId: req.params.sessionId })
        if (!room) return res.status(404).json({ error: 'No room for this session' })
        return res.json(roomResponse(room))
    } catch (e) {
        return res.status(500).json({ error: 'Database error' })
    }
})

module.exports = router
