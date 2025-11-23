# AI Assessment Bot - Build Guide

## Project Structure
```
ClaudeCode/
├── api/                      # Vercel Serverless Functions (MAX 5 FILES)
│   ├── get-questions.ts      # Fetch assessment questions
│   ├── save-lead.ts          # Save initial user info
│   ├── submit-assessment.ts  # Submit responses & calculate scores
│   ├── get-results.ts        # Retrieve assessment results
│   ├── send-report.ts        # Send email OR download PDF (?download=true)
│   └── _lib/                 # Helper functions (NOT counted as functions)
│       ├── cors.ts
│       ├── db.ts
│       ├── emailTemplates.ts
│       ├── generatePDF.ts
│       ├── hubspot.ts
│       ├── microsoftGraph.ts
│       ├── questions.ts
│       └── scoring.ts
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   ├── package.json
│   └── dist/                 # Build output
├── vercel.json              # Deployment configuration
└── BUILD_GUIDE.md           # This file
```

## Critical Build Configuration

### vercel.json (MUST MATCH EXACTLY)
```json
{
  "buildCommand": "cd frontend && npm ci && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": null,
  "installCommand": "cd frontend && npm ci",
  "functions": {
    "api/*.ts": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

### Why This Configuration Works
- **buildCommand**: Only builds frontend (no root build needed)
- **outputDirectory**: Points to Vite's output directory
- **framework**: Set to null (we handle build manually)
- **installCommand**: Only installs frontend dependencies
- **functions**: Configures API timeout
- **rewrites**: Routes /api requests correctly

## Environment Variables (Set in Vercel Dashboard)

### Database
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.woyiceldsaqpmsruzauh.supabase.co:6543/postgres
```
**Important:**
- Use port **6543** (transaction pooler for serverless)
- URL-encode special characters in password (@→%40, #→%23, etc.)

### Microsoft Graph (Email)
```bash
AZURE_TENANT_ID=[your-tenant-id]
AZURE_CLIENT_ID=[your-client-id]
AZURE_CLIENT_SECRET=[your-client-secret]
M365_SENDER_EMAIL=info@sherpatech.ai
```

### HubSpot CRM
```bash
HUBSPOT_API_KEY=[your-api-key]
```

## Common Mistakes to AVOID

### ❌ DON'T DO THIS:
1. Add more than 5 files in `/api` folder (causes 12-function limit error)
2. Run `npm ci` in root directory (no root package.json needed)
3. Use port 5432 for database (use 6543 transaction pooler)
4. Forget to URL-encode special characters in DATABASE_URL
5. Create new branches (always work on main)
6. Add separate download-pdf endpoint (use ?download=true on send-report)

### ✅ DO THIS:
1. Keep all helper code in `/api/_lib/` (underscore prefix = not counted)
2. Only build frontend: `cd frontend && npm run build`
3. Use transaction pooler on port 6543
4. URL-encode passwords with special characters
5. Work directly on main branch
6. Use query parameters to extend existing endpoints

## Deployment Checklist

Before pushing to production:
- [ ] Only 5 files in `/api` directory (check with `ls api/*.ts`)
- [ ] All helpers in `/api/_lib/` directory
- [ ] vercel.json matches the template above EXACTLY
- [ ] All environment variables set in Vercel dashboard
- [ ] Database URL uses port 6543 (transaction pooler)
- [ ] Special characters in password are URL-encoded
- [ ] Frontend builds locally: `cd frontend && npm run build`
- [ ] No root package.json (frontend/package.json only)

## Testing Locally

```bash
# Install frontend dependencies
cd frontend && npm install

# Run frontend dev server
npm run dev

# Test API endpoints (requires Vercel CLI)
vercel dev
```

## Troubleshooting

### Build fails with "Command exited with 127"
- Check vercel.json buildCommand is correct
- Ensure no root package.json or wrong build script

### "No more than 12 Serverless Functions" error
- Count files in /api: should be MAX 5
- Move helpers to /api/_lib/

### Database connection fails
- Verify DATABASE_URL uses port 6543
- Check password special characters are URL-encoded
- Test connection from Supabase dashboard

### Email delivery fails
- Verify all 4 Azure environment variables are set
- Check Azure AD app has Mail.Send permission
- Confirm M365_SENDER_EMAIL is correct

## Success Criteria

When everything works correctly:
- ✅ Frontend loads at https://claude-code-phi.vercel.app/assessment
- ✅ Assessment can be completed without errors
- ✅ Results display with correct dimension scores
- ✅ PDF download works
- ✅ Email arrives with PDF attachment
- ✅ HubSpot contact created with scores
- ✅ All data saved to Supabase database

---

**This is the authoritative build guide. Refer to this document for ALL build and deployment questions.**
