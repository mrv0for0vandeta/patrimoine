# 🏛️ Moroccan Heritage Survey Platform

A comprehensive web-based survey platform for collecting and analyzing data about Moroccan cultural heritage. Built for academic research and institutional data collection with support for 5,000+ responses.

## 🌟 Features

- **Multi-language Support**: Arabic, French, and English interfaces
- **Professional Survey Engine**: Dynamic question types, validation, and branching logic
- **Real-time Analytics**: Advanced data visualization and reporting
- **Secure Authentication**: JWT-based admin authentication
- **Data Export**: Excel, CSV, and JSON export capabilities
- **Offline Support**: Progressive Web App (PWA) with offline data collection
- **Production-Ready**: PostgreSQL backend with Supabase, deployed on Vercel/Railway

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0

### Local Development

1. **Clone the repository**:
```bash
git clone https://github.com/mrv0for0vandeta/patrimoine.git
cd patrimoine
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
Create a `.env` file in the root directory:
```env
NODE_ENV=development
DATABASE_URL=./data/survey_platform.db
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@example.com
```

4. **Initialize the database**:
```bash
npm run init-db
```

5. **Start the server**:
```bash
npm start
```

6. **Open your browser**:
- Main site: http://localhost:3000
- Admin panel: http://localhost:3000/admin

## 🌐 Production Deployment

### Option 1: Vercel (Recommended for Static + Serverless)

#### Automated Setup (2 minutes):
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Configure environment variables automatically
node setup-vercel.js

# Deploy
vercel --prod
```

