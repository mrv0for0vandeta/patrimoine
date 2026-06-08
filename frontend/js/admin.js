/**
 * Admin Dashboard JavaScript
 * Handles authentication and dashboard functionality
 */

class AdminDashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.user = null;
        this.init();
    }

    async init() {
        // Check if already logged in
        const token = api.getToken();
        if (token) {
            try {
                await this.verifyToken();
                this.showDashboard();
                this.loadDashboardData();
            } catch (error) {
                this.showLogin();
            }
        } else {
            this.showLogin();
        }

        this.setupEventListeners();
    }

    async verifyToken() {
        try {
            const response = await api.getCurrentUser();
            if (response.success) {
                this.user = response.user;
                return true;
            }
        } catch (error) {
            api.clearAuth();
            throw error;
        }
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                this.navigateToPage(page);
            });
        });
    }

    async handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        try {
            errorDiv.style.display = 'none';

            const response = await api.login(username, password);

            if (response.success) {
                this.user = response.user;
                this.showDashboard();
                this.loadDashboardData();
            }
        } catch (error) {
            errorDiv.textContent = error.message || 'Invalid credentials';
            errorDiv.style.display = 'block';
        }
    }

    async handleLogout() {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter?')) {
            try {
                await api.logout();
            } finally {
                this.showLogin();
            }
        }
    }

    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('dashboardScreen').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboardScreen').style.display = 'flex';

        if (this.user) {
            document.getElementById('currentUser').textContent =
                `${this.user.full_name || this.user.username} (${this.user.role})`;
        }
    }

    navigateToPage(pageName) {
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

        // Show page
        document.querySelectorAll('.page-content').forEach(page => {
            page.style.display = 'none';
        });
        document.getElementById(`${pageName}Page`).style.display = 'block';

        this.currentPage = pageName;
        this.loadPageData(pageName);
    }

    async loadPageData(pageName) {
        switch (pageName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'surveys':
                await this.loadSurveysData();
                break;
            case 'analytics':
                await this.loadAnalyticsData();
                break;
            case 'export':
                await this.loadExportData();
                break;
            case 'respondents':
                await this.loadRespondentsData();
                break;
            case 'users':
                await this.loadUsersData();
                break;
            case 'system':
                await this.loadSystemData();
                break;
        }
    }

    async loadDashboardData() {
        try {
            const summary = await api.getDashboardSummary();

            if (summary.success) {
                const { overall, recent_activity, top_surveys } = summary.summary;

                // Update stats
                document.getElementById('totalSurveys').textContent = overall.total_surveys || 0;
                document.getElementById('totalResponses').textContent = overall.total_respondents || 0;
                document.getElementById('completedResponses').textContent = overall.completed_responses || 0;
                document.getElementById('completionRate').textContent =
                    (overall.overall_completion_rate || 0) + '%';

                // Render recent activity
                this.renderRecentActivity(recent_activity);

                // Render top surveys
                this.renderTopSurveys(top_surveys);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    renderRecentActivity(activity) {
        const container = document.getElementById('recentActivity');

        if (!activity || activity.length === 0) {
            container.innerHTML = '<p>Aucune activité récente</p>';
            return;
        }

        let html = '<table class="data-table"><thead><tr><th>Date</th><th>Réponses</th></tr></thead><tbody>';

        activity.forEach(item => {
            html += `<tr><td>${item.date}</td><td>${item.responses}</td></tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    renderTopSurveys(surveys) {
        const container = document.getElementById('topSurveys');

        if (!surveys || surveys.length === 0) {
            container.innerHTML = '<p>Aucun questionnaire</p>';
            return;
        }

        let html = '<table class="data-table">';
        html += '<thead><tr><th>Code</th><th>Titre</th><th>Réponses</th><th>Taux</th></tr></thead><tbody>';

        surveys.forEach(survey => {
            html += `
                <tr>
                    <td>${survey.survey_code}</td>
                    <td>${survey.survey_title}</td>
                    <td>${survey.completed_responses || 0}</td>
                    <td>${survey.completion_rate || 0}%</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    async loadSurveysData() {
        try {
            const response = await api.getAllSurveys();

            if (response.success) {
                this.renderSurveysList(response.surveys);
            }
        } catch (error) {
            console.error('Error loading surveys:', error);
        }
    }

    renderSurveysList(surveys) {
        const container = document.getElementById('surveysPage');

        let html = '<h1>Gestion des Questionnaires</h1>';
        html += '<div class="surveys-list">';

        if (!surveys || surveys.length === 0) {
            html += '<p>Aucun questionnaire disponible</p>';
        } else {
            html += '<table class="data-table">';
            html += '<thead><tr><th>Code</th><th>Titre</th><th>Public</th><th>Réponses</th><th>Statut</th><th>Actions</th></tr></thead>';
            html += '<tbody>';

            surveys.forEach(survey => {
                const statusClass = survey.is_active ? 'status-active' : 'status-inactive';
                const statusText = survey.is_active ? 'Actif' : 'Inactif';

                html += `
                    <tr>
                        <td>${survey.survey_code}</td>
                        <td>${survey.survey_title || survey.title_fr}</td>
                        <td>${survey.target_audience}</td>
                        <td>${survey.completed_responses || 0} / ${survey.total_responses || 0}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td class="actions">
                            <button class="btn btn-sm" onclick="adminDashboard.viewSurvey(${survey.survey_id || survey.id})">
                                Voir
                            </button>
                            <button class="btn btn-sm" onclick="adminDashboard.toggleSurvey(${survey.survey_id || survey.id})">
                                ${survey.is_active ? 'Désactiver' : 'Activer'}
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
        }

        html += '</div>';
        container.innerHTML = html;
    }

    async toggleSurvey(surveyId) {
        if (confirm('Êtes-vous sûr de vouloir changer le statut de ce questionnaire?')) {
            try {
                await api.toggleSurveyStatus(surveyId);
                this.loadSurveysData();
            } catch (error) {
                alert('Erreur: ' + error.message);
            }
        }
    }

    async viewSurvey(surveyId) {
        alert('Fonctionnalité de visualisation à venir pour le questionnaire #' + surveyId);
    }

    async loadAnalyticsData() {
        const container = document.getElementById('analyticsPage');
        container.innerHTML = '<h1>Analytiques</h1><p>Chargement des données analytiques...</p>';

        // TODO: Implement detailed analytics
        container.innerHTML += '<p>Fonctionnalité d\'analytiques avancées à venir.</p>';
    }

    async loadExportData() {
        const container = document.getElementById('exportPage');

        try {
            const surveys = await api.getAllSurveys();

            let html = '<h1>Export de Données</h1>';
            html += '<div class="export-section">';
            html += '<h2>Sélectionnez un questionnaire à exporter:</h2>';

            if (surveys.success && surveys.surveys.length > 0) {
                html += '<div class="export-list">';

                surveys.surveys.forEach(survey => {
                    html += `
                        <div class="export-item">
                            <h3>${survey.survey_code} - ${survey.survey_title || survey.title_fr}</h3>
                            <p>Réponses: ${survey.completed_responses || 0}</p>
                            <div class="export-buttons">
                                <button class="btn" onclick="api.exportCSV(${survey.survey_id || survey.id})">
                                    📄 CSV
                                </button>
                                <button class="btn" onclick="api.exportXLSX(${survey.survey_id || survey.id})">
                                    📊 Excel
                                </button>
                                <button class="btn" onclick="api.exportJSON(${survey.survey_id || survey.id})">
                                    🔤 JSON
                                </button>
                                <button class="btn" onclick="adminDashboard.exportSPSS(${survey.survey_id || survey.id})">
                                    📈 SPSS
                                </button>
                            </div>
                        </div>
                    `;
                });

                html += '</div>';
            } else {
                html += '<p>Aucun questionnaire disponible pour l\'export</p>';
            }

            html += '</div>';
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading export data:', error);
        }
    }

    async exportSPSS(surveyId) {
        try {
            const response = await api.exportSPSS(surveyId);
            alert('Fichiers SPSS générés: ' + JSON.stringify(response.files));
        } catch (error) {
            alert('Erreur: ' + error.message);
        }
    }

    async loadRespondentsData() {
        const container = document.getElementById('respondentsPage');
        container.innerHTML = '<h1>Gestion des Répondants</h1><p>Liste des répondants à venir...</p>';
    }

    async loadUsersData() {
        const container = document.getElementById('usersPage');

        try {
            const response = await api.getUsers();

            let html = '<h1>Gestion des Utilisateurs</h1>';

            if (response.success && response.users) {
                html += '<table class="data-table">';
                html += '<thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Dernière connexion</th></tr></thead>';
                html += '<tbody>';

                response.users.forEach(user => {
                    const statusClass = user.is_active ? 'status-active' : 'status-inactive';
                    const statusText = user.is_active ? 'Actif' : 'Inactif';

                    html += `
                        <tr>
                            <td>${user.full_name || user.username}</td>
                            <td>${user.email}</td>
                            <td>${user.role}</td>
                            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                            <td>${user.last_login || 'Jamais'}</td>
                        </tr>
                    `;
                });

                html += '</tbody></table>';
            } else {
                html += '<p>Aucun utilisateur trouvé</p>';
            }

            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    async loadSystemData() {
        const container = document.getElementById('systemPage');

        try {
            const stats = await api.getSystemStats();

            let html = '<h1>Paramètres Système</h1>';
            html += '<div class="system-section">';
            html += '<h2>Statistiques de la Base de Données</h2>';

            if (stats.success && stats.statistics) {
                const s = stats.statistics;
                html += `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <strong>Questionnaires:</strong> ${s.surveys || 0}
                        </div>
                        <div class="stat-item">
                            <strong>Répondants:</strong> ${s.respondents || 0}
                        </div>
                        <div class="stat-item">
                            <strong>Réponses complètes:</strong> ${s.completed_responses || 0}
                        </div>
                        <div class="stat-item">
                            <strong>Total réponses:</strong> ${s.total_responses || 0}
                        </div>
                        <div class="stat-item">
                            <strong>Taille BDD:</strong> ${(s.database_size / 1024 / 1024).toFixed(2)} MB
                        </div>
                    </div>
                `;
            }

            html += '<h2>Actions Système</h2>';
            html += '<div class="system-actions">';
            html += '<button class="btn" onclick="adminDashboard.createBackup()">Créer Sauvegarde</button>';
            html += '<button class="btn" onclick="adminDashboard.optimizeDatabase()">Optimiser BDD</button>';
            html += '<button class="btn" onclick="adminDashboard.checkIntegrity()">Vérifier Intégrité</button>';
            html += '</div>';

            html += '</div>';
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading system data:', error);
        }
    }

    async createBackup() {
        if (confirm('Créer une sauvegarde de la base de données?')) {
            try {
                await api.createBackup();
                alert('Sauvegarde créée avec succès!');
            } catch (error) {
                alert('Erreur: ' + error.message);
            }
        }
    }

    async optimizeDatabase() {
        if (confirm('Optimiser la base de données? Cela peut prendre quelques secondes.')) {
            try {
                await api.optimizeDatabase();
                alert('Base de données optimisée avec succès!');
            } catch (error) {
                alert('Erreur: ' + error.message);
            }
        }
    }

    async checkIntegrity() {
        try {
            const response = await api.checkIntegrity();
            if (response.success && response.integrity_ok) {
                alert('✓ Intégrité de la base de données vérifiée');
            } else {
                alert('⚠ Problème d\'intégrité détecté');
            }
        } catch (error) {
            alert('Erreur: ' + error.message);
        }
    }
}

// Initialize dashboard when DOM is ready
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});
