const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const dbManager = require('../utils/database-sqlite3');
const { authenticateToken, authorizeRole, logActivity } = require('../middleware/auth');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

/**
 * Admin Management Routes
 * System administration, user management, and system operations
 */

// Ensure QR codes directory exists
const qrCodesDir = path.join(__dirname, '../../qr-codes');
if (!fs.existsSync(qrCodesDir)) {
    fs.mkdirSync(qrCodesDir, { recursive: true });
}

// =====================================================
// USER MANAGEMENT
// =====================================================

// Get all admin users
router.get('/users', authenticateToken, authorizeRole('admin'), async (req, res, next) => {
    try {
        const users = await dbManager.all(`
            SELECT id, username, email, full_name, role, is_active, created_at, last_login
            FROM admins
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            users
        });

    } catch (error) {
        next(error);
    }
});

// Create new admin user
router.post('/users', authenticateToken, authorizeRole('admin'), logActivity('CREATE_USER', 'admin'), async (req, res, next) => {
    try {
        const { username, email, password, full_name, role = 'researcher' } = req.body;

        // Validate input
        if (!username || !email || !password) {
            throw new ValidationError('Username, email, and password are required');
        }

        if (password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters long');
        }

        if (!['admin', 'researcher', 'viewer'].includes(role)) {
            throw new ValidationError('Invalid role');
        }

        // Check if username or email already exists
        const existing = await dbManager.get('SELECT id FROM admins WHERE username = ? OR email = ?', [username, email]);
        if (existing) {
            throw new ValidationError('Username or email already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await dbManager.run(`
            INSERT INTO admins (username, email, password_hash, full_name, role, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        `, [username, email, passwordHash, full_name, role]);

        res.json({
            success: true,
            message: 'User created successfully',
            user_id: result.lastID
        });

    } catch (error) {
        next(error);
    }
});

// Update admin user
router.patch('/users/:userId', authenticateToken, authorizeRole('admin'), logActivity('UPDATE_USER', 'admin'), async (req, res, next) => {
    try {
        const { full_name, email, role, is_active } = req.body;

        if (!full_name && !email && !role && is_active === undefined) {
            throw new ValidationError('At least one field must be provided');
        }

        const updates = [];
        const params = [];

        if (full_name !== undefined) {
            updates.push('full_name = ?');
            params.push(full_name);
        }

        if (email !== undefined) {
            // Check if email is already in use
            const existing = await dbManager.get('SELECT id FROM admins WHERE email = ? AND id != ?', [email, req.params.userId]);
            if (existing) {
                throw new ValidationError('Email is already in use');
            }
            updates.push('email = ?');
            params.push(email);
        }

        if (role !== undefined) {
            if (!['admin', 'researcher', 'viewer'].includes(role)) {
                throw new ValidationError('Invalid role');
            }
            updates.push('role = ?');
            params.push(role);
        }

        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active ? 1 : 0);
        }

        params.push(req.params.userId);

        await dbManager.run(`UPDATE admins SET ${updates.join(', ')} WHERE id = ?`, params);

        res.json({
            success: true,
            message: 'User updated successfully'
        });

    } catch (error) {
        next(error);
    }
});

// Delete admin user
router.delete('/users/:userId', authenticateToken, authorizeRole('admin'), logActivity('DELETE_USER', 'admin'), async (req, res, next) => {
    try {
        // Prevent self-deletion
        if (parseInt(req.params.userId) === req.user.id) {
            throw new ValidationError('Cannot delete your own account');
        }

        await dbManager.run('DELETE FROM admins WHERE id = ?', [req.params.userId]);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        next(error);
    }
});

// Reset user password
router.post('/users/:userId/reset-password', authenticateToken, authorizeRole('admin'), logActivity('RESET_PASSWORD', 'admin'), async (req, res, next) => {
    try {
        const { new_password } = req.body;

        if (!new_password || new_password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters long');
        }

        const passwordHash = await bcrypt.hash(new_password, 10);

        await dbManager.run('UPDATE admins SET password_hash = ? WHERE id = ?', [passwordHash, req.params.userId]);

        res.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        next(error);
    }
});

// =====================================================
// SURVEY LINK MANAGEMENT
// =====================================================

// Generate survey link
router.post('/survey-links', authenticateToken, logActivity('CREATE_SURVEY_LINK', 'survey_link'), async (req, res, next) => {
    try {
        const { survey_id, description, expires_at, max_uses } = req.body;

        if (!survey_id) {
            throw new ValidationError('Survey ID is required');
        }

        // Verify survey exists
        const survey = await dbManager.get('SELECT survey_code FROM surveys WHERE id = ?', [survey_id]);
        if (!survey) {
            throw new NotFoundError('Survey not found');
        }

        // Generate unique link code
        const linkCode = require('crypto').randomBytes(8).toString('hex');
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const linkUrl = `${baseUrl}/survey/${survey.survey_code}?ref=${linkCode}`;

        // Insert link
        const result = await dbManager.run(`
            INSERT INTO survey_links (survey_id, link_code, link_url, description, expires_at, max_uses, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [survey_id, linkCode, linkUrl, description, expires_at, max_uses, req.user.id]);

        res.json({
            success: true,
            link: {
                id: result.lastID,
                code: linkCode,
                url: linkUrl
            }
        });

    } catch (error) {
        next(error);
    }
});

// Generate QR code for survey
router.post('/survey-links/:linkId/qr-code', authenticateToken, logActivity('GENERATE_QR_CODE', 'survey_link'), async (req, res, next) => {
    try {
        const link = await dbManager.get('SELECT * FROM survey_links WHERE id = ?', [req.params.linkId]);
        if (!link) {
            throw new NotFoundError('Survey link not found');
        }

        // Generate QR code
        const qrFilename = `qr_${link.link_code}_${Date.now()}.png`;
        const qrFilepath = path.join(qrCodesDir, qrFilename);

        await QRCode.toFile(qrFilepath, link.link_url, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Update link with QR code path
        await dbManager.run('UPDATE survey_links SET qr_code_path = ? WHERE id = ?', [qrFilepath, req.params.linkId]);

        res.json({
            success: true,
            qr_code_path: qrFilepath,
            qr_code_filename: qrFilename
        });

    } catch (error) {
        next(error);
    }
});

// Get survey links
router.get('/survey-links', authenticateToken, async (req, res, next) => {
    try {
        const { survey_id } = req.query;

        let query = `
            SELECT sl.*, s.survey_code, s.title_fr, a.username as created_by_username
            FROM survey_links sl
            JOIN surveys s ON sl.survey_id = s.id
            LEFT JOIN admins a ON sl.created_by = a.id
        `;

        const params = [];
        if (survey_id) {
            query += ' WHERE sl.survey_id = ?';
            params.push(survey_id);
        }

        query += ' ORDER BY sl.created_at DESC';

        const links = await dbManager.all(query, params);

        res.json({
            success: true,
            links
        });

    } catch (error) {
        next(error);
    }
});

// Toggle link status
router.patch('/survey-links/:linkId/toggle', authenticateToken, logActivity('TOGGLE_SURVEY_LINK', 'survey_link'), async (req, res, next) => {
    try {
        const link = await dbManager.get('SELECT is_active FROM survey_links WHERE id = ?', [req.params.linkId]);
        if (!link) {
            throw new NotFoundError('Survey link not found');
        }

        const newStatus = link.is_active ? 0 : 1;
        await dbManager.run('UPDATE survey_links SET is_active = ? WHERE id = ?', [newStatus, req.params.linkId]);

        res.json({
            success: true,
            is_active: newStatus
        });

    } catch (error) {
        next(error);
    }
});

// =====================================================
// SYSTEM MANAGEMENT
// =====================================================

// Get system statistics
router.get('/system/stats', authenticateToken, async (req, res, next) => {
    try {
        const stats = await dbManager.getStatistics();
        const health = await dbManager.healthCheck();

        res.json({
            success: true,
            statistics: stats,
            health
        });

    } catch (error) {
        next(error);
    }
});

// Get audit logs
router.get('/audit-logs', authenticateToken, authorizeRole('admin'), async (req, res, next) => {
    try {
        const { limit = 100, offset = 0, admin_id, action } = req.query;

        let query = `
            SELECT al.*, a.username
            FROM audit_logs al
            LEFT JOIN admins a ON al.admin_id = a.id
            WHERE 1=1
        `;

        const params = [];

        if (admin_id) {
            query += ' AND al.admin_id = ?';
            params.push(admin_id);
        }

        if (action) {
            query += ' AND al.action = ?';
            params.push(action);
        }

        query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const logs = await dbManager.all(query, params);

        // Get total count
        const totalCount = await dbManager.get('SELECT COUNT(*) as count FROM audit_logs');

        res.json({
            success: true,
            logs,
            pagination: {
                total: totalCount.count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        next(error);
    }
});

// Get system configuration
router.get('/system/config', authenticateToken, authorizeRole('admin'), async (req, res, next) => {
    try {
        const config = await dbManager.all('SELECT * FROM system_config ORDER BY config_key');

        res.json({
            success: true,
            config
        });

    } catch (error) {
        next(error);
    }
});

// Update system configuration
router.patch('/system/config/:configKey', authenticateToken, authorizeRole('admin'), logActivity('UPDATE_CONFIG', 'system_config'), async (req, res, next) => {
    try {
        const { config_value } = req.body;

        if (config_value === undefined) {
            throw new ValidationError('Config value is required');
        }

        await dbManager.run(`
            UPDATE system_config 
            SET config_value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
            WHERE config_key = ?
        `, [config_value, req.user.id, req.params.configKey]);

        res.json({
            success: true,
            message: 'Configuration updated successfully'
        });

    } catch (error) {
        next(error);
    }
});

// Database maintenance
router.post('/system/maintenance/optimize', authenticateToken, authorizeRole('admin'), logActivity('OPTIMIZE_DATABASE', 'system'), async (req, res, next) => {
    try {
        await dbManager.vacuum();
        await dbManager.analyze();

        res.json({
            success: true,
            message: 'Database optimization completed'
        });

    } catch (error) {
        next(error);
    }
});

// Database backup
router.post('/system/backup', authenticateToken, authorizeRole('admin'), logActivity('CREATE_BACKUP', 'system'), (req, res, next) => {
    try {
        const { createBackup } = require('../utils/backup');
        createBackup();

        res.json({
            success: true,
            message: 'Database backup created successfully'
        });

    } catch (error) {
        next(error);
    }
});

// Database integrity check
router.get('/system/integrity-check', authenticateToken, authorizeRole('admin'), async (req, res, next) => {
    try {
        const isOk = await dbManager.checkIntegrity();

        res.json({
            success: true,
            integrity_ok: isOk,
            message: isOk ? 'Database integrity verified' : 'Database integrity check failed'
        });

    } catch (error) {
        next(error);
    }
});

// Get respondent details
router.get('/respondents/:respondentId', authenticateToken, async (req, res, next) => {
    try {
        const respondent = await dbManager.get(`
            SELECT r.*, s.survey_code, s.title_fr
            FROM respondents r
            JOIN surveys s ON r.survey_id = s.id
            WHERE r.id = ?
        `, [req.params.respondentId]);

        if (!respondent) {
            throw new NotFoundError('Respondent not found');
        }

        // Get responses
        const responses = await dbManager.all(`
            SELECT r.*, q.question_text_fr, q.question_number
            FROM responses r
            JOIN questions q ON r.question_id = q.id
            WHERE r.respondent_id = ?
            ORDER BY q.display_order
        `, [req.params.respondentId]);

        // Get demographics (table may not exist in simple schema)
        let demographics = null;
        try {
            demographics = await dbManager.get('SELECT * FROM demographics WHERE respondent_id = ?', [req.params.respondentId]);
        } catch (err) {
            // demographics table doesn't exist in simple schema
        }

        res.json({
            success: true,
            respondent: {
                ...respondent,
                demographics,
                responses
            }
        });

    } catch (error) {
        next(error);
    }
});

// Delete respondent (with all associated data)
router.delete('/respondents/:respondentId', authenticateToken, authorizeRole('admin'), logActivity('DELETE_RESPONDENT', 'respondent'), async (req, res, next) => {
    try {
        // All associated data will be deleted via CASCADE
        await dbManager.run('DELETE FROM respondents WHERE id = ?', [req.params.respondentId]);

        res.json({
            success: true,
            message: 'Respondent and all associated data deleted successfully'
        });

    } catch (error) {
        next(error);
    }
});

// Flag/unflag respondent
router.patch('/respondents/:respondentId/flag', authenticateToken, logActivity('FLAG_RESPONDENT', 'respondent'), async (req, res, next) => {
    try {
        const { is_flagged, flag_reason } = req.body;

        await dbManager.run(`
            UPDATE respondents 
            SET is_flagged = ?, flag_reason = ?
            WHERE id = ?
        `, [is_flagged ? 1 : 0, flag_reason || null, req.params.respondentId]);

        res.json({
            success: true,
            message: is_flagged ? 'Respondent flagged' : 'Flag removed'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