#### Manual Setup:
1. Go to [Vercel Environment Variables](https://vercel.com/mrv0for0vandeta/patrimoine-jet/settings/environment-variables)
2. Add these 7 variables (copy from `COPY_THESE_ENV_VARS.txt`):
   - DATABASE_URL
   - NODE_ENV
   - JWT_SECRET
   - SESSION_SECRET
   - ADMIN_USERNAME
   - ADMIN_PASSWORD
   - ADMIN_EMAIL
3. Redeploy from dashboard

📖 **See `VERCEL_FIX.md` for complete instructions**

### Option 2: Railway (Zero Configuration - 1 minute)

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select `mrv0for0vandeta/patrimoine`
4. Done! Railway automatically reads `.env.production`

**Railway Benefits:**
- ✅ No manual environment variable setup
- ✅ Automatic deployments on git push
- ✅ Better PostgreSQL integration
- ✅ Free tier: 500 hours/month

### Option 3: Other Platforms

The platform can be deployed to:
- **Render**: Similar to Railway, reads `.env.production`
- **Heroku**: Manual env var setup required
- **DigitalOcean App Platform**: Manual env var setup required
- **Google Cloud Run**: Use `deploy-to-google-cloud.bat`

## 🗄️ Database

### Development (SQLite)
```bash
# Uses local SQLite database
DATABASE_URL=./data/survey_platform.db
```

### Production (PostgreSQL + Supabase)
```bash
# Uses Supabase PostgreSQL
DATABASE_URL=postgresql://postgres.PROJECTID:PASSWORD@HOST:6543/postgres
```

**Current Supabase Project:**
- Project ID: `elswjgrymyiklvsjimav`
- Host: `aws-0-us-east-1.pooler.supabase.com`
- Database: `postgres`

The app automatically detects which database to use based on `DATABASE_URL`.

## 📊 Database Schema

The platform includes 9 tables:
- `surveys` - Survey definitions
- `survey_sections` - Survey sections/pages
- `questions` - Individual questions
- `question_options` - Multiple choice options
- `respondents` - Survey participants
- `demographics` - Demographic data
- `responses` - Survey answers
- `admins` - Admin accounts
- `audit_logs` - Activity tracking

## 🔐 Admin Access

**Default Credentials (Change in Production):**
- Username: `admin`
- Password: `Patrimoine2024!`
- Email: `admin@patrimoine.gov.ma`

**Admin Features:**
- Create and manage surveys
- View real-time analytics
- Export data (Excel, CSV, JSON)
- User management
- Activity logs

## 📁 Project Structure

```
patrimoine/
├── frontend/               # Client-side application
│   ├── index.html         # Main landing page
│   ├── survey.html        # Survey taking interface
│   ├── admin/             # Admin dashboard
│   │   └── index.html
│   ├── css/               # Stylesheets
│   ├── js/                # Client-side JavaScript
│   └── service-worker.js  # PWA offline support
├── backend/               # Server-side application
│   ├── server.js          # Main Express server
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── survey.js
│   │   ├── analytics.js
│   │   ├── export.js
│   │   └── admin.js
│   ├── middleware/        # Custom middleware
│   └── utils/             # Utility functions
│       ├── database.js           # SQLite adapter
│       └── database-supabase.js  # PostgreSQL adapter
├── api/                   # Vercel serverless functions
│   └── index.js           # Serverless entry point
├── data/                  # SQLite database (development)
├── database/              # SQL schemas
├── docs/                  # Documentation
│   └── API_DOCUMENTATION.md
├── .env.production        # Production environment variables
└── vercel.json           # Vercel configuration
```

## 🛠️ NPM Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm run init-db        # Initialize database schema
npm run seed           # Seed with sample data
npm run backup         # Backup database
npm test               # Run tests (TODO)
```

## 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `development` |
| `DATABASE_URL` | Database connection string | Yes | `./data/survey_platform.db` |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `SESSION_SECRET` | Session encryption secret | Yes | - |
| `ADMIN_USERNAME` | Default admin username | Yes | `admin` |
| `ADMIN_PASSWORD` | Default admin password | Yes | - |
| `ADMIN_EMAIL` | Admin email address | Yes | - |
| `PORT` | Server port | No | `3000` |
| `CORS_ORIGIN` | Allowed CORS origins | No | `*` |

## 📡 API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /api` - API information
- `POST /api/auth/login` - Admin login
- `GET /api/survey/:code` - Get survey by code
- `POST /api/survey/:code/response` - Submit survey response

### Admin Endpoints (Authentication Required)
- `POST /api/admin/survey` - Create survey
- `PUT /api/admin/survey/:id` - Update survey
- `DELETE /api/admin/survey/:id` - Delete survey
- `GET /api/analytics/:surveyCode` - Get survey analytics
- `GET /api/export/:surveyCode/:format` - Export data

📖 **See `docs/API_DOCUMENTATION.md` for complete API reference**

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CSRF protection
- Rate limiting
- SQL injection prevention
- XSS protection with Helmet
- HTTPS enforcement in production
- Environment variable validation

## 📊 Expected Scale

The platform is designed to handle:
- **5,000+ survey responses**
- **Multiple concurrent surveys**
- **Real-time analytics**
- **Large data exports**

## 🐛 Troubleshooting

### Vercel 500 Error
**Problem:** Site shows 500 error after deployment
**Solution:** Environment variables not set. See `VERCEL_FIX.md`

### Database Connection Failed
**Problem:** Can't connect to database
**Solution:** Check `DATABASE_URL` is correct in environment variables

### Admin Login Failed
**Problem:** Can't log in to admin panel
**Solution:** Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set correctly

### Port Already in Use
**Problem:** `Error: listen EADDRINUSE: address already in use`
**Solution:** Change port in `.env` file: `PORT=3001`

## 📚 Documentation

- [API Documentation](docs/API_DOCUMENTATION.md) - Complete API reference
- [Vercel Deployment Fix](VERCEL_FIX.md) - Fix 500 errors on Vercel
- [Installation Guide](INSTALLATION.md) - Detailed setup instructions
- [Admin Guide](ADMIN_GUIDE.md) - Admin panel user guide
- [Deployment Summary](DEPLOYMENT_SUMMARY.md) - All deployment options

## 🤝 Contributing

This is an academic research platform developed for institutional use. For contributions or questions, please contact the development team.

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Direction du Patrimoine**  
Ministère de la Jeunesse, de la Culture et de la Communication  
Kingdom of Morocco

---

## 🚨 Current Status

✅ **Application**: Fully functional, tested locally  
✅ **Database**: Supabase PostgreSQL configured  
✅ **Deployment**: Code deployed to Vercel  
⚠️ **Action Required**: Set environment variables in Vercel dashboard  

### Fix Deployment Now:

**Option A - Automated (2 min):**
```bash
node setup-vercel.js
vercel --prod
```

**Option B - Manual (5 min):**
1. Open `COPY_THESE_ENV_VARS.txt`
2. Copy variables to Vercel dashboard
3. Redeploy

**Option C - Railway (1 min):**
1. Visit https://railway.app/new
2. Deploy from GitHub
3. Done!

---

**Live URL:** https://patrimoine-jet.vercel.app/ *(Will work after env vars are set)*  
**Health Check:** https://patrimoine-jet.vercel.app/health  
**Admin Panel:** https://patrimoine-jet.vercel.app/admin  

---

Made with ❤️ for Moroccan Cultural Heritage Preservation
