# API Documentation
## Moroccan Heritage Survey Platform API Reference

Version: 1.0.0  
Base URL: `http://localhost:3000/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Survey Management](#survey-management)
3. [Response Submission](#response-submission)
4. [Analytics](#analytics)
5. [Data Export](#data-export)
6. [Admin Operations](#admin-operations)
7. [Error Handling](#error-handling)

---

## Authentication

### Admin Login

**Endpoint:** `POST /api/auth/admin/login`

**Description:** Authenticate an administrator and receive a JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@patrimoine.gov.ma",
      "role": "super_admin"
    }
  }
}
```

**Status Codes:**
- `200 OK` - Successfully authenticated
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limit exceeded

---

### Get Current Admin User

**Endpoint:** `GET /api/auth/admin/me`

**Description:** Get information about the currently authenticated admin.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@patrimoine.gov.ma",
    "full_name": "System Administrator",
    "role": "super_admin",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Logout

**Endpoint:** `POST /api/auth/admin/logout`

**Description:** Logout and invalidate the current token.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Survey Management

### List All Surveys

**Endpoint:** `GET /api/survey`

**Description:** Get a list of all surveys (admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `inactive`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "surveys": [
      {
        "id": 1,
        "survey_code": "Q1_PRIMARY",
        "title_fr": "Questionnaire pour élèves de l'école primaire",
        "title_ar": "استبيان لطلاب المدرسة الابتدائية",
        "title_en": "Questionnaire for Primary School Students",
        "description_fr": "...",
        "is_active": true,
        "total_responses": 150,
        "completed_responses": 120,
        "completion_rate": 80.0,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 7,
      "total_pages": 1
    }
  }
}
```

---

### Get Survey Details (Public)

**Endpoint:** `GET /api/survey/public/:surveyCode`

**Description:** Get public survey structure (no authentication required).

**Parameters:**
- `surveyCode`: Survey code (e.g., `Q1_PRIMARY`)

**Query Parameters:**
- `lang` (optional): Language (`fr`, `ar`, `en`, default: `fr`)

**Response:**
```json
{
  "success": true,
  "data": {
    "survey": {
      "id": 1,
      "survey_code": "Q1_PRIMARY",
      "title": "Questionnaire pour élèves de l'école primaire",
      "description": "...",
      "estimated_time": 15,
      "is_active": true
    },
    "sections": [
      {
        "id": 1,
        "title": "Informations démographiques",
        "order_index": 1,
        "questions": [
          {
            "id": 1,
            "question_text": "Quel âge avez-vous?",
            "question_type": "single_choice",
            "is_required": true,
            "order_index": 1,
            "options": [
              {
                "id": 1,
                "option_text": "6-8 ans",
                "order_index": 1
              },
              {
                "id": 2,
                "option_text": "9-11 ans",
                "order_index": 2
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

### Toggle Survey Active Status

**Endpoint:** `PATCH /api/survey/:id/toggle-active`

**Description:** Activate or deactivate a survey (admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Parameters:**
- `id`: Survey ID

**Response:**
```json
{
  "success": true,
  "message": "Survey status updated",
  "data": {
    "is_active": false
  }
}
```

---

## Response Submission

### Start Survey Response

**Endpoint:** `POST /api/survey/public/:surveyCode/start`

**Description:** Initialize a new survey response session.

**Parameters:**
- `surveyCode`: Survey code (e.g., `Q1_PRIMARY`)

**Request Body:**
```json
{
  "demographics": {
    "age_group": "9-11 ans",
    "gender": "female",
    "location": "Rabat",
    "education_level": "primaire"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Survey session started",
  "data": {
    "respondent_id": "abc123def456",
    "survey_id": 1,
    "started_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Save Progress

**Endpoint:** `POST /api/survey/public/:surveyCode/save-progress`

**Description:** Save partial survey responses (allows continuation later).

**Parameters:**
- `surveyCode`: Survey code

**Request Body:**
```json
{
  "respondent_id": "abc123def456",
  "responses": [
    {
      "question_id": 1,
      "answer_text": "9-11 ans",
      "selected_option_ids": [2]
    },
    {
      "question_id": 2,
      "answer_text": "Oui",
      "selected_option_ids": [3]
    }
  ],
  "current_section": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Progress saved successfully",
  "data": {
    "resume_token": "xyz789abc123",
    "saved_responses": 2,
    "completion_percentage": 35.5
  }
}
```

---

### Submit Complete Survey

**Endpoint:** `POST /api/survey/public/:surveyCode/submit`

**Description:** Submit a completed survey response.

**Parameters:**
- `surveyCode`: Survey code

**Request Body:**
```json
{
  "respondent_id": "abc123def456",
  "responses": [
    {
      "question_id": 1,
      "answer_text": "9-11 ans",
      "selected_option_ids": [2]
    },
    {
      "question_id": 2,
      "answer_text": "Oui",
      "selected_option_ids": [3]
    }
  ],
  "completion_time_seconds": 450
}
```

**Response:**
```json
{
  "success": true,
  "message": "Survey submitted successfully",
  "data": {
    "response_id": 123,
    "submitted_at": "2024-01-15T10:45:00.000Z",
    "confirmation_code": "CONF-ABC123"
  }
}
```

**Status Codes:**
- `201 Created` - Successfully submitted
- `400 Bad Request` - Missing required responses
- `404 Not Found` - Survey not found or inactive
- `409 Conflict` - Response already submitted

---

## Analytics

### Get Survey Statistics

**Endpoint:** `GET /api/analytics/survey/:id`

**Description:** Get comprehensive statistics for a survey (admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Parameters:**
- `id`: Survey ID

**Query Parameters:**
- `start_date` (optional): Filter from date (ISO 8601)
- `end_date` (optional): Filter to date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "survey": {
      "id": 1,
      "survey_code": "Q1_PRIMARY",
      "title": "Questionnaire pour élèves de l'école primaire"
    },
    "statistics": {
      "total_responses": 150,
      "completed_responses": 120,
      "incomplete_responses": 30,
      "completion_rate": 80.0,
      "average_time_seconds": 420,
      "median_time_seconds": 390
    },
    "demographics": {
      "age_groups": {
        "6-8 ans": 60,
        "9-11 ans": 90
      },
      "gender": {
        "male": 75,
        "female": 75
      },
      "locations": {
        "Rabat": 50,
        "Casablanca": 40,
        "Fes": 30,
        "Other": 30
      }
    },
    "question_statistics": [
      {
        "question_id": 1,
        "question_text": "Quel âge avez-vous?",
        "question_type": "single_choice",
        "response_count": 150,
        "responses": {
          "6-8 ans": 60,
          "9-11 ans": 90
        }
      }
    ],
    "timeline": {
      "responses_by_day": [
        {
          "date": "2024-01-10",
          "count": 15
        },
        {
          "date": "2024-01-11",
          "count": 23
        }
      ]
    }
  }
}
```

---

### Get Dashboard Overview

**Endpoint:** `GET /api/analytics/dashboard`

**Description:** Get overview statistics for all surveys (admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_surveys": 7,
      "active_surveys": 5,
      "total_responses": 1250,
      "total_completed": 980,
      "overall_completion_rate": 78.4
    },
    "survey_summary": [
      {
        "survey_code": "Q1_PRIMARY",
        "title": "Questionnaire pour élèves de l'école primaire",
        "responses": 150,
        "completion_rate": 80.0,
        "is_active": true
      }
    ],
    "recent_activity": [
      {
        "timestamp": "2024-01-15T10:45:00.000Z",
        "survey_code": "Q1_PRIMARY",
        "action": "response_submitted"
      }
    ]
  }
}
```

---

## Data Export

### Export Survey Data

**Endpoint:** `GET /api/export/survey/:id/:format`

**Description:** Export survey responses in various formats (admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Parameters:**
- `id`: Survey ID
- `format`: Export format (`csv`, `xlsx`, `json`, `spss`, `pdf`)

**Query Parameters:**
- `start_date` (optional): Filter from date
- `end_date` (optional): Filter to date
- `include_incomplete` (optional): Include incomplete responses (default: false)
- `language` (optional): Export language (`fr`, `ar`, `en`, default: `fr`)

**Response:** File download (Content-Type varies by format)

**CSV Example:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="Q1_PRIMARY_responses_2024-01-15.csv"
```

**XLSX Example:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="Q1_PRIMARY_responses_2024-01-15.xlsx"
```

**JSON Example:**
```json
{
  "survey_code": "Q1_PRIMARY",
  "export_date": "2024-01-15T10:30:00.000Z",
  "total_responses": 150,
  "responses": [
    {
      "respondent_id": "abc123",
      "started_at": "2024-01-10T09:00:00.000Z",
      "completed_at": "2024-01-10T09:15:00.000Z",
      "duration_seconds": 450,
      "demographics": {
        "age_group": "9-11 ans",
        "gender": "female"
      },
      "answers": [
        {
          "question_id": 1,
          "question_text": "Quel âge avez-vous?",
          "answer": "9-11 ans"
        }
      ]
    }
  ]
}
```

---

### Generate QR Code

**Endpoint:** `GET /api/export/qr-code/:surveyCode`

**Description:** Generate QR code for survey access (admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Parameters:**
- `surveyCode`: Survey code

**Query Parameters:**
- `size` (optional): QR code size in pixels (default: 300)
- `format` (optional): Image format (`png`, `svg`, default: `png`)

**Response:**
```
Content-Type: image/png
Content-Disposition: attachment; filename="QR_Q1_PRIMARY.png"
```

---

## Admin Operations

### Get Audit Logs

**Endpoint:** `GET /api/admin/audit-logs`

**Description:** Retrieve system audit logs (admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)
- `action_type` (optional): Filter by action type
- `user_id` (optional): Filter by admin user ID
- `start_date` (optional): Filter from date
- `end_date` (optional): Filter to date

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "admin_id": 1,
        "admin_username": "admin",
        "action": "survey_toggled",
        "details": "Survey Q1_PRIMARY deactivated",
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 245,
      "total_pages": 5
    }
  }
}
```

---

### Create Admin User

**Endpoint:** `POST /api/admin/users`

**Description:** Create a new admin user (super admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "username": "newadmin",
  "password": "SecurePassword123!",
  "email": "newadmin@patrimoine.gov.ma",
  "full_name": "New Administrator",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "data": {
    "id": 2,
    "username": "newadmin",
    "email": "newadmin@patrimoine.gov.ma",
    "role": "admin",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Roles:**
- `super_admin`: Full access to all features
- `admin`: Survey and data management
- `analyst`: View and export data only

---

### Update Admin User

**Endpoint:** `PATCH /api/admin/users/:id`

**Description:** Update admin user information (super admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Parameters:**
- `id`: Admin user ID

**Request Body:**
```json
{
  "email": "updated@patrimoine.gov.ma",
  "full_name": "Updated Name",
  "role": "analyst"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin user updated successfully",
  "data": {
    "id": 2,
    "username": "newadmin",
    "email": "updated@patrimoine.gov.ma",
    "full_name": "Updated Name",
    "role": "analyst"
  }
}
```

---

### Change Password

**Endpoint:** `POST /api/admin/change-password`

**Description:** Change current admin user's password.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewSecurePassword456!",
  "confirm_password": "NewSecurePassword456!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### System Health Check

**Endpoint:** `GET /health`

**Description:** Check system health status (public endpoint).

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "connected",
      "response_time_ms": 2
    },
    "disk_space": {
      "status": "ok",
      "available_gb": 45.2,
      "usage_percentage": 55
    }
  },
  "server": {
    "uptime": 86400,
    "environment": "production",
    "version": "1.0.0"
  }
}
```

---

## Error Handling

### Error Response Format

All API errors follow this format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    "field": "specific_field",
    "reason": "Additional details"
  }
}
```

---

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

---

### Error Types

**Authentication Errors:**
```json
{
  "success": false,
  "error": "AuthenticationError",
  "message": "Invalid credentials"
}
```

**Validation Errors:**
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Required field missing",
  "details": {
    "field": "password",
    "reason": "Password must be at least 8 characters"
  }
}
```

**Not Found Errors:**
```json
{
  "success": false,
  "error": "NotFoundError",
  "message": "Survey not found"
}
```

**Rate Limit Errors:**
```json
{
  "success": false,
  "error": "RateLimitError",
  "message": "Too many requests. Please try again later.",
  "retry_after": 900
}
```

---

## Rate Limiting

### Default Limits

- **API Endpoints**: 100 requests per 15 minutes per IP
- **Auth Endpoints**: 5 requests per 15 minutes per IP
- **Export Endpoints**: 10 requests per hour per user

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705320000
```

---

## Authentication & Security

### JWT Token

- **Algorithm**: HS256
- **Expiration**: 24 hours
- **Refresh**: Not implemented (re-login required)

### Token Usage

Include in header:
```
Authorization: Bearer {your_jwt_token}
```

### Security Headers

All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

---

## Pagination

Paginated endpoints support:

**Request:**
```
GET /api/survey?page=2&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "surveys": [...],
    "pagination": {
      "page": 2,
      "limit": 20,
      "total": 50,
      "total_pages": 3,
      "has_next": true,
      "has_prev": true
    }
  }
}
```

---

## Examples

### JavaScript/Fetch Example

```javascript
// Login
const loginResponse = await fetch('http://localhost:3000/api/auth/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.data.token;

// Get surveys
const surveysResponse = await fetch('http://localhost:3000/api/survey', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const surveysData = await surveysResponse.json();
console.log(surveysData.data.surveys);
```

---

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Get Surveys:**
```bash
curl http://localhost:3000/api/survey \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Export Data:**
```bash
curl http://localhost:3000/api/export/survey/1/csv \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -o responses.csv
```

---

## Changelog

### Version 1.0.0 (2024)
- Initial API release
- Authentication endpoints
- Survey management
- Response submission
- Analytics endpoints
- Export functionality
- Admin operations

---

## Support

For API support:
- **Email**: api-support@patrimoine.gov.ma
- **Documentation**: http://localhost:3000/api/docs
- **Issues**: Report technical issues to development team

---

**Last Updated**: January 2024  
**API Version**: 1.0.0
