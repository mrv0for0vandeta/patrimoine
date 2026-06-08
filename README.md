# Moroccan Heritage Survey Platform
## Enquête Nationale sur le Patrimoine Culturel Marocain

A production-ready academic survey data collection and analysis platform developed for the Direction du Patrimoine, Ministère de la Jeunesse, de la Culture et de la Communication, Royaume du Maroc.

## Overview

This platform implements 7 comprehensive surveys targeting different audiences to assess perceptions, knowledge, and engagement with Moroccan cultural heritage:

1. **Questionnaire 1**: Primary School Students (Élèves de l'école primaire)
2. **Questionnaire 2**: Middle School Students (Élèves du collège)
3. **Questionnaire 3**: High School Students (Élèves du lycée)
4. **Questionnaire 4**: University Students (Étudiants de l'enseignement supérieur)
5. **Questionnaire 5**: General Public (Grand public)
6. **Questionnaire 6**: Ministry Employees (Employés du Ministère)
7. **Questionnaire 7**: Heritage Studies Students (Étudiants des disciplines liées au patrimoine)

## Features

### For Participants
- ✅ Multi-language support (Arabic RTL, French, English)
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Anonymous participation
- ✅ Save and continue later
- ✅ Progress tracking
- ✅ Secure data submission

### For Researchers
- ✅ Secure admin dashboard
- ✅ Real-time response monitoring
- ✅ Multiple export formats (CSV, XLSX, SPSS, JSON, PDF)
- ✅ Built-in analytics and visualization
- ✅ Survey management (activate/deactivate)
- ✅ QR code generation
- ✅ Demographic filtering
- ✅ Data quality checks

### Technical Features
- ✅ SQLite database with full ACID compliance
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ Audit logging
- ✅ Automatic backups
- ✅ GDPR compliant

## Installation

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0

### Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and change default passwords and secrets
   ```

3. **Initialize database**
   ```bash
   npm run init-db
   ```

4. **Seed survey data**
   ```bash
   npm run seed
   ```

5. **Start server**
   ```bash
   npm start
   ```

6. **Access the platform**
   - Public surveys: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin
   - Default credentials: admin / admin123 (CHANGE IMMEDIATELY!)

## Development

```bash
npm run dev
```

## Project Structure

```
gjfi/
├── backend/
│   ├── server.js                 # Main server file
│   ├── routes/                   # API routes
│   │   ├── auth.js              # Authentication
│   │   ├── survey.js            # Survey management
│   │   ├── analytics.js         # Analytics & reporting
│   │   ├── export.js            # Data export
│   │   └── admin.js             # Admin operations
│   ├── middleware/               # Custom middleware
│   │   ├── auth.js              # Auth middleware
│   │   ├── errorHandler.js     # Error handling
│   │   └── logger.js            # Request logging
│   └── utils/                    # Utilities
│       ├── database.js          # Database manager
│       ├── init-database.js    # DB initialization
│       ├── seed-surveys.js     # Survey data seeding
│       └── backup.js            # Backup utility
├── frontend/
│   ├── index.html               # Landing page
│   ├── admin/                   # Admin dashboard
│   ├── survey.html              # Survey interface
│   ├── js/                      # JavaScript modules
│   │   ├── survey-engine.js    # Survey logic
│   │   ├── api-client.js       # API communication
│   │   └── analytics.js        # Analytics visualization
│   └── css/                     # Stylesheets
│       ├── main.css            # Global styles
│       ├── survey.css          # Survey styles
│       └── admin.css           # Admin styles
├── database/
│   └── schema.sql               # Database schema
├── data/                        # Database files (generated)
├── backups/                     # Backup files (generated)
├── logs/                        # Log files (generated)
├── .env                         # Environment configuration
├── .env.example                 # Environment template
├── package.json                 # Node dependencies
└── README.md                    # This file
```

## API Documentation

### Public Endpoints

- `GET /api/survey/public/:surveyCode` - Get survey structure
- `POST /api/survey/public/:surveyCode/start` - Start new response
- `POST /api/survey/public/:surveyCode/submit` - Submit completed survey
- `POST /api/survey/public/:surveyCode/save-progress` - Save partial progress

### Admin Endpoints (Authentication required)

- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/admin/me` - Get current user
- `GET /api/survey` - List all surveys
- `PATCH /api/survey/:id/toggle-active` - Activate/deactivate survey
- `GET /api/analytics/survey/:id` - Get survey statistics
- `GET /api/export/survey/:id/:format` - Export survey data

## Database Schema

The platform uses SQLite with a comprehensive schema including:

- **surveys** - Survey definitions
- **survey_sections** - Survey sections
- **questions** - Individual questions
- **question_options** - Answer choices
- **respondents** - Participant tracking
- **responses** - Survey responses
- **demographics** - Demographic data
- **admins** - Admin users
- **audit_logs** - System audit trail

See `database/schema.sql` for complete schema.

## Security

### Best Practices Implemented
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Rate limiting
- ✅ SQL injection prevention (prepared statements)
- ✅ XSS protection (Helmet.js)
- ✅ CORS configuration
- ✅ Session management
- ✅ Audit logging
- ✅ Input validation

### Production Checklist
- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET and SESSION_SECRET
- [ ] Configure proper CORS_ORIGIN
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure firewall
- [ ] Set up regular backups
- [ ] Monitor logs
- [ ] Implement rate limiting rules

## Data Export Formats

### CSV
Standard comma-separated values for Excel/SPSS

### XLSX
Microsoft Excel format with multiple sheets

### SPSS
SPSS-compatible format with:
- Data file
- Syntax file
- Codebook
- Variable labels

### JSON
Complete data structure in JSON format

### PDF
Summary reports with:
- Descriptive statistics
- Charts and visualizations
- Demographic breakdowns

## Support

For technical support or questions:
- Email: admin@patrimoine.gov.ma
- Repository issues: [GitHub/GitLab URL]

## License

MIT License - See LICENSE file for details

## Credits

Developed for:
**Direction du Patrimoine**
Ministère de la Jeunesse, de la Culture et de la Communication
Royaume du Maroc

---

**Version**: 1.0.0
**Last Updated**: 2024
