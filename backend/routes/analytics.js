const express = require('express');
const router = express.Router();
const dbManager = require('../utils/database-sqlite3');
const { authenticateToken } = require('../middleware/auth');
const { NotFoundError } = require('../middleware/errorHandler');

/**
 * Analytics Routes
 * Provides statistical data and insights for surveys
 */

// Get survey statistics
router.get('/survey/:surveyId', authenticateToken, (req, res, next) => {
    try {
        const db = dbManager.getConnection();

        // Get overall statistics
        const stats = db.prepare('SELECT * FROM vw_survey_statistics WHERE survey_id = ?')
            .get(req.params.surveyId);

        if (!stats) {
            throw new NotFoundError('Survey not found');
        }

        // Get daily activity
        const dailyActivity = db.prepare(`
            SELECT * FROM vw_daily_survey_activity 
            WHERE survey_id = ?
            ORDER BY activity_date DESC
            LIMIT 30
        `).all(req.params.surveyId);

        // Get completion funnel
        const funnel = db.prepare(`
            SELECT 
                COUNT(*) as total_started,
                COUNT(CASE WHEN is_completed = 1 THEN 1 END) as completed,
                COUNT(CASE WHEN is_completed = 0 AND last_activity > datetime('now', '-1 hour') THEN 1 END) as in_progress,
                COUNT(CASE WHEN is_completed = 0 AND last_activity <= datetime('now', '-1 hour') THEN 1 END) as abandoned
            FROM respondents
            WHERE survey_id = ?
        `).get(req.params.surveyId);

        // Get time statistics
        const timeStats = db.prepare(`
            SELECT 
                AVG(time_taken_seconds) as avg_time,
                MIN(time_taken_seconds) as min_time,
                MAX(time_taken_seconds) as max_time,
                COUNT(*) as total_completed
            FROM respondents
            WHERE survey_id = ? AND is_completed = 1 AND time_taken_seconds IS NOT NULL
        `).get(req.params.surveyId);

        res.json({
            success: true,
            statistics: {
                overview: stats,
                funnel,
                time_statistics: timeStats,
                daily_activity: dailyActivity
            }
        });

    } catch (error) {
        next(error);
    }
});

// Get demographic breakdown
router.get('/survey/:surveyId/demographics', authenticateToken, (req, res, next) => {
    try {
        const db = dbManager.getConnection();

        // Age distribution
        const ageDistribution = db.prepare(`
            SELECT age_group, COUNT(*) as count
            FROM demographics d
            JOIN respondents r ON d.respondent_id = r.id
            WHERE r.survey_id = ? AND r.is_completed = 1 AND d.age_group IS NOT NULL
            GROUP BY age_group
            ORDER BY count DESC
        `).all(req.params.surveyId);

        // Gender distribution
        const genderDistribution = db.prepare(`
            SELECT gender, COUNT(*) as count
            FROM demographics d
            JOIN respondents r ON d.respondent_id = r.id
            WHERE r.survey_id = ? AND r.is_completed = 1 AND d.gender IS NOT NULL
            GROUP BY gender
            ORDER BY count DESC
        `).all(req.params.surveyId);

        // Region distribution
        const regionDistribution = db.prepare(`
            SELECT region_residence, COUNT(*) as count
            FROM demographics d
            JOIN respondents r ON d.respondent_id = r.id
            WHERE r.survey_id = ? AND r.is_completed = 1 AND d.region_residence IS NOT NULL
            GROUP BY region_residence
            ORDER BY count DESC
        `).all(req.params.surveyId);

        // Education level distribution
        const educationDistribution = db.prepare(`
            SELECT education_level, COUNT(*) as count
            FROM demographics d
            JOIN respondents r ON d.respondent_id = r.id
            WHERE r.survey_id = ? AND r.is_completed = 1 AND d.education_level IS NOT NULL
            GROUP BY education_level
            ORDER BY count DESC
        `).all(req.params.surveyId);

        // Urban/Rural distribution
        const urbanRuralDistribution = db.prepare(`
            SELECT urban_rural, COUNT(*) as count
            FROM demographics d
            JOIN respondents r ON d.respondent_id = r.id
            WHERE r.survey_id = ? AND r.is_completed = 1 AND d.urban_rural IS NOT NULL
            GROUP BY urban_rural
            ORDER BY count DESC
        `).all(req.params.surveyId);

        res.json({
            success: true,
            demographics: {
                age: ageDistribution,
                gender: genderDistribution,
                region: regionDistribution,
                education: educationDistribution,
                urban_rural: urbanRuralDistribution
            }
        });

    } catch (error) {
        next(error);
    }
});

// Get question statistics
router.get('/survey/:surveyId/questions', authenticateToken, (req, res, next) => {
    try {
        const db = dbManager.getConnection();

        const questionStats = db.prepare(`
            SELECT 
                q.id,
                q.question_code,
                q.question_number,
                q.question_text_fr,
                q.question_type,
                COUNT(DISTINCT r.respondent_id) as response_count,
                AVG(r.time_spent_seconds) as avg_time_seconds
            FROM questions q
            JOIN survey_sections s ON q.section_id = s.id
            LEFT JOIN responses r ON q.id = r.question_id
            WHERE s.survey_id = ?
            GROUP BY q.id
            ORDER BY s.display_order, q.display_order
        `).all(req.params.surveyId);

        res.json({
            success: true,
            questions: questionStats
        });

    } catch (error) {
        next(error);
    }
});

