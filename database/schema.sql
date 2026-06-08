-- =====================================================
-- Moroccan Heritage Survey Platform - Database Schema
-- Version: 1.0.0
-- Description: Complete database schema for academic survey data collection and analysis
-- =====================================================

-- =====================================================
-- ADMIN AND AUTHENTICATION TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin' CHECK(role IN ('admin', 'researcher', 'viewer')),
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);

CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_admin ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON admin_sessions(expires_at);

-- =====================================================
-- SURVEY STRUCTURE TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS surveys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_code TEXT NOT NULL UNIQUE,
    title_ar TEXT NOT NULL,
    title_fr TEXT NOT NULL,
    title_en TEXT,
    description_ar TEXT,
    description_fr TEXT,
    description_en TEXT,
    introduction_ar TEXT,
    introduction_fr TEXT,
    introduction_en TEXT,
    instructions_ar TEXT,
    instructions_fr TEXT,
    instructions_en TEXT,
    target_audience TEXT NOT NULL,
    estimated_duration INTEGER,
    is_active INTEGER DEFAULT 1,
    require_consent INTEGER DEFAULT 1,
    consent_text_ar TEXT,
    consent_text_fr TEXT,
    consent_text_en TEXT,
    allow_anonymous INTEGER DEFAULT 1,
    allow_save_continue INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (created_by) REFERENCES admins(id)
);

CREATE INDEX IF NOT EXISTS idx_surveys_code ON surveys(survey_code);
CREATE INDEX IF NOT EXISTS idx_surveys_active ON surveys(is_active);
CREATE INDEX IF NOT EXISTS idx_surveys_order ON surveys(display_order);

CREATE TABLE IF NOT EXISTS survey_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_id INTEGER NOT NULL,
    section_code TEXT NOT NULL,
    section_number TEXT,
    title_ar TEXT NOT NULL,
    title_fr TEXT NOT NULL,
    title_en TEXT,
    description_ar TEXT,
    description_fr TEXT,
    description_en TEXT,
    display_order INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    UNIQUE(survey_id, section_code)
);

CREATE INDEX IF NOT EXISTS idx_sections_survey ON survey_sections(survey_id, display_order);

CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL,
    question_code TEXT NOT NULL,
    question_number TEXT NOT NULL,
    question_text_ar TEXT NOT NULL,
    question_text_fr TEXT NOT NULL,
    question_text_en TEXT,
    question_type TEXT NOT NULL CHECK(question_type IN (
        'single_choice',
        'multiple_choice',
        'text_short',
        'text_long',
        'scale_likert_5',
        'scale_likert_3',
        'scale_numeric',
        'dropdown',
        'checkbox',
        'radio',
        'matrix_single',
        'matrix_multiple',
        'demographic',
        'yes_no',
        'text_area'
    )),
    is_required INTEGER DEFAULT 1,
    display_order INTEGER NOT NULL,
    has_other_option INTEGER DEFAULT 0,
    other_label_ar TEXT,
    other_label_fr TEXT,
    other_label_en TEXT,
    has_none_option INTEGER DEFAULT 0,
    none_label_ar TEXT,
    none_label_fr TEXT,
    none_label_en TEXT,
    skip_logic TEXT,
    validation_rules TEXT,
    min_selections INTEGER,
    max_selections INTEGER,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES survey_sections(id) ON DELETE CASCADE,
    UNIQUE(section_id, question_code)
);

CREATE INDEX IF NOT EXISTS idx_questions_section ON questions(section_id, display_order);
CREATE INDEX IF NOT EXISTS idx_questions_code ON questions(question_code);

CREATE TABLE IF NOT EXISTS question_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    option_code TEXT NOT NULL,
    option_text_ar TEXT NOT NULL,
    option_text_fr TEXT NOT NULL,
    option_text_en TEXT,
    option_value TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    triggers_skip TEXT,
    is_exclusive INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_options_question ON question_options(question_id, display_order);

-- =====================================================
-- RESPONDENT AND RESPONSE TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS respondents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    respondent_uuid TEXT NOT NULL UNIQUE,
    survey_id INTEGER NOT NULL,
    is_anonymous INTEGER DEFAULT 1,
    ip_address TEXT,
    user_agent TEXT,
    language_preference TEXT DEFAULT 'fr' CHECK(language_preference IN ('ar', 'fr', 'en')),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    is_completed INTEGER DEFAULT 0,
    time_taken_seconds INTEGER,
    consent_given INTEGER DEFAULT 0,
    consent_timestamp DATETIME,
    quality_score REAL,
    is_flagged INTEGER DEFAULT 0,
    flag_reason TEXT,
    metadata TEXT,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_respondents_uuid ON respondents(respondent_uuid);
