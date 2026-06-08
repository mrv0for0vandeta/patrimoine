/**
 * Neon PostgreSQL Database Manager for Vercel
 * Replaces SQLite for serverless deployment
 */

const { neon } = require('@neondatabase/serverless');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.sql = null;
    }

    async initialize() {
        try {
            const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

            if (!databaseUrl) {
                throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
            }

            this.sql = neon(databaseUrl);

            // Test connection
            await this.sql`SELECT 1`;

            console.log('✓ Neon PostgreSQL connected successfully');

            // Initialize schema
            await this.initializeSchema();

            return true;
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    async initializeSchema() {
        try {
            // Create surveys table
            await this.sql`
                CREATE TABLE IF NOT EXISTS surveys (
                    id SERIAL PRIMARY KEY,
                    survey_code VARCHAR(50) UNIQUE NOT NULL,
                    title_fr TEXT,
                    title_ar TEXT,
                    title_en TEXT,
                    description_fr TEXT,
                    description_ar TEXT,
                    description_en TEXT,
                    target_audience VARCHAR(100),
                    estimated_time_minutes INTEGER,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Create survey_sections table
            await this.sql`
                CREATE TABLE IF NOT EXISTS survey_sections (
                    id SERIAL PRIMARY KEY,
                    survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
                    title_fr TEXT,
                    title_ar TEXT,
                    title_en TEXT,
                    description_fr TEXT,
                    description_ar TEXT,
                    description_en TEXT,
                    order_index INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Create questions table
            await this.sql`
                CREATE TABLE IF NOT EXISTS questions (
                    id SERIAL PRIMARY KEY,
                    section_id INTEGER REFERENCES survey_sections(id) ON DELETE CASCADE,
                    question_text_fr TEXT,
                    question_text_ar TEXT,
                    question_text_en TEXT,
                    question_type VARCHAR(50) NOT NULL,
                    is_required BOOLEAN DEFAULT false,
                    order_index INTEGER NOT NULL,
                    validation_rules TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Create question_options table
            await this.sql`
                CREATE TABLE IF NOT EXISTS question_options (
                    id SERIAL PRIMARY KEY,
                    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
                    option_text_fr TEXT,
                    option_text_ar TEXT,
                    option_text_en TEXT,
                    option_value VARCHAR(255),
                    order_index INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Create respondents table
            await this.sql`
                CREATE TABLE IF NOT EXISTS respondents (
                    id SERIAL PRIMARY KEY,
                    survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
                    session_token VARCHAR(255) UNIQUE NOT NULL,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    is_completed BOOLEAN DEFAULT false,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    language VARCHAR(10)
                )
            `;

            // Create demographics table
            await this.sql`
                CREATE TABLE IF NOT EXISTS demographics (
                    id SERIAL PRIMARY KEY,
                    respondent_id INTEGER REFERENCES respondents(id) ON DELETE CASCADE,
                    age_group VARCHAR(50),
                    gender VARCHAR(20),
                    location VARCHAR(100),
                    education_level VARCHAR(100),
                    occupation VARCHAR(100),
                    additional_data JSONB
                )
            `;

            // Create responses table
            await this.sql`
                CREATE TABLE IF NOT EXISTS responses (
                    id SERIAL PRIMARY KEY,
                    respondent_id INTEGER REFERENCES respondents(id) ON DELETE CASCADE,
                    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
                    answer_text TEXT,
                    selected_option_ids TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Create admins table
            await this.sql`
                CREATE TABLE IF NOT EXISTS admins (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    email VARCHAR(255),
                    full_name VARCHAR(255),
                    role VARCHAR(50) DEFAULT 'admin',
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                )
            `;

            // Create audit_logs table
            await this.sql`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id SERIAL PRIMARY KEY,
                    admin_id INTEGER REFERENCES admins(id),
                    action VARCHAR(100) NOT NULL,
                    details TEXT,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Create indexes
            await this.sql`CREATE INDEX IF NOT EXISTS idx_surveys_code ON surveys(survey_code)`;
            await this.sql`CREATE INDEX IF NOT EXISTS idx_respondents_token ON respondents(session_token)`;
            await this.sql`CREATE INDEX IF NOT EXISTS idx_responses_respondent ON responses(respondent_id)`;
            await this.sql`CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username)`;

            console.log('✓ Database schema initialized');
        } catch (error) {
            console.error('Schema initialization error:', error);
            throw error;
        }
    }

    async query(sql, params = []) {
        return this.sql(sql, ...params);
    }

    async get(sql, params = []) {
        const result = await this.sql(sql, ...params);
        return result[0] || null;
    }

    async all(sql, params = []) {
        return this.sql(sql, ...params);
    }

    async run(sql, params = []) {
        return this.sql(sql, ...params);
    }

    async healthCheck() {
        try {
            await this.sql`SELECT 1`;
            return {
                status: 'healthy',
                database: 'connected',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async close() {
        // Neon handles connections automatically
        console.log('Database connection closed');
    }
}

// Singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
