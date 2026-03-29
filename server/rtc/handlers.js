const rooms = require('./rooms')
const config = require('./config')

/**
 * All WebRTC signaling events handled here.
 *
 * Client → Server events:
 *   join          { roomId, nickname }          — join a room
 *   leave         { roomId }                    — explicit leave
 *   offer         { to, sdp }                   — forward SDP offer to peer
 *   answer        { to, sdp }                   — forward SDP answer to peer
 *   ice-candidate { to, candidate }             — forward ICE candidate to peer
 *   toggle-media  { roomId, video, audio }      — broadcast media state change
 *
 * Server → Client events:
 *   joined        { roomId, peers, iceServers } — confirmation + existing peers
 *   peer-joined   { peer }                      — a new peer entered the room
 *   peer-left     { socketId }                  — a peer disconnected
 *   offer         { from, sdp }                 — incoming offer
 *   answer        { from, sdp }                 — incoming answer
 *   ice-candidate { from, candidate }           — incoming ICE candidate
 *   media-state   { socketId, video, audio }    — peer toggled media
 *   error         { message }                   — error feedback
 */
module.exports = function registerHandlers(io) {
    io.on('connection', (socket) => {
        const { userId, email } = socket.data.user

        // ── join ──────────────────────────────────────────────────────────────
        socket.on('join', ({ roomId, nickname }) => {
            if (!roomId) { socket.emit('error', { message: 'roomId is required' }); return }

            const peerInfo = { userId, nickname: nickname || email, socketId: socket.id }

            // Get existing peers BEFORE adding self
            const existingPeers = rooms.getPeers(roomId)

            // Add self to room
            rooms.addPeer(roomId, socket.id, peerInfo)
            socket.join(roomId)

            // Confirm join with existing peers list and ICE server config
            socket.emit('joined', {
                roomId,
                peers: existingPeers,
                iceServers: config.ICE_SERVERS
            })

            // Notify existing peers
            socket.to(roomId).emit('peer-joined', { peer: peerInfo })

            console.log(`[join] ${nickname || email} → room ${roomId} (${existingPeers.length + 1} peers)`)
        })

        // ── leave ─────────────────────────────────────────────────────────────
        socket.on('leave', ({ roomId }) => {
            _leaveRoom(socket, roomId)
        })

        // ── offer ─────────────────────────────────────────────────────────────
        socket.on('offer', ({ to, sdp }) => {
            if (!to || !sdp) return
            io.to(to).emit('offer', { from: socket.id, sdp })
        })

        // ── answer ────────────────────────────────────────────────────────────
        socket.on('answer', ({ to, sdp }) => {
            if (!to || !sdp) return
            io.to(to).emit('answer', { from: socket.id, sdp })
        })

        // ── ice-candidate ─────────────────────────────────────────────────────
        socket.on('ice-candidate', ({ to, candidate }) => {
            if (!to || !candidate) return
            io.to(to).emit('ice-candidate', { from: socket.id, candidate })
        })

        // ── toggle-media ──────────────────────────────────────────────────────
        socket.on('toggle-media', ({ roomId, video, audio }) => {
            socket.to(roomId).emit('media-state', { socketId: socket.id, video, audio })
        })

        // ── disconnect ────────────────────────────────────────────────────────
        socket.on('disconnecting', () => {
            for (const roomId of socket.rooms) {
                if (roomId !== socket.id) _leaveRoom(socket, roomId)
            }
        })

        socket.on('disconnect', () => {
            rooms.removePeer(socket.id)
        })
    })

    function _leaveRoom(socket, roomId) {
        socket.leave(roomId)
        rooms.removePeer(socket.id)
        socket.to(roomId).emit('peer-left', { socketId: socket.id })
        console.log(`[leave] ${socket.data.user.email} ← room ${roomId}`)
    }
}