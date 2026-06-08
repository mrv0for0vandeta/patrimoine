/**
 * API Client Module
 * Handles all HTTP requests to the backend API
 */

class APIClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.apiURL = `${this.baseURL}/api`;
        this.token = localStorage.getItem('auth_token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    // Get authentication token
    getToken() {
        return this.token || localStorage.getItem('auth_token');
    }

    // Clear authentication
    clearAuth() {
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.apiURL}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add authorization header if token exists
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options
        });
    }

    // POST request
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    }

    // PATCH request
    async patch(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options
        });
    }

    // DELETE request
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options
        });
    }

    // =====================================================
    // AUTHENTICATION METHODS
    // =====================================================

    async login(username, password) {
        const data = await this.post('/auth/admin/login', { username, password });
        if (data.success && data.token) {
            this.setToken(data.token);
            localStorage.setItem('user_info', JSON.stringify(data.user));
        }
        return data;
    }

    async logout() {
        try {
            await this.post('/auth/admin/logout', {});
        } finally {
            this.clearAuth();
        }
    }

    async getCurrentUser() {
        return this.get('/auth/admin/me');
    }

    async changePassword(currentPassword, newPassword) {
        return this.post('/auth/admin/change-password', { currentPassword, newPassword });
    }

    // =====================================================
    // SURVEY METHODS (PUBLIC)
    // =====================================================

    async getSurvey(surveyCode) {
        return this.get(`/survey/public/${surveyCode}`);
    }

    async startSurvey(surveyCode, language = 'fr', consent = true) {
        return this.post(`/survey/public/${surveyCode}/start`, { language, consent });
    }

    async submitSurvey(surveyCode, respondentUuid, responses, demographics) {
        return this.post(`/survey/public/${surveyCode}/submit`, {
            respondent_uuid: respondentUuid,
            responses,
            demographics
        });
    }

    async saveProgress(surveyCode, respondentUuid, responses, demographics) {
        return this.post(`/survey/public/${surveyCode}/save-progress`, {
            respondent_uuid: respondentUuid,
            responses,
            demographics
        });
    }

    async getProgress(surveyCode, respondentUuid) {
        return this.get(`/survey/public/${surveyCode}/progress/${respondentUuid}`);
    }

    // =====================================================
    // SURVEY METHODS (ADMIN)
    // =====================================================

    async getAllSurveys() {
        return this.get('/survey');
    }

    async getSurveyById(surveyId) {
        return this.get(`/survey/${surveyId}`);
    }

    async toggleSurveyStatus(surveyId) {
        return this.patch(`/survey/${surveyId}/toggle-active`, {});
    }

    async updateSurvey(surveyId, updates) {
        return this.patch(`/survey/${surveyId}`, updates);
    }

    // =====================================================
    // ANALYTICS METHODS
    // =====================================================

    async getSurveyStatistics(surveyId) {
        return this.get(`/analytics/survey/${surveyId}`);
    }

    async getDemographics(surveyId) {
        return this.get(`/analytics/survey/${surveyId}/demographics`);
    }

    async getQuestionStatistics(surveyId) {
        return this.get(`/analytics/survey/${surveyId}/questions`);
    }

    async getQuestionResponses(questionId) {
        return this.get(`/analytics/question/${questionId}/responses`);
    }

    async getCrosstab(surveyId, question1Id, question2Id) {
        return this.post(`/analytics/survey/${surveyId}/crosstab`, {
            question1_id: question1Id,
            question2_id: question2Id
        });
    }

    async getTimeline(surveyId, period = 7) {
        return this.get(`/analytics/survey/${surveyId}/timeline?period=${period}`);
    }

    async getDashboardSummary() {
        return this.get('/analytics/dashboard/summary');
    }

    // =====================================================
    // EXPORT METHODS
    // =====================================================

    async exportCSV(surveyId, includeIncomplete = false) {
        const url = `${this.apiURL}/export/survey/${surveyId}/csv?include_incomplete=${includeIncomplete}`;
        window.open(url, '_blank');
    }

    async exportXLSX(surveyId, includeIncomplete = false) {
        const url = `${this.apiURL}/export/survey/${surveyId}/xlsx?include_incomplete=${includeIncomplete}`;
        window.open(url, '_blank');
    }

    async exportJSON(surveyId, includeIncomplete = false) {
        const url = `${this.apiURL}/export/survey/${surveyId}/json?include_incomplete=${includeIncomplete}`;
        window.open(url, '_blank');
    }

    async exportSPSS(surveyId, includeIncomplete = false) {
        return this.get(`/export/survey/${surveyId}/spss?include_incomplete=${includeIncomplete}`);
    }

    async getExportHistory() {
        return this.get('/export/history');
    }

    // =====================================================
    // ADMIN METHODS
    // =====================================================

    async getUsers() {
        return this.get('/admin/users');
    }

    async createUser(userData) {
        return this.post('/admin/users', userData);
    }

    async updateUser(userId, updates) {
        return this.patch(`/admin/users/${userId}`, updates);
    }

    async deleteUser(userId) {
        return this.delete(`/admin/users/${userId}`);
    }

    async resetUserPassword(userId, newPassword) {
        return this.post(`/admin/users/${userId}/reset-password`, { new_password: newPassword });
    }

    async getSystemStats() {
        return this.get('/admin/system/stats');
    }

    async getAuditLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/admin/audit-logs?${query}`);
    }

    async createBackup() {
        return this.post('/admin/system/backup', {});
    }

    async optimizeDatabase() {
        return this.post('/admin/system/maintenance/optimize', {});
    }

    async checkIntegrity() {
        return this.get('/admin/system/integrity-check');
    }

    async getSurveyLinks(surveyId = null) {
        const query = surveyId ? `?survey_id=${surveyId}` : '';
        return this.get(`/admin/survey-links${query}`);
    }

    async createSurveyLink(surveyId, description, expiresAt = null, maxUses = null) {
        return this.post('/admin/survey-links', {
            survey_id: surveyId,
            description,
            expires_at: expiresAt,
            max_uses: maxUses
        });
    }

    async generateQRCode(linkId) {
        return this.post(`/admin/survey-links/${linkId}/qr-code`, {});
    }

    async getRespondent(respondentId) {
        return this.get(`/admin/respondents/${respondentId}`);
    }

    async deleteRespondent(respondentId) {
        return this.delete(`/admin/respondents/${respondentId}`);
    }

    async flagRespondent(respondentId, isFlagged, reason = null) {
        return this.patch(`/admin/respondents/${respondentId}/flag`, {
            is_flagged: isFlagged,
            flag_reason: reason
        });
    }

    // =====================================================
    // HEALTH CHECK
    // =====================================================

    async healthCheck() {
        return this.get('/health', { baseURL: this.baseURL });
    }
}

// Create singleton instance
const api = new APIClient();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}
