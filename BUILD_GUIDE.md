# Build Guide - AI Readiness Assessment

## SINGLE SOURCE OF TRUTH FOR BUILD CONFIGURATION

**This document defines the correct build setup. DO NOT modify build commands without updating this guide.**

---

## Project Structure

```
/
├── api/                    # Serverless API functions (auto-deployed by Vercel)
│   ├── send-report.ts     # Email & PDF download endpoint
│   ├── get-questions.ts   # Assessment questions endpoint
│   ├── save-lead.ts       # Lead capture endpoint
│   └── lib/               # Shared utilities
│       ├── cors.ts
│       ├── generatePDF.ts
│       ├── microsoftGraph.ts
│       └── hubspot.ts
│
├── frontend/              # React frontend (Vite)
│   ├── src/
│   ├── package.json       # Frontend dependencies
│   ├── package-lock.json  # Frontend lockfile (MUST be committed)
│   └── vite.config.ts
│
├── package.json           # Root package.json (NO build script!)
├── vercel.json            # Vercel configuration (SINGLE SOURCE OF TRUTH)
└── BUILD_GUIDE.md         # This file
```

---

## Vercel Configuration (`vercel.json`)

### CORRECT Configuration

```json
{
  "buildCommand": "cd frontend && npm ci && npm run build",
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

- **`buildCommand`**: Navigates to frontend and builds ONLY the React app
  - Uses `npm ci` for clean, reproducible installs
  - `cd frontend` ensures we're in the right directory
  - `npm run build` runs Vite build

- **`installCommand`**: Installs frontend dependencies separately
  - Vercel runs this before buildCommand
  - Ensures package-lock.json is respected

- **`outputDirectory`**: Where Vercel finds built static files
  - `frontend/dist` is where Vite outputs the build

- **`framework: null`**: Disables auto-detection
  - We handle the build ourselves
  - Prevents Vercel from running wrong build commands

---

## Root `package.json` Rules

### ✅ CORRECT

```json
{
  "name": "ai-readiness-assessment",
  "version": "1.0.1",
  "private": true,
  "engines": {
    "node": "20.x"
  },
  "scripts": {
    "dev": "vercel dev",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "@azure/identity": "^4.13.0",
    "@microsoft/microsoft-graph-client": "^3.0.7",
    "html2canvas": "^1.4.1",
    "jspdf": "^3.0.4",
    "pg": "^8.11.3"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/pg": "^8.10.9",
    "@vercel/node": "^3.0.11",
    "typescript": "^5.3.2"
  }
}
```

### ❌ WRONG - Do NOT add these to root package.json:

```json
// ❌ NO build script in root!
"scripts": {
  "build": "tsc --noEmit",           // WRONG
  "build": "echo 'Building...'",     // WRONG
  "build:all": "cd frontend && ..."  // WRONG
}
```

**WHY?** Vercel uses `vercel.json` buildCommand. Root package.json build scripts cause confusion.

---

## Environment Variables

### Required Environment Variables (Vercel Dashboard)

Set these in: Vercel Dashboard → Project → Settings → Environment Variables

#### Microsoft Graph (Email Sending)
- `AZURE_TENANT_ID` - Azure AD tenant ID
- `AZURE_CLIENT_ID` - Azure app client ID
- `AZURE_CLIENT_SECRET` - Azure app secret
- `SENDER_EMAIL` - Email address to send from

#### HubSpot (Optional - CRM Integration)
- `HUBSPOT_ACCESS_TOKEN` - HubSpot API token

#### Database (Optional - if using PostgreSQL)
- `DATABASE_URL` - PostgreSQL connection string

### Local Development (`.env`)

Create a `.env` file in the root (DO NOT commit this):

```bash
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
SENDER_EMAIL=noreply@sherpatech.ai
HUBSPOT_ACCESS_TOKEN=your-hubspot-token
```

---

## How Builds Work

### 1. Vercel Detects Changes
- Push to GitHub triggers build
- Vercel clones repo

### 2. Install Phase
```bash
# Vercel runs:
cd frontend && npm ci
```

### 3. Build Phase
```bash
# Vercel runs:
cd frontend && npm ci && npm run build
```
This executes `vite build` from `frontend/package.json`, which:
- Compiles TypeScript
- Bundles React app
- Outputs to `frontend/dist/`

### 4. Deploy Phase
- Static files from `frontend/dist/` → CDN
- API functions from `api/` → Serverless (automatic)

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Wrong Build Command
```json
// WRONG - Don't do this:
"buildCommand": "npm run build"  // Tries to build root!
```
**Fix:** Use `cd frontend && npm ci && npm run build`

### ❌ Mistake 2: Missing package-lock.json
```bash
# If frontend/package-lock.json is missing:
cd frontend
npm install  # This regenerates it
git add package-lock.json
git commit -m "Add package-lock.json"
```

### ❌ Mistake 3: Duplicate Properties in JSON
```json
// WRONG - JSON doesn't allow duplicates:
{
  "buildCommand": "npm run build",
  "buildCommand": "vite build"  // ❌ DUPLICATE
}
```

### ❌ Mistake 4: Using `npm install` in Build
```json
// WRONG:
"buildCommand": "cd frontend && npm install && npm run build"
```
**Fix:** Use `npm ci` for reproducible builds

### ❌ Mistake 5: Multiple Build Configurations
- Only use `vercel.json` for build config
- Do NOT add build commands to:
  - Root package.json
  - `.vercelrc` (we don't use this)
  - Vercel dashboard UI (use vercel.json instead)

---

## Deployment Checklist

### Before Deploying

- [ ] Verify `vercel.json` matches this guide
- [ ] Verify root `package.json` has NO build script
- [ ] Verify `frontend/package-lock.json` exists and is committed
- [ ] Verify environment variables are set in Vercel dashboard
- [ ] Test locally with `vercel dev`

### Test Locally

```bash
# 1. Install root dependencies (for API functions)
npm ci

