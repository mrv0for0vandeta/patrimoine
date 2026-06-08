const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');
const dbManager = require('../utils/database');
const { authenticateToken, authorizeRole, logActivity } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');

/**
 * Data Export Routes
 * Handles exporting survey data in various formats
 */

// Ensure exports directory exists
const exportsDir = path.join(__dirname, '../../exports');
if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
}

// Get survey data for export
function getSurveyData(surveyId, includeIncomplete = false) {
    const db = dbManager.getConnection();

    // Get survey info
    const survey = db.prepare('SELECT * FROM surveys WHERE id = ?').get(surveyId);
    if (!survey) {
        throw new NotFoundError('Survey not found');
    }

    // Get respondents
    const respondentsQuery = includeIncomplete
        ? 'SELECT * FROM respondents WHERE survey_id = ? ORDER BY id'
        : 'SELECT * FROM respondents WHERE survey_id = ? AND is_completed = 1 ORDER BY id';

    const respondents = db.prepare(respondentsQuery).all(surveyId);

    // Get all responses with question info
    const responses = db.prepare(`
        SELECT 
            r.id,
            r.respondent_id,
            resp.respondent_uuid,
            q.question_code,
            q.question_number,
            q.question_text_fr,
            q.question_type,
            r.response_text,
            r.response_value,
            r.response_numeric,
            GROUP_CONCAT(o.option_text_fr, '; ') as selected_options
        FROM responses r
        JOIN questions q ON r.question_id = q.id
        JOIN respondents resp ON r.respondent_id = resp.id
        LEFT JOIN response_options ro ON r.id = ro.response_id
        LEFT JOIN question_options o ON ro.option_id = o.id
        WHERE resp.survey_id = ? ${!includeIncomplete ? 'AND resp.is_completed = 1' : ''}
        GROUP BY r.id
        ORDER BY r.respondent_id, q.display_order
    `).all(surveyId);

    // Get demographics
    const demographics = db.prepare(`
        SELECT d.*, r.respondent_uuid
        FROM demographics d
        JOIN respondents r ON d.respondent_id = r.id
        WHERE r.survey_id = ? ${!includeIncomplete ? 'AND r.is_completed = 1' : ''}
    `).all(surveyId);

    return { survey, respondents, responses, demographics };
}

// Export to CSV
router.get('/survey/:surveyId/csv', authenticateToken, logActivity('EXPORT_DATA', 'survey'), (req, res, next) => {
    try {
        const includeIncomplete = req.query.include_incomplete === 'true';
        const { survey, respondents, responses, demographics } = getSurveyData(req.params.surveyId, includeIncomplete);

        // Prepare data for CSV
        const csvData = respondents.map(respondent => {
            const demo = demographics.find(d => d.respondent_uuid === respondent.respondent_uuid) || {};
            const respondentResponses = responses.filter(r => r.respondent_id === respondent.id);

            const row = {
                respondent_uuid: respondent.respondent_uuid,
                started_at: respondent.started_at,
                completed_at: respondent.completed_at,
                is_completed: respondent.is_completed,
                time_taken_seconds: respondent.time_taken_seconds,
                language_preference: respondent.language_preference,
                age_group: demo.age_group,
                gender: demo.gender,
                region_residence: demo.region_residence,
                region_origin: demo.region_origin,
                urban_rural: demo.urban_rural,
                education_level: demo.education_level,
                employment_status: demo.employment_status
            };

            // Add responses as columns
            respondentResponses.forEach(r => {
                const columnName = `${r.question_code}_${r.question_number}`;
                row[columnName] = r.selected_options || r.response_text || r.response_value || r.response_numeric || '';
            });

            return row;
        });

        // Generate CSV
        const parser = new Parser({ delimiter: ',' });
        const csv = parser.parse(csvData);

        // Save to file
        const filename = `survey_${survey.survey_code}_${Date.now()}.csv`;
        const filepath = path.join(exportsDir, filename);
        fs.writeFileSync(filepath, csv, 'utf8');

        // Record export
        const db = dbManager.getConnection();
        db.prepare(`
            INSERT INTO data_exports (admin_id, survey_id, export_type, file_path, file_name, file_size)
            VALUES (?, ?, 'csv', ?, ?, ?)
        `).run(req.user.id, req.params.surveyId, filepath, filename, Buffer.byteLength(csv));

        // Send file
        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('Download error:', err);
            }
        });

    } catch (error) {
        next(error);
    }
});

