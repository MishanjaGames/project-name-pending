/**
 * In-memory room registry.
 *
 * Room ID convention:  session:<sessionId>   — tied to a ManageSession session
 *                      or any arbitrary string for ad-hoc rooms
 *
 * Room shape:
 * {
 *   id:        string,
 *   peers:     Map<socketId, { userId, nickname, socketId, joinedAt }>
 *   createdAt: Date
 * }
 */

const rooms = new Map()

function getOrCreate(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, { id: roomId, peers: new Map(), createdAt: new Date() })
    }
    return rooms.get(roomId)
}

function get(roomId) {
    return rooms.get(roomId) || null
}

function addPeer(roomId, socketId, peerInfo) {
    const room = getOrCreate(roomId)
    room.peers.set(socketId, { ...peerInfo, socketId, joinedAt: new Date() })
    return room
}

function removePeer(socketId) {
    // Remove from every room this socket was in
    const affected = []
    for (const [roomId, room] of rooms) {
        if (room.peers.has(socketId)) {
            room.peers.delete(socketId)
            affected.push(roomId)
            // Clean up empty rooms
            if (room.peers.size === 0) rooms.delete(roomId)
        }
    }
    return affected
}

function getPeers(roomId) {
    const room = rooms.get(roomId)
    if (!room) return []
    return Array.from(room.peers.values())
}

function getRoomsForSocket(socketId) {
    const result = []
    for (const [roomId, room] of rooms) {
        if (room.peers.has(socketId)) result.push(roomId)
    }
    return result
}

function listAll() {
    return Array.from(rooms.entries()).map(([id, room]) => ({
        id,
        peerCount: room.peers.size,
        createdAt: room.createdAt
    }))
}

module.exports = { getOrCreate, get, addPeer, removePeer, getPeers, getRoomsForSocket, listAll }