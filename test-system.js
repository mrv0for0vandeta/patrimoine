/**
 * System Test Script
 * Tests core functionality of the survey platform
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = './data/survey_platform.db';
const db = new sqlite3.Database(dbPath);

console.log('\n========================================');
console.log('MOROCCAN HERITAGE SURVEY PLATFORM');
console.log('System Test Script');
console.log('========================================\n');

// Test 1: Database Connection
function testDatabaseConnection() {
    return new Promise((resolve, reject) => {
        db.get('SELECT 1', (err) => {
            if (err) {
                console.log('❌ Database connection: FAILED');
                console.log('   Error:', err.message);
                reject(err);
            } else {
                console.log('✅ Database connection: PASSED');
                resolve();
            }
        });
    });
}

// Test 2: Verify Surveys
function testSurveysExist() {
    return new Promise((resolve, reject) => {
        db.all('SELECT survey_code, title_fr, is_active FROM surveys ORDER BY id', (err, rows) => {
            if (err) {
                console.log('❌ Survey verification: FAILED');
                reject(err);
            } else {
                console.log('✅ Survey verification: PASSED');
                console.log(`   Found ${rows.length} surveys:`);
                rows.forEach(row => {
                    console.log(`   - ${row.survey_code}: ${row.title_fr} (${row.is_active ? 'Active' : 'Inactive'})`);
                });
                resolve(rows);
            }
        });
    });
}

// Test 3: Verify Sections
function testSectionsExist() {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM sections', (err, row) => {
            if (err) {
                console.log('❌ Section verification: FAILED');
                reject(err);
            } else {
                console.log('✅ Section verification: PASSED');
                console.log(`   Found ${row.count} sections`);
                resolve(row.count);
            }
        });
    });
}

// Test 4: Verify Questions
function testQuestionsExist() {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM questions', (err, row) => {
            if (err) {
                console.log('❌ Question verification: FAILED');
                reject(err);
            } else {
                console.log('✅ Question verification: PASSED');
                console.log(`   Found ${row.count} questions`);
                resolve(row.count);
            }
        });
    });
}

// Test 5: Verify Options
function testOptionsExist() {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM question_options', (err, row) => {
            if (err) {
                console.log('❌ Options verification: FAILED');
                reject(err);
            } else {
                console.log('✅ Options verification: PASSED');
                console.log(`   Found ${row.count} options`);
                resolve(row.count);
            }
        });
    });
}

// Test 6: Verify Admin User
function testAdminExists() {
    return new Promise((resolve, reject) => {
        db.get('SELECT username, email, is_active FROM admins WHERE username = ?', ['admin'], (err, row) => {
            if (err) {
                console.log('❌ Admin user verification: FAILED');
                reject(err);
            } else if (!row) {
                console.log('❌ Admin user verification: FAILED');
                console.log('   No admin user found');
                reject(new Error('No admin user'));
            } else {
                console.log('✅ Admin user verification: PASSED');
                console.log(`   Username: ${row.username}, Email: ${row.email}, Active: ${row.is_active}`);
                resolve(row);
            }
        });
    });
}

// Test 7: Verify Data Integrity
function testDataIntegrity() {
    return new Promise((resolve, reject) => {
        // Check for orphaned sections
        db.get(`
            SELECT COUNT(*) as count FROM sections 
            WHERE survey_id NOT IN (SELECT id FROM surveys)
        `, (err, row) => {
            if (err) {
                console.log('❌ Data integrity check: FAILED');
                reject(err);
            } else if (row.count > 0) {
                console.log('⚠️  Data integrity check: WARNING');
                console.log(`   Found ${row.count} orphaned sections`);
                resolve();
            } else {
                console.log('✅ Data integrity check: PASSED');
                console.log('   No orphaned records found');
                resolve();
            }
        });
    });
}

// Test 8: Verify File Structure
function testFileStructure() {
    const fs = require('fs');
    const requiredFiles = [
        './backend/server.js',
        './backend/utils/database-sqlite3.js',
        './backend/routes/auth.js',
        './backend/routes/survey.js',
        './backend/routes/admin.js',
        './backend/routes/analytics.js',
        './backend/routes/export.js',
        './frontend/index.html',
        './frontend/survey.html',
        './frontend/admin/index.html',
        './frontend/js/api-client.js',
        './frontend/js/survey-engine.js',
        './frontend/css/main.css',
        './frontend/css/survey.css',
        './package.json',
        './.env'
    ];

    let allExist = true;
    console.log('File structure verification:');

    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`   ✅ ${file}`);
        } else {
            console.log(`   ❌ ${file} MISSING`);
            allExist = false;
        }
    });

    if (allExist) {
        console.log('✅ File structure: PASSED');
    } else {
        console.log('❌ File structure: FAILED');
    }

    return Promise.resolve(allExist);
}

// Test 9: Database Size
function testDatabaseSize() {
    const fs = require('fs');
    return new Promise((resolve) => {
        if (fs.existsSync(dbPath)) {
            const stats = fs.statSync(dbPath);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            console.log('✅ Database size check: PASSED');
            console.log(`   Database size: ${sizeMB} MB`);
            resolve(sizeMB);
        } else {
            console.log('❌ Database size check: FAILED');
            console.log('   Database file not found');
            resolve(0);
        }
    });
}

// Test 10: Survey Statistics
function testSurveyStatistics() {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                s.survey_code,
                s.title_fr,
                COUNT(DISTINCT sec.id) as section_count,
                COUNT(DISTINCT q.id) as question_count,
                COUNT(DISTINCT qo.id) as option_count
            FROM surveys s
            LEFT JOIN sections sec ON s.id = sec.survey_id
            LEFT JOIN questions q ON sec.id = q.section_id
            LEFT JOIN question_options qo ON q.id = qo.question_id
            GROUP BY s.id
            ORDER BY s.id
        `, (err, rows) => {
            if (err) {
                console.log('❌ Survey statistics: FAILED');
                reject(err);
            } else {
                console.log('✅ Survey statistics: PASSED');
                console.log('\n   Detailed Survey Breakdown:');
                console.log('   ' + '='.repeat(80));
                rows.forEach(row => {
                    console.log(`   ${row.survey_code}: ${row.section_count} sections, ${row.question_count} questions, ${row.option_count} options`);
                });
                console.log('   ' + '='.repeat(80));
                resolve(rows);
            }
        });
    });
}

// Run all tests
async function runAllTests() {
    try {
        await testDatabaseConnection();
        await testSurveysExist();
        await testSectionsExist();
        await testQuestionsExist();
        await testOptionsExist();
        await testAdminExists();
        await testDataIntegrity();
        await testFileStructure();
        await testDatabaseSize();
        await testSurveyStatistics();

        console.log('\n========================================');
        console.log('ALL TESTS COMPLETED');
        console.log('========================================\n');
        console.log('✅ System is ready for use!');
        console.log('\nNext steps:');
        console.log('1. Start server: node backend/server.js');
        console.log('2. Open browser: http://localhost:3000');
        console.log('3. Admin login: http://localhost:3000/admin');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('\n⚠️  IMPORTANT: Change the default admin password before deployment!\n');

    } catch (error) {
        console.log('\n========================================');
        console.log('TESTS FAILED');
        console.log('========================================\n');
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Run tests
runAllTests();
