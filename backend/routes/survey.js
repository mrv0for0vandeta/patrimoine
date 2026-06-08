const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const dbManager = require('../utils/database-sqlite3');
const { authenticateToken, authorizeRole, logActivity } = require('../middleware/auth');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

/**
 * Survey Routes
 * Handles both public survey access and admin survey management
 */

// =====================================================
// PUBLIC ROUTES (No authentication required)
// =====================================================

// Get active survey by code
router.get('/public/:surveyCode', async (req, res, next) => {
    try {
        // Get survey metadata
        const survey = await dbManager.get(`
            SELECT id, survey_code, title_ar, title_fr, title_en, 
                   description_fr, target_audience, estimated_duration, is_active
            FROM surveys
            WHERE survey_code = ? AND is_active = 1
        `, [req.params.surveyCode]);

        if (!survey) {
            throw new NotFoundError('Survey not found or inactive');
        }

        // Get sections
        const sections = await dbManager.all(`
            SELECT id, survey_id, title_fr, description_fr, display_order
            FROM sections
            WHERE survey_id = ?
            ORDER BY display_order
        `, [survey.id]);

        // Get questions
        const questions = await dbManager.all(`
            SELECT q.id, q.section_id, q.question_number,
                   q.question_text_ar, q.question_text_fr, q.question_text_en,
                   q.question_type, q.required, q.display_order
            FROM questions q
            WHERE q.section_id IN (SELECT id FROM sections WHERE survey_id = ?)
            ORDER BY q.section_id, q.display_order
        `, [survey.id]);

        // Get options
        const options = await dbManager.all(`
            SELECT o.id, o.question_id, o.option_text_fr, o.display_order
            FROM question_options o
            WHERE o.question_id IN (
                SELECT id FROM questions WHERE section_id IN (
                    SELECT id FROM sections WHERE survey_id = ?
                )
            )
            ORDER BY o.question_id, o.display_order
        `, [survey.id]);

        // Organize data structure
        sections.forEach(section => {
            section.questions = questions
                .filter(q => q.section_id === section.id)
                .map(q => ({
                    ...q,
                    is_required: q.required, // Map 'required' to 'is_required' for frontend compatibility
                    options: options.filter(o => o.question_id === q.id)
                }));
        });

        survey.sections = sections;
        survey.total_questions = questions.length;
        survey.total_sections = sections.length;

        res.json({
            success: true,
            survey
        });

    } catch (error) {
        next(error);
    }
});

// Start new survey response
router.post('/public/:surveyCode/start', async (req, res, next) => {
    try {
        const { language = 'fr', consent = true } = req.body;

        // Get survey
        const survey = await dbManager.get(
            'SELECT id FROM surveys WHERE survey_code = ? AND is_active = 1',
            [req.params.surveyCode]
        );

        if (!survey) {
            throw new NotFoundError('Survey not found or inactive');
        }

        // Create respondent
        const respondentUuid = uuidv4();

        const result = await dbManager.run(`
            INSERT INTO respondents (
                respondent_uuid, survey_id, is_anonymous, language_preference
            ) VALUES (?, ?, 1, ?)
        `, [
            respondentUuid,
            survey.id,
            language
        ]);

        res.json({
            success: true,
            respondent_uuid: respondentUuid,
            respondent_id: result.lastID,
            message: 'Survey session started successfully'
        });

    } catch (error) {
        next(error);
    }
});