// Get question response details
router.get('/question/:questionId/responses', authenticateToken, (req, res, next) => {
    try {
        const db = dbManager.getConnection();

        // Get question info
        const question = db.prepare(`
            SELECT q.*, s.survey_id
            FROM questions q
            JOIN survey_sections s ON q.section_id = s.id
            WHERE q.id = ?
        `).get(req.params.questionId);

        if (!question) {
            throw new NotFoundError('Question not found');
        }

        // Get response frequency for choice questions
        if (['single_choice', 'multiple_choice', 'radio', 'checkbox'].includes(question.question_type)) {
            const optionFrequency = db.prepare(`
                SELECT 
                    o.option_text_fr,
                    o.option_value,
                    COUNT(ro.id) as selection_count,
                    ROUND(CAST(COUNT(ro.id) AS REAL) / 
                        NULLIF((SELECT COUNT(DISTINCT respondent_id) 
                                FROM responses 
                                WHERE question_id = ?), 0) * 100, 2) as percentage
                FROM question_options o
                LEFT JOIN response_options ro ON o.id = ro.option_id
                WHERE o.question_id = ?
                GROUP BY o.id, o.option_text_fr, o.option_value
                ORDER BY selection_count DESC
            `).all(req.params.questionId, req.params.questionId);

            res.json({
                success: true,
                question,
                response_distribution: optionFrequency
            });

        } else if (question.question_type.includes('scale') || question.question_type === 'scale_numeric') {
            // Get statistics for scale questions
            const scaleStats = db.prepare(`
                SELECT 
                    AVG(response_numeric) as mean,
                    MIN(response_numeric) as min,
                    MAX(response_numeric) as max,
                    COUNT(*) as total_responses
                FROM responses
                WHERE question_id = ? AND response_numeric IS NOT NULL
            `).get(req.params.questionId);

            // Get distribution
            const distribution = db.prepare(`
                SELECT 
                    response_numeric as value,
                    COUNT(*) as count,
                    ROUND(CAST(COUNT(*) AS REAL) / ? * 100, 2) as percentage
                FROM responses
                WHERE question_id = ? AND response_numeric IS NOT NULL
                GROUP BY response_numeric
                ORDER BY response_numeric
            `).all(scaleStats.total_responses, req.params.questionId);

            res.json({
                success: true,
                question,
                statistics: scaleStats,
                distribution
            });

        } else {
            // Text responses
            const textResponses = db.prepare(`
                SELECT 
                    response_text,
                    created_at
                FROM responses
                WHERE question_id = ? AND response_text IS NOT NULL
                ORDER BY created_at DESC
                LIMIT 100
            `).all(req.params.questionId);

            res.json({
                success: true,
                question,
                text_responses: textResponses,
                total: textResponses.length
            });
        }

    } catch (error) {
        next(error);
    }
});

// Get cross-tabulation
router.post('/survey/:surveyId/crosstab', authenticateToken, (req, res, next) => {
    try {
        const { question1_id, question2_id } = req.body;

        if (!question1_id || !question2_id) {
            throw new ValidationError('Both question IDs are required');
        }

        const db = dbManager.getConnection();

        // Get responses for both questions
        const crosstab = db.prepare(`
            SELECT 
                r1.response_value as question1_value,
                r2.response_value as question2_value,
                COUNT(*) as count
            FROM responses r1
            JOIN responses r2 ON r1.respondent_id = r2.respondent_id
            WHERE r1.question_id = ? AND r2.question_id = ?
            GROUP BY r1.response_value, r2.response_value
            ORDER BY count DESC
        `).all(question1_id, question2_id);

        res.json({
            success: true,
            crosstab
        });

    } catch (error) {
        next(error);
    }
});

// Get response timeline
router.get('/survey/:surveyId/timeline', authenticateToken, (req, res, next) => {
    try {
        const db = dbManager.getConnection();

        const { period = '7' } = req.query; // days

        const timeline = db.prepare(`
            SELECT 
                DATE(completed_at) as date,
                COUNT(*) as responses,
                AVG(time_taken_seconds) as avg_time
            FROM respondents
            WHERE survey_id = ? 
              AND is_completed = 1 
              AND completed_at >= datetime('now', '-' || ? || ' days')
            GROUP BY DATE(completed_at)
            ORDER BY date DESC
        `).all(req.params.surveyId, period);

        res.json({
            success: true,
            timeline,
            period: `${period} days`
        });

    } catch (error) {
        next(error);
    }
});

// Get dashboard summary (all surveys)
router.get('/dashboard/summary', authenticateToken, (req, res, next) => {
    try {
        const db = dbManager.getConnection();

        // Overall statistics
        const overall = db.prepare(`
            SELECT 
                COUNT(DISTINCT s.id) as total_surveys,
                COUNT(DISTINCT CASE WHEN s.is_active = 1 THEN s.id END) as active_surveys,
                COUNT(DISTINCT r.id) as total_respondents,
                COUNT(DISTINCT CASE WHEN r.is_completed = 1 THEN r.id END) as completed_responses,
                ROUND(CAST(COUNT(DISTINCT CASE WHEN r.is_completed = 1 THEN r.id END) AS REAL) / 
                      NULLIF(COUNT(DISTINCT r.id), 0) * 100, 2) as overall_completion_rate
            FROM surveys s
            LEFT JOIN respondents r ON s.id = r.survey_id
        `).get();

        // Recent activity
        const recentActivity = db.prepare(`
            SELECT 
                DATE(completed_at) as date,
                COUNT(*) as responses
            FROM respondents
            WHERE is_completed = 1 
              AND completed_at >= datetime('now', '-7 days')
            GROUP BY DATE(completed_at)
            ORDER BY date DESC
        `).all();

        // Top performing surveys
        const topSurveys = db.prepare(`
            SELECT * FROM vw_survey_statistics
            ORDER BY completed_responses DESC
            LIMIT 5
        `).all();

        res.json({
            success: true,
            summary: {
                overall,
                recent_activity: recentActivity,
                top_surveys: topSurveys
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
