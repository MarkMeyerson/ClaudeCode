# SherpaTech.AI - AI Readiness Assessment Bot

A comprehensive web application that assesses SMBs' readiness for AI transformation and generates personalized reports with service recommendations. This is a lead-generation tool designed to educate prospects while qualifying them for SherpaTech.AI services.

## 🎯 Project Overview

This application provides:
- **Interactive Assessment**: 5-dimension assessment covering Strategic Clarity, Governance Readiness, Team Capability, Technical Infrastructure, and Executive Alignment
- **Intelligent Scoring**: Multi-dimensional scoring system (0-100 points) with 6A phase mapping
- **Personalized Reports**: On-screen results with charts, downloadable PDFs, and email delivery
- **CRM Integration**: Automatic lead sync to HubSpot with assessment data
- **Professional UI**: Modern, responsive React interface with Tailwind CSS

## 📊 Assessment Framework

### 5-Dimension Scoring System

Each dimension is worth 0-20 points (total: 0-100):

1. **Strategic Clarity (0-20)**: AI strategy, use cases, ownership, and measurable outcomes
2. **Governance Readiness (0-20)**: Compliance, data policies, ethics, and budget
3. **Team Capability (0-20)**: Skills, learning readiness, dedicated resources, and change management
4. **Technical Infrastructure (0-20)**: Data consolidation, modern systems, APIs, and scalability
5. **Executive Alignment (0-20)**: Leadership buy-in, budget approval, stakeholder alignment, and sponsorship

### 6A Phase Mapping

Based on total score (0-100):

- **Pre-Assess** (0-15): Building awareness and exploring possibilities
- **Assess** (15-30): Assessment and strategic planning phase
- **Align** (30-45): Stakeholder alignment and resource planning
- **Activate** (45-60): Pilot projects and capability building
- **Accelerate** (60-75): Scaling successful initiatives
- **Apply** (75-85): Enterprise integration and optimization
- **Amplify** (85-100): Innovation and competitive differentiation

## 🛠️ Technical Stack

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Integrations**:
  - HubSpot API (CRM sync)
  - Nodemailer/SendGrid (Email delivery)
  - PDFKit (PDF report generation)
- **Security**: Helmet, CORS, Rate limiting

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Routing**: React Router v6
- **UI Components**: Headless UI, Heroicons

## 📁 Project Structure

```
ClaudeCode/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── questions.ts          # Assessment questions configuration
│   │   ├── database/
│   │   │   ├── db.ts                 # PostgreSQL connection
│   │   │   └── schema.sql            # Database schema
│   │   ├── routes/
│   │   │   └── assessment.ts         # API routes
│   │   ├── services/
│   │   │   ├── email.ts              # Email service
│   │   │   ├── hubspot.ts            # HubSpot integration
│   │   │   ├── pdf.ts                # PDF generation
│   │   │   └── scoring.ts            # Scoring logic
│   │   └── server.ts                 # Express server
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── WelcomePage.tsx       # Initial form
    │   │   ├── AssessmentPage.tsx    # Question flow
    │   │   └── ResultsPage.tsx       # Results & charts
    │   ├── services/
    │   │   └── api.ts                # API client
    │   ├── App.tsx                   # Main app component
    │   ├── main.tsx                  # Entry point
    │   └── index.css                 # Global styles
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── .env.example
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- HubSpot account with API key (optional)
- SMTP credentials for email (Gmail, SendGrid, etc.)

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb ai_assessment

# Or using psql
psql -U postgres
CREATE DATABASE ai_assessment;
\q

# Run schema migration
psql -U postgres -d ai_assessment -f backend/src/database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Configure your .env file:**

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_assessment
DB_USER=postgres
DB_PASSWORD=your_password

# HubSpot API Configuration (optional)
HUBSPOT_API_KEY=your_hubspot_api_key

# Email Configuration (Gmail example)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM="SherpaTech.AI" <hello@sherpatech.ai>
```

**Start the backend:**

```bash
# Development mode with auto-reload
npm run dev

# Production build
npm run build
npm start
```

The backend API will be available at `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🔧 Configuration

### HubSpot Integration

To enable HubSpot integration, you need to:

1. Get your HubSpot API key from your account settings
2. Create custom properties in HubSpot:
   - `ai_readiness_score` (Number)
   - `ai_readiness_phase` (Text)
   - `strategic_clarity_score` (Number)
   - `governance_readiness_score` (Number)
   - `team_capability_score` (Number)
   - `technical_infrastructure_score` (Number)
   - `executive_alignment_score` (Number)
   - `assessment_completed_date` (Date)

3. Add your API key to the `.env` file

### Email Configuration

#### Option 1: Gmail

1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in your `.env` file

#### Option 2: SendGrid

1. Create a SendGrid account and get an API key
2. Update your `.env` file:
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
```

