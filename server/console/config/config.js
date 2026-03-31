require('dotenv').config();

module.exports = {
    PORT:            parseInt(process.env.PORT, 10) || 4040,
    DB:              process.env.DB_DRIVER || 'mongo',
    //DB_NAME:         process.env.DB_NAME || 'P_01',
    DB_NAME:         'P_01',
    //DB_URL:             process.env.MONGODB_URI || process.env.DB_URL || 'mongodb://localhost:27017',
    DB_URL:             'mongodb+srv://mishanja:qwerty123@cluster0.oewbabf.mongodb.net/?appName=Cluster0',
    DO_RECONNECT:    process.env.DO_RECONNECT === 'true',
    //SECRET:             process.env.SECRET,
    SECRET:             '#K!x1$iSzC%Cs5uk:n7b8wcvM6pZlg6T.Uif9QBCIz2p7o3V:S!aMXEsDYtEG@BG',
    //JWT_SECRET:         process.env.JWT_SECRET,
    JWT_SECRET:         'Z3H@u8E#375Q[hKxAprDFGmERb05',
    JWT_EXPIRES_IN:  parseInt(process.env.JWT_EXPIRES_IN, 10) || 14400,
    PASSWORD_LENGTH: parseInt(process.env.PASSWORD_LENGTH, 10) || 16,
    ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean),
};
