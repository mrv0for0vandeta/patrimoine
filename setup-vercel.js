#!/usr/bin/env node

/**
 * Automated Vercel Environment Variables Setup
 * This script configures all required environment variables for your Vercel deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('============================================');
console.log('Vercel Deployment Setup');
console.log('============================================\n');

// Check if Vercel CLI is installed
try {
    execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
    console.error('❌ Vercel CLI is not installed.');
    console.log('\nInstall it with: npm install -g vercel');
    console.log('Then run this script again.');
    process.exit(1);
}

// Environment variables to set
const envVars = [
    {
        key: 'DATABASE_URL',
        value: 'postgresql://postgres.elswjgrymyiklvsjimav:Medmahdi2025+@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
        description: 'Supabase PostgreSQL connection string'
    },
    {
        key: 'NODE_ENV',
        value: 'production',
        description: 'Node environment'
    },
    {
        key: 'JWT_SECRET',
        value: 'moroccan_heritage_jwt_secret_2024_secure_minimum_32_chars',
        description: 'JWT token secret'
    },
    {
        key: 'SESSION_SECRET',
        value: 'moroccan_session_secret_2024_secure_minimum_32_chars',
        description: 'Session secret'
    },
    {
        key: 'ADMIN_USERNAME',
        value: 'admin',
        description: 'Admin username'
    },
    {
        key: 'ADMIN_PASSWORD',
        value: 'Patrimoine2024!',
        description: 'Admin password'
    },
    {
        key: 'ADMIN_EMAIL',
        value: 'admin@patrimoine.gov.ma',
        description: 'Admin email'
    }
];

console.log('This will configure environment variables for your Vercel project.');
console.log('You must be logged in to Vercel CLI.\n');

// Check if logged in
try {
    const whoami = execSync('vercel whoami', { encoding: 'utf-8' });
    console.log(`✓ Logged in as: ${whoami.trim()}\n`);
} catch (error) {
    console.error('❌ Not logged in to Vercel.');
    console.log('\nRun: vercel login');
    console.log('Then run this script again.');
    process.exit(1);
}

console.log('Setting environment variables...\n');

let successCount = 0;
let errorCount = 0;

for (const { key, value, description } of envVars) {
    try {
        console.log(`[${successCount + errorCount + 1}/${envVars.length}] Setting ${key}...`);
        console.log(`    ${description}`);

        // Use Vercel CLI to set environment variable
        // Format: echo "value" | vercel env add KEY production
        const command = `vercel env add ${key} production`;

        // On Windows, we need to handle input differently
        const tempFile = `temp_${key}.txt`;
        fs.writeFileSync(tempFile, value);

        try {
            execSync(`type ${tempFile} | ${command}`, {
                stdio: 'pipe',
                encoding: 'utf-8'
            });
            fs.unlinkSync(tempFile);
            console.log(`    ✓ ${key} set successfully\n`);
            successCount++;
        } catch (err) {
            // Try to clean up temp file
            try { fs.unlinkSync(tempFile); } catch { }

            // Variable might already exist
            if (err.message.includes('already exists')) {
                console.log(`    ⚠ ${key} already exists (skipping)\n`);
                successCount++;
            } else {
                throw err;
            }
        }
    } catch (error) {
        console.error(`    ✗ Failed to set ${key}`);
        console.error(`    Error: ${error.message}\n`);
        errorCount++;
    }
}

console.log('============================================');
console.log(`✓ Successfully set: ${successCount} variables`);
if (errorCount > 0) {
    console.log(`✗ Failed: ${errorCount} variables`);
}
console.log('============================================\n');

if (successCount > 0) {
    console.log('Next steps:');
    console.log('1. Redeploy your site: vercel --prod');
    console.log('2. Visit your deployment URL');
    console.log('\nOr push to GitHub and Vercel will auto-deploy.');
} else {
    console.log('⚠ No variables were set. You may need to set them manually:');
    console.log('https://vercel.com/mrv0for0vandeta/patrimoine-jet/settings/environment-variables');
}

console.log('\n');
