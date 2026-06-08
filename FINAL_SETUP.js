const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const DB_PATH = './data/survey_platform.db';

console.log('\n🚀 MOROCCAN HERITAGE SURVEY PLATFORM - FINAL SETUP');
console.log('='.repeat(70) + '\n');

if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
try {
    if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
} catch (e) {
    console.log('⚠️  Database in use, will overwrite tables...');
}

const db = new sqlite3.Database(DB_PATH);
const schema = fs.readFileSync('./database/schema-simple.sql', 'utf8');

db.serialize(() => {
    // Drop existing tables
    db.exec('DROP TABLE IF EXISTS responses', (err) => { });
    db.exec('DROP TABLE IF EXISTS respondents', (err) => { });
    db.exec('DROP TABLE IF EXISTS question_options', (err) => { });
    db.exec('DROP TABLE IF EXISTS questions', (err) => { });
    db.exec('DROP TABLE IF EXISTS sections', (err) => { });
    db.exec('DROP TABLE IF EXISTS surveys', (err) => { });
    db.exec('DROP TABLE IF EXISTS audit_logs', (err) => { });
    db.exec('DROP TABLE IF EXISTS admin_sessions', (err) => { });
    db.exec('DROP TABLE IF EXISTS admins', (err) => { });

    db.exec(schema, (err) => {
        if (err) {
            console.error('❌ Schema error:', err.message);
            process.exit(1);
        }
        console.log('✓ Database schema created');
    });

    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT INTO admins (username, email, password_hash, full_name, role) 
            VALUES (?, ?, ?, ?, ?)`,
        ['admin', 'admin@patrimoine.gov.ma', passwordHash, 'Administrator', 'admin']);
    console.log('✓ Admin user created');

    const surveys = [
        { code: 'Q1_PRIMARY', title: 'Enquête Primaire', target: 'Élèves primaire', duration: 20 },
        { code: 'Q2_COLLEGE', title: 'Enquête Collège', target: 'Élèves collège', duration: 25 },
        { code: 'Q3_LYCEE', title: 'Enquête Lycée', target: 'Élèves lycée', duration: 20 },
        { code: 'Q4_UNIV', title: 'Enquête Université', target: 'Étudiants université', duration: 25 },
        { code: 'Q5_PUBLIC', title: 'Enquête Public', target: 'Grand public', duration: 30 },
        { code: 'Q6_MINISTRY', title: 'Enquête Ministère', target: 'Employés ministère', duration: 35 },
        { code: 'Q7_HERITAGE_STUDENTS', title: 'Enquête Patrimoine', target: 'Étudiants patrimoine', duration: 40 }
    ];

    const stmt = db.prepare('INSERT INTO surveys (survey_code, title_fr, target_audience, estimated_duration, is_active) VALUES (?, ?, ?, ?, 1)');
    surveys.forEach(s => stmt.run(s.code, s.title, s.target, s.duration));
    stmt.finalize(() => {
        console.log(`✓ ${surveys.length} surveys created\n`);
        importAllSurveys();
    });
});

function importAllSurveys() {
    const files = ['Q1_PRIMARY.json', 'Q2_COLLEGE.json', 'Q3_LYCEE.json', 'Q4_UNIV.json', 'Q5_PUBLIC.json', 'Q6_MINISTRY.json', 'Q7_HERITAGE_STUDENTS.json'];
    let completed = 0;

    files.forEach(filename => {
        const filePath = path.join('./survey-data', filename);
        if (!fs.existsSync(filePath)) {
            completed++;
            return;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const { surveyCode, sections } = data;

        db.get('SELECT id FROM surveys WHERE survey_code = ?', [surveyCode], (err, survey) => {
            if (err || !survey) {
                completed++;
                return;
            }

            console.log(`📄 Importing ${surveyCode}...`);
            let sectionsDone = 0;

            sections.forEach(section => {
                db.run('INSERT INTO sections (survey_id, title_fr, description_fr, display_order) VALUES (?, ?, ?, ?)',
                    [survey.id, section.title, section.description || '', section.order],
                    function (err) {
                        if (err) {
                            console.error(`  ❌ Section error:`, err.message);
                            return;
                        }

                        const sectionId = this.lastID;
                        let questionsDone = 0;

                        section.questions.forEach(q => {
                            db.run(`INSERT INTO questions (
                                section_id, question_number, question_text_fr, 
                                question_type, required, display_order
                            ) VALUES (?, ?, ?, ?, ?, ?)`,
                                [sectionId, q.number, q.text, q.type, q.required ? 1 : 0, q.order],
                                function (err) {
                                    if (err) {
                                        console.error(`    ❌ Question error:`, err.message);
                                        return;
                                    }

                                    const questionId = this.lastID;

                                    if (q.options && q.options.length > 0) {
                                        const optStmt = db.prepare('INSERT INTO question_options (question_id, option_text_fr, display_order) VALUES (?, ?, ?)');
                                        q.options.forEach(opt => {
                                            optStmt.run(questionId, opt.text, opt.order);
                                        });
                                        optStmt.finalize();
                                    }

                                    questionsDone++;
                                    if (questionsDone === section.questions.length) {
                                        sectionsDone++;
                                        if (sectionsDone === sections.length) {
                                            console.log(`  ✅ ${sections.length} sections, ${sections.reduce((sum, s) => sum + s.questions.length, 0)} questions\n`);
                                            completed++;
                                            checkCompletion();
                                        }
                                    }
                                });
                        });
                    }
                );
            });
        });
    });

    function checkCompletion() {
        if (completed === files.length) {
            setTimeout(() => {
                db.all('SELECT COUNT(*) as c FROM questions', (err, rows) => {
                    db.all('SELECT COUNT(*) as c FROM sections', (err2, rows2) => {
                        console.log('='.repeat(70));
                        console.log('✨ SETUP COMPLETE!\n');
                        console.log(`   📊 Surveys: 7`);
                        console.log(`   📂 Sections: ${rows2[0].c}`);
                        console.log(`   ❓ Questions: ${rows[0].c}`);
                        console.log(`   💾 Database: ${(fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(2)} MB\n`);
                        console.log('='.repeat(70));
                        console.log('\n🎯 Next steps:');
                        console.log('   1. npm start');
                        console.log('   2. Open: http://localhost:3000');
                        console.log('   3. Login: admin / admin123\n');

                        db.close();
                    });
                });
            }, 1000);
        }
    }
}
