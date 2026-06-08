// Vercel Serverless Function Entry Point
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import database manager (auto-detects Supabase or SQLite)
const dbManager = require('../backend/utils/database');

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
            console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
            console.log('NODE_ENV:', process.env.NODE_ENV);

            await dbManager.initialize();
            initialized = true;
            console.log('✓ Database initialized successfully');
        } catch (error) {
            console.error('✗ Database initialization failed:', error.message);
            console.error('Stack:', error.stack);
            throw error;
        }
    }
}

// Initialize on module load (not per request)
init().catch(err => {
    console.error('Failed to initialize on startup:', err);
});

// Export handler for Vercel
module.exports = app;