CREATE INDEX IF NOT EXISTS idx_respondents_survey ON respondents(survey_id);
CREATE INDEX IF NOT EXISTS idx_respondents_completed ON respondents(is_completed);
CREATE INDEX IF NOT EXISTS idx_respondents_date ON respondents(completed_at);
CREATE INDEX IF NOT EXISTS idx_respondents_started ON respondents(started_at);

CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    respondent_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    response_text TEXT,
    response_value TEXT,
    response_numeric REAL,
    time_spent_seconds INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (respondent_id) REFERENCES respondents(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_responses_respondent ON responses(respondent_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON responses(question_id);
CREATE INDEX IF NOT EXISTS idx_responses_value ON responses(response_value);

CREATE TABLE IF NOT EXISTS response_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    response_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    is_selected INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES question_options(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_response_options_response ON response_options(response_id);
CREATE INDEX IF NOT EXISTS idx_response_options_option ON response_options(option_id);

-- =====================================================
-- DEMOGRAPHIC DATA TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS demographics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    respondent_id INTEGER NOT NULL UNIQUE,
    age TEXT,
    age_group TEXT,
    gender TEXT,
    region_residence TEXT,
    region_origin TEXT,
    urban_rural TEXT,
    province TEXT,
    education_level TEXT,
    class_level TEXT,
    study_level TEXT,
    study_field TEXT,
    institution_type TEXT,
    employment_status TEXT,
    occupation_sector TEXT,
    professional_level TEXT,
    department TEXT,
    years_of_service TEXT,
    primary_language TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (respondent_id) REFERENCES respondents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_demographics_age ON demographics(age_group);
CREATE INDEX IF NOT EXISTS idx_demographics_gender ON demographics(gender);
CREATE INDEX IF NOT EXISTS idx_demographics_region ON demographics(region_residence);
CREATE INDEX IF NOT EXISTS idx_demographics_education ON demographics(education_level);
CREATE INDEX IF NOT EXISTS idx_demographics_employment ON demographics(employment_status);

-- =====================================================
-- ANALYTICS AND TRACKING TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS survey_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_id INTEGER NOT NULL,
    date DATE NOT NULL,
    total_started INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    total_abandoned INTEGER DEFAULT 0,
    completion_rate REAL DEFAULT 0,
    average_time_seconds INTEGER DEFAULT 0,
    median_time_seconds INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    UNIQUE(survey_id, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_survey_date ON survey_analytics(survey_id, date);

CREATE TABLE IF NOT EXISTS question_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    date DATE NOT NULL,
    total_responses INTEGER DEFAULT 0,
    skip_count INTEGER DEFAULT 0,
    average_time_seconds INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE(question_id, date)
);

CREATE INDEX IF NOT EXISTS idx_question_analytics_question_date ON question_analytics(question_id, date);

-- =====================================================
-- SYSTEM TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    FOREIGN KEY (updated_by) REFERENCES admins(id)
);

CREATE INDEX IF NOT EXISTS idx_config_key ON system_config(config_key);

CREATE TABLE IF NOT EXISTS data_exports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    survey_id INTEGER,
    export_type TEXT NOT NULL CHECK(export_type IN ('csv', 'xlsx', 'spss', 'json', 'pdf')),
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    filters TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    download_count INTEGER DEFAULT 0,
    last_downloaded DATETIME,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_exports_admin ON data_exports(admin_id, created_at);
CREATE INDEX IF NOT EXISTS idx_exports_survey ON data_exports(survey_id, created_at);

CREATE TABLE IF NOT EXISTS survey_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_id INTEGER NOT NULL,
    link_code TEXT NOT NULL UNIQUE,
    link_url TEXT NOT NULL,
    qr_code_path TEXT,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    expires_at DATETIME,
    max_uses INTEGER,
    use_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admins(id)
);

CREATE INDEX IF NOT EXISTS idx_links_survey ON survey_links(survey_id);
CREATE INDEX IF NOT EXISTS idx_links_code ON survey_links(link_code);
CREATE INDEX IF NOT EXISTS idx_links_active ON survey_links(is_active);

-- =====================================================
-- VIEWS FOR ANALYTICS AND REPORTING
-- =====================================================

CREATE VIEW IF NOT EXISTS vw_survey_statistics AS
SELECT 
    s.id AS survey_id,
    s.survey_code,
    s.title_fr AS survey_title,
    s.target_audience,
    s.is_active,
    COUNT(DISTINCT r.id) AS total_responses,
    COUNT(DISTINCT CASE WHEN r.is_completed = 1 THEN r.id END) AS completed_responses,
    COUNT(DISTINCT CASE WHEN r.is_completed = 0 THEN r.id END) AS incomplete_responses,
    ROUND(CAST(COUNT(DISTINCT CASE WHEN r.is_completed = 1 THEN r.id END) AS REAL) / 
          NULLIF(COUNT(DISTINCT r.id), 0) * 100, 2) AS completion_rate,
    AVG(CASE WHEN r.is_completed = 1 THEN r.time_taken_seconds END) AS avg_completion_time,
    MIN(r.started_at) AS first_response_date,
    MAX(r.completed_at) AS last_response_date
FROM surveys s
LEFT JOIN respondents r ON s.id = r.survey_id
GROUP BY s.id, s.survey_code, s.title_fr, s.target_audience, s.is_active;

CREATE VIEW IF NOT EXISTS vw_demographic_summary AS
SELECT 
    r.survey_id,
    d.age_group,
    d.gender,
    d.region_residence,
    d.region_origin,
    d.urban_rural,
    d.education_level,
    d.employment_status,
    COUNT(*) AS respondent_count
FROM respondents r
INNER JOIN demographics d ON r.id = d.respondent_id
WHERE r.is_completed = 1
GROUP BY r.survey_id, d.age_group, d.gender, d.region_residence, d.region_origin, d.urban_rural, d.education_level, d.employment_status;

CREATE VIEW IF NOT EXISTS vw_question_response_summary AS
SELECT 
    q.id AS question_id,
    q.question_code,
    q.question_number,
    q.question_text_fr,
    q.question_type,
    sec.survey_id,
    COUNT(DISTINCT resp.respondent_id) AS total_responses,
    AVG(resp.time_spent_seconds) AS avg_time_seconds
FROM questions q
INNER JOIN survey_sections sec ON q.section_id = sec.id
LEFT JOIN responses resp ON q.id = resp.question_id
GROUP BY q.id, q.question_code, q.question_number, q.question_text_fr, q.question_type, sec.survey_id;

CREATE VIEW IF NOT EXISTS vw_daily_survey_activity AS
SELECT 
    survey_id,
    DATE(started_at) as activity_date,
    COUNT(*) as total_started,
    COUNT(CASE WHEN is_completed = 1 THEN 1 END) as total_completed,
    ROUND(CAST(COUNT(CASE WHEN is_completed = 1 THEN 1 END) AS REAL) / COUNT(*) * 100, 2) as completion_rate
FROM respondents
GROUP BY survey_id, DATE(started_at)
ORDER BY activity_date DESC;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update respondent last_activity on new response
CREATE TRIGGER IF NOT EXISTS trg_update_respondent_activity
AFTER INSERT ON responses
BEGIN
    UPDATE respondents 
    SET last_activity = CURRENT_TIMESTAMP
    WHERE id = NEW.respondent_id;
END;

-- Update response timestamp on edit
CREATE TRIGGER IF NOT EXISTS trg_update_response_timestamp
AFTER UPDATE ON responses
BEGIN
    UPDATE responses 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Update admin timestamp
CREATE TRIGGER IF NOT EXISTS trg_update_admin_timestamp
AFTER UPDATE ON admins
BEGIN
    UPDATE admins 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Update survey timestamp
CREATE TRIGGER IF NOT EXISTS trg_update_survey_timestamp
AFTER UPDATE ON surveys
BEGIN
    UPDATE surveys 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Update demographics timestamp
CREATE TRIGGER IF NOT EXISTS trg_update_demographics_timestamp
AFTER UPDATE ON demographics
BEGIN
    UPDATE demographics 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- =====================================================
-- INITIAL SYSTEM CONFIGURATION
-- =====================================================

INSERT OR IGNORE INTO system_config (config_key, config_value, description) VALUES
('platform_name_fr', 'Enquête Nationale sur le Patrimoine Culturel Marocain', 'Nom de la plateforme en français'),
('platform_name_ar', 'المسح الوطني للتراث الثقافي المغربي', 'Nom de la plateforme en arabe'),
('platform_version', '1.0.0', 'Version de la plateforme'),
('organization', 'Direction du Patrimoine - Ministère de la Jeunesse, de la Culture et de la Communication', 'Organisation'),
('max_file_size', '10485760', 'Taille maximale des fichiers en octets'),
('session_timeout', '3600', 'Délai d\'expiration de session en secondes'),
('backup_enabled', '1', 'Activer les sauvegardes automatiques'),
('backup_retention_days', '30', 'Jours de conservation des sauvegardes'),
('export_retention_days', '7', 'Jours de conservation des exports'),
('max_export_size', '52428800', 'Taille maximale d\'export en octets (50MB)'),
('enable_analytics', '1', 'Activer les analyses'),
('enable_audit_log', '1', 'Activer le journal d\'audit'),
('maintenance_mode', '0', 'Mode maintenance'),
('allow_duplicate_responses', '0', 'Autoriser les réponses en double');
