/**
 * Survey Question Import Utility
 * Extracts questions from DOCX files and imports to database
 * CRITICAL: Preserves exact wording, numbering, and order from source documents
 */

const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const dbManager = require('./database');

/**
 * DOCX file paths
 */
const DOCX_FILES = {
    french: path.join(__dirname, '../../Questionnaires_Patrimoine_Marocain.docx'),
    arabic: path.join(__dirname, '../../Questionnaires_Patrimoine_Marocain_AR_Amélioré.docx')
};

/**
 * Survey code mapping to database survey IDs
 */
const SURVEY_CODES = {
    'Q1_PRIMARY': 1,
    'Q2_COLLEGE': 2,
    'Q3_LYCEE': 3,
    'Q4_UNIV': 4,
    'Q5_PUBLIC': 5,
    'Q6_MINISTRY': 6,
    'Q7_HERITAGE_STUDENTS': 7
};

/**
 * Extract text from DOCX file
 */
async function extractTextFromDocx(filePath) {
    try {
        console.log(`Reading DOCX file: ${filePath}`);
        const result = await mammoth.extractRawText({ path: filePath });
        console.log(`✓ Successfully extracted text from ${path.basename(filePath)}`);
        return result.value;
    } catch (error) {
        console.error(`✗ Error reading DOCX file: ${error.message}`);
        throw error;
    }
}

/**
 * Parse question type from text patterns
 */
function detectQuestionType(questionText, hasOptions) {
    const lowerText = questionText.toLowerCase();

    // Check for multiple choice patterns
    if (hasOptions) {
        if (lowerText.includes('plusieurs réponses') ||
            lowerText.includes('plusieurs choix') ||
            lowerText.includes('cochez toutes') ||
            lowerText.includes('multiple')) {
            return 'checkbox';
        }

        if (lowerText.includes('échelle') ||
            lowerText.includes('scale') ||
            lowerText.includes('de 1 à') ||
            /\d+\s*à\s*\d+/.test(lowerText)) {
            return 'likert';
        }

        return 'radio'; // Default for options
    }

    // Check for text input patterns
    if (lowerText.includes('expliquez') ||
        lowerText.includes('décrivez') ||
        lowerText.includes('pourquoi') ||
        lowerText.includes('comment') ||
        lowerText.includes('commentaire')) {
        return 'textarea';
    }

    return 'text';
}

/**
 * Parse a single survey from extracted text
 * This function needs to be customized based on actual DOCX structure
 */
function parseSurveyFromText(text, surveyCode) {
    console.log(`\nParsing survey: ${surveyCode}`);

    // Split text into lines
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const sections = [];
    let currentSection = null;
    let currentQuestion = null;
    let questionCounter = 0;

    // This is a template parser - needs customization based on actual document structure
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detect section headers (customize based on actual format)
        // Example patterns: "Section 1:", "PARTIE I", etc.
        if (/^(Section|Partie|SECTION|PARTIE)\s*[IVX\d]+/i.test(line) ||
            /^[IVX]+\.\s+[A-Z]/.test(line)) {

            if (currentSection) {
                sections.push(currentSection);
            }

            currentSection = {
                title: line,
                description: '',
                order: sections.length + 1,
                questions: []
            };
            continue;
        }

        // Detect questions (customize based on actual format)
        // Example patterns: "1.", "Q1.", "Question 1"
        if (/^(\d+|Q\d+)[\.\)]\s+/.test(line)) {
            if (currentQuestion && currentSection) {
                currentSection.questions.push(currentQuestion);
            }

            questionCounter++;
            currentQuestion = {
                number: questionCounter,
                text: line.replace(/^(\d+|Q\d+)[\.\)]\s+/, ''),
                type: 'text',
                required: true,
                order: questionCounter,
                options: []
            };
            continue;
        }

        // Detect options (customize based on actual format)
        // Example patterns: "a)", "○", "□", "-"
        if (currentQuestion && /^[a-z][\.\)]\s+|^[○□▪•-]\s+/.test(line)) {
            const optionText = line.replace(/^[a-z][\.\)]\s+|^[○□▪•-]\s+/, '');
            currentQuestion.options.push({
                text: optionText,
                order: currentQuestion.options.length + 1
            });
        } else if (currentQuestion && line.length > 0 && !currentSection) {
            // Continuation of question text
            currentQuestion.text += ' ' + line;
        } else if (currentSection && !currentQuestion && line.length > 0) {
            // Section description
            currentSection.description += (currentSection.description ? ' ' : '') + line;
        }
    }

    // Add last question and section
    if (currentQuestion && currentSection) {
        currentSection.questions.push(currentQuestion);
    }
    if (currentSection) {
        sections.push(currentSection);
    }

    // Detect question types based on options
    sections.forEach(section => {
        section.questions.forEach(question => {
            question.type = detectQuestionType(question.text, question.options.length > 0);
        });
    });

    console.log(`✓ Parsed ${sections.length} sections with ${questionCounter} total questions`);

    return sections;
}

