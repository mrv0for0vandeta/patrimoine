const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const dbManager = require('./database-sqlite3');

async function initializeDatabase() {
    console.log('\n===========================================');
    console.log('Moroccan Heritage Survey Platform');
    console.log('Database Initialization');
    console.log('===========================================\n');

    try {
        // Initialize database connection
        await dbManager.initialize();
        console.log('✓ Database connection established\n');

        // Read and execute schema
        console.log('Creating database schema...');
        const schemaPath = path.join(__dirname, '../../database/schema-simple.sql');

        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }

        const schema = fs.readFileSync(schemaPath, 'utf8');
        await dbManager.exec(schema);
        console.log('✓ Database schema created');
        console.log('✓ Tables created');
        console.log('✓ Indexes created');
        console.log('✓ Views created');
        console.log('✓ Triggers created\n');

        // Create default admin user
        console.log('Creating default admin user...');
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@patrimoine.gov.ma';

        const passwordHash = await bcrypt.hash(adminPassword, 10);

        await dbManager.run(
            'INSERT OR REPLACE INTO admins (username, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [adminUsername, adminEmail, passwordHash, 'System Administrator', 'admin', 1]
        );
        console.log('✓ Default admin user created\n');

        // Verify installation
        console.log('Verifying installation...');
        const stats = await dbManager.getStatistics();
        console.log(`  ✓ Admin users: ${stats.admins}`);
        console.log(`  ✓ Database size: ${(stats.database_size / 1024).toFixed(2)} KB`);

        // Check integrity
        const integrityOk = dbManager.checkIntegrity();
        if (integrityOk) {
            console.log('  ✓ Database integrity verified');
        }

        console.log('\n===========================================');
        console.log('✓ Database initialization completed!');
        console.log('===========================================\n');
        console.log('Default login credentials:');
        console.log(`  Username: ${adminUsername}`);
        console.log(`  Password: ${adminPassword}`);
        console.log(`  Email: ${adminEmail}`);
        console.log('\n⚠️  IMPORTANT: Change the default password immediately after first login!\n');
        console.log('Next step: Run "npm run seed" to import survey data\n');

        await dbManager.close();
        process.exit(0);

    } catch (error) {
        console.error('\n✗ Database initialization failed:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run initialization if called directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
