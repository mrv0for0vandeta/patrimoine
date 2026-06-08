/**
 * Survey Engine
 * Handles survey rendering, validation, and submission
 */

class SurveyEngine {
    constructor() {
        this.surveyCode = this.getSurveyCodeFromURL();
        this.currentLanguage = 'fr';
        this.surveyData = null;
        this.respondentUuid = null;
        this.responses = {};
        this.startTime = null;
        this.questionTimes = {};

        this.init();
    }

    getSurveyCodeFromURL() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    async init() {
        try {
            await this.loadSurvey();
            this.setupEventListeners();
            this.showConsentSection();
        } catch (error) {
            this.showError('Erreur lors du chargement du questionnaire. Veuillez réessayer.');
            console.error('Survey initialization error:', error);
        }
    }

    async loadSurvey() {
        this.showLoading(true);

        try {
            const response = await api.getSurvey(this.surveyCode);

            if (!response.success) {
                throw new Error(response.message || 'Failed to load survey');
            }

            this.surveyData = response.survey;
            this.renderSurveyHeader();
            this.renderConsentSection();

        } catch (error) {
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    renderSurveyHeader() {
        const lang = this.currentLanguage;
        const titleKey = `title_${lang}`;

        document.getElementById('surveyTitle').textContent = this.surveyData[titleKey] || this.surveyData.title_fr;
        document.getElementById('targetAudience').textContent = this.surveyData.target_audience;
        document.getElementById('estimatedDuration').textContent = `⏱️ ${this.surveyData.estimated_duration} min`;
    }

    renderConsentSection() {
        if (!this.surveyData.require_consent) {
            // Skip consent, go directly to survey
            this.startSurvey();
            return;
        }

        const lang = this.currentLanguage;
        const consentKey = `consent_text_${lang}`;
        const introKey = `introduction_${lang}`;

        let consentHTML = '<div class="consent-content">';

        if (this.surveyData[introKey]) {
            consentHTML += `<div class="introduction">${this.surveyData[introKey]}</div>`;
        }

        consentHTML += `
            <div class="consent-text">
                ${this.surveyData[consentKey] || this.getDefaultConsent(lang)}
            </div>
        </div>`;

        document.getElementById('consentText').innerHTML = consentHTML;
    }

    getDefaultConsent(lang) {
        const texts = {
            fr: `
                <p>En participant à cette enquête, vous acceptez que vos réponses soient collectées et analysées de manière anonyme.</p>
                <p>Vos données seront utilisées uniquement à des fins de recherche académique.</p>
                <p>Vous pouvez arrêter à tout moment sans conséquence.</p>
            `,
            ar: `
                <p dir="rtl">بالمشاركة في هذا الاستبيان، فإنك توافق على جمع إجاباتك وتحليلها بشكل مجهول.</p>
                <p dir="rtl">سيتم استخدام بياناتك فقط لأغراض البحث الأكاديمي.</p>
                <p dir="rtl">يمكنك التوقف في أي وقت دون عواقب.</p>
            `,
            en: `
                <p>By participating in this survey, you agree that your responses will be collected and analyzed anonymously.</p>
                <p>Your data will be used only for academic research purposes.</p>
                <p>You can stop at any time without consequences.</p>
            `
        };
        return texts[lang] || texts.fr;
    }

    showConsentSection() {
        document.getElementById('consentSection').style.display = 'block';
    }

    setupEventListeners() {
        // Consent checkbox
        document.getElementById('consentCheckbox').addEventListener('change', (e) => {
            document.getElementById('startSurveyBtn').disabled = !e.target.checked;
        });

        // Start survey button
        document.getElementById('startSurveyBtn').addEventListener('click', () => {
            this.startSurvey();
        });

        // Language selector
        document.getElementById('languageSelect').addEventListener('change', (e) => {
            this.currentLanguage = e.target.value;
            this.updateLanguage();
        });

        // Save progress button
        document.getElementById('saveProgressBtn').addEventListener('click', () => {
            this.saveProgress();
        });

        // Survey form submission
        document.getElementById('surveyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitSurvey();
        });
    }

    async startSurvey() {
        try {
            this.showLoading(true);

            const response = await api.startSurvey(
                this.surveyCode,
                this.currentLanguage,
                true
            );

            if (response.success) {
                this.respondentUuid = response.respondent_uuid;
                this.startTime = Date.now();

                // Hide consent, show survey
                document.getElementById('consentSection').style.display = 'none';
                document.getElementById('surveyContent').style.display = 'block';

                this.renderSurvey();
            }
        } catch (error) {
            this.showError('Erreur lors du démarrage du questionnaire.');
            console.error(error);
        } finally {
            this.showLoading(false);
        }
    }

    renderSurvey() {
        const lang = this.currentLanguage;
        const introKey = `introduction_${lang}`;
        const instrKey = `instructions_${lang}`;

        // Render introduction
        if (this.surveyData[introKey]) {
            document.getElementById('introductionText').innerHTML = this.surveyData[introKey];
        }

        if (this.surveyData[instrKey]) {
            document.getElementById('instructionsText').innerHTML = this.surveyData[instrKey];
        }

        // Render sections and questions
        const sectionsContainer = document.getElementById('sectionsContainer');
        sectionsContainer.innerHTML = '';

        if (!this.surveyData.sections || this.surveyData.sections.length === 0) {
            sectionsContainer.innerHTML = '<p class="no-questions">Ce questionnaire ne contient pas encore de questions. Veuillez contacter l\'administrateur.</p>';
            return;
        }

        this.surveyData.sections.forEach((section, sectionIndex) => {
            const sectionHTML = this.renderSection(section, sectionIndex);
            sectionsContainer.innerHTML += sectionHTML;
        });

        // Add change listeners to all inputs
        this.attachInputListeners();

        // Update progress
        this.updateProgress();
    }

    renderSection(section, sectionIndex) {
        const lang = this.currentLanguage;
        const titleKey = `title_${lang}`;
        const descKey = `description_${lang}`;

        let html = `
            <div class="survey-section" data-section-id="${section.id}">
                <h2 class="section-title">${section[titleKey] || section.title_fr}</h2>
        `;

        if (section[descKey]) {
            html += `<p class="section-description">${section[descKey]}</p>`;
        }

        if (section.questions && section.questions.length > 0) {
            section.questions.forEach(question => {
                html += this.renderQuestion(question);
            });
        }

        html += '</div>';
        return html;
    }

    renderQuestion(question) {
        const lang = this.currentLanguage;
        const textKey = `question_text_${lang}`;
        const questionText = question[textKey] || question.question_text_fr;

        let html = `
            <div class="question-container" data-question-id="${question.id}" data-type="${question.question_type}">
                <div class="question-header">
                    <span class="question-number">${question.question_number}</span>
                    <span class="question-text">${questionText}</span>
                    ${question.is_required ? '<span class="required">*</span>' : ''}
                </div>
                <div class="question-input">
        `;

        // Render based on question type
        switch (question.question_type) {
            case 'single_choice':
            case 'radio':
                html += this.renderRadioOptions(question);
                break;
            case 'multiple_choice':
            case 'checkbox':
                html += this.renderCheckboxOptions(question);
                break;
            case 'text_short':
            case 'text':
                html += this.renderTextShort(question);
                break;
            case 'text_long':
            case 'text_area':
            case 'textarea':
                html += this.renderTextLong(question);
                break;
            case 'scale_likert_5':
            case 'likert_5':
            case 'likert':
                html += this.renderLikertScale(question, 5);
                break;
            case 'scale_likert_3':
            case 'likert_3':
                html += this.renderLikertScale(question, 3);
                break;
            case 'dropdown':
            case 'select':
                html += this.renderDropdown(question);
                break;
            case 'yes_no':
                html += this.renderYesNo(question);
                break;
            default:
                html += `<p class="error-message">Type de question non supporté: ${question.question_type}</p>`;
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    renderRadioOptions(question) {
        const lang = this.currentLanguage;
        const optionTextKey = `option_text_${lang}`;

        let html = '<div class="radio-options">';

        if (question.options) {
            question.options.forEach(option => {
                html += `
                    <label class="radio-option">
                        <input type="radio" name="q_${question.id}" value="${option.option_value}" data-option-id="${option.id}">
                        <span>${option[optionTextKey] || option.option_text_fr}</span>
                    </label>
                `;
            });
        }

        if (question.has_other_option) {
            const otherLabelKey = `other_label_${lang}`;
            html += `
                <label class="radio-option">
                    <input type="radio" name="q_${question.id}" value="other">
                    <span>${question[otherLabelKey] || 'Autre'}</span>
                </label>
                <input type="text" class="other-input" data-question-id="${question.id}" placeholder="Précisez..." style="display:none;">
            `;
        }

        html += '</div>';
        return html;
    }

    renderCheckboxOptions(question) {
        const lang = this.currentLanguage;
        const optionTextKey = `option_text_${lang}`;

        let html = '<div class="checkbox-options">';

        if (question.options) {
            question.options.forEach(option => {
                html += `
                    <label class="checkbox-option">
                        <input type="checkbox" name="q_${question.id}" value="${option.option_value}" data-option-id="${option.id}">
                        <span>${option[optionTextKey] || option.option_text_fr}</span>
                    </label>
                `;
            });
        }

        if (question.has_other_option) {
            const otherLabelKey = `other_label_${lang}`;
            html += `
                <label class="checkbox-option">
                    <input type="checkbox" name="q_${question.id}" value="other">
                    <span>${question[otherLabelKey] || 'Autre'}</span>
                </label>
                <input type="text" class="other-input" data-question-id="${question.id}" placeholder="Précisez..." style="display:none;">
            `;
        }

        html += '</div>';
        return html;
    }

    renderTextShort(question) {
        return `<input type="text" class="text-input" data-question-id="${question.id}" maxlength="500">`;
    }

    renderTextLong(question) {
        return `<textarea class="textarea-input" data-question-id="${question.id}" rows="6" maxlength="2000" placeholder="Tapez votre réponse ici..."></textarea>`;
    }

    renderLikertScale(question, points) {
        let html = '<div class="likert-scale">';

        for (let i = 1; i <= points; i++) {
            html += `
                <label class="likert-option">
                    <input type="radio" name="q_${question.id}" value="${i}">
                    <span class="likert-value">${i}</span>
                </label>
            `;
        }

        html += '</div>';
        return html;
    }

    renderDropdown(question) {
        const lang = this.currentLanguage;
        const optionTextKey = `option_text_${lang}`;

        let html = `<select class="dropdown-select" data-question-id="${question.id}">
            <option value="">-- Sélectionnez --</option>
        `;

        if (question.options) {
            question.options.forEach(option => {
                html += `<option value="${option.option_value}" data-option-id="${option.id}">
                    ${option[optionTextKey] || option.option_text_fr}
                </option>`;
            });
        }

        html += '</select>';
        return html;
    }

    renderYesNo(question) {
        return `
            <div class="yes-no-options">
                <label class="radio-option">
                    <input type="radio" name="q_${question.id}" value="yes">
                    <span>Oui / نعم / Yes</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="q_${question.id}" value="no">
                    <span>Non / لا / No</span>
                </label>
            </div>
        `;
    }

    attachInputListeners() {
        // Track all input changes
        document.querySelectorAll('input, select, textarea').forEach(element => {
            element.addEventListener('change', (e) => {
                this.handleInputChange(e);
                this.updateProgress();
            });
        });

        // Handle "other" option visibility
        document.querySelectorAll('input[value="other"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const questionId = e.target.closest('.question-container').dataset.questionId;
                const otherInput = document.querySelector(`.other-input[data-question-id="${questionId}"]`);
                if (otherInput) {
                    otherInput.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        });
    }

    handleInputChange(event) {
        const questionContainer = event.target.closest('.question-container');
        if (!questionContainer) return;

        const questionId = parseInt(questionContainer.dataset.questionId);
        const questionType = questionContainer.dataset.type;

        let responseData = {
            question_id: questionId,
            time_spent_seconds: 0
        };

        // Collect response based on type
        if (event.target.type === 'radio') {
            responseData.response_value = event.target.value;
            const optionId = event.target.dataset.optionId;
            if (optionId) {
                responseData.selected_options = [parseInt(optionId)];
            }
        } else if (event.target.type === 'checkbox') {
            const checked = questionContainer.querySelectorAll('input[type="checkbox"]:checked');
            responseData.response_value = Array.from(checked).map(cb => cb.value).join(';');
            responseData.selected_options = Array.from(checked)
                .map(cb => cb.dataset.optionId)
                .filter(id => id)
                .map(id => parseInt(id));
        } else if (event.target.tagName === 'SELECT') {
            responseData.response_value = event.target.value;
            const selectedOption = event.target.options[event.target.selectedIndex];
            const optionId = selectedOption.dataset.optionId;
            if (optionId) {
                responseData.selected_options = [parseInt(optionId)];
            }
        } else if (event.target.tagName === 'INPUT' && event.target.type === 'text') {
            responseData.response_text = event.target.value;
        } else if (event.target.tagName === 'TEXTAREA') {
            responseData.response_text = event.target.value;
        }

        this.responses[questionId] = responseData;
    }

    updateProgress() {
        const totalQuestions = this.getTotalQuestions();
        const answeredQuestions = Object.keys(this.responses).length;
        const percentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

        document.getElementById('progressBar').style.width = `${percentage}%`;
        document.getElementById('progressText').textContent = `${percentage}%`;
    }

    getTotalQuestions() {
        let total = 0;
        if (this.surveyData && this.surveyData.sections) {
            this.surveyData.sections.forEach(section => {
                if (section.questions) {
                    total += section.questions.length;
                }
            });
        }
        return total;
    }

    validateResponses() {
        const errors = [];

        if (!this.surveyData || !this.surveyData.sections) return errors;

        this.surveyData.sections.forEach(section => {
            if (!section.questions) return;

            section.questions.forEach(question => {
                if (question.is_required && !this.responses[question.id]) {
                    errors.push(`Question ${question.question_number} est obligatoire`);
                }
            });
        });

        return errors;
    }

    async saveProgress() {
        try {
            this.showLoading(true);

            const responsesArray = Object.values(this.responses);

            await api.saveProgress(
                this.surveyCode,
                this.respondentUuid,
                responsesArray,
                {}
            );

            this.showSuccess('Progression sauvegardée avec succès!');
        } catch (error) {
            this.showError('Erreur lors de la sauvegarde.');
            console.error(error);
        } finally {
            this.showLoading(false);
        }
    }

    async submitSurvey() {
        // Validate
        const errors = this.validateResponses();
        if (errors.length > 0) {
            this.showError('Veuillez répondre à toutes les questions obligatoires:\n' + errors.join('\n'));
            return;
        }

        if (!confirm('Êtes-vous sûr de vouloir soumettre le questionnaire? Vous ne pourrez plus le modifier.')) {
            return;
        }

        try {
            this.showLoading(true);

            const responsesArray = Object.values(this.responses);
            const demographics = {}; // Collect demographics if needed

            await api.submitSurvey(
                this.surveyCode,
                this.respondentUuid,
                responsesArray,
                demographics
            );

            this.showThankYou();
        } catch (error) {
            this.showError('Erreur lors de la soumission. Veuillez réessayer.');
            console.error(error);
        } finally {
            this.showLoading(false);
        }
    }

    showThankYou() {
        const timeTaken = Math.round((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(timeTaken / 60);
        const seconds = timeTaken % 60;

        document.getElementById('surveyContent').style.display = 'none';
        document.getElementById('thankYouSection').style.display = 'block';
        document.getElementById('completionTime').textContent =
            `Temps écoulé: ${minutes} minutes et ${seconds} secondes`;
    }

    updateLanguage() {
        // Re-render with new language
        this.renderSurveyHeader();
        this.renderSurvey();
    }

    showLoading(show) {
        document.getElementById('loadingIndicator').style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        alert('❌ ' + message);
    }

    showSuccess(message) {
        alert('✓ ' + message);
    }
}

// Initialize survey engine when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.surveyEngine = new SurveyEngine();
});