/**
 * Import sections and questions to database
 */
function importToDatabase(surveyCode, sections) {
    const db = dbManager.getDb();
    const surveyId = SURVEY_CODES[surveyCode];

    if (!surveyId) {
        throw new Error(`Unknown survey code: ${surveyCode}`);
    }

    console.log(`\nImporting to database: Survey ID ${surveyId} (${surveyCode})`);

    // Start transaction
    const transaction = db.transaction(() => {
        // Clear existing sections and questions for this survey
        db.prepare('DELETE FROM questions WHERE section_id IN (SELECT id FROM sections WHERE survey_id = ?)').run(surveyId);
        db.prepare('DELETE FROM sections WHERE survey_id = ?').run(surveyId);

        let totalQuestions = 0;
        let totalOptions = 0;

        // Insert sections and questions
        sections.forEach(section => {
            // Insert section
            const sectionResult = db.prepare(`
                INSERT INTO sections (survey_id, title_fr, description_fr, display_order)
                VALUES (?, ?, ?, ?)
            `).run(surveyId, section.title, section.description, section.order);

            const sectionId = sectionResult.lastInsertRowid;

            // Insert questions
            section.questions.forEach(question => {
                const questionResult = db.prepare(`
                    INSERT INTO questions (
                        section_id, question_number, question_text_fr, 
                        question_type, required, display_order
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    sectionId,
                    question.number,
                    question.text,
                    question.type,
                    question.required ? 1 : 0,
                    question.order
                );

                const questionId = questionResult.lastInsertRowid;
                totalQuestions++;

                // Insert options if any
                question.options.forEach(option => {
                    db.prepare(`
                        INSERT INTO question_options (question_id, option_text_fr, display_order)
                        VALUES (?, ?, ?)
                    `).run(questionId, option.text, option.order);
                    totalOptions++;
                });
            });
        });

        console.log(`✓ Imported ${sections.length} sections`);
        console.log(`✓ Imported ${totalQuestions} questions`);
        console.log(`✓ Imported ${totalOptions} options`);
    });

    // Execute transaction
    transaction();
}

/**
 * Manual import function for when automatic parsing fails
 * Allows manual entry of survey structure
 */
async function manualImport(surveyCode) {
    console.log('\n=== MANUAL IMPORT MODE ===');
    console.log('Automatic parsing failed. Please enter survey structure manually.');
    console.log('See MANUAL_IMPORT_TEMPLATE.json for structure.\n');

    const templatePath = path.join(__dirname, `../../survey-data/${surveyCode}.json`);

    if (fs.existsSync(templatePath)) {
        console.log(`Loading from: ${templatePath}`);
        const data = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        importToDatabase(surveyCode, data.sections);
    } else {
        console.log(`\n⚠ Template file not found: ${templatePath}`);
        console.log('Please create a JSON file with the following structure:');
        console.log(JSON.stringify({
            surveyCode: surveyCode,
            sections: [
                {
                    title: "Section Title",
                    description: "Section description",
                    order: 1,
                    questions: [
                        {
                            number: 1,
                            text: "Question text exactly as in DOCX",
                            type: "radio",
                            required: true,
                            order: 1,
                            options: [
                                { text: "Option 1", order: 1 },
                                { text: "Option 2", order: 2 }
                            ]
                        }
                    ]
                }
            ]
        }, null, 2));
    }
}

/**
 * Import all surveys from DOCX files
 */
async function importAllSurveys() {
    console.log('='.repeat(70));
    console.log('MOROCCAN HERITAGE SURVEY - QUESTION IMPORT UTILITY');
    console.log('='.repeat(70));
    console.log('\n⚠ CRITICAL: This process preserves exact wording from DOCX files');
    console.log('No modifications, translations, or corrections will be made.\n');

    // Check if DOCX files exist
    if (!fs.existsSync(DOCX_FILES.french)) {
        console.error(`✗ French DOCX file not found: ${DOCX_FILES.french}`);
        return;
    }

    try {
        // Extract text from French DOCX
        const frenchText = await extractTextFromDocx(DOCX_FILES.french);

        // Save extracted text for manual review
        const extractedPath = path.join(__dirname, '../../extracted-text.txt');
        fs.writeFileSync(extractedPath, frenchText, 'utf8');
        console.log(`\n✓ Extracted text saved to: ${extractedPath}`);
        console.log('  Please review this file to verify correct extraction.\n');

        // Attempt to parse each survey
        // NOTE: The user will need to review and potentially customize the parsing logic
        console.log('\n' + '='.repeat(70));
        console.log('PARSING SURVEYS FROM EXTRACTED TEXT');
        console.log('='.repeat(70));
        console.log('\n⚠ IMPORTANT: Automatic parsing may not work perfectly.');
        console.log('  Please review extracted-text.txt and customize the parser if needed.');
        console.log('  Alternatively, use manual import mode.\n');

        // For now, provide instructions for manual import
        console.log('\n' + '='.repeat(70));
        console.log('NEXT STEPS - MANUAL IMPORT REQUIRED');
        console.log('='.repeat(70));
        console.log('\n1. Review extracted-text.txt to understand document structure');
        console.log('2. Create survey-data/ directory in project root');
        console.log('3. Create JSON files for each survey (Q1_PRIMARY.json, Q2_COLLEGE.json, etc.)');
        console.log('4. Use the template structure shown above');
        console.log('5. Run: npm run import-questions -- --manual Q1_PRIMARY');
        console.log('\nOR');
        console.log('\n1. Customize the parseSurveyFromText() function in this file');
        console.log('2. Based on the patterns you see in extracted-text.txt');
        console.log('3. Re-run this script\n');

    } catch (error) {
        console.error('✗ Error during import:', error.message);
        console.error(error.stack);
    }
}

/**
 * Import single survey from JSON file
 */
async function importSingleSurvey(surveyCode) {
    console.log(`\nImporting survey: ${surveyCode}`);

    const jsonPath = path.join(__dirname, `../../survey-data/${surveyCode}.json`);

    if (!fs.existsSync(jsonPath)) {
        console.error(`✗ JSON file not found: ${jsonPath}`);
        return;
    }

    try {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        if (!data.sections || !Array.isArray(data.sections)) {
            console.error('✗ Invalid JSON structure. Expected { sections: [...] }');
            return;
        }

        importToDatabase(surveyCode, data.sections);
        console.log(`\n✓ Successfully imported ${surveyCode}`);

    } catch (error) {
        console.error(`✗ Error importing ${surveyCode}:`, error.message);
    }
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--manual') && args.length > 1) {
        // Manual import of specific survey
        const surveyCode = args[args.indexOf('--manual') + 1];
        await importSingleSurvey(surveyCode);
    } else if (args.includes('--help') || args.includes('-h')) {
        // Show help
        console.log('\nSurvey Question Import Utility\n');
        console.log('Usage:');
        console.log('  npm run import-questions           Extract text from DOCX files');
        console.log('  npm run import-questions -- --manual Q1_PRIMARY   Import from JSON file');
        console.log('  npm run import-questions -- --help                Show this help\n');
        console.log('Survey Codes:');
        Object.keys(SURVEY_CODES).forEach(code => {
            console.log(`  ${code}`);
        });
        console.log('');
    } else {
        // Full automatic import
        await importAllSurveys();
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = {
    extractTextFromDocx,
    parseSurveyFromText,
    importToDatabase,
    importSingleSurvey
};
