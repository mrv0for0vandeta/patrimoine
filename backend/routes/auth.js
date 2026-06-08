const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dbManager = require('../utils/database-sqlite3');
const { authenticateToken } = require('../middleware/auth');
const { ValidationError } = require('../middleware/errorHandler');

/**
 * Authentication Routes
 * Handles admin login, logout, and session management
 */

// Admin login
router.post('/admin/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            throw new ValidationError('Username and password are required');
        }

        // Find admin user
        const admin = await dbManager.get('SELECT * FROM admins WHERE username = ? AND is_active = 1', [username]);

        if (!admin) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'Incorrect username or password'
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, admin.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                message: 'Incorrect username or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login
        await dbManager.run('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [admin.id]);

        // Create session record
        const sessionToken = uuidv4();
        await dbManager.run(`
            INSERT INTO admin_sessions (admin_id, token, ip_address, user_agent, expires_at)
            VALUES (?, ?, ?, ?, datetime('now', '+24 hours'))
        `, [admin.id, sessionToken, req.ip, req.get('User-Agent')]);

        // Log activity
        await dbManager.run(`
            INSERT INTO audit_logs (admin_id, action, ip_address, details)
            VALUES (?, 'LOGIN', ?, ?)
        `, [admin.id, req.ip, JSON.stringify({ username: admin.username })]);

        res.json({
            success: true,
            token,
            user: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                full_name: admin.full_name
            },
            expiresIn: '24h'
        });

    } catch (error) {
        next(error);
    }
});

// Admin logout
router.post('/admin/logout', authenticateToken, (req, res, next) => {
    try {
        const db = dbManager.getConnection();

        // Remove active sessions
        db.prepare('DELETE FROM admin_sessions WHERE admin_id = ?').run(req.user.id);

        // Log activity
        db.prepare(`
            INSERT INTO audit_logs (admin_id, action, ip_address)
            VALUES (?, 'LOGOUT', ?)
        `).run(req.user.id, req.ip);

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        next(error);
    }
});

// Get current user info
router.get('/admin/me', authenticateToken, (req, res, next) => {
    try {
        const db = dbManager.getConnection();
        const admin = db.prepare(`
            SELECT id, username, email, full_name, role, created_at, last_login
            FROM admins
            WHERE id = ? AND is_active = 1
        `).get(req.user.id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            user: admin
        });

    } catch (error) {
        next(error);
    }
});

// Change password
router.post('/admin/change-password', authenticateToken, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            throw new ValidationError('Current password and new password are required');
        }

        if (newPassword.length < 8) {
            throw new ValidationError('New password must be at least 8 characters long');
        }

        const db = dbManager.getConnection();
        const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.user.id);

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, admin.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid password',
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newPasswordHash, req.user.id);

        // Log activity
        db.prepare(`
            INSERT INTO audit_logs (admin_id, action, ip_address)
            VALUES (?, 'PASSWORD_CHANGE', ?)
        `).run(req.user.id, req.ip);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        next(error);
    }
});

// Update profile
router.patch('/admin/profile', authenticateToken, async (req, res, next) => {
    try {
        const { full_name, email } = req.body;

        if (!full_name && !email) {
            throw new ValidationError('At least one field must be provided');
        }

        const db = dbManager.getConnection();
        const updates = [];
        const params = [];

        if (full_name) {
            updates.push('full_name = ?');
            params.push(full_name);
        }

        if (email) {
            // Check if email is already in use
            const existing = db.prepare('SELECT id FROM admins WHERE email = ? AND id != ?').get(email, req.user.id);
            if (existing) {
                throw new ValidationError('Email is already in use');
            }
            updates.push('email = ?');
            params.push(email);
        }

        params.push(req.user.id);

        db.prepare(`UPDATE admins SET ${updates.join(', ')} WHERE id = ?`).run(...params);

        // Log activity
        db.prepare(`
            INSERT INTO audit_logs (admin_id, action, ip_address, details)
            VALUES (?, 'PROFILE_UPDATE', ?, ?)
        `).run(req.user.id, req.ip, JSON.stringify({ full_name, email }));

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        next(error);
    }
});

// Verify token
router.get('/admin/verify-token', authenticateToken, (req, res) => {
    res.json({
        success: true,
        valid: true,
        user: req.user
    });
});

// Get active sessions
router.get('/admin/sessions', authenticateToken, (req, res, next) => {
    try {
        const db = dbManager.getConnection();
        const sessions = db.prepare(`
            SELECT id, ip_address, user_agent, created_at, expires_at
            FROM admin_sessions
            WHERE admin_id = ? AND expires_at > datetime('now')
            ORDER BY created_at DESC
        `).all(req.user.id);

        res.json({
            success: true,
            sessions
        });

    } catch (error) {
        next(error);
    }
});

// Revoke session
router.delete('/admin/sessions/:sessionId', authenticateToken, (req, res, next) => {
    try {
        const db = dbManager.getConnection();

        db.prepare('DELETE FROM admin_sessions WHERE id = ? AND admin_id = ?')
            .run(req.params.sessionId, req.user.id);

        res.json({
            success: true,
            message: 'Session revoked successfully'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
