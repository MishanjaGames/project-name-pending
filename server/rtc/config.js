require('dotenv').config();

// ═══════════════════════════════════════════════════════════════════════════
// PROTOCOL SELECTION: Automatically select ports and URLs based on USE_HTTPS
// ═══════════════════════════════════════════════════════════════════════════
const useHttps = false;

// Select port based on protocol
const rtcPort = useHttps
    ? parseInt(process.env.RTC_PORT_HTTPS || '5051', 10)
    : parseInt(process.env.RTC_PORT_HTTP || '5050', 10);

// Select service URLs based on protocol
const apiUrl = useHttps
    ? (process.env.API_URL_S || 'https://localhost:4043/api')
    : (process.env.API_URL || 'http://localhost:4040/api');

const rtcUrl = useHttps
    ? (process.env.RTC_URL_S || 'https://localhost:5051')
    : (process.env.RTC_URL || 'http://localhost:5050');

module.exports = {
    // ─────────────────────────────────────────────────────────────────────
    // Protocol & Port Configuration
    // ─────────────────────────────────────────────────────────────────────
    USE_HTTPS:              useHttps,
    PORT:                   rtcPort || parseInt(process.env.PORT, 10) || 5050,

    // Service URLs (for internal references and logging)
    SERVICE_URLS: {
        API:                apiUrl,
        RTC:                rtcUrl,
    },

    // ─────────────────────────────────────────────────────────────────────
    // JWT & Authentication
    // ─────────────────────────────────────────────────────────────────────
    JWT_SECRET:             'Z3H@u8E#375Q[hKxAprDFGmERb05' || process.env.JWT_SECRET,

    // ─────────────────────────────────────────────────────────────────────
    // CORS Configuration
    // ─────────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS:        (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim()),

    // ─────────────────────────────────────────────────────────────────────
    // Database Configuration
    // ─────────────────────────────────────────────────────────────────────
    MONGO_URI:              process.env.MONGO_URI || null,

    // ─────────────────────────────────────────────────────────────────────
    // ICE Servers (STUN/TURN for WebRTC)
    // ─────────────────────────────────────────────────────────────────────
    ICE_SERVERS: [
        ...((process.env.STUN_URLS || 'stun:stun.l.google.com:19302').split(',').map(url => ({ urls: url.trim() }))),
        ...(process.env.TURN_URL ? [{
            urls:       process.env.TURN_URL,
            username:   process.env.TURN_USERNAME || '',
            credential: process.env.TURN_CREDENTIAL || ''
        }] : [])
    ]
};
