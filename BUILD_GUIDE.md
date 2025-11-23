# Build Guide - AI Readiness Assessment

## SINGLE SOURCE OF TRUTH FOR BUILD CONFIGURATION

**This document defines the correct build setup. DO NOT modify build commands without consulting this guide.**

---

## 1. Project Structure

```
/
├── api/                    # Vercel serverless functions (MAX 5 files)
│   ├── send-report.ts     # Email & PDF download endpoint
│   ├── get-questions.ts   # Assessment questions endpoint
│   ├── save-lead.ts       # Lead capture endpoint
│   └── _lib/              # Helper functions (NOT counted as serverless functions)
│       ├── cors.ts
│       ├── generatePDF.ts
│       ├── microsoftGraph.ts
│       └── hubspot.ts
│
├── frontend/              # React app (TypeScript + Vite)
│   ├── src/
│   ├── package.json       # Frontend dependencies
│   ├── package-lock.json  # Frontend lockfile (MUST be committed)
│   └── vite.config.ts
│
├── package.json           # Root package.json (for API dependencies)
├── vercel.json            # Vercel configuration (see below)
└── BUILD_GUIDE.md         # This file
```

**Important:**
- `/api` folder can contain MAX 5 serverless function files (Vercel free tier limit: 12)
- Helper functions go in `/api/_lib` (underscore prefix = not counted as serverless)
- Frontend is a separate React + Vite app

---

## 2. Correct vercel.json Configuration

### REQUIRED Configuration (SINGLE SOURCE OF TRUTH)

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": null,
  "installCommand": "cd frontend && npm ci",
  "env": {
    "NODE_ENV": "production"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/assessment/questions",
      "destination": "/api/get-questions"
    },
    {
      "source": "/api/assessment/start",
      "destination": "/api/save-lead"
    },
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

### Why These Settings?

- **`buildCommand`**: Only builds frontend (serverless functions auto-deploy)
  - `cd frontend` - Navigate to frontend directory
  - `npm run build` - Runs Vite build (dependencies already installed by installCommand)

- **`outputDirectory`**: `frontend/dist` - Where Vite outputs built files

- **`framework: null`**: Disables Vercel's framework auto-detection
  - Prevents Vercel from guessing wrong build commands
  - We explicitly control the build process

- **`installCommand`**: Install frontend dependencies separately
  - Runs before buildCommand
  - Ensures reproducible builds with package-lock.json

---

## 3. Environment Variables Required

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**

### Database
- **`DATABASE_URL`** - PostgreSQL connection string
  - Format: `postgres://user:password@host:6543/database?sslmode=require`
  - **IMPORTANT:** Use port `6543` (transaction pooler), NOT `5432`
  - **IMPORTANT:** URL-encode special characters in password (e.g., `@` → `%40`)

### Microsoft 365 / Azure AD (Email Sending)
- **`AZURE_TENANT_ID`** - Azure AD tenant ID
- **`AZURE_CLIENT_ID`** - Azure app client ID
- **`AZURE_CLIENT_SECRET`** - Azure app secret
- **`M365_SENDER_EMAIL`** - Email address to send from (e.g., `noreply@sherpatech.ai`)

### HubSpot CRM (Optional)
- **`HUBSPOT_API_KEY`** - HubSpot API key for lead capture

### Example `.env` (Local Development Only - DO NOT COMMIT)

```bash
DATABASE_URL=postgres://user:password@localhost:6543/ai_readiness?sslmode=require
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
M365_SENDER_EMAIL=noreply@sherpatech.ai
HUBSPOT_API_KEY=your-hubspot-key
```

---

## 4. Common Mistakes to Avoid

### ❌ MISTAKE 1: Running npm ci in buildCommand
```json
// WRONG - Don't do this:
"buildCommand": "cd frontend && npm ci && npm run build"
```
**Why:** installCommand already runs npm ci. Running it twice is redundant and can cause issues.
**Fix:** buildCommand should only run `npm run build`.

### ❌ MISTAKE 2: Adding more than 5 files in /api folder
```
api/
├── endpoint1.ts
├── endpoint2.ts
├── endpoint3.ts
├── endpoint4.ts
├── endpoint5.ts
├── endpoint6.ts  ❌ TOO MANY!
```
**Why:** Vercel free tier has 12 serverless function limit.
**Fix:** Move helper functions to `api/_lib/` (underscore prefix = not counted).

### ❌ MISTAKE 3: Forgetting to URL-encode DATABASE_URL
```bash
# WRONG:
DATABASE_URL=postgres://user:p@ssw0rd!@host:5432/db

# CORRECT:
DATABASE_URL=postgres://user:p%40ssw0rd%21@host:6543/db
```
**Why:** Special characters break connection string parsing.
**Fix:** URL-encode: `@` → `%40`, `!` → `%21`, etc.

### ❌ MISTAKE 4: Using port 5432 instead of 6543
```bash
# WRONG (direct connection):
DATABASE_URL=postgres://user:pass@host:5432/db

# CORRECT (transaction pooler):
DATABASE_URL=postgres://user:pass@host:6543/db
```
**Why:** Serverless functions need transaction pooling (port 6543), not direct connections (5432).
**Fix:** Always use port `6543` for Supabase/PostgreSQL in serverless.

