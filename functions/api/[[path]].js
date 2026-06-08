// Cloudflare Pages Functions - API Handler
// This handles all /api/* routes using Cloudflare's serverless functions

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import database manager (auto-detects Supabase or SQLite)
const dbManager = require('../../backend/utils/database');

// Import routes
const authRoutes = require('../../backend/routes/auth');
const surveyRoutes = require('../../backend/routes/survey');
const analyticsRoutes = require('../../backend/routes/analytics');
const exportRoutes = require('../../backend/routes/export');
const adminRoutes = require('../../backend/routes/admin');

// Create Express app
const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/api/health', async (req, res) => {
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
        version: '1.0.0',
        platform: 'Cloudflare Pages'
    });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Initialize database once
let initialized = false;
async function init(env) {
    if (!initialized) {
        try {
            console.log('Initializing database...');
            console.log('DATABASE_URL exists:', !!(env.DATABASE_URL || process.env.DATABASE_URL));
            console.log('NODE_ENV:', env.NODE_ENV || process.env.NODE_ENV);

            // Set environment variables for database connection
            if (env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL;
            if (env.JWT_SECRET) process.env.JWT_SECRET = env.JWT_SECRET;
            if (env.SESSION_SECRET) process.env.SESSION_SECRET = env.SESSION_SECRET;
            if (env.ADMIN_USERNAME) process.env.ADMIN_USERNAME = env.ADMIN_USERNAME;
            if (env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = env.ADMIN_PASSWORD;
            if (env.ADMIN_EMAIL) process.env.ADMIN_EMAIL = env.ADMIN_EMAIL;

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

// Export Cloudflare Pages Function handler
export async function onRequest(context) {
    try {
        // Initialize database with Cloudflare environment variables
        await init(context.env);

        // Convert Cloudflare Request to Node.js compatible request
        const url = new URL(context.request.url);
        const pathname = url.pathname;

        // Create a mock request object compatible with Express
        const req = {
            method: context.request.method,
            url: pathname + url.search,
            headers: Object.fromEntries(context.request.headers),
            body: context.request.body
        };

        // Create a mock response object
        let statusCode = 200;
        let headers = {};
        let body = '';

        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (data) => {
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify(data);
                return res;
            },
            send: (data) => {
                body = data;
                return res;
            },
            setHeader: (key, value) => {
                headers[key] = value;
                return res;
            },
            end: () => { }
        };

        // Route the request through Express
        return new Promise((resolve) => {
            app(req, {
                ...res,
                end: () => {
                    resolve(new Response(body, {
                        status: statusCode,
                        headers: headers
                    }));
                }
            });
        });

    } catch (error) {
        console.error('Handler error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