// Submit complete survey response
router.post('/public/:surveyCode/submit', async (req, res, next) => {
    try {
        const { respondent_uuid, responses: responseData, demographics } = req.body;

        if (!respondent_uuid || !responseData) {
            throw new ValidationError('Respondent UUID and responses are required');
        }

        // Verify respondent
        const respondent = await dbManager.get(
            'SELECT * FROM respondents WHERE respondent_uuid = ?',
            [respondent_uuid]
        );

        if (!respondent) {
            throw new NotFoundError('Invalid respondent UUID');
        }

        if (respondent.is_completed) {
            throw new ValidationError('Survey already completed');
        }

        // Start transaction
        await dbManager.run('BEGIN TRANSACTION');

        try {
            // Insert responses
            for (const response of responseData) {
                // Store response_value as JSON if it's an array (for multi-select)
                let responseValue = response.response_value;
                if (response.selected_options && response.selected_options.length > 0) {
                    responseValue = JSON.stringify(response.selected_options);
                }

                await dbManager.run(`
                    INSERT INTO responses (respondent_id, question_id, response_text, response_value)
                    VALUES (?, ?, ?, ?)
                `, [
                    respondent.id,
                    response.question_id,
                    response.response_text || null,
                    responseValue || null
                ]);
            }

            // Skip demographics - table doesn't exist in simple schema

            // Mark as completed
            const timeTaken = Math.floor((Date.now() - new Date(respondent.started_at).getTime()) / 1000);
            await dbManager.run(`
                UPDATE respondents 
                SET is_completed = 1, completed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [respondent.id]);

            // Commit transaction
            await dbManager.run('COMMIT');

            res.json({
                success: true,
                message: 'Survey submitted successfully',
                respondent_id: respondent.id,
                time_taken_seconds: timeTaken
            });
        } catch (error) {
            await dbManager.run('ROLLBACK');
            throw error;
        }

    } catch (error) {
        next(error);
    }
});

// Save progress (partial response)
router.post('/public/:surveyCode/save-progress', async (req, res, next) => {
    try {
        const { respondent_uuid, responses: responseData, demographics } = req.body;

        if (!respondent_uuid) {
            throw new ValidationError('Respondent UUID is required');
        }

        const respondent = await dbManager.get(
            'SELECT * FROM respondents WHERE respondent_uuid = ?',
            [respondent_uuid]
        );

        if (!respondent) {
            throw new NotFoundError('Invalid respondent UUID');
        }

        if (respondent.is_completed) {
            throw new ValidationError('Cannot save progress for completed survey');
        }

        // Start transaction
        await dbManager.run('BEGIN TRANSACTION');

        try {
            // Delete existing responses
            await dbManager.run('DELETE FROM responses WHERE respondent_id = ?', [respondent.id]);

            // Insert new responses
            if (responseData && responseData.length > 0) {
                for (const response of responseData) {
                    // Store response_value as JSON if it's an array (for multi-select)
                    let responseValue = response.response_value;
                    if (response.selected_options && response.selected_options.length > 0) {
                        responseValue = JSON.stringify(response.selected_options);
                    }

                    await dbManager.run(`
                        INSERT INTO responses (respondent_id, question_id, response_text, response_value)
                        VALUES (?, ?, ?, ?)
                    `, [
                        respondent.id,
                        response.question_id,
                        response.response_text || null,
                        responseValue || null
                    ]);
                }
            }

            // Skip demographics - table doesn't exist in simple schema

            // Commit transaction
            await dbManager.run('COMMIT');

            res.json({
                success: true,
                message: 'Progress saved successfully'
            });
        } catch (error) {
            await dbManager.run('ROLLBACK');
            throw error;
        }

    } catch (error) {
        next(error);
    }
});

// Get saved progress
router.get('/public/:surveyCode/progress/:respondentUuid', async (req, res, next) => {
    try {
        const respondent = await dbManager.get(`
            SELECT r.*, s.survey_code
            FROM respondents r
            JOIN surveys s ON r.survey_id = s.id
            WHERE r.respondent_uuid = ? AND s.survey_code = ?
        `, [req.params.respondentUuid, req.params.surveyCode]);

        if (!respondent) {
            throw new NotFoundError('No saved progress found');
        }

        if (respondent.is_completed) {
            return res.json({
                success: true,
                completed: true,
                message: 'Survey already completed'
            });
        }

        // Get saved responses
        const responses = await dbManager.all(`
            SELECT r.question_id, r.response_text, r.response_value
            FROM responses r
            WHERE r.respondent_id = ?
        `, [respondent.id]);

        // No demographics table in simple schema

        res.json({
            success: true,
            completed: false,
            respondent: {
                uuid: respondent.respondent_uuid,
                started_at: respondent.started_at
            },
            responses: responses.map(r => ({
                ...r,
                selected_options: r.response_value && r.response_value.startsWith('[') ?
                    JSON.parse(r.response_value) : []
            }))
        });

    } catch (error) {
        next(error);
    }
});

// =====================================================
// ADMIN ROUTES (Authentication required)
// =====================================================

// Get all surveys
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        const surveys = await dbManager.all('SELECT * FROM surveys ORDER BY display_order');

        res.json({
            success: true,
            surveys,
            total: surveys.length
        });

    } catch (error) {
        next(error);
    }
});

// Get survey by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
    try {
        const survey = await dbManager.get('SELECT * FROM surveys WHERE id = ?', [req.params.id]);

        if (!survey) {
            throw new NotFoundError('Survey not found');
        }

        res.json({
            success: true,
            survey
        });

    } catch (error) {
        next(error);
    }
});

// Toggle survey active status
router.patch('/:id/toggle-active', authenticateToken, authorizeRole('admin'), logActivity('TOGGLE_SURVEY_STATUS', 'survey'), async (req, res, next) => {
    try {
        const survey = await dbManager.get('SELECT is_active FROM surveys WHERE id = ?', [req.params.id]);

        if (!survey) {
            throw new NotFoundError('Survey not found');
        }

        const newStatus = survey.is_active ? 0 : 1;
        await dbManager.run('UPDATE surveys SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);

        res.json({
            success: true,
            is_active: newStatus,
            message: `Survey ${newStatus ? 'activated' : 'deactivated'} successfully`
        });

    } catch (error) {
        next(error);
    }
});

// Update survey
router.patch('/:id', authenticateToken, authorizeRole('admin'), logActivity('UPDATE_SURVEY', 'survey'), async (req, res, next) => {
    try {
        const allowedFields = ['title_ar', 'title_fr', 'title_en', 'description_ar', 'description_fr',
            'description_en', 'introduction_ar', 'introduction_fr', 'introduction_en',
            'instructions_ar', 'instructions_fr', 'instructions_en', 'estimated_duration'];

        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(req.body[field]);
            }
        }

        if (updates.length === 0) {
            throw new ValidationError('No valid fields to update');
        }

        params.push(req.params.id);

        await dbManager.run(`UPDATE surveys SET ${updates.join(', ')} WHERE id = ?`, params);

        res.json({
            success: true,
            message: 'Survey updated successfully'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
