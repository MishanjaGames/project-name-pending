require('dotenv').config();

// ═══════════════════════════════════════════════════════════════════════════
// PROTOCOL SELECTION: Automatically select ports and URLs based on USE_HTTPS
// ═══════════════════════════════════════════════════════════════════════════
const useHttps = process.env.USE_HTTPS || false;

// Select port based on protocol
const apiPort = useHttps
    ? parseInt(process.env.API_PORT_HTTPS || '4043', 10)
    : parseInt(process.env.API_PORT_HTTP || '4040', 10);

// Select service URLs based on protocol
const apiUrl = useHttps
    ? (process.env.API_URL_S || 'https://localhost:4043/api')
    : (process.env.API_URL || 'http://localhost:4040/api');

const rtcUrl = useHttps
    ? (process.env.RTC_URL_S || 'https://localhost:5051')
    : (process.env.RTC_URL || 'http://localhost:5050');

const webUrl = useHttps
    ? (process.env.WEB_URL_S || 'https://localhost:4004')
    : (process.env.WEB_URL || 'http://localhost:4000');

module.exports = {
    // ─────────────────────────────────────────────────────────────────────
    // Protocol & Port Configuration
    // ─────────────────────────────────────────────────────────────────────
    USE_HTTPS:              useHttps,
    PORT:                   apiPort || process.env.PORT || 4040,

    // Service URLs (for internal references and logging)
    SERVICE_URLS: {
        API:                apiUrl,
        RTC:                rtcUrl,
        WEB:                webUrl
    },

    // ─────────────────────────────────────────────────────────────────────
    // Database Configuration
    // ─────────────────────────────────────────────────────────────────────
    DB:                     process.env.DB_DRIVER || 'mongo',
    DB_NAME:                process.env.DB_NAME || 'P_01',
    DB_URL:                 'mongodb+srv://mishanja:qwerty123@cluster0.oewbabf.mongodb.net/?appName=Cluster0' || process.env.DB_URL || process.env.MONGODB_URI || process.env.MONGO_URI,
    DO_RECONNECT:           process.env.DO_RECONNECT === 'true',

    // ─────────────────────────────────────────────────────────────────────
    // JWT & Security
    // ─────────────────────────────────────────────────────────────────────
    SECRET:                 '#K!x1$iSzC%Cs5uk:n7b8wcvM6pZlg6T.Uif9QBCIz2p7o3V:S!aMXEsDYtEG@BG' || process.env.SECRET,
    JWT_SECRET:             'Z3H@u8E#375Q[hKxAprDFGmERb05' || process.env.JWT_SECRET,
    JWT_EXPIRES_IN:         parseInt(process.env.JWT_EXPIRES_IN, 10) || 14400,
    PASSWORD_LENGTH:        parseInt(process.env.PASSWORD_LENGTH, 10) || 16,

    // ─────────────────────────────────────────────────────────────────────
    // CORS Configuration
    // ─────────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS:        (process.env.ALLOWED_ORIGINS || 'https://localhost:3000').split(',').map(s => s.trim()).filter(Boolean),
};
