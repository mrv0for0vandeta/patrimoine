# Installation Guide
## Moroccan Heritage Survey Platform

This guide will walk you through the complete installation and setup process.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** version 16.0.0 or higher
- **npm** version 8.0.0 or higher
- **Git** (optional, for version control)

### Check Prerequisites

```bash
node --version
npm --version
```

## Installation Steps

### 1. Install Dependencies

Navigate to the project directory and install all required packages:

```bash
npm install
```

This will install all dependencies listed in `package.json`:
- Express.js (web framework)
- Better-sqlite3 (database)
- JWT & Bcrypt (authentication)
- XLSX & JSON2CSV (data export)
- QRCode (QR code generation)
- And more...

### 2. Configure Environment

Copy the environment template and configure it:

```bash
cp .env.example .env
```

Then edit `.env` and change the following:

```env
# CRITICAL: Change these in production!
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
ADMIN_EMAIL=your_email@domain.com
JWT_SECRET=your_very_long_random_secret_key
SESSION_SECRET=your_very_long_random_session_secret
```

### 3. Initialize Database

Create the database schema and tables:

```bash
npm run init-db
```

Expected output:
```
✓ Database connection established
✓ Database schema created
✓ Default admin user created
```

### 4. Seed Survey Data

Import the 7 survey structures:

```bash
npm run seed
```

Expected output:
```
✓ Survey 1/7: Q1_PRIMARY created
✓ Survey 2/7: Q2_COLLEGE created
...
✓ All 7 surveys created successfully
```

### 5. Start the Server

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

Expected output:
```
✓ Database connected
✓ Server running on port 3000
```

### 6. Access the Platform

Open your browser and navigate to:

- **Public Surveys**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin

Default login credentials:
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT: Change the default password immediately after first login!**

## Verification Checklist

After installation, verify everything is working:

- [ ] Server starts without errors
- [ ] Can access the home page
- [ ] Can log in to admin dashboard
- [ ] Database file exists in `data/` directory
- [ ] Can view the 7 surveys in admin panel
- [ ] Can access individual survey pages

## Directory Structure

After installation, your directory should look like this:

```
gjfi/
├── node_modules/        # Installed dependencies
├── backend/            
│   ├── middleware/      # Auth, error handling, logging
│   ├── routes/          # API endpoints (to be created)
│   └── utils/           # Database utilities
├── database/
│   └── schema.sql       # Database schema
├── data/                # Generated: Database files
│   └── survey_platform.db
├── logs/                # Generated: Log files
│   ├── access.log
│   └── error.log
├── backups/             # Generated: Database backups
├── .env                 # Your configuration
├── .env.example         # Configuration template
├── package.json         # Project dependencies
└── README.md            # Project documentation
```

## Next Steps

After successful installation:

1. **Change Default Credentials**
   - Log in to admin panel
   - Go to Settings
   - Change admin password

2. **Import Survey Questions**
   - The survey structures are created
   - Full questions from DOCX files need to be imported
   - Use the admin import tool (coming in next phase)

3. **Configure Backups**
   - Set up automatic backups:
   ```bash
   npm run backup
   ```

4. **Test Survey Flow**
   - Try taking a test survey
   - Verify data is saved correctly
   - Check admin analytics

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, change it in `.env`:
```env
PORT=3001
```

### Database Locked Error

If you see "database is locked":
1. Close any database browsers
2. Restart the server
3. Check no other instance is running

### Permission Errors

If you get permission errors:
```bash
# On Unix/Linux/Mac
chmod +x node_modules/.bin/*

# On Windows (run as administrator)
npm install --force
```

### Module Not Found

If dependencies are missing:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## Production Deployment

For production deployment:

1. **Set Environment**
   ```env
   NODE_ENV=production
   ```

2. **Use Strong Secrets**
   - Generate strong JWT_SECRET (32+ characters)
   - Use complex passwords

3. **Enable HTTPS**
   - Use a reverse proxy (Nginx/Apache)
   - Get SSL certificate (Let's Encrypt)

4. **Configure Firewall**
   - Only allow necessary ports
   - Restrict database access

5. **Set Up Monitoring**
   - Monitor logs in `logs/` directory
   - Set up automated backups
   - Monitor disk space

6. **Performance Optimization**
   - Enable compression
   - Configure caching
   - Optimize database (vacuum)

## Getting Help

If you encounter issues:

1. Check the logs in `logs/` directory
2. Review the README.md
3. Contact technical support
4. Check for updates

## Backup and Maintenance

### Create Backup
```bash
npm run backup
```

### List Backups
```bash
npm run backup list
```

### Clean Old Backups
```bash
npm run backup clean
```

Backups are stored in the `backups/` directory with timestamps.

---

**Installation Complete!** 

You now have a fully functional survey platform foundation ready for development.
