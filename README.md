# SherpaTech.AI - AI Readiness Assessment Bot

A production-ready web application that evaluates organizations across 5 strategic dimensions of AI readiness and generates personalized PDF reports with actionable recommendations.

**Live Demo:** https://claude-code-phi.vercel.app/assessment

## Features

- ✅ Interactive 20-question assessment
- ✅ Real-time scoring across 5 dimensions (Strategic Clarity, Team Capability, Governance Readiness, Technical Infrastructure, Executive Alignment)
- ✅ Beautiful data visualization (radar charts, progress bars)
- ✅ Automated PDF report generation
- ✅ Email delivery via Microsoft Graph
- ✅ HubSpot CRM integration for lead capture
- ✅ Fully responsive design
- ✅ Database persistence (PostgreSQL/Supabase)

## Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Recharts for data visualization

**Backend:**
- Vercel Serverless Functions (Node.js)
- PostgreSQL database (Supabase)
- Microsoft Graph API for email
- HubSpot API for CRM integration

**Key Libraries:**
- jsPDF for PDF generation
- @azure/identity for Azure authentication
- @microsoft/microsoft-graph-client for email sending

## Project Structure

```
/frontend           # React application
  /src
    /components     # Reusable UI components
    /pages          # Main page components
    /services       # API client
/api                # Serverless function endpoints (max 5 for Hobby plan)
  /_lib             # Shared utilities (not counted as functions)
```

## Database Schema

**Tables:**
- `assessments` - User info and overall scores
- `responses` - Individual question responses
- `assessment_results` - Calculated dimension scores

## Assessment Dimensions

Each dimension scored 0-20 points (100 total):

1. **Strategic Clarity** - AI strategy and vision alignment
2. **Team Capability** - Skills and readiness measurement
3. **Governance Readiness** - Compliance and risk management
4. **Technical Infrastructure** - Technology stack readiness
5. **Executive Alignment** - Leadership buy-in and sponsorship

**Readiness Phases:**
- 0-39: Foundation
- 40-59: Emerging
- 60-79: Activate
- 80-100: Scale

## Setup Instructions

### Prerequisites
- Node.js 18+
- Vercel account
- Supabase account
- Azure AD app (for email)
- HubSpot account (optional)

### Installation

1. Clone repository
```bash
git clone https://github.com/MarkMeyerson/ClaudeCode.git
cd ClaudeCode
```

2. Install dependencies
```bash
cd frontend && npm install
```

3. Set up environment variables (see `.env.example`)

4. Set up Supabase database (run SQL schema from `database/schema.sql`)

5. Configure Azure AD app for Microsoft Graph

6. Deploy to Vercel
```bash
vercel --prod
```

## Environment Variables

See `.env.example` and `BUILD_GUIDE.md` for required variables.

## API Endpoints

- `GET /api/get-questions` - Fetch assessment questions
- `POST /api/save-lead` - Save initial user info
- `POST /api/submit-assessment` - Submit responses and calculate scores
- `GET /api/get-results/:id` - Retrieve assessment results
- `POST /api/send-report` - Send email OR download PDF (use ?download=true)

## Development

```bash
# Start frontend dev server
cd frontend && npm run dev

# Test with Vercel CLI
vercel dev
```

## Deployment Notes

- **Vercel Hobby plan limit:** 12 serverless functions
- **Solution:** Use `api/_lib/` folder for helper code (not counted)
- **Database:** Uses transaction pooler (port 6543) for serverless compatibility

## Architecture Decisions

### Why Transaction Pooler?
Serverless functions need short-lived connections. Supabase transaction pooler (port 6543) handles this better than direct connections (port 5432).

### Why _lib Folder?
Vercel counts each file in `/api` as a function. Files in `/api/_lib/` (underscore prefix) are treated as utilities and don't count toward the 12-function limit.

### Why Consolidated Endpoints?
Originally had separate download-pdf endpoint. Consolidated into send-report with ?download=true to stay under function limit.

## Contributing

This is a private SherpaTech.AI project.

## License

Proprietary - SherpaTech.AI

## Support

- **Email:** info@sherpatech.ai
- **Website:** https://sherpatech.ai
- **Documentation:** See BUILD_GUIDE.md