## 📡 API Endpoints

### Health Checks
- `GET /health` - Server health check
- `GET /health/db` - Database health check

### Assessment Endpoints
- `GET /api/assessment/questions` - Get all assessment questions
- `POST /api/assessment/start` - Start new assessment
- `POST /api/assessment/:id/submit` - Submit assessment responses
- `GET /api/assessment/:id/results` - Get assessment results
- `GET /api/assessment/:id/pdf` - Download PDF report

## 🎨 User Flow

1. **Welcome Page** (`/assessment`)
   - User enters company information
   - Creates assessment record in database

2. **Assessment Page** (`/assessment/questions`)
   - User answers 20 questions across 5 dimensions
   - Progress bar shows completion status
   - Can navigate back to previous questions

3. **Results Page** (`/assessment/results/:id`)
   - Displays overall score and 6A phase
   - Shows dimension breakdown with charts
   - Provides personalized recommendations
   - Offers PDF download and consultation booking
   - Email report sent automatically

## 📊 Database Schema

### Tables

**assessments**
- Stores assessment metadata and scores
- Links to responses via foreign key
- Tracks HubSpot sync and email delivery status

**responses**
- Stores individual question responses
- Linked to assessments table
- Includes dimension, question, and answer data

**Views**
- `assessment_summary` - Aggregated assessment data

## 🔒 Security Features

- Helmet.js for HTTP headers security
- CORS configuration for cross-origin requests
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- Environment variable protection
- Secure database connections

## 🚢 Deployment

### Backend Deployment

**Recommended platforms**: Heroku, Railway, Render, AWS Elastic Beanstalk

```bash
# Build the backend
cd backend
npm run build

# Set environment variables in your platform
# Deploy the dist/ folder
```

### Frontend Deployment

**Recommended platforms**: Vercel, Netlify, AWS Amplify

```bash
# Build the frontend
cd frontend
npm run build

# Deploy the dist/ folder
```

### Database Deployment

**Recommended platforms**:
- AWS RDS (PostgreSQL)
- Heroku Postgres
- Supabase
- Railway

## 📧 Email Templates

The email template includes:
- Personalized greeting with company name
- Overall score and phase badge
- Dimension breakdown table with progress bars
- Personalized recommendations
- Call-to-action for consultation
- Professional branding

## 📄 PDF Report Structure

1. **Cover Page**: Company name, score, and branding
2. **Executive Summary**: Score card, phase, and description
3. **Dimension Breakdown**: Detailed scores with visual progress bars
4. **Recommendations**: Actionable next steps
5. **Call to Action**: Contact information and scheduling

## 🧪 Testing

### Test the Backend

```bash
# Check server health
curl http://localhost:3001/health

# Get questions
curl http://localhost:3001/api/assessment/questions

# Test database connection
curl http://localhost:3001/health/db
```

### Test the Frontend

1. Open `http://localhost:3000`
2. Fill in the welcome form
3. Complete the assessment
4. View results and download PDF

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env` file
- Ensure database exists: `psql -l`

### Email Not Sending
- Verify SMTP credentials
- Check spam folder
- Enable "Less secure apps" for Gmail (or use App Password)
- Check email service logs in backend console

### HubSpot Sync Failing
- Verify API key is valid
- Ensure custom properties exist in HubSpot
- Check backend logs for error messages

### PDF Not Generating
- Ensure PDFKit is installed: `npm list pdfkit`
- Check file permissions for temp directory
- Verify backend logs for errors

## 🎯 Next Steps & Enhancements

### Phase 2 Features
- Discord bot integration
- Slack bot integration
- Email-based assessment
- Multi-language support
- Advanced analytics dashboard
- A/B testing capabilities
- Custom branding per client

### Improvements
- Add authentication for viewing past results
- Implement assessment versioning
- Add comparison with industry benchmarks
- Create admin dashboard for managing assessments
- Add more visualization options
- Implement progressive web app (PWA)

## 📞 Support

For questions or issues:
- Email: hello@sherpatech.ai
- Website: https://sherpatech.ai

## 📝 License

Copyright © 2024 SherpaTech.AI. All rights reserved.

---

Built with ❤️ by SherpaTech.AI
