/**
 * Global Error Handler Middleware
 * Handles all errors and returns appropriate JSON responses
 */

const errorHandler = (err, req, res, next) => {
    // Log error details
    console.error('Error occurred:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    // Database errors
    if (err.code && err.code.startsWith('SQLITE_')) {
        switch (err.code) {
            case 'SQLITE_CONSTRAINT':
                return res.status(400).json({
                    success: false,
                    error: 'Database constraint violation',
                    message: 'The operation violates database constraints. This may be due to duplicate data or invalid references.'
                });
            case 'SQLITE_BUSY':
                return res.status(503).json({
                    success: false,
                    error: 'Database busy',
                    message: 'The database is currently busy. Please try again in a moment.'
                });
            case 'SQLITE_LOCKED':
                return res.status(503).json({
                    success: false,
                    error: 'Database locked',
                    message: 'The database is temporarily locked. Please try again.'
                });
            case 'SQLITE_CORRUPT':
                return res.status(500).json({
                    success: false,
                    error: 'Database corruption',
                    message: 'Database integrity error. Please contact the system administrator.'
                });
        }
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            message: 'The provided authentication token is invalid.'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expired',
            message: 'Your authentication token has expired. Please log in again.'
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: err.message,
            details: err.details || null
        });
    }

    // Multer (file upload) errors
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            error: 'File upload error',
            message: err.message
        });
    }

    // Syntax errors (JSON parsing)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON',
            message: 'The request body contains invalid JSON.'
        });
    }

    // Default error response
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'An unexpected error occurred';

    res.status(statusCode).json({
        success: false,
        error: err.name || 'Error',
        message: message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err.details
        })
    });
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not found',
        message: `The requested resource ${req.method} ${req.url} was not found on this server.`,
        path: req.url,
        method: req.method
    });
};

/**
 * Async Route Handler Wrapper
 * Catches async errors and passes them to error handler
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Validation Error Creator
 */
class ValidationError extends Error {
    constructor(message, details = null) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
        this.statusCode = 400;
    }
}

/**
 * Not Found Error Creator
 */
class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

/**
 * Unauthorized Error Creator
 */
class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized access') {
        super(message);
        this.name = 'UnauthorizedError';
        this.statusCode = 401;
    }
}

/**
 * Forbidden Error Creator
 */
class ForbiddenError extends Error {
    constructor(message = 'Access forbidden') {
        super(message);
        this.name = 'ForbiddenError';
        this.statusCode = 403;
    }
}

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError
};