### ❌ MISTAKE 5: Missing package-lock.json
```bash
cd frontend
ls package-lock.json  # Must exist!
```
**Why:** `npm ci` requires package-lock.json for reproducible builds.
**Fix:** Run `npm install` to generate it, then commit.

---

## 5. Deployment Checklist

### Before Deploying to Production

- [ ] Verify `vercel.json` matches Section 2 above
- [ ] Verify all environment variables are set in Vercel dashboard (Section 3)
- [ ] Verify `DATABASE_URL` uses port `6543` (transaction pooler)
- [ ] Verify `DATABASE_URL` has URL-encoded special characters
- [ ] Verify only 5 or fewer files in `/api` (not counting `_lib/`)
- [ ] Verify `frontend/package-lock.json` exists and is committed
- [ ] Test locally with `vercel dev` first

### Test Locally

```bash
# 1. Install API dependencies (root)
npm ci

# 2. Install frontend dependencies
cd frontend
npm ci
cd ..

# 3. Run local Vercel dev server
vercel dev
```

Visit: `http://localhost:3000`

### Deploy to Production

```bash
# Option 1: Push to main branch (auto-deploys)
git push origin main

# Option 2: Manual deploy
vercel --prod
```

---

## 6. How Builds Work on Vercel

### Build Process Flow

1. **Clone Repository**
   - Vercel clones your GitHub repo

2. **Install Phase** (runs `installCommand`)
   ```bash
   cd frontend && npm ci
   ```

3. **Build Phase** (runs `buildCommand`)
   ```bash
   cd frontend && npm run build
   ```
   - Compiles TypeScript
   - Bundles React app with Vite
   - Outputs to `frontend/dist/`

4. **Deploy Phase**
   - Static files from `frontend/dist/` → Vercel CDN
   - API functions from `api/*.ts` → Serverless (automatic)
   - Helper functions in `api/_lib/` → Bundled with serverless functions

---

## 7. API Endpoints

### Current Endpoints (5 total)

1. **`POST /api/send-report`** - Send assessment results
   - With `?download=true`: Returns PDF blob
   - Without query param: Sends email with PDF attachment

2. **`GET /api/get-questions`** - Get assessment questions

3. **`POST /api/save-lead`** - Save lead information to database

4. *(Available for 2 more endpoints)*

### Endpoint Consolidation Strategy

**DO NOT create separate endpoints for related functionality.**

✅ **GOOD:** Single endpoint with query params
```typescript
// /api/send-report.ts
const isDownload = req.query.download === 'true';
if (isDownload) {
  return pdfBlob;
} else {
  sendEmail();
}
```

❌ **BAD:** Multiple endpoints
```typescript
// /api/download-pdf.ts  ❌
// /api/send-email.ts    ❌
```

---

## 8. Database Connection

### Connection String Format

```bash
DATABASE_URL=postgres://[user]:[password]@[host]:6543/[database]?sslmode=require
```

### Important Rules

1. **Always use port `6543`** (transaction pooler)
   - Serverless functions need pooling
   - Port `5432` is for direct connections only

2. **URL-encode special characters in password**
   - Example: `p@ssw0rd!` → `p%40ssw0rd%21`

3. **Include `?sslmode=require`** for secure connections

4. **Use `pg` library for connections**
   ```typescript
   import { Pool } from 'pg';
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
   });
   ```

---

## 9. Troubleshooting

### Build Fails: "npm ci can only install packages when package.json and package-lock.json are in sync"

**Problem:** package-lock.json out of sync with package.json

**Solution:**
```bash
cd frontend
rm package-lock.json
npm install
git add package-lock.json
git commit -m "Regenerate package-lock.json"
git push
```

### Build Fails: "command not found: vite"

**Problem:** Build command not in frontend directory

**Solution:** Verify `vercel.json` has:
```json
"buildCommand": "cd frontend && npm ci && npm run build"
```

### Serverless Functions Not Deploying

**Problem:** Files in wrong location or wrong naming

**Solution:**
- Files must be in `/api` directory (not subdirectories)
- Files must have `.ts` or `.js` extension
- Files must export default function
- Helper files should be in `/api/_lib/`

### Database Connection Errors

**Problem:** Wrong port or URL encoding

**Solution:**
1. Check port is `6543` (not `5432`)
2. URL-encode special characters in password
3. Verify `sslmode=require` is included

---

## Version Information

- **Node.js:** 20.x
- **React:** 18.2.0
- **Vite:** 5.4.0
- **TypeScript:** 5.3.3
- **PostgreSQL:** Compatible with Supabase

---

## Important Reminders

1. **DO NOT modify `vercel.json` without updating this guide**
2. **DO NOT add more than 5 files to `/api` directory**
3. **ALWAYS use port `6543` for database connections**
4. **ALWAYS URL-encode special characters in `DATABASE_URL`**
5. **ALWAYS commit `frontend/package-lock.json`**

---

## Questions?

If Claude Code or another AI assistant tries to modify the build configuration:

1. **Point them to this guide**
2. **Verify changes against Section 2 (vercel.json)**
3. **Ensure they don't break the 5-endpoint limit**
4. **Update this guide if requirements change**

**This guide is the SINGLE SOURCE OF TRUTH for build configuration.**

Last updated: 2025-11-23