# 2. Install frontend dependencies
cd frontend
npm ci

# 3. Run Vercel dev server
cd ..
vercel dev
```

Visit: `http://localhost:3000`

### Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploys)
git push origin main
```

---

## API Endpoints

All API endpoints are serverless functions in `/api`:

- `POST /api/send-report` - Send assessment results via email OR download PDF
  - Query param: `?download=true` returns PDF blob
  - Query param: `?download=false` (default) sends email with PDF
- `GET /api/get-questions` - Get assessment questions
- `POST /api/save-lead` - Save lead information

### Serverless Function Count Limit

Vercel has a 12 serverless function limit on free tier.

**Our strategy:** Consolidate related functionality
- ✅ `send-report.ts` handles BOTH email sending AND PDF downloads (via query param)
- ❌ Don't create separate `download-pdf.ts` endpoint

---

## Troubleshooting

### Build fails with "command not found"

**Problem:** Build command can't find `vite` or other frontend tools

**Solution:** Ensure `buildCommand` navigates to frontend first:
```json
"buildCommand": "cd frontend && npm ci && npm run build"
```

### Build fails with "Could not parse File as JSON"

**Problem:** Malformed JSON in `vercel.json` or `package.json`

**Solution:**
1. Validate JSON: https://jsonlint.com/
2. Check for:
   - Duplicate keys
   - Missing commas
   - Unclosed brackets/braces
   - Trailing commas (not allowed in JSON)

### Functions don't deploy

**Problem:** Changes to `api/` files not deploying

**Solution:** Vercel auto-deploys all `.ts` files in `api/` directory. Check:
1. File is in `api/` directory
2. File exports default function
3. Function matches Vercel serverless signature

---

## File Naming Conventions

### API Functions (`/api`)
- **Lowercase with hyphens:** `send-report.ts`, `get-questions.ts`
- **Export default handler:**
  ```typescript
  export default async function handler(req: VercelRequest, res: VercelResponse) {
    // ...
  }
  ```

### Frontend (`/frontend`)
- React components: **PascalCase** (`AssessmentForm.tsx`)
- Utilities: **camelCase** (`utils/formatDate.ts`)

---

## Version Information

- **Node.js:** 20.x (specified in `package.json` engines)
- **React:** 18.2.0
- **Vite:** 5.4.0
- **TypeScript:** 5.3.3
- **Vercel Node Runtime:** @vercel/node 3.0.11

---

## Questions?

If Claude Code or another AI assistant tries to modify the build configuration:

1. **Point them to this guide**
2. **Verify changes against this document**
3. **Update this guide if requirements change**

**This guide is the SINGLE SOURCE OF TRUTH for build configuration.**

Last updated: 2025-11-23
