const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbPath = process.env.DATABASE_PATH || './data/survey_platform.db';
    }

    initialize() {
        return new Promise((resolve, reject) => {
            try {
                // Ensure data directory exists
                const dataDir = path.dirname(this.dbPath);
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                    console.log(`✓ Created data directory: ${dataDir}`);
                }

                // Initialize database connection
                this.db = new sqlite3.Database(this.dbPath, (err) => {
                    if (err) {
                        console.error('✗ Database initialization error:', err);
                        reject(err);
                    } else {
                        // Enable foreign key constraints
                        this.db.run('PRAGMA foreign_keys = ON');
                        this.db.run('PRAGMA journal_mode = WAL');
                        this.db.run('PRAGMA synchronous = NORMAL');

                        console.log(`✓ Database connection established: ${this.dbPath}`);
                        resolve(this.db);
                    }
                });
            } catch (error) {
                console.error('✗ Database initialization error:', error);
                reject(error);
            }
        });
    }

    getDb() {
        if (!this.db) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.db;
    }

    // Alias for compatibility
    getConnection() {
        return this.getDb();
    }

    // Helper to run SQL with parameters
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    // Helper to get single row
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Helper to get all rows
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Execute raw SQL
    exec(sql) {
        return new Promise((resolve, reject) => {
            this.db.exec(sql, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Prepare statement (returns sqlite3-compatible object)
    prepare(sql) {
        // Return wrapper that works like better-sqlite3
        const db = this.db;
        return {
            run: (...params) => {
                return new Promise((resolve, reject) => {
                    db.run(sql, params, function (err) {
                        if (err) reject(err);
                        else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
                    });
                });
            },
            get: (...params) => {
                return new Promise((resolve, reject) => {
                    db.get(sql, params, (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });
            },
            all: (...params) => {
                return new Promise((resolve, reject) => {
                    db.all(sql, params, (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });
            }
        };
    }

    // Transaction helper
    transaction(callback) {
        return async () => {
            await this.run('BEGIN TRANSACTION');
            try {
                await callback();
                await this.run('COMMIT');
            } catch (error) {
                await this.run('ROLLBACK');
                throw error;
            }
        };
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('✗ Error closing database:', err);
                        reject(err);
                    } else {
                        this.db = null;
                        console.log('✓ Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Get database statistics
    async getStatistics() {
        try {
            const stats = {
                surveys: (await this.get('SELECT COUNT(*) as count FROM surveys')).count,
                active_surveys: (await this.get('SELECT COUNT(*) as count FROM surveys WHERE is_active = 1')).count,
                respondents: (await this.get('SELECT COUNT(*) as count FROM respondents')).count,
                completed_responses: (await this.get('SELECT COUNT(*) as count FROM respondents WHERE is_completed = 1')).count,
                incomplete_responses: (await this.get('SELECT COUNT(*) as count FROM respondents WHERE is_completed = 0')).count,
                total_responses: (await this.get('SELECT COUNT(*) as count FROM responses')).count,
                admins: (await this.get('SELECT COUNT(*) as count FROM admins WHERE is_active = 1')).count,
                sections: (await this.get('SELECT COUNT(*) as count FROM sections')).count,
                questions: (await this.get('SELECT COUNT(*) as count FROM questions')).count,
                database_size: fs.existsSync(this.dbPath) ? fs.statSync(this.dbPath).size : 0,
                last_response: (await this.get('SELECT MAX(completed_at) as last_response FROM respondents WHERE is_completed = 1')).last_response
            };

            return stats;
        } catch (error) {
            console.error('✗ Error getting statistics:', error);
            return null;
        }
    }

    // Health check
    async healthCheck() {
        try {
            await this.get('SELECT 1');
            const stats = await this.getStatistics();

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
    async vacuum() {
        try {
            console.log('Running VACUUM to optimize database...');
            await this.exec('VACUUM');
            console.log('✓ Database optimized');
            return true;
        } catch (error) {
            console.error('✗ VACUUM error:', error);
            return false;
        }
    }

    // Analyze database (update query planner statistics)
    async analyze() {
        try {
            console.log('Running ANALYZE to update statistics...');
            await this.exec('ANALYZE');
            console.log('✓ Database statistics updated');
            return true;
        } catch (error) {
            console.error('✗ ANALYZE error:', error);
            return false;
        }
    }

    // Check database integrity
    async checkIntegrity() {
        try {
            const result = await this.get('PRAGMA integrity_check');
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
