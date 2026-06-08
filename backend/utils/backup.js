const fs = require('fs');
const path = require('path');
const dbManager = require('./database');

/**
 * Database Backup Utility
 * Creates timestamped backups of the survey platform database
 */

function createBackup() {
    console.log('\n===========================================');
    console.log('Database Backup Utility');
    console.log('===========================================\n');

    try {
        const backupDir = process.env.BACKUP_PATH || './backups';

        // Ensure backup directory exists
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
            console.log(`✓ Created backup directory: ${backupDir}`);
        }

        // Create timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupFileName = `survey_platform_backup_${timestamp}.db`;
        const backupPath = path.join(backupDir, backupFileName);

        // Get database statistics before backup
        const stats = dbManager.getStatistics();
        console.log('Database Statistics:');
        console.log(`  Surveys: ${stats.surveys}`);
        console.log(`  Total Respondents: ${stats.respondents}`);
        console.log(`  Completed Responses: ${stats.completed_responses}`);
        console.log(`  Database Size: ${(stats.database_size / 1024 / 1024).toFixed(2)} MB\n`);

        // Perform backup
        console.log(`Creating backup: ${backupFileName}`);
        const success = dbManager.backup(backupPath);

        if (success) {
            const backupSize = fs.statSync(backupPath).size;
            console.log(`✓ Backup created successfully`);
            console.log(`  Path: ${backupPath}`);
            console.log(`  Size: ${(backupSize / 1024 / 1024).toFixed(2)} MB\n`);

            // Clean old backups (keep last 30 days by default)
            cleanOldBackups(backupDir);

            console.log('===========================================');
            console.log('✓ Backup completed successfully!');
            console.log('===========================================\n');
        } else {
            throw new Error('Backup failed');
        }

    } catch (error) {
        console.error('\n✗ Backup failed:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

function cleanOldBackups(backupDir) {
    try {
        const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        console.log(`Cleaning backups older than ${retentionDays} days...`);

        const files = fs.readdirSync(backupDir);
        let deletedCount = 0;

        files.forEach(file => {
            if (file.startsWith('survey_platform_backup_') && file.endsWith('.db')) {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);

                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`  Deleted old backup: ${file}`);
                }
            }
        });

        if (deletedCount > 0) {
            console.log(`✓ Deleted ${deletedCount} old backup(s)\n`);
        } else {
            console.log(`✓ No old backups to delete\n`);
        }

    } catch (error) {
        console.error('Warning: Error cleaning old backups:', error.message);
    }
}

function listBackups() {
    const backupDir = process.env.BACKUP_PATH || './backups';

    if (!fs.existsSync(backupDir)) {
        console.log('No backups directory found.');
        return;
    }

    const files = fs.readdirSync(backupDir);
    const backups = files
        .filter(file => file.startsWith('survey_platform_backup_') && file.endsWith('.db'))
        .map(file => {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            return {
                file: file,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
        })
        .sort((a, b) => b.modified - a.modified);

    console.log('\n===========================================');
    console.log('Available Backups');
    console.log('===========================================\n');

    if (backups.length === 0) {
        console.log('No backups found.\n');
        return;
    }

    backups.forEach((backup, index) => {
        console.log(`${index + 1}. ${backup.file}`);
        console.log(`   Size: ${(backup.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Date: ${backup.modified.toLocaleString()}\n`);
    });

    console.log(`Total: ${backups.length} backup(s)\n`);
}

// Command line interface
if (require.main === module) {
    const command = process.argv[2];

    switch (command) {
        case 'create':
        case undefined:
            createBackup();
            break;
        case 'list':
            listBackups();
            break;
        case 'clean':
            const backupDir = process.env.BACKUP_PATH || './backups';
            cleanOldBackups(backupDir);
            break;
        default:
            console.log('Usage:');
            console.log('  npm run backup         - Create a new backup');
            console.log('  npm run backup list    - List all backups');
            console.log('  npm run backup clean   - Clean old backups');
            break;
    }
}

module.exports = { createBackup, listBackups, cleanOldBackups };
