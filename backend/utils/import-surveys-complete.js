const fs = require('fs');
const path = require('path');
const dbManager = require('./database-sqlite3');

async function importSurveyFromJSON(jsonFilePath) {
    try {
        console.log(`\n📄 Reading: ${path.basename(jsonFilePath)}`);

        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
        const { surveyCode, sections } = jsonData;

        // Get survey from database
        const survey = await dbManager.get('SELECT id FROM surveys WHERE survey_code = ?', [surveyCode]);

        if (!survey) {
            console.error(`❌ Survey not found: ${surveyCode}`);
            return false;
        }

        const surveyId = survey.id;
        console.log(`✅ Found survey: ${surveyCode} (ID: ${surveyId})`);

        let totalQuestions = 0;
        let totalOptions = 0;

        // Import sections and questions
        for (const section of sections) {
            console.log(`  📂 Section ${section.order}: ${section.title.substring(0, 50)}...`);

            // Insert section
            const sectionResult = await dbManager.run(`
                INSERT INTO survey_sections (
                    survey_id, 
                    section_code,
                    title_fr, 
                    title_ar,
                    description_fr, 
                    display_order
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                surveyId,
                `SEC_${section.order}`,
                section.title,
                section.title,
                section.description || '',
                section.order
            ]);

            const sectionId = sectionResult.lastID;

            // Import questions
            for (const question of section.questions) {
                const questionResult = await dbManager.run(`
                    INSERT INTO questions (
                        section_id, 
                        question_code,
                        question_number, 
                        question_text_fr, 
                        question_text_ar,
                        question_type, 
                        is_required, 
                        display_order
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    sectionId,
                    `Q${question.order}`,
                    question.number,
                    question.text,
                    question.text,
                    question.type,
                    question.required ? 1 : 0,
                    question.order
                ]);

                const questionId = questionResult.lastID;
                totalQuestions++;

                // Import options
                if (question.options && question.options.length > 0) {
                    for (const option of question.options) {
                        await dbManager.run(`
                            INSERT INTO question_options (
                                question_id, 
                                option_text_fr, 
                                option_text_ar,
                                option_value, 
                                display_order
                            ) VALUES (?, ?, ?, ?, ?)
                        `, [
                            questionId,
                            option.text,
                            option.text,
                            option.text,
                            option.order
                        ]);
                        totalOptions++;
                    }
                }
            }
        }

        console.log(`✅ Imported: ${sections.length} sections, ${totalQuestions} questions, ${totalOptions} options`);
        return true;

    } catch (error) {
        console.error(`❌ Error:`, error.message);
        return false;
    }
}

async function main() {
    try {
        console.log('\n🚀 MOROCCAN HERITAGE SURVEY PLATFORM');
        console.log('📊 Survey Import Process\n');
        console.log('='.repeat(60));

        await dbManager.initialize();

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
        const surveyDataDir = path.join(__dirname, '../../survey-data');

        for (const filename of surveyFiles) {
            const filePath = path.join(surveyDataDir, filename);

            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  Skipping ${filename} - not found`);
                continue;
            }

            const success = await importSurveyFromJSON(filePath);
            if (success) successCount++;
        }

        console.log('\n' + '='.repeat(60));
        console.log(`📊 IMPORT COMPLETE`);
        console.log(`   ✅ Successful: ${successCount}/${surveyFiles.length}`);
        console.log('='.repeat(60) + '\n');

        // Show stats
        const stats = await dbManager.getStatistics();
        console.log('📈 Database Statistics:');
        console.log(`   Surveys: ${stats.surveys}`);
        console.log(`   Sections: ${stats.sections}`);
        console.log(`   Questions: ${stats.questions}`);
        console.log(`   DB Size: ${(stats.database_size / 1024 / 1024).toFixed(2)} MB\n`);

        await dbManager.close();

        console.log('✨ All surveys imported successfully!\n');

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().then(() => process.exit(0)).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { importSurveyFromJSON };
