const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const DB_PATH = './data/survey_platform.db';

console.log('\n🚀 MOROCCAN HERITAGE SURVEY PLATFORM');
console.log('📦 Complete Setup & Import\n');
console.log('='.repeat(70));

// Ensure data directory exists
if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
    console.log('✓ Created data directory');
}

// Delete old database
if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('✓ Removed old database');
}

const db = new sqlite3.Database(DB_PATH);

// Read and execute schema
const schema = fs.readFileSync('./database/schema-simple.sql', 'utf8');
console.log('✓ Read schema file');

db.serialize(() => {
    // Execute schema
    db.exec(schema, (err) => {
        if (err) {
            console.error('❌ Schema error:', err.message);
            process.exit(1);
        }
        console.log('✓ Created database schema');
    });

    // Create admin user
    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.run(`
        INSERT INTO admins (username, email, password_hash, full_name, role)
        VALUES (?, ?, ?, ?, ?)
    `, ['admin', 'admin@patrimoine.gov.ma', passwordHash, 'System Administrator', 'admin'], (err) => {
        if (err) console.error('Admin error:', err.message);
        else console.log('✓ Created admin user');
    });

    // Insert surveys
    const surveys = [
        { code: 'Q1_PRIMARY', title_fr: 'Enquête Primaire', title_ar: 'الاستطلاع الابتدائي', target: 'Primaire', duration: 20 },
        { code: 'Q2_COLLEGE', title_fr: 'Enquête Collège', title_ar: 'استطلاع الإعدادية', target: 'Collège', duration: 25 },
        { code: 'Q3_LYCEE', title_fr: 'Enquête Lycée', title_ar: 'استطلاع الثانوية', target: 'Lycée', duration: 20 },
        { code: 'Q4_UNIV', title_fr: 'Enquête Université', title_ar: 'استطلاع الجامعة', target: 'Université', duration: 25 },
        { code: 'Q5_PUBLIC', title_fr: 'Enquête Grand Public', title_ar: 'استطلاع عام', target: 'Public', duration: 30 },
        { code: 'Q6_MINISTRY', title_fr: 'Enquête Ministère', title_ar: 'استطلاع الوزارة', target: 'Ministère', duration: 35 },
        { code: 'Q7_HERITAGE_STUDENTS', title_fr: 'Enquête Étudiants Patrimoine', title_ar: 'استطلاع طلاب التراث', target: 'Étudiants', duration: 40 }
    ];

    const stmt = db.prepare(`
        INSERT INTO surveys (
            survey_code, title_fr, title_ar, target_audience, 
            estimated_duration, is_active
        ) VALUES (?, ?, ?, ?, ?, 1)
    `);

    surveys.forEach(s => {
        stmt.run(s.code, s.title_fr, s.title_ar, s.target, s.duration);
    });
    stmt.finalize(() => {
        console.log(`✓ Inserted ${surveys.length} surveys`);

        // Now import questions
        importAllSurveys();
    });
});

function importAllSurveys() {
    const files = [
        'Q1_PRIMARY.json',
        'Q2_COLLEGE.json',
        'Q3_LYCEE.json',
        'Q4_UNIV.json',
        'Q5_PUBLIC.json',
        'Q6_MINISTRY.json',
        'Q7_HERITAGE_STUDENTS.json'
    ];

    let completed = 0;
    let totalQuestions = 0;
    let totalOptions = 0;

    files.forEach((filename, index) => {
        const filePath = path.join('./survey-data', filename);
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Skipping ${filename}`);
            completed++;
            return;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const { surveyCode, sections } = data;

        db.get('SELECT id FROM surveys WHERE survey_code = ?', [surveyCode], (err, survey) => {
            if (err || !survey) {
                console.log(`❌ Survey not found: ${surveyCode}`);
                completed++;
                return;
            }

            console.log(`\n📄 Importing: ${surveyCode}`);

            sections.forEach((section, sIdx) => {
                db.run(`
                    INSERT INTO survey_sections (
                        survey_id, section_code, title_fr, title_ar, 
                        description_fr, display_order
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    survey.id,
                    `SEC_${section.order}`,
                    section.title,
                    section.title,
                    section.description || '',
                    section.order
                ], function (err) {
                    if (err) {
                        console.error(`  ❌ Section error:`, err.message);
                        return;
                    }

                    const sectionId = this.lastID;

                    section.questions.forEach((q, qIdx) => {
                        db.run(`
                            INSERT INTO questions (
                                section_id, question_code, question_number,
                                question_text_fr, question_text_ar, question_type,
                                is_required, display_order
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            sectionId,
                            `Q${q.order}`,
                            q.number,
                            q.text,
                            q.text,
                            q.type,
                            q.required ? 1 : 0,
                            q.order
                        ], function (err) {
                            if (err) {
                                console.error(`    ❌ Question error:`, err.message);
                                return;
                            }

                            const questionId = this.lastID;
                            totalQuestions++;

                            if (q.options && q.options.length > 0) {
                                q.options.forEach((opt, oIdx) => {
                                    db.run(`
                                        INSERT INTO question_options (
                                            question_id, option_code, option_text_fr,
                                            option_text_ar, option_value, display_order
                                        ) VALUES (?, ?, ?, ?, ?, ?)
                                    `, [
                                        questionId,
                                        `OPT${opt.order}`,
                                        opt.text,
                                        opt.text,
                                        opt.text,
                                        opt.order
                                    ], (err) => {
                                        if (!err) totalOptions++;
                                    });
                                });
                            }
                        });
                    });
                });
            });

            completed++;
            console.log(`  ✅ ${sections.length} sections, ${sections.reduce((sum, s) => sum + s.questions.length, 0)} questions`);

            if (completed === files.length) {
                setTimeout(() => {
                    db.all('SELECT COUNT(*) as count FROM questions', (err, rows) => {
                        console.log('\n' + '='.repeat(70));
                        console.log('📊 IMPORT COMPLETE\n');
                        console.log(`   Surveys: 7`);
                        console.log(`   Questions: ${rows[0].count}`);
                        console.log(`   Database: ${(fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(2)} MB`);
                        console.log('='.repeat(70));
                        console.log('\n✨ Setup complete! Run: npm start\n');

                        db.close();
                    });
                }, 2000);
            }
        });
    });
}
