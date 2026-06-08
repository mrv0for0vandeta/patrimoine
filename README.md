<div align="center">

# 🏛️ Moroccan Heritage Survey Platform

### *Plateforme Nationale d'Enquête sur le Patrimoine Culturel Marocain*

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/BNAHJz?referralCode=alphasec)

[![Node.js](https://img.shields.io/badge/Node.js-16.x+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Production-ready academic survey data collection and analysis platform**

[🚀 Quick Start](#-quick-start) • [📚 Documentation](#-documentation) • [🎯 Features](#-features) • [🔧 Installation](#-installation) • [🌐 API](#-api-documentation)

---

</div>

## 📋 Overview

A comprehensive survey platform developed for the **Direction du Patrimoine**, *Ministère de la Jeunesse, de la Culture et de la Communication, Royaume du Maroc*, to conduct national surveys on Moroccan cultural heritage awareness and engagement.

### 📊 Seven Specialized Surveys

| Survey Code | Target Audience | Status |
|------------|-----------------|--------|
| **Q1_PRIMARY** | 🎒 Primary School Students | ✅ Active |
| **Q2_COLLEGE** | 📚 Middle School Students | ✅ Active |
| **Q3_LYCEE** | 🎓 High School Students | ✅ Active |
| **Q4_UNIV** | 🏫 University Students | ✅ Active |
| **Q5_PUBLIC** | 👥 General Public | ✅ Active |
| **Q6_MINISTRY** | 🏛️ Ministry Employees | ✅ Active |
| **Q7_HERITAGE_STUDENTS** | 🏺 Heritage Studies Students | ✅ Active |

---

## 🎯 Features

<table>
<tr>
<td width="50%">

### 👤 For Participants

- 🌍 **Multi-language Support**
  - Arabic (RTL support)
  - French
  - English
- 📱 **Responsive Design**
  - Mobile optimized
  - Tablet friendly
  - Desktop ready
- 💾 **Save & Continue**
  - Progress tracking
  - Resume later
- 🔒 **Privacy First**
  - Anonymous participation
  - Secure data submission
- ⚡ **PWA Support**
  - Offline functionality
  - Install as app

</td>
<td width="50%">

### 👨‍💼 For Administrators

- 📊 **Advanced Analytics**
  - Real-time dashboards
  - Visual data reports
  - Demographic filtering
- 📤 **Multiple Export Formats**
  - CSV, XLSX, JSON
  - SPSS compatible
  - PDF reports
- 🔐 **Security Features**
  - JWT authentication
  - Role-based access
  - Audit logging
- 🎨 **Survey Management**
  - Activate/Deactivate
  - QR code generation
  - Response monitoring

</td>
</tr>
</table>

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/mrv0for0vandeta/patrimoine.git
cd patrimoine

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and update credentials

# Initialize database
npm run init-db

# Seed survey data
npm run seed

# Start the server
npm start
```

**🌐 Access the platform:**
- **Public**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **Default login**: `admin` / `admin123` ⚠️ *Change immediately!*

---

## 🔧 Installation

### Prerequisites

- **Node.js** `>= 16.0.0`
- **npm** `>= 8.0.0`

### Verification

```bash
node --version  # Should be v16.x or higher
npm --version   # Should be v8.x or higher
```

### Step-by-Step Setup

#### 1️⃣ Install Dependencies

```bash
npm install
```

#### 2️⃣ Environment Configuration

Create `.env` file from template:

```bash
cp .env.example .env
```

**Critical settings to update:**

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Security (⚠️ CHANGE THESE!)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
SESSION_SECRET=your_super_secret_session_key_minimum_32_characters

# Admin Account (⚠️ CHANGE THESE!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
ADMIN_EMAIL=your_email@example.com

# Database
DATABASE_PATH=./data/survey_platform.db

# CORS
CORS_ORIGIN=*
```

#### 3️⃣ Database Initialization

```bash
npm run init-db
```

**Expected output:**
```
✓ Database connection established
✓ Database schema created
✓ Default admin user created
```

#### 4️⃣ Seed Survey Data

```bash
npm run seed
```

**Expected output:**
```
✓ Survey 1/7: Q1_PRIMARY created (27 questions)
✓ Survey 2/7: Q2_COLLEGE created (42 questions)
...
✓ All 7 surveys created successfully
```

#### 5️⃣ Run System Tests

```bash
node test-system.js
```

#### 6️⃣ Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

---

## 📁 Project Structure

```
patrimoine/
├── 📂 backend/
│   ├── server.js                    # Main Express server
│   ├── 📂 routes/
│   │   ├── auth.js                  # Authentication endpoints
│   │   ├── survey.js                # Survey CRUD operations
│   │   ├── analytics.js             # Data analytics & statistics
│   │   ├── export.js                # Data export (CSV, XLSX, etc.)
│   │   └── admin.js                 # Admin management
│   ├── 📂 middleware/
│   │   ├── auth.js                  # JWT authentication
│   │   ├── errorHandler.js          # Global error handling
│   │   └── logger.js                # Request logging
│   └── 📂 utils/
│       ├── database-sqlite3.js      # Database connection manager
│       ├── init-database.js         # Database initialization
│       ├── seed-surveys.js          # Survey data seeding
│       └── backup.js                # Backup utilities
├── 📂 frontend/
│   ├── index.html                   # Landing page
│   ├── survey.html                  # Survey interface
│   ├── 📂 admin/
│   │   └── index.html               # Admin dashboard
│   ├── 📂 js/
│   │   ├── survey-engine.js         # Survey rendering logic
│   │   ├── api-client.js            # API communication
│   │   ├── admin.js                 # Admin panel logic
│   │   └── offline-manager.js       # PWA offline support
│   ├── 📂 css/
│   │   ├── main.css                 # Global styles
│   │   ├── survey.css               # Survey page styles
│   │   └── admin.css                # Admin panel styles
│   ├── service-worker.js            # PWA service worker
│   └── manifest.json                # PWA manifest
├── 📂 database/
│   ├── schema.sql                   # Complete database schema
│   └── schema-simple.sql            # Simplified schema
├── 📂 survey-data/
│   ├── Q1_PRIMARY.json              # Primary school survey
│   ├── Q2_COLLEGE.json              # Middle school survey
│   ├── Q3_LYCEE.json                # High school survey
│   ├── Q4_UNIV.json                 # University survey
│   ├── Q5_PUBLIC.json               # Public survey
│   ├── Q6_MINISTRY.json             # Ministry survey
│   └── Q7_HERITAGE_STUDENTS.json    # Heritage students survey
├── 📂 docs/
│   └── API_DOCUMENTATION.md         # Complete API reference
├── 📂 data/                         # 🔒 Generated at runtime
│   └── survey_platform.db           # SQLite database
├── 📂 logs/                         # 🔒 Generated at runtime
│   ├── access.log                   # Access logs
│   └── error.log                    # Error logs
├── 📂 backups/                      # 🔒 Generated at runtime
├── 📂 exports/                      # 🔒 Generated at runtime
├── 📂 qr-codes/                     # 🔒 Generated at runtime
├── .env                             # Environment configuration
├── .env.example                     # Environment template
├── package.json                     # Dependencies
└── README.md                        # This file
```

---

## 🌐 API Documentation

### 🔓 Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/survey/public/:surveyCode` | Get survey structure |
| `POST` | `/api/survey/public/:surveyCode/start` | Start new response |
| `POST` | `/api/survey/public/:surveyCode/submit` | Submit completed survey |
| `POST` | `/api/survey/public/:surveyCode/save-progress` | Save partial progress |

### 🔐 Admin Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/admin/login` | Admin authentication |
| `GET` | `/api/auth/admin/me` | Get current user info |
| `GET` | `/api/survey` | List all surveys |
| `PATCH` | `/api/survey/:id/toggle-active` | Toggle survey status |
| `GET` | `/api/analytics/survey/:id` | Get survey statistics |
| `GET` | `/api/analytics/dashboard` | Dashboard overview |
| `GET` | `/api/export/survey/:id/:format` | Export data (csv/xlsx/json/spss) |
| `GET` | `/api/export/qr-code/:surveyCode` | Generate QR code |
| `GET` | `/api/admin/audit-logs` | System audit logs |

**📖 Full API documentation:** [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)

---

## 🗄️ Database Schema

**Main Tables:**
- `surveys` - Survey definitions
- `survey_sections` - Survey sections/pages
- `questions` - Individual questions
- `question_options` - Answer choices
- `respondents` - Participant sessions
- `responses` - Survey answers
- `demographics` - Demographic data
- `admins` - Administrator accounts
- `audit_logs` - System activity tracking

---

## 🔒 Security

### ✅ Implemented Security Measures

- 🔐 **Password Hashing**: bcrypt with salt rounds
- 🎫 **JWT Authentication**: HS256 algorithm
- 🚦 **Rate Limiting**: IP-based throttling
- 🛡️ **SQL Injection Prevention**: Parameterized queries
- 🔒 **XSS Protection**: Helmet.js security headers
- 🌐 **CORS Configuration**: Configurable origins
- 📝 **Audit Logging**: Complete activity tracking
- ✔️ **Input Validation**: Server-side validation

### 🔐 Production Security Checklist

- [ ] Change default admin credentials
- [ ] Generate strong `JWT_SECRET` (32+ characters)
- [ ] Generate strong `SESSION_SECRET` (32+ characters)
- [ ] Configure specific `CORS_ORIGIN`
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Enable log monitoring
- [ ] Implement IP whitelisting for admin

---

## 📊 Data Export Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| **CSV** | Comma-separated values | Excel, basic analysis |
| **XLSX** | Microsoft Excel | Advanced Excel features |
| **JSON** | JavaScript Object Notation | API integration, programming |
| **SPSS** | SPSS-compatible format | Statistical analysis |
| **PDF** | Formatted reports | Presentation, printing |

---

## 🧪 Testing

### Run System Tests

```bash
node test-system.js
```

**Test Coverage:**
- ✅ Database connectivity
- ✅ Survey data integrity
- ✅ Question and option counts
- ✅ Admin user verification
- ✅ File structure validation
- ✅ Database size check

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [`ADMIN_GUIDE.md`](ADMIN_GUIDE.md) | Administrator's guide |
| [`USER_GUIDE.md`](USER_GUIDE.md) | Participant's guide |
| [`INSTALLATION.md`](INSTALLATION.md) | Detailed installation steps |
| [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) | Complete API reference |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Production deployment guide |

---

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production

```bash
# Set production environment
export NODE_ENV=production

# Start server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start backend/server.js --name patrimoine-survey
```

### Docker (Coming Soon)

```bash
docker build -t patrimoine-survey .
docker run -p 3000:3000 patrimoine-survey
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🏛️ Credits

### Developed For

**Direction du Patrimoine**  
*Ministère de la Jeunesse, de la Culture et de la Communication*  
*Royaume du Maroc* 🇲🇦

### Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: JWT, bcrypt
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Security**: Helmet.js, express-rate-limit
- **Export**: XLSX, JSON2CSV, QRCode
- **PWA**: Service Workers, Web App Manifest

---

## 📞 Support

### Contact

- 📧 **Email**: admin@patrimoine.gov.ma
- 🐛 **Issues**: [GitHub Issues](https://github.com/mrv0for0vandeta/patrimoine/issues)
- 📖 **Documentation**: [Wiki](https://github.com/mrv0for0vandeta/patrimoine/wiki)

### Office Hours

**Monday - Friday**: 9:00 AM - 5:00 PM (GMT+1)  
**Emergency Support**: Available for critical issues

---

## 📈 Statistics

```
📊 Total Surveys: 7
📝 Total Questions: 364
📋 Total Options: 1,702
🔧 Total Sections: 57
👥 Target Audience: Students, Public, Ministry Staff
🌍 Languages: 3 (French, Arabic, English)
```

---

## 🎯 Roadmap

- [x] Core survey engine
- [x] Multi-language support
- [x] Admin dashboard
- [x] Data export functionality
- [x] PWA support
- [ ] Email notifications
- [ ] Advanced reporting
- [ ] Mobile app (React Native)
- [ ] Real-time collaboration
- [ ] AI-powered insights

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Made with ❤️ for Moroccan Cultural Heritage**

[![GitHub stars](https://img.shields.io/github/stars/mrv0for0vandeta/patrimoine?style=social)](https://github.com/mrv0for0vandeta/patrimoine/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/mrv0for0vandeta/patrimoine?style=social)](https://github.com/mrv0for0vandeta/patrimoine/network/members)

---

**Version 1.0.0** | **Last Updated: 2024**

</div>
