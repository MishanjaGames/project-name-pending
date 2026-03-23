const fs = require('fs');
const path = require('path');

// ============================================================================
// SIMPLE LOGGING SYSTEM
// ============================================================================

const LOGS_DIR = path.join(__dirname, '../../storage/logs');

// Ensure logs directory exists
function ensureLogsDir() {
    if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
}

ensureLogsDir();

/**
 * Get current timestamp in readable format
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').replace('Z', '');
}

/**
 * Get or create log file for current date
 * @returns {string} Path to log file
 */
function getLogFile() {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fileName = `app-${date}.log`;
    return path.join(LOGS_DIR, fileName);
}

/**
 * Write message to log file
 * @param {string} level - Log level (INFO, ERROR, WARN, REQUEST, DATA)
 * @param {string} message - Log message
 * @param {object} data - Optional data object
 */
function writeLog(level, message, data = null) {
    try {
        const timestamp = getTimestamp();
        const logFile = getLogFile();
        
        let logEntry = `[${timestamp}] [${level}] ${message}`;
        
        if (data) {
            if (typeof data === 'object') {
                logEntry += `\n  Data: ${JSON.stringify(data, null, 2)}`;
            } else {
                logEntry += `\n  Data: ${data}`;
            }
        }
        
        logEntry += '\n';
        
        // Append to log file
        fs.appendFileSync(logFile, logEntry);
        
        // Also console log for development
        const consoleColor = {
            'INFO': '\x1b[36m',    // Cyan
            'ERROR': '\x1b[31m',   // Red
            'WARN': '\x1b[33m',    // Yellow
            'REQUEST': '\x1b[34m', // Magenta
            'DATA': '\x1b[32m'     // Green
        };
        
        const reset = '\x1b[0m';
        const color = consoleColor[level] || reset;
        
        console.log(`${color}[${timestamp}] [${level}] ${message}${reset}`);
        if (data && typeof data === 'object') {
            //console.log(`  Data:`, data);
        }
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
}

/**
 * Log an incoming request
 * @param {object} req - Express request object
 */
function logRequest(req) {
    const message = `${req.method} ${req.originalUrl}`;
    const data = {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent')
    };
    writeLog('REQUEST', message, data);
}

/**
 * Log response data
 * @param {string} message - Description of the data
 * @param {object} data - Data being sent
 */
function logData(message, data) {
    writeLog('DATA', message, data);
}

/**
 * Log info message
 * @param {string} message - Log message
 * @param {object} data - Optional data
 */
function logInfo(message, data) {
    writeLog('INFO', message, data);
}

/**
 * Log warning message
 * @param {string} message - Log message
 * @param {object} data - Optional data
 */
function logWarn(message, data) {
    writeLog('WARN', message, data);
}

/**
 * Log error message
 * @param {string} message - Log message
 * @param {object} error - Error object
 */
function logError(message, error) {
    const errorData = {
        message: error?.message || error,
        stack: error?.stack
    };
    writeLog('ERROR', message, errorData);
}

/**
 * Read logs from a specific file
 * @param {string} date - Date string (YYYY-MM-DD) or 'today'
 * @param {number} lines - Number of last lines to read (default: all)
 * @returns {string} Log file content
 */
function readLogs(date = 'today', lines = null) {
    try {
        if (date === 'today') {
            date = new Date().toISOString().split('T')[0];
        }
        
        const logFile = path.join(LOGS_DIR, `app-${date}.log`);
        
        if (!fs.existsSync(logFile)) {
            return `No logs found for ${date}`;
        }
        
        let content = fs.readFileSync(logFile, 'utf8');
        
        if (lines) {
            const logLines = content.split('\n').filter(line => line.trim());
            content = logLines.slice(-lines).join('\n');
        }
        
        return content;
    } catch (error) {
        console.error('Error reading logs:', error);
        return '';
    }
}

/**
 * Get list of available log files
 * @returns {array} Array of log file names
 */
function getLogFiles() {
    try {
        ensureLogsDir();
        const files = fs.readdirSync(LOGS_DIR)
            .filter(f => f.endsWith('.log'))
            .sort()
            .reverse();
        return files;
    } catch (error) {
        console.error('Error reading log files:', error);
        return [];
    }
}

/**
 * Clear old logs (older than specified days)
 * @param {number} days - Delete logs older than this many days
 */
function clearOldLogs(days = 30) {
    try {
        ensureLogsDir();
        const files = fs.readdirSync(LOGS_DIR);
        const now = Date.now();
        const maxAge = days * 24 * 60 * 60 * 1000;
        
        files.forEach(file => {
            const filePath = path.join(LOGS_DIR, file);
            const stat = fs.statSync(filePath);
            
            if (now - stat.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath);
                logInfo(`Deleted old log file: ${file}`);
            }
        });
    } catch (error) {
        logError('Error clearing old logs', error);
    }
}

module.exports = {
    logRequest,
    logData,
    logInfo,
    logWarn,
    logError,
    readLogs,
    getLogFiles,
    clearOldLogs,
    getTimestamp
};
