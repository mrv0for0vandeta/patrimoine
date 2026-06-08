# Quick Start Guide
## Moroccan Heritage Survey Platform

Get up and running in 5 minutes!

---

## Prerequisites

Ensure you have:
- **Node.js** 16.0.0 or higher
- **npm** 8.0.0 or higher

Check versions:
```bash
node --version
npm --version
```

---

## 🚀 Installation (3 steps)

### 1. Install Dependencies

```bash
npm install
```

Wait for all packages to download (~1-2 minutes).

### 2. Initialize Database

```bash
npm run init-db
```

Expected output:
```
✓ Database connection established
✓ Database schema created
✓ Default admin user created
```

### 3. Seed Survey Data

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

---

## 🎯 Start the Server

```bash
npm start
```

You should see:
```
✓ Database initialized successfully
Server running on port 3000

Access points:
  - Public: http://localhost:3000
  - Admin:  http://localhost:3000/admin
  - API:    http://localhost:3000/api
  - Health: http://localhost:3000/health
```

---

## ✅ Verify Installation

### Test 1: Health Check

Open browser to: http://localhost:3000/health

Should see:
```json
{
  "success": true,
  "status": "healthy",
  "database_size_mb": "X.XX"
}
```

### Test 2: Access Home Page

Open: http://localhost:3000

Should see the survey platform home page with 7 survey options.

### Test 3: Login to Admin

1. Open: http://localhost:3000/admin
2. Login with:
   - **Username**: `admin`
   - **Password**: `admin123`
3. Should see the admin dashboard

---

## 🔑 Important First Steps

### Change Default Password

After first login:
1. Go to admin dashboard
2. Click on your username
3. Change password immediately
4. Use a strong password (8+ characters)

### Configure Environment

Edit `.env` file:
```env
# Change these values!
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_very_long_random_secret_here
SESSION_SECRET=your_session_secret_here
```

---

## 📝 What Works Now

✅ **Backend API**: Fully operational  
✅ **Database**: Created with schema  
✅ **Authentication**: Login/logout working  
✅ **7 Surveys**: Metadata imported  
✅ **Admin Access**: Dashboard accessible  
✅ **Data Export**: API endpoints ready  
✅ **Analytics**: API endpoints ready  

---

## ⏳ What's Next

The platform foundation is complete. Next phase:

1. **Import Survey Questions** from DOCX files
2. **Complete Frontend** JavaScript and CSS
3. **Test End-to-End** survey flow
4. **Deploy** to production

---

## 🛠 Common Commands

```bash
# Start server (production)
npm start

# Start with auto-reload (development)
npm run dev

# Create database backup
npm run backup

# Reinitialize database (⚠️ deletes all data!)
npm run init-db

# View logs
# Logs are in: logs/access.log and logs/error.log
```

---

## 📁 Important Files

```
gjfi/
├── .env                    # Your configuration (EDIT THIS!)
├── backend/server.js       # Main server file
├── database/schema.sql     # Database structure
├── data/                   # Database files (auto-created)
│   └── survey_platform.db
├── logs/                   # Server logs (auto-created)
├── backups/                # Database backups (auto-created)
├── README.md               # Full documentation
├── INSTALLATION.md         # Detailed installation guide
└── STATUS.md               # Project status
```

---

## 🐛 Troubleshooting

### Server won't start

```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Use different port
# Edit .env: PORT=3001
```

### Database error

```bash
# Delete and recreate database
rm -rf data/
npm run init-db
npm run seed
```

### Missing modules

```bash
# Reinstall dependencies
rm -rf node_modules
rm package-lock.json
npm install
```

### Can't login

Default credentials:
- Username: `admin`
- Password: `admin123`

Check `.env` file for any custom values.

---

## 📊 Testing the API

### Using curl

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get surveys (requires token from login)
curl http://localhost:3000/api/survey \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Browser

1. Open: http://localhost:3000/api
2. See API information and available endpoints

---

## 🎓 Learning Resources

- **README.md** - Complete project overview
- **INSTALLATION.md** - Detailed setup guide
- **STATUS.md** - Current project status
- **database/schema.sql** - Database structure
- **backend/routes/** - API endpoint implementations

---

## ✨ You're All Set!

The platform foundation is running. You can now:

1. ✅ Access the admin dashboard
2. ✅ View survey structures
3. ✅ Test API endpoints
4. ✅ Export data (once questions are imported)
5. ✅ Manage users
6. ✅ View system statistics

**Next Phase**: Import full survey questions from DOCX files to make surveys functional.

---

## 📞 Need Help?

1. Check logs in `logs/` directory
2. Review `INSTALLATION.md` for detailed setup
3. Check `STATUS.md` for current limitations
4. Verify database health: http://localhost:3000/health

---

**Happy Surveying! 🎉**

*Moroccan Heritage Survey Platform - Version 1.0.0*
