const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbPath = process.env.DATABASE_PATH || './data/survey_platform.db';
    }

    initialize() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
                console.log(`✓ Created data directory: ${dataDir}`);
            }

            // Initialize database connection
            this.db = new Database(this.dbPath);

            // Enable WAL mode for better concurrency
            this.db.pragma('journal_mode = WAL');

            // Enable foreign key constraints
            this.db.pragma('foreign_keys = ON');

            // Optimize for better performance
            this.db.pragma('synchronous = NORMAL');
            this.db.pragma('cache_size = -64000'); // 64MB cache
            this.db.pragma('temp_store = MEMORY');

            console.log(`✓ Database connection established: ${this.dbPath}`);
            return this.db;
        } catch (error) {
            console.error('✗ Database initialization error:', error);
            throw error;
        }
    }

    getConnection() {
        if (!this.db) {
            this.initialize();
        }
        return this.db;
    }

    close() {
        if (this.db) {
            try {
                this.db.close();
                this.db = null;
                console.log('✓ Database connection closed');
            } catch (error) {
                console.error('✗ Error closing database:', error);
            }
        }
    }

    // Transaction helper
    transaction(callback) {
        const db = this.getConnection();
        const transaction = db.transaction(callback);
        return transaction;
    }

    // Prepared statement helper
    prepare(sql) {
        const db = this.getConnection();
        return db.prepare(sql);
    }

    // Execute raw SQL
    exec(sql) {
        const db = this.getConnection();
        return db.exec(sql);
    }

    // Backup database
    backup(backupPath) {
        try {
            const db = this.getConnection();

            // Ensure backup directory exists
            const backupDir = path.dirname(backupPath);
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            // Create backup
            db.backup(backupPath)
                .then(() => {
                    console.log(`✓ Database backed up to ${backupPath}`);
                })
                .catch(err => {
                    console.error('✗ Backup error:', err);
                });

            return true;
        } catch (error) {
            console.error('✗ Backup error:', error);
            return false;
        }
    }

    // Get database statistics
    getStatistics() {
        const db = this.getConnection();

        try {
            const stats = {
                surveys: db.prepare('SELECT COUNT(*) as count FROM surveys').get().count,
                active_surveys: db.prepare('SELECT COUNT(*) as count FROM surveys WHERE is_active = 1').get().count,
                respondents: db.prepare('SELECT COUNT(*) as count FROM respondents').get().count,
                completed_responses: db.prepare('SELECT COUNT(*) as count FROM respondents WHERE is_completed = 1').get().count,
                incomplete_responses: db.prepare('SELECT COUNT(*) as count FROM respondents WHERE is_completed = 0').get().count,
                total_responses: db.prepare('SELECT COUNT(*) as count FROM responses').get().count,
                admins: db.prepare('SELECT COUNT(*) as count FROM admins WHERE is_active = 1').get().count,
                sections: db.prepare('SELECT COUNT(*) as count FROM survey_sections').get().count,
                questions: db.prepare('SELECT COUNT(*) as count FROM questions').get().count,
                database_size: fs.existsSync(this.dbPath) ? fs.statSync(this.dbPath).size : 0,
                last_response: db.prepare('SELECT MAX(completed_at) as last_response FROM respondents WHERE is_completed = 1').get().last_response
            };

            return stats;
        } catch (error) {
            console.error('✗ Error getting statistics:', error);
            return null;
        }
    }

    // Health check
    healthCheck() {
        try {
            const db = this.getConnection();
            db.prepare('SELECT 1').get();

            const stats = this.getStatistics();

            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database_path: this.dbPath,
                database_size_mb: ((stats.database_size || 0) / 1024 / 1024).toFixed(2),
                statistics: stats
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Vacuum database (optimize)
    vacuum() {
        try {
            const db = this.getConnection();
            console.log('Running VACUUM to optimize database...');
            db.exec('VACUUM');
            console.log('✓ Database optimized');
            return true;
        } catch (error) {
            console.error('✗ VACUUM error:', error);
            return false;
        }
    }

    // Analyze database (update query planner statistics)
    analyze() {
        try {
            const db = this.getConnection();
            console.log('Running ANALYZE to update statistics...');
            db.exec('ANALYZE');
            console.log('✓ Database statistics updated');
            return true;
        } catch (error) {
            console.error('✗ ANALYZE error:', error);
            return false;
        }
    }

    // Check database integrity
    checkIntegrity() {
        try {
            const db = this.getConnection();
            const result = db.prepare('PRAGMA integrity_check').get();
            const isOk = result.integrity_check === 'ok';

            if (isOk) {
                console.log('✓ Database integrity check passed');
            } else {
                console.error('✗ Database integrity check failed:', result);
            }

            return isOk;
        } catch (error) {
            console.error('✗ Integrity check error:', error);
            return false;
        }
    }
}

// Singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
