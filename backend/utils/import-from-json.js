const fs = require('fs');
const path = require('path');
const dbManager = require('./database-sqlite3');

/**
 * Import surveys from JSON files into the database
 */

async function importSurveyFromJSON(jsonFilePath) {
    try {
        console.log(`\n📄 Reading survey file: ${path.basename(jsonFilePath)}`);

        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
        const { surveyCode, sections } = jsonData;

        // Get survey_id from database
        const survey = await dbManager.get('SELECT survey_id FROM surveys WHERE survey_code = ?', [surveyCode]);

        if (!survey) {
            console.error(`❌ Survey not found with code: ${surveyCode}`);
            return false;
        }

        const surveyId = survey.survey_id;
        console.log(`✅ Found survey: ${surveyCode} (ID: ${surveyId})`);

        let totalQuestions = 0;
        let totalOptions = 0;

        // Import sections and questions
        for (const section of sections) {
            console.log(`  📂 Section ${section.order}: ${section.title}`);

            // Insert section
            const sectionResult = await dbManager.run(`
                INSERT INTO survey_sections (survey_id, title, description, display_order)
                VALUES (?, ?, ?, ?)
            `, [surveyId, section.title, section.description || '', section.order]);

            const sectionId = sectionResult.lastID;

            // Import questions for this section
            for (const question of section.questions) {
                const questionResult = await dbManager.run(`
                    INSERT INTO questions (
                        section_id, 
                        question_number, 
                        question_text, 
                        question_type, 
                        is_required, 
                        display_order
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    sectionId,
                    question.number,
                    question.text,
                    question.type,
                    question.required ? 1 : 0,
                    question.order
                ]);

                const questionId = questionResult.lastID;
                totalQuestions++;

                // Import options for this question (if any)
                if (question.options && question.options.length > 0) {
                    for (const option of question.options) {
                        await dbManager.run(`
                            INSERT INTO question_options (
                                question_id, 
                                option_text, 
                                option_value, 
                                display_order
                            ) VALUES (?, ?, ?, ?)
                        `, [
                            questionId,
                            option.text,
                            option.text,
                            option.order
                        ]);
                        totalOptions++;
                    }
                }
            }
        }

        console.log(`✅ Import complete: ${sections.length} sections, ${totalQuestions} questions, ${totalOptions} options`);
        return true;

    } catch (error) {
        console.error(`❌ Error importing survey from ${jsonFilePath}:`, error.message);
        console.error(error.stack);
        return false;
    }
}

async function importAllSurveys() {
    try {
        console.log('🚀 Starting survey import from JSON files...\n');

        // Initialize database
        await dbManager.initialize();

        const surveyDataDir = path.join(__dirname, '../../survey-data');

        const surveyFiles = [
            'Q1_PRIMARY.json',
            'Q2_COLLEGE.json',
            'Q3_LYCEE.json',
            'Q4_UNIV.json',
            'Q5_PUBLIC.json',
            'Q6_MINISTRY.json',
            'Q7_HERITAGE_STUDENTS.json'
        ];

        let successCount = 0;
        let failCount = 0;

        for (const filename of surveyFiles) {
            const filePath = path.join(surveyDataDir, filename);

            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  Skipping ${filename} - file not found`);
                failCount++;
                continue;
            }

            const success = await importSurveyFromJSON(filePath);
            if (success) {
                successCount++;
            } else {
                failCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`📊 Import Summary:`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Failed: ${failCount}`);
        console.log(`   📁 Total: ${surveyFiles.length}`);
        console.log('='.repeat(60) + '\n');

        if (successCount > 0) {
            console.log('✨ Survey import completed successfully!');
        }

        // Close database connection
        await dbManager.close();

    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    importAllSurveys()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { importSurveyFromJSON, importAllSurveys };
