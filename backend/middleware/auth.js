const jwt = require('jsonwebtoken');
const dbManager = require('../utils/database-sqlite3');

/**
 * Authentication Middleware
 * Verifies JWT tokens and authenticates users
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'Access token is required'
            });
        }

        // Verify token
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        success: false,
                        error: 'Token expired',
                        message: 'Your session has expired. Please log in again.'
                    });
                }
                return res.status(403).json({
                    success: false,
                    error: 'Invalid token',
                    message: 'The provided token is invalid'
                });
            }

            try {
                // Verify user still exists and is active
                const admin = await dbManager.get('SELECT * FROM admins WHERE id = ? AND is_active = 1', [decoded.id]);

                if (!admin) {
                    return res.status(403).json({
                        success: false,
                        error: 'User inactive',
                        message: 'This user account is no longer active'
                    });
                }

                // Attach user info to request
                req.user = {
                    id: admin.id,
                    username: admin.username,
                    email: admin.email,
                    role: admin.role,
                    full_name: admin.full_name
                };

                next();
            } catch (dbError) {
                console.error('Database error during auth:', dbError);
                return res.status(500).json({
                    success: false,
                    error: 'Authentication error',
                    message: 'Database error during authentication'
                });
            }
        });

    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication error',
            message: 'An error occurred during authentication'
        });
    }
};

/**
 * Role-based Authorization Middleware
 * Restricts access based on user roles
 */
const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'You must be logged in to access this resource'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Optional Authentication Middleware
 * Authenticates if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (!err && decoded) {
            try {
                const admin = await dbManager.get('SELECT * FROM admins WHERE id = ? AND is_active = 1', [decoded.id]);

                if (admin) {
                    req.user = {
                        id: admin.id,
                        username: admin.username,
                        email: admin.email,
                        role: admin.role,
                        full_name: admin.full_name
                    };
                }
            } catch (error) {
                console.error('Optional auth error:', error);
            }
        }
        next();
    });
};

/**
 * Activity Logging Middleware
 * Logs admin actions to audit log
 */
const logActivity = (action, entityType = null) => {
    return (req, res, next) => {
        // Store original send function
        const originalSend = res.send;

        // Override send function to log after response
        res.send = async function (data) {
            // Only log if request was successful and user is authenticated
            if (req.user && res.statusCode < 400) {
                try {
                    const details = JSON.stringify({
                        method: req.method,
                        path: req.path,
                        query: req.query,
                        params: req.params,
                        body: req.body,
                        statusCode: res.statusCode
                    });

                    await dbManager.run(`
                        INSERT INTO audit_logs (admin_id, action, entity_type, ip_address, details)
                        VALUES (?, ?, ?, ?, ?)
                    `, [
                        req.user.id,
                        action,
                        entityType,
                        req.ip,
                        details
                    ]);
                } catch (error) {
                    console.error('Error logging activity:', error);
                }
            }

            // Call original send
            originalSend.call(this, data);
        };

        next();
    };
};

/**
 * Rate Limiting Check (basic implementation)
 * Note: For production, consider using express-rate-limit package
 */
const checkRateLimit = (maxRequests = 100, windowMs = 900000) => {
    const requests = new Map();

    return (req, res, next) => {
        const identifier = req.ip || 'unknown';
        const now = Date.now();

        if (!requests.has(identifier)) {
            requests.set(identifier, []);
        }

        const userRequests = requests.get(identifier);

        // Remove old requests outside the window
        const validRequests = userRequests.filter(time => now - time < windowMs);

        if (validRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                error: 'Too many requests',
                message: 'You have exceeded the rate limit. Please try again later.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        validRequests.push(now);
        requests.set(identifier, validRequests);

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRole,
    optionalAuth,
    logActivity,
    checkRateLimit
};
