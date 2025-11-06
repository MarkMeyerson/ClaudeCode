# SherpaTech.AI - AI Readiness Assessment Bot

A comprehensive lead-generation web application that assesses SMBs' readiness for AI transformation and generates personalized reports with service recommendations.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- SMTP credentials (Gmail, SendGrid, etc.)
- HubSpot API key (optional)

### Setup

1. **Database Setup**
```bash
createdb ai_assessment
psql -U postgres -d ai_assessment -f backend/src/database/schema.sql
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Features

- **5-Dimension Assessment**: Strategic Clarity, Governance, Team Capability, Infrastructure, Executive Alignment
- **Intelligent Scoring**: 0-100 point system with 6A phase mapping (Pre-Assess → Amplify)
- **Beautiful Reports**: Interactive charts, downloadable PDFs, email delivery
- **HubSpot Integration**: Automatic lead sync with assessment data
- **Modern UI**: React + TypeScript + Tailwind CSS

## Documentation

For complete documentation, see [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)

## Project Structure

```
├── backend/          # Node.js/Express API
│   ├── src/
│   │   ├── config/      # Assessment questions
│   │   ├── database/    # PostgreSQL setup
│   │   ├── routes/      # API endpoints
│   │   └── services/    # Business logic
│   └── package.json
│
└── frontend/         # React application
    ├── src/
    │   ├── pages/       # UI pages
    │   └── services/    # API client
    └── package.json
```

## License

Copyright © 2024 SherpaTech.AI. All rights reserved.
