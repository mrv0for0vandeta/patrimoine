/**
 * Auto-Detecting Database Manager
 * Automatically uses Supabase (PostgreSQL) in production or SQLite in development
 */

// Detect which database to use
const DATABASE_URL = process.env.DATABASE_URL || '';
const useSupabase = DATABASE_URL.includes('postgres') || DATABASE_URL.includes('supabase');

let dbManager;

if (useSupabase) {
    console.log('🔵 Using Supabase PostgreSQL database');
    dbManager = require('./database-supabase');
} else {
    console.log('🟢 Using SQLite database');
    dbManager = require('./database-sqlite3');
}

module.exports = dbManager;
