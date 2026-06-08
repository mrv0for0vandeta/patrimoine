const dbManager = require('./database');

/**
 * Survey Data Seeding Utility
 * 
 * This script creates the 7 surveys from the questionnaires with basic structure.
 * Full question content will be imported separately to maintain exact wording from DOCX.
 * 
 * CRITICAL: All survey content must be preserved exactly as in original DOCX files.
 * No modification, translation, or paraphrasing of any content is permitted.
 */

// Survey definitions - basic metadata only
// Full questions will be imported from DOCX files
const surveys = [
    {
        survey_code: 'Q1_PRIMARY',
        title_fr: 'Le patrimoine marocain : que sais-tu ? Que ressens-tu ? Que peux-tu faire ?',
        title_ar: 'التراث المغربي: ماذا تعرف؟ ماذا تشعر؟ ماذا يمكنك أن تفعل؟',
        title_en: 'Moroccan Heritage: What do you know? What do you feel? What can you do?',
        target_audience: 'Élèves de l\'école primaire',
        estimated_duration: 20,
        display_order: 1,
        instructions_fr: 'Réponds à chaque question honnêtement. Il n\'y a pas de bonnes ou de mauvaises réponses. Si tu n\'es pas sûr(e), choisis l\'option qui te semble la plus proche de la vérité.',
        instructions_ar: 'أجب عن كل سؤال بصدق. لا توجد إجابات صحيحة أو خاطئة. إذا لم تكن متأكداً، اختر الخيار الأقرب إلى الحقيقة.'
    },
    {
        survey_code: 'Q2_COLLEGE',
        title_fr: 'Le patrimoine culturel marocain : questionnaire pour les collégiens',
        title_ar: 'التراث الثقافي المغربي: استبيان لتلاميذ الإعدادي',
        title_en: 'Moroccan Cultural Heritage: Questionnaire for Middle School Students',
        target_audience: 'Élèves du collège (6e, 5e, 4e)',
        estimated_duration: 25,
        display_order: 2,
        instructions_fr: 'Lisez attentivement chaque question et répondez honnêtement. Il n\'y a pas de bonnes ou de mauvaises réponses.',
        instructions_ar: 'اقرأ كل سؤال بعناية وأجب بصدق. لا توجد إجابات صحيحة أو خاطئة.'
    },
    {
        survey_code: 'Q3_LYCEE',
        title_fr: 'Le patrimoine culturel marocain : perceptions, connaissances et engagement des élèves du lycée',
        title_ar: 'التراث الثقافي المغربي: تصورات ومعارف والتزام تلاميذ الثانوي',
        title_en: 'Moroccan Cultural Heritage: Perceptions, Knowledge and Engagement of High School Students',
        target_audience: 'Élèves du lycée (15–18 ans)',
        estimated_duration: 20,
        display_order: 3,
        introduction_fr: 'La Direction du Patrimoine du Ministère de la Jeunesse, de la Culture et de la Communication mène ce questionnaire dans le cadre d\'une étude nationale sur la façon dont les jeunes Marocaines et Marocains perçoivent, comprennent et s\'engagent vis-à-vis du patrimoine culturel marocain.',
        instructions_fr: 'Vos réponses sont entièrement anonymes. Votre participation est volontaire.'
    },
    {
        survey_code: 'Q4_UNIV',
        title_fr: 'Patrimoine culturel marocain : perceptions, engagement et responsabilité civique parmi les étudiants du supérieur',
        title_ar: 'التراث الثقافي المغربي: التصورات والالتزام والمسؤولية المدنية لدى طلاب التعليم العالي',
        title_en: 'Moroccan Cultural Heritage: Perceptions, Engagement and Civic Responsibility among Higher Education Students',
        target_audience: 'Étudiants de l\'enseignement supérieur',
        estimated_duration: 25,
        display_order: 4,
        introduction_fr: 'La Direction du Patrimoine mène une enquête nationale examinant comment les citoyens marocains, notamment les étudiants du supérieur, perçoivent, valorisent et s\'engagent envers le riche patrimoine culturel du pays.',
        instructions_fr: 'Toutes les réponses sont anonymes et confidentielles.'
    },
    {
        survey_code: 'Q5_PUBLIC',
        title_fr: 'Patrimoine culturel marocain : enquête nationale auprès du grand public',
        title_ar: 'التراث الثقافي المغربي: مسح وطني للجمهور العام',
        title_en: 'Moroccan Cultural Heritage: National Survey of the General Public',
        target_audience: 'Grand public (18 ans et plus)',
        estimated_duration: 30,
        display_order: 5,
        introduction_fr: 'La Direction du Patrimoine mène une étude nationale sur la manière dont les citoyens marocains perçoivent, valorisent et s\'engagent envers le patrimoine culturel du pays.',
        instructions_fr: 'Vos réponses sont anonymes et confidentielles. La participation est volontaire.'
    },
    {
        survey_code: 'Q6_MINISTRY',
        title_fr: 'Perceptions du patrimoine et efficacité institutionnelle : enquête auprès des employés du Ministère',
        title_ar: 'تصورات التراث والفعالية المؤسسية: مسح موظفي الوزارة',
        title_en: 'Heritage Perceptions and Institutional Effectiveness: Survey of Ministry Employees',
        target_audience: 'Employés du Ministère / Direction du Patrimoine',
        estimated_duration: 35,
        display_order: 6,
        introduction_fr: 'La Direction du Patrimoine mène une enquête interne dans le cadre d\'une étude nationale globale sur la perception du patrimoine. Vos perspectives professionnelles constituent des apports essentiels.',
        instructions_fr: 'Toutes les réponses sont totalement anonymes. Les résultats seront présentés uniquement de manière agrégée. La participation est volontaire.'
    },
    {
        survey_code: 'Q7_HERITAGE_STUDENTS',
        title_fr: 'Connaissances patrimoniales, identité et perspectives professionnelles : enquête destinée aux étudiants des disciplines liées au patrimoine',
        title_ar: 'المعرفة التراثية والهوية والآفاق المهنية: مسح لطلاب التخصصات المتعلقة بالتراث',
        title_en: 'Heritage Knowledge, Identity and Professional Perspectives: Survey for Heritage Studies Students',
        target_audience: 'Étudiants des disciplines liées au patrimoine',
        estimated_duration: 40,
        display_order: 7,
        introduction_fr: 'En tant qu\'étudiants spécialisés dans des domaines liés au patrimoine, vos perspectives sont particulièrement précieuses : vous représentez la prochaine génération de professionnels du patrimoine et jouerez un rôle central dans la définition de l\'avenir patrimonial du Maroc.',
        instructions_fr: 'Toutes les réponses sont anonymes et confidentielles.'
    }
];

