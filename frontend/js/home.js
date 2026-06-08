/**
 * Home Page JavaScript
 * Loads and displays available surveys
 */

document.addEventListener('DOMContentLoaded', async () => {
    const surveyListContainer = document.getElementById('surveyList');

    // Survey data (will be loaded from API in production)
    const surveys = [
        {
            code: 'Q1_PRIMARY',
            title_fr: 'Le patrimoine marocain : que sais-tu ? Que ressens-tu ? Que peux-tu faire ?',
            title_ar: 'التراث المغربي: ماذا تعرف؟ ماذا تشعر؟ ماذا يمكنك أن تفعل؟',
            target: 'Élèves de l\'école primaire',
            target_ar: 'تلاميذ المدرسة الابتدائية',
            duration: 20,
            icon: '🎓'
        },
        {
            code: 'Q2_COLLEGE',
            title_fr: 'Le patrimoine culturel marocain : questionnaire pour les collégiens',
            title_ar: 'التراث الثقافي المغربي: استبيان لتلاميذ الإعدادي',
            target: 'Élèves du collège',
            target_ar: 'تلاميذ الإعدادي',
            duration: 25,
            icon: '📚'
        },
        {
            code: 'Q3_LYCEE',
            title_fr: 'Le patrimoine culturel marocain : perceptions, connaissances et engagement des élèves du lycée',
            title_ar: 'التراث الثقافي المغربي: تصورات ومعارف والتزام تلاميذ الثانوي',
            target: 'Élèves du lycée',
            target_ar: 'تلاميذ الثانوي',
            duration: 20,
            icon: '🎯'
        },
        {
            code: 'Q4_UNIV',
            title_fr: 'Patrimoine culturel marocain : perceptions, engagement et responsabilité civique',
            title_ar: 'التراث الثقافي المغربي: التصورات والالتزام والمسؤولية المدنية',
            target: 'Étudiants de l\'enseignement supérieur',
            target_ar: 'طلاب التعليم العالي',
            duration: 25,
            icon: '🎓'
        },
        {
            code: 'Q5_PUBLIC',
            title_fr: 'Patrimoine culturel marocain : enquête nationale auprès du grand public',
            title_ar: 'التراث الثقافي المغربي: مسح وطني للجمهور العام',
            target: 'Grand public (18 ans et plus)',
            target_ar: 'الجمهور العام (18 سنة فما فوق)',
            duration: 30,
            icon: '👥'
        },
        {
            code: 'Q6_MINISTRY',
            title_fr: 'Perceptions du patrimoine et efficacité institutionnelle',
            title_ar: 'تصورات التراث والفعالية المؤسسية',
            target: 'Employés du Ministère / Direction du Patrimoine',
            target_ar: 'موظفو الوزارة / مديرية التراث',
            duration: 35,
            icon: '🏛️'
        },
        {
            code: 'Q7_HERITAGE_STUDENTS',
            title_fr: 'Connaissances patrimoniales, identité et perspectives professionnelles',
            title_ar: 'المعرفة التراثية والهوية والآفاق المهنية',
            target: 'Étudiants des disciplines liées au patrimoine',
            target_ar: 'طلاب التخصصات المتعلقة بالتراث',
            duration: 40,
            icon: '🏺'
        }
    ];

    // Create survey cards
    function createSurveyCard(survey) {
        return `
            <div class="survey-card" data-survey="${survey.code}">
                <div class="survey-icon">${survey.icon}</div>
                <div class="survey-content">
                    <h3 class="survey-title">${survey.title_fr}</h3>
                    <h4 class="survey-title-ar" dir="rtl">${survey.title_ar}</h4>
                    <div class="survey-meta">
                        <span class="survey-target">
                            <strong>Public cible:</strong> ${survey.target}
                        </span>
                        <span class="survey-target-ar" dir="rtl">
                            <strong>الجمهور المستهدف:</strong> ${survey.target_ar}
                        </span>
                        <span class="survey-duration">
                            ⏱️ ${survey.duration} minutes / دقيقة
                        </span>
                    </div>
                    <button class="btn btn-primary survey-start-btn" data-code="${survey.code}">
                        Commencer / ابدأ / Start
                    </button>
                </div>
            </div>
        `;
    }

    // Render surveys
    function renderSurveys() {
        if (surveys.length === 0) {
            surveyListContainer.innerHTML = '<p class="no-surveys">Aucun questionnaire disponible pour le moment.</p>';
            return;
        }

        surveyListContainer.innerHTML = surveys.map(createSurveyCard).join('');

        // Add click handlers
        document.querySelectorAll('.survey-start-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const surveyCode = e.target.dataset.code;
                window.location.href = `/survey/${surveyCode}`;
            });
        });
    }

    // Load surveys from API (optional - fallback to hardcoded data)
    async function loadSurveys() {
        try {
            // Try to load from API if available
            // const response = await fetch('/api/survey/public/list');
            // const data = await response.json();
            // if (data.success) {
            //     surveys = data.surveys;
            // }
        } catch (error) {
            console.log('Using default survey list');
        } finally {
            renderSurveys();
        }
    }

    // Initialize
    loadSurveys();
});
