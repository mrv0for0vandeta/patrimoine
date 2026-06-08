// Vercel Serverless Function Entry Point
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import Supabase database manager
const dbManager = require('../backend/utils/database-supabase');

// Import routes
const authRoutes = require('../backend/routes/auth');
const surveyRoutes = require('../backend/routes/survey');
const analyticsRoutes = require('../backend/routes/analytics');
const exportRoutes = require('../backend/routes/export');
const adminRoutes = require('../backend/routes/admin');

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check
app.get('/health', async (req, res) => {
    try {
        const health = await dbManager.healthCheck();
        res.json({ success: true, ...health });
    } catch (error) {
        res.status(503).json({ success: false, error: error.message });
    }
});

// API info
app.get('/api', (req, res) => {
    res.json({
        success: true,
        name: 'Moroccan Heritage Survey Platform API',
        version: '1.0.0'
    });
});

// Mount API routes
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

app.get('/survey/:code', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/survey.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Catch all - return index
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Initialize database once
let initialized = false;
async function init() {
    if (!initialized) {
        try {
            console.log('Initializing database...');
            await dbManager.initialize();
            initialized = true;
            console.log('✓ Database initialized');
        } catch (error) {
            console.error('✗ Database initialization failed:', error);
            throw error;
        }
    }
}

// Export handler for Vercel
module.exports = async (req, res) => {
    try {
        await init();
        return app(req, res);
    } catch (error) {
        console.error('Handler error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};
