# AI Readiness Assessment API - Serverless Functions

This directory contains Vercel serverless functions for the AI Readiness Assessment Bot backend.

## Architecture

The backend has been converted from Express.js to Vercel serverless functions for production deployment. Each API endpoint is now a separate serverless function.

## API Endpoints

### 1. Get Questions
- **Endpoint**: `GET /api/assessment/questions`
- **File**: `/api/get-questions.ts`
- **Description**: Retrieves all assessment questions grouped by dimensions
- **Response**: Returns assessment dimensions and total question count

### 2. Save Lead (Start Assessment)
- **Endpoint**: `POST /api/assessment/start`
- **File**: `/api/save-lead.ts`
- **Description**: Creates a new assessment and saves lead information
- **Request Body**:
  ```json
  {
    "companyName": "string",
    "contactName": "string",
    "email": "string",
    "phone": "string (optional)",
    "companySize": "string (optional)",
    "industry": "string (optional)"
  }
  ```
- **Response**: Returns assessment ID and creation timestamp

### 3. Submit Assessment
- **Endpoint**: `POST /api/assessment/:id/submit`
- **File**: `/api/submit-assessment.ts`
- **Description**: Submits assessment responses and calculates scores
- **Request Body**:
  ```json
  {
    "responses": [
      {
        "questionId": "string",
        "dimension": "string",
        "questionText": "string",
        "answerValue": "number",
        "answerText": "string (optional)"
      }
    ]
  }
  ```
- **Response**: Returns assessment ID and calculated score

### 4. Get Results
- **Endpoint**: `GET /api/assessment/:id/results`
- **File**: `/api/get-results.ts`
- **Description**: Retrieves completed assessment results
- **Response**: Returns assessment details, scores, and all responses

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Database - Use either DATABASE_URL or individual credentials
DATABASE_URL=postgresql://user:password@host:5432/database

# Alternative individual credentials
DB_HOST=your_host
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
DB_SSL=true

# Environment
NODE_ENV=production
```

## Database Connection

The serverless functions use PostgreSQL connection pooling optimized for serverless environments:
- Single connection per function instance
- Automatic connection reuse
- SSL support for Supabase and other cloud providers
- 10-second idle timeout
- 5-second connection timeout

## CORS Configuration

CORS is handled in each function with support for:
- Production frontend: `https://staireadiasses.vercel.app`
- Local development: `http://localhost:5173` and `http://localhost:3000`
- Preflight OPTIONS requests

## Deployment

### Vercel Deployment

1. Ensure environment variables are set in Vercel dashboard
2. Deploy using:
   ```bash
   npm run deploy
   ```

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Run local development server:
   ```bash
   npm run dev
   ```

## Frontend Integration

The frontend is already configured to use these endpoints. No changes required to the frontend code.

The `VITE_API_URL` in the frontend should be set to your Vercel deployment URL (e.g., `https://your-app.vercel.app`).

## Migration Notes

- HubSpot sync and email notifications have been temporarily disabled in the serverless version
- These can be re-implemented as separate background jobs or webhook handlers
- PDF generation has been omitted for now but can be added as needed
- All core assessment functionality is preserved

## TypeScript

The project uses TypeScript for type safety. To check for type errors:

```bash
npm run build
```

## File Structure

```
/api
  /lib
    cors.ts         - CORS handling utilities
    db.ts           - Database connection and query helpers
    questions.ts    - Assessment questions configuration
    scoring.ts      - Score calculation logic
  get-questions.ts  - Questions endpoint
  save-lead.ts      - Lead/assessment creation endpoint
  submit-assessment.ts - Assessment submission endpoint
  get-results.ts    - Results retrieval endpoint
```
