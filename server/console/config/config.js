module.exports = {
    PORT: process.env.DB || 4040,
    PASSWORD_LENGTH: 16,
    DB: process.env.DB || 'mongo',
    DO_RECONNECT: process.env.reconnect || false,
    DB_URL: "mongodb+srv://mishanja:qwerty123@cluster0.oewbabf.mongodb.net/?appName=Cluster0",
    JWT_SALT: 13764,
    JWT_SECRET: 'Z3H@u8E#375Q[hKxAprDFGmERb05'
}