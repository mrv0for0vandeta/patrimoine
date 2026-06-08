const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

/**
 * Request Logging Middleware
 * Uses Morgan for HTTP request logging
 */

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create write streams for different log files
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
    path.join(logsDir, 'error.log'),
    { flags: 'a' }
);

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
    if (!req._startTime || !res._startTime) {
        return null;
    }
    const ms = res._startTime - req._startTime;
    return ms.toFixed(3);
});

// Custom token for timestamp
morgan.token('timestamp', () => {
    return new Date().toISOString();
});

// Custom format for detailed logging
const detailedFormat = ':timestamp :remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Custom format for simple console logging
const simpleFormat = ':method :url :status :response-time ms - :res[content-length]';

// Development logger (console only)
const devLogger = morgan('dev', {
    skip: (req, res) => {
        // Skip logging for static files in development
        return req.url.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/);
    }
});

// Production logger (file + console)
const prodLogger = morgan(detailedFormat, {
    stream: accessLogStream,
    skip: (req, res) => {
        // Don't log successful health checks in production
        return req.url === '/health' && res.statusCode < 400;
    }
});

// Error logger (only log errors)
const errorLogger = morgan(detailedFormat, {
    stream: errorLogStream,
    skip: (req, res) => res.statusCode < 400
});

// Request logger middleware with timing
const requestLogger = (req, res, next) => {
    req._startTime = Date.now();

    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        if (req.body && Object.keys(req.body).length > 0) {
            console.log('Body:', JSON.stringify(req.body, null, 2));
        }
    }

    // Track response time
    const originalSend = res.send;
    res.send = function (data) {
        res._startTime = Date.now();
        originalSend.call(this, data);
    };

    next();
};

// Export appropriate logger based on environment
const logger = process.env.NODE_ENV === 'production'
    ? [prodLogger, errorLogger]
    : devLogger;

module.exports = {
    logger,
    requestLogger,
    accessLogStream,
    errorLogStream
};
