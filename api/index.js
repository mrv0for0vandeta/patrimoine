// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Use Neon for Vercel
const dbManager = require('../backend/utils/database-neon');
const { errorHandler, notFoundHandler } = require('../backend/middleware/errorHandler');

// Import routes
const authRoutes = require('../backend/routes/auth');
const surveyRoutes = require('../backend/routes/survey');
const analyticsRoutes = require('../backend/routes/analytics');
const exportRoutes = require('../backend/routes/export');
const adminRoutes = require('../backend/routes/admin');

const app = express();

// Security
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
    windowMs: 900000,
    max: 100,
    message: { success: false, error: 'Too many requests' }
});
app.use('/api/', limiter);

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check
app.get('/health', async (req, res) => {
    try {
        const health = await dbManager.healthCheck();
        res.status(200).json({
            success: true,
            ...health,
            server: { environment: 'production', version: '1.0.0' }
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: error.message
        });
    }
});

// API info
app.get('/api', (req, res) => {
    res.json({
        success: true,
        name: 'Moroccan Heritage Survey Platform API',
        version: '1.0.0',
        description: 'Academic survey data collection and analysis platform'
    });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/admin', adminRoutes);

// Frontend routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin/index.html'));
});

app.get('/survey/:surveyCode', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/survey.html'));
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database
let dbInitialized = false;
const initDb = async () => {
    if (!dbInitialized) {
        try {
            await dbManager.initialize();
            dbInitialized = true;
            console.log('✓ Database initialized');
        } catch (error) {
            console.error('✗ Database init error:', error);
        }
    }
};

// Vercel serverless handler
module.exports = async (req, res) => {
    await initDb();
    return app(req, res);
};