// Common demographic reference data
const moroccanRegions = [
    { value: 'tanger_tetouan', label_fr: 'Tanger-Tétouan-Al Hoceïma', label_ar: 'طنجة-تطوان-الحسيمة' },
    { value: 'oriental', label_fr: 'L\'Oriental', label_ar: 'الشرق' },
    { value: 'fes_meknes', label_fr: 'Fès-Meknès', label_ar: 'فاس-مكناس' },
    { value: 'rabat_sale', label_fr: 'Rabat-Salé-Kénitra', label_ar: 'الرباط-سلا-القنيطرة' },
    { value: 'beni_mellal', label_fr: 'Béni Mellal-Khénifra', label_ar: 'بني ملال-خنيفرة' },
    { value: 'casablanca_settat', label_fr: 'Casablanca-Settat', label_ar: 'الدار البيضاء-سطات' },
    { value: 'marrakech_safi', label_fr: 'Marrakech-Safi', label_ar: 'مراكش-آسفي' },
    { value: 'draa_tafilalet', label_fr: 'Drâa-Tafilalet', label_ar: 'درعة-تافيلالت' },
    { value: 'souss_massa', label_fr: 'Souss-Massa', label_ar: 'سوس-ماسة' },
    { value: 'guelmim', label_fr: 'Guelmim-Oued Noun', label_ar: 'كلميم-واد نون' },
    { value: 'laayoune', label_fr: 'Laâyoune-Sakia El Hamra', label_ar: 'العيون-الساقية الحمراء' },
    { value: 'dakhla', label_fr: 'Dakhla-Oued Ed-Dahab', label_ar: 'الداخلة-وادي الذهب' }
];

async function seedDatabase() {
    console.log('\n===========================================');
    console.log('Seeding Survey Data');
    console.log('===========================================\n');

    await dbManager.initialize();

    try {
        console.log('Inserting survey metadata...\n');

        // Begin transaction
        await dbManager.run('BEGIN TRANSACTION');

        for (let index = 0; index < surveys.length; index++) {
            const survey = surveys[index];

            const result = await dbManager.run(`
                INSERT INTO surveys (
                    survey_code, title_ar, title_fr, title_en,
                    description_fr,
                    target_audience, estimated_duration,
                    is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            `, [
                survey.survey_code,
                survey.title_ar,
                survey.title_fr,
                survey.title_en || survey.title_fr,
                `Enquête nationale sur le patrimoine culturel marocain`,
                survey.target_audience,
                survey.estimated_duration
            ]);

            console.log(`✓ Survey ${index + 1}/7: ${survey.survey_code} created (ID: ${result.lastID})`);
            console.log(`  Target: ${survey.target_audience}`);
            console.log(`  Duration: ${survey.estimated_duration} minutes\n`);
        }

        // Commit transaction
        await dbManager.run('COMMIT');
        console.log('✓ All 7 surveys created successfully');

        // Verify surveys
        const surveyCount = await dbManager.get('SELECT COUNT(*) as count FROM surveys');
        console.log(`\n✓ Verification: ${surveyCount.count} surveys in database\n`);

        console.log('===========================================');
        console.log('✓ Seeding completed successfully!');
        console.log('===========================================\n');
        console.log('Survey Structure Status:');
        console.log('  ✓ 7 surveys created with metadata');
        console.log('  ⏳ Survey questions need to be imported from JSON files');
        console.log('\nNext steps:');
        console.log('1. Import Q1_PRIMARY survey: node backend/utils/import-from-json.js Q1_PRIMARY');
        console.log('2. Create and import remaining surveys (Q2-Q7)');
        console.log('3. Run: npm start');
        console.log('4. Access admin panel at: http://localhost:3000/admin\n');

        // Display survey list
        const surveyList = await dbManager.all('SELECT survey_code, title_fr, target_audience FROM surveys ORDER BY id');
        console.log('Surveys ready for question import:');
        surveyList.forEach((s, i) => {
            console.log(`${i + 1}. ${s.survey_code} - ${s.title_fr}`);
        });
        console.log();

        await dbManager.close();
        process.exit(0);

    } catch (error) {
        await dbManager.run('ROLLBACK');
        console.error('\n✗ Seeding failed:', error);
        console.error('Stack trace:', error.stack);
        await dbManager.close();
        process.exit(1);
    }
}

// Run seeding if called directly
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase, surveys, moroccanRegions };
