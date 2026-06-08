require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import utilities and middleware
// Use Neon for Vercel/production with DATABASE_URL, SQLite for local development
const useNeon = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const dbManager = useNeon
    ? require('./utils/database-neon')
    : require('./utils/database-sqlite3');

console.log(`Using ${useNeon ? 'Neon PostgreSQL' : 'SQLite'} database`);

const { logger, requestLogger } = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const surveyRoutes = require('./routes/survey');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');
const adminRoutes = require('./routes/admin');

/**
 * Moroccan Heritage Survey Platform - Main Server
 * Production-ready academic survey data collection and analysis platform
 */

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// =====================================================
// SECURITY MIDDLEWARE
// =====================================================

// Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            workerSrc: ["'self'"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiter to API routes
app.use('/api/', limiter);

// =====================================================
// GENERAL MIDDLEWARE
// =====================================================

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: process.env.MAX_SURVEY_RESPONSE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Request logging
app.use(requestLogger);
if (Array.isArray(logger)) {
    logger.forEach(l => app.use(l));
} else {
    app.use(logger);
}

// =====================================================
// STATIC FILES
// =====================================================

// Serve service worker at root level
app.get('/service-worker.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(__dirname, '../frontend/service-worker.js'));
});

// Serve manifest at root level
app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, '../frontend/manifest.json'));
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve QR codes
app.use('/qr-codes', express.static(path.join(__dirname, '../qr-codes')));

// =====================================================
// API ROUTES
// =====================================================

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const health = await dbManager.healthCheck();
        const statusCode = health.status === 'healthy' ? 200 : 503;

        res.status(statusCode).json({
            success: health.status === 'healthy',
            ...health,
            server: {
                uptime: process.uptime(),
                environment: NODE_ENV,
                version: require('../package.json').version
            }
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: error.message
        });
    }
});

// API information endpoint
app.get('/api', (req, res) => {
    res.json({
        success: true,
        name: 'Moroccan Heritage Survey Platform API',
        version: '1.0.0',
        description: 'Academic survey data collection and analysis platform',
        organization: 'Direction du Patrimoine - Ministère de la Jeunesse, de la Culture et de la Communication',
        endpoints: {
            authentication: '/api/auth',
            surveys: '/api/survey',
            analytics: '/api/analytics',
            export: '/api/export',
            admin: '/api/admin',
            health: '/health'
        },
        documentation: '/api/docs'
    });
});

// Mount route handlers
app.use('/api/auth', authRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/admin', adminRoutes);

// =====================================================
// FRONTEND ROUTES
// =====================================================

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve survey page
app.get('/survey/:surveyCode', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/survey.html'));
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin/index.html'));
});

// Serve admin pages
app.get('/admin/:page', (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, `../frontend/admin/${page}.html`);

    // Check if file exists
    if (require('fs').existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.sendFile(path.join(__dirname, '../frontend/admin/index.html'));
    }
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// =====================================================
// SERVER INITIALIZATION
// =====================================================

// Initialize database and start server
async function startServer() {
    try {
        await dbManager.initialize();
        console.log('✓ Database initialized successfully');

        // Start server
        const server = app.listen(PORT, () => {
            console.log('\n===========================================');
            console.log('Moroccan Heritage Survey Platform');
            console.log('===========================================');
            console.log(`Environment: ${NODE_ENV}`);
            console.log(`Server running on port ${PORT}`);
            console.log(`\nAccess points:`);
            console.log(`  - Public: http://localhost:${PORT}`);
            console.log(`  - Admin:  http://localhost:${PORT}/admin`);
            console.log(`  - API:    http://localhost:${PORT}/api`);
            console.log(`  - Health: http://localhost:${PORT}/health`);
            console.log('===========================================\n');
        });

        // =====================================================
        // GRACEFUL SHUTDOWN
        // =====================================================

        const gracefulShutdown = async (signal) => {
            console.log(`\n${signal} received. Starting graceful shutdown...`);

            server.close(async () => {
                console.log('✓ HTTP server closed');

                // Close database connection
                await dbManager.close();

                console.log('✓ Database connection closed');
                console.log('✓ Graceful shutdown completed');
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error('✗ Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });

    } catch (error) {
        console.error('✗ Failed to initialize database:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;