// Export to Excel (XLSX)
router.get('/survey/:surveyId/xlsx', authenticateToken, logActivity('EXPORT_DATA', 'survey'), (req, res, next) => {
    try {
        const includeIncomplete = req.query.include_incomplete === 'true';
        const { survey, respondents, responses, demographics } = getSurveyData(req.params.surveyId, includeIncomplete);

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Sheet 1: Responses
        const responseData = respondents.map(respondent => {
            const demo = demographics.find(d => d.respondent_uuid === respondent.respondent_uuid) || {};
            const respondentResponses = responses.filter(r => r.respondent_id === respondent.id);

            const row = {
                'Respondent UUID': respondent.respondent_uuid,
                'Started At': respondent.started_at,
                'Completed At': respondent.completed_at,
                'Status': respondent.is_completed ? 'Completed' : 'Incomplete',
                'Time Taken (seconds)': respondent.time_taken_seconds,
                'Language': respondent.language_preference,
                'Age Group': demo.age_group,
                'Gender': demo.gender,
                'Region': demo.region_residence,
                'Origin Region': demo.region_origin,
                'Urban/Rural': demo.urban_rural,
                'Education': demo.education_level,
                'Employment': demo.employment_status
            };

            respondentResponses.forEach(r => {
                const columnName = `${r.question_number} - ${r.question_text_fr.substring(0, 50)}`;
                row[columnName] = r.selected_options || r.response_text || r.response_value || r.response_numeric || '';
            });

            return row;
        });

        const ws1 = XLSX.utils.json_to_sheet(responseData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Responses');

        // Sheet 2: Demographics Summary
        const demoSummary = demographics.map(d => ({
            'Respondent UUID': d.respondent_uuid,
            'Age Group': d.age_group,
            'Gender': d.gender,
            'Region Residence': d.region_residence,
            'Region Origin': d.region_origin,
            'Urban/Rural': d.urban_rural,
            'Education Level': d.education_level,
            'Employment Status': d.employment_status,
            'Institution Type': d.institution_type,
            'Study Level': d.study_level,
            'Primary Language': d.primary_language
        }));

        const ws2 = XLSX.utils.json_to_sheet(demoSummary);
        XLSX.utils.book_append_sheet(wb, ws2, 'Demographics');

        // Sheet 3: Survey Info
        const surveyInfo = [{
            'Survey Code': survey.survey_code,
            'Title (FR)': survey.title_fr,
            'Target Audience': survey.target_audience,
            'Total Responses': respondents.length,
            'Export Date': new Date().toISOString()
        }];

        const ws3 = XLSX.utils.json_to_sheet(surveyInfo);
        XLSX.utils.book_append_sheet(wb, ws3, 'Survey Info');

        // Write file
        const filename = `survey_${survey.survey_code}_${Date.now()}.xlsx`;
        const filepath = path.join(exportsDir, filename);
        XLSX.writeFile(wb, filepath);

        // Record export
        const fileSize = fs.statSync(filepath).size;
        const db = dbManager.getConnection();
        db.prepare(`
            INSERT INTO data_exports (admin_id, survey_id, export_type, file_path, file_name, file_size)
            VALUES (?, ?, 'xlsx', ?, ?, ?)
        `).run(req.user.id, req.params.surveyId, filepath, filename, fileSize);

        // Send file
        res.download(filepath, filename);

    } catch (error) {
        next(error);
    }
});

// Export to JSON
router.get('/survey/:surveyId/json', authenticateToken, logActivity('EXPORT_DATA', 'survey'), (req, res, next) => {
    try {
        const includeIncomplete = req.query.include_incomplete === 'true';
        const { survey, respondents, responses, demographics } = getSurveyData(req.params.surveyId, includeIncomplete);

        // Structure data
        const exportData = {
            survey: {
                code: survey.survey_code,
                title_fr: survey.title_fr,
                title_ar: survey.title_ar,
                target_audience: survey.target_audience
            },
            export_info: {
                export_date: new Date().toISOString(),
                total_respondents: respondents.length,
                exported_by: req.user.username
            },
            respondents: respondents.map(respondent => {
                const demo = demographics.find(d => d.respondent_uuid === respondent.respondent_uuid);
                const respondentResponses = responses.filter(r => r.respondent_id === respondent.id);

                return {
                    uuid: respondent.respondent_uuid,
                    started_at: respondent.started_at,
                    completed_at: respondent.completed_at,
                    is_completed: respondent.is_completed,
                    time_taken_seconds: respondent.time_taken_seconds,
                    language: respondent.language_preference,
                    demographics: demo || null,
                    responses: respondentResponses.map(r => ({
                        question_code: r.question_code,
                        question_number: r.question_number,
                        question_text: r.question_text_fr,
                        question_type: r.question_type,
                        response_text: r.response_text,
                        response_value: r.response_value,
                        response_numeric: r.response_numeric,
                        selected_options: r.selected_options
                    }))
                };
            })
        };

        const jsonString = JSON.stringify(exportData, null, 2);

        // Save to file
        const filename = `survey_${survey.survey_code}_${Date.now()}.json`;
        const filepath = path.join(exportsDir, filename);
        fs.writeFileSync(filepath, jsonString, 'utf8');

        // Record export
        const db = dbManager.getConnection();
        db.prepare(`
            INSERT INTO data_exports (admin_id, survey_id, export_type, file_path, file_name, file_size)
            VALUES (?, ?, 'json', ?, ?, ?)
        `).run(req.user.id, req.params.surveyId, filepath, filename, Buffer.byteLength(jsonString));

        // Send file
        res.download(filepath, filename);

    } catch (error) {
        next(error);
    }
});

// Export to SPSS format (syntax file + CSV)
router.get('/survey/:surveyId/spss', authenticateToken, logActivity('EXPORT_DATA', 'survey'), (req, res, next) => {
    try {
        const includeIncomplete = req.query.include_incomplete === 'true';
        const { survey, respondents, responses } = getSurveyData(req.params.surveyId, includeIncomplete);

        const db = dbManager.getConnection();

        // Get all questions
        const questions = db.prepare(`
            SELECT q.*, s.section_number
            FROM questions q
            JOIN survey_sections s ON q.section_id = s.id
            WHERE s.survey_id = ?
            ORDER BY s.display_order, q.display_order
        `).all(req.params.surveyId);

        // Generate SPSS syntax file
        let syntax = `* SPSS Syntax File for ${survey.survey_code}\n`;
        syntax += `* Generated: ${new Date().toISOString()}\n\n`;
        syntax += `DATA LIST FILE='survey_${survey.survey_code}_data.csv' LIST /\n`;
        syntax += `  respondent_id\n`;

        questions.forEach(q => {
            const varName = `Q${q.question_number.replace(/\./g, '_')}`;
            syntax += `  ${varName}\n`;
        });

        syntax += `.\n\nVARIABLE LABELS\n`;

        questions.forEach(q => {
            const varName = `Q${q.question_number.replace(/\./g, '_')}`;
            const label = q.question_text_fr.replace(/'/g, "''").substring(0, 120);
            syntax += `  ${varName} '${label}'\n`;
        });

        syntax += `.\n\nEXECUTE.\n`;

        // Save syntax file
        const syntaxFilename = `survey_${survey.survey_code}_spss_${Date.now()}.sps`;
        const syntaxFilepath = path.join(exportsDir, syntaxFilename);
        fs.writeFileSync(syntaxFilepath, syntax, 'utf8');

        res.json({
            success: true,
            message: 'SPSS export files generated',
            files: {
                syntax: syntaxFilename,
                data: `Use /csv endpoint for data file`
            }
        });

    } catch (error) {
        next(error);
    }
});

// List export history
router.get('/history', authenticateToken, (req, res, next) => {
    try {
        const db = dbManager.getConnection();
        const exports = db.prepare(`
            SELECT 
                e.*,
                s.survey_code,
                s.title_fr,
                a.username as exported_by
            FROM data_exports e
            JOIN surveys s ON e.survey_id = s.id
            JOIN admins a ON e.admin_id = a.id
            ORDER BY e.created_at DESC
            LIMIT 50
        `).all();

        res.json({
            success: true,
            exports
        });

    } catch (error) {
        next(error);
    }
});

// Download previous export
router.get('/download/:exportId', authenticateToken, (req, res, next) => {
    try {
        const db = dbManager.getConnection();
        const exportRecord = db.prepare('SELECT * FROM data_exports WHERE id = ?').get(req.params.exportId);

        if (!exportRecord) {
            throw new NotFoundError('Export not found');
        }

        if (!fs.existsSync(exportRecord.file_path)) {
            throw new NotFoundError('Export file no longer exists');
        }

        // Update download count
        db.prepare(`
            UPDATE data_exports 
            SET download_count = download_count + 1, last_downloaded = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(req.params.exportId);

        res.download(exportRecord.file_path, exportRecord.file_name);

    } catch (error) {
        next(error);
    }
});

module.exports = router;
