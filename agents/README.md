# AI Agent System

**A production-ready multi-agent system for autonomous business operations.**

---

## Overview

This system consists of 7 specialized AI agents that work together to automate business operations, track metrics, detect risks, and generate daily executive briefings.

**Agents:**
1. **CEO Agent** - Orchestrates all agents, calculates priorities, generates briefings
2. **Finance Agent** - Tracks revenue, expenses, runway, financial health
3. **Sales Agent** - Monitors pipeline, conversion rates, deal velocity
4. **Operations Agent** - Manages projects, team capacity, delivery metrics
5. **Marketing Agent** - Analyzes traffic, leads, CAC, channel performance
6. **HR Agent** - Tracks team health, hiring, satisfaction, retention
7. **Customer Success Agent** - Monitors churn, NPS, support, customer health

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL (via Supabase recommended)
- Stripe account (for Finance Agent)
- API keys for integrations (Notion, HubSpot, etc.)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/ai-agent-system
cd ai-agent-system

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Build TypeScript
npm run build

# Run CEO Agent
npm run agent:ceo
```

### First Run

```bash
# Test Finance Agent
node dist/agents/finance/index.js

# Test CEO Agent
node dist/agents/ceo/index.js
```

Expected output:

```
🤖 CEO Agent starting daily briefing generation...
1️⃣  Running pre-flight checks...
2️⃣  Fetching founder status from Notion...
   Energy: 7/10, Mood: good
3️⃣  Orchestrating agents...
   ✓ finance completed in 1247ms
   ✓ sales completed in 892ms
   ...
✅ Briefing generated successfully!
⏱️  Total time: 6234ms
```

---

## Architecture

### System Overview

```
        ┌────────────────┐
        │   CEO Agent    │  ← Orchestrates everything
        │ (Orchestrator) │
        └───────┬────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
┌───▼───┐   ┌──▼───┐   ┌───▼───┐
│Finance│   │Sales │   │  Ops  │
└───┬───┘   └──┬───┘   └───┬───┘
    │          │           │
┌───▼───┐   ┌──▼───┐   ┌───▼───┐
│ Marketing │   HR │  │Customer│
│          │      │  │ Success│
└──────────┘ └────┘  └────────┘
```

### Data Flow

```
6:00 AM - CEO Agent wakes up
   ↓
Gather context (Notion, goals)
   ↓
Call all 6 specialized agents (parallel)
   ↓
Aggregate metrics from all agents
   ↓
Detect risks (25+ rules)
   ↓
Calculate top 3 priorities (multi-factor algorithm)
   ↓
Generate executive briefing
   ↓
Distribute (Notion, Email, Slack)
```

---

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...

# Integrations
STRIPE_SECRET_KEY=sk_live_...
NOTION_API_KEY=secret_...
NOTION_BUSINESS_TRACKER_DB_ID=abc123...
HUBSPOT_API_KEY=pat-na1-...

# Email
EMAIL_TO=founder@company.com
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@email.com
SMTP_PASSWORD=app_password

# Slack (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Environment
NODE_ENV=production
CEO_OPERATING_HOURS_START=6
CEO_OPERATING_HOURS_END=22
CEO_TIMEZONE=America/Los_Angeles
```

### Priority Weights

Configure priority calculation weights in `.env`:

```env
CEO_WEIGHT_REVENUE=0.40      # Revenue impact (40%)
CEO_WEIGHT_URGENCY=0.25      # Urgency (25%)
CEO_WEIGHT_ENERGY=0.15       # Energy alignment (15%)
CEO_WEIGHT_STRATEGY=0.20     # Strategic alignment (20%)
```

### Risk Thresholds

```env
CEO_LOW_RUNWAY_THRESHOLD=6        # Months
CEO_HIGH_CHURN_THRESHOLD=5        # Percent
CEO_LOW_NPS_THRESHOLD=50          # Score
CEO_HIGH_CAC_THRESHOLD=500        # Dollars
```

---

## Agent Details

### CEO Agent

**Purpose:** Orchestrate all agents and generate daily briefing

**Methods:**
- `getDailyBriefing()` - Main entry point
- `orchestrateAgents()` - Call all agents
- `aggregateMetrics()` - Combine data
- `detectRisks()` - Run risk rules
- `calculatePriorities()` - Multi-factor scoring
- `generateBriefing()` - Create markdown/JSON output

**Output:**

```typescript
interface Briefing {
  id: string;
  date: Date;
  topPriorities: Task[];  // Top 3 priorities
  healthOverview: {
    overall: number;
    finance: number;
    sales: number;
    operations: number;
    marketing: number;
    hr: number;
    customerSuccess: number;
  };
  risks: DetectedRisk[];
  metrics: AggregatedMetrics;
  recommendations: Recommendation[];
  founderStatus: {
    energy: number;
    mood: string;
    blockers: string[];
    focusTimeAvailable: number;
  };
  markdown: string;
  json: string;
}
```

### Finance Agent

**Purpose:** Track financial health

**Data Sources:**
- Stripe API (revenue, subscriptions)
- Bank APIs (cash balance)
- Accounting software (expenses)

**Metrics:**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Burn Rate
- Runway (months of cash)
- Customer LTV
- Churn Rate

**Alerts:**
- Low runway (<6 months)
- Negative cash flow
- High burn rate
- Churn spike

### Sales Agent

**Purpose:** Monitor sales pipeline

**Data Sources:**
- HubSpot CRM
- Calendar (meetings)
- Email (follow-ups)

**Metrics:**
- Pipeline value
- Active deals
- Conversion rate
- Deal velocity
- Win rate

**Alerts:**
- Stalled deals (>14 days)
- Low pipeline (<3x quota)
- Declining conversion

### Operations Agent

**Purpose:** Track project delivery

**Data Sources:**
- Linear/Jira
- GitHub
- Team calendars

**Metrics:**
- Project health
- Team utilization
- Sprint velocity
- Blocker count

**Alerts:**
- Projects at risk
- Team overloaded
- Missed deadlines

### Marketing Agent

**Purpose:** Optimize marketing performance

**Data Sources:**
- Google Analytics
- Ad platforms
- Social media
- Email platforms

**Metrics:**
- Website traffic
- Leads generated
- CAC (Customer Acquisition Cost)
- Channel ROI

**Alerts:**
- CAC spike
- Low lead generation
- Underperforming channels

### HR Agent

**Purpose:** Monitor team health

**Data Sources:**
- HRIS
- Applicant tracking
- Calendars
- Pulse surveys

**Metrics:**
- Team size
- Open roles
- Hiring velocity
- Employee satisfaction

**Alerts:**
- Burnout risk
- Slow hiring
- Low satisfaction

### Customer Success Agent

**Purpose:** Prevent churn, drive expansion

**Data Sources:**
- Support platforms
- Product analytics
- NPS surveys

**Metrics:**
- Active customers
- NPS score
- Churn rate
- At-risk customers

**Alerts:**
- High churn risk
- Inactive customers
- Low NPS

---

## Scheduling

### Vercel Cron

```json
// vercel.json
{
  "crons": [{
    "path": "/api/agents/ceo",
    "schedule": "0 6 * * *"
  }]
}
```

### Railway Cron

```toml
# railway.toml
[[crons]]
schedule = "0 6 * * *"
command = "npm run agent:ceo"
```

### Linux/Mac Cron

```bash
# Install cron jobs
bash scripts/schedulers/cron-schedule.sh

# View installed jobs
crontab -l

# Edit jobs
crontab -e
```

### Windows Task Scheduler

```powershell
# Import XML schedule
schtasks /Create /XML scripts/schedulers/windows-schedule-ceo-agent.xml /TN "AI Agents\CEO Agent"

# Run manually
schtasks /Run /TN "AI Agents\CEO Agent"

# View tasks
schtasks /Query /TN "AI Agents\CEO Agent"
```

---

## Deployment

### Option 1: Vercel (Recommended for serverless)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL production
vercel env add STRIPE_SECRET_KEY production
# ... etc
```

### Option 2: Railway (Recommended for cron jobs)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up

# Set environment variables
railway variables set DATABASE_URL=...
railway variables set STRIPE_SECRET_KEY=...
```

### Option 3: Manual VPS

```bash
# SSH to server
ssh user@your-server.com

# Clone repository
git clone https://github.com/yourusername/ai-agent-system
cd ai-agent-system

# Install dependencies
npm install

# Build
npm run build

# Install cron jobs
bash scripts/schedulers/cron-schedule.sh

# Set up monitoring
pm2 start dist/agents/ceo/index.js --name "ceo-agent" --cron "0 6 * * *"
```

---

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- priority-calculator.test.ts

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Test specific agent
npm test -- finance-agent.integration.test.ts
```

### Manual Testing

```bash
# Test Finance Agent
node dist/agents/finance/index.js

# Test CEO Agent
node dist/agents/ceo/index.js

# Test with debug logs
DEBUG=* node dist/agents/ceo/index.js
```

---

## Monitoring

### Health Checks

```bash
# Check system health
node dist/scripts/monitoring/health-check.js

# Output:
# ✓ Database: healthy
# ✓ Stripe API: healthy
# ✓ Notion API: healthy
# ✓ All agents: healthy
```

### Logs

```bash
# View CEO Agent logs
tail -f /var/log/ai-agents/ceo-agent.log

# View all logs
tail -f /var/log/ai-agents/*.log

# View errors only
grep -i "error" /var/log/ai-agents/*.log
```

### Alerts

Configure email/Slack alerts in `.env`:

```env
ALERT_EMAIL=founder@company.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

---

## Troubleshooting

### Agent Not Running

1. Check cron job is installed: `crontab -l`
2. Check logs: `tail -f /var/log/ai-agents/ceo-agent.log`
3. Test manually: `node dist/agents/ceo/index.js`
4. Check environment variables: `printenv | grep DATABASE`

### Database Connection Errors

1. Verify `DATABASE_URL` is correct
2. Test connection: `psql $DATABASE_URL`
3. Check firewall allows connection
4. Verify credentials haven't expired

### API Errors

1. Check API keys are valid
2. Verify API rate limits not exceeded
3. Check service status pages
4. Review error logs for details

### Briefing Not Generating

1. Check all environment variables set
2. Verify Notion credentials
3. Test each agent individually
4. Check for error logs

---

## Cost Breakdown

**Infrastructure:**
- Supabase: $0-25/month
- Vercel: $0-20/month
- Railway: $5/month
- **Total: $5-45/month**

**API Costs:**
- Stripe: $0 (free)
- Notion: $0 (free tier)
- HubSpot: $0-45/month
- **Total: $0-45/month**

**Grand Total: $5-90/month**

**Compare to:**
- Fractional CFO: $3,000-5,000/month
- SaaS tools: $500-1,000/month
- Finance team: $80,000+/year

**Savings: $30,000-60,000/year**

---

## Development

### Project Structure

```
agents/
├── ceo/
│   ├── ceo-agent.ts           # Main orchestrator
│   ├── config.ts              # Configuration
│   ├── types/                 # TypeScript types
│   ├── algorithms/
│   │   └── priority-calculator.ts
│   ├── lib/
│   │   ├── briefing-generator.ts
│   │   └── risk-detector.ts
│   └── integrations/
│       └── notion.ts
├── finance/
│   └── finance-agent.ts
├── sales/
│   └── sales-agent.ts
└── ...

tests/
├── unit/
├── integration/
└── e2e/

scripts/
├── deployment/
├── monitoring/
├── database/
└── schedulers/
```

### Adding a New Agent

1. Create agent file: `agents/your-agent/your-agent.ts`
2. Implement `Agent` interface
3. Add to CEO Agent orchestration
4. Add tests
5. Update documentation

### Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

---

## Roadmap

### Phase 1 (Complete)
- ✅ CEO Agent architecture
- ✅ Finance Agent
- ✅ Priority calculation
- ✅ Risk detection
- ✅ Briefing generation

### Phase 2 (In Progress)
- 🚧 Sales Agent
- 🚧 Operations Agent
- 🚧 Testing suite
- 🚧 Deployment automation

### Phase 3 (Planned)
- ⬜ Marketing Agent
- ⬜ HR Agent
- ⬜ Customer Success Agent
- ⬜ React Dashboard
- ⬜ Mobile app

### Phase 4 (Future)
- ⬜ ML-powered predictions
- ⬜ Auto-execution of tasks
- ⬜ Multi-tenant SaaS
- ⬜ Agent marketplace

---

## License

MIT License - see LICENSE file

---

## Support

- **Documentation:** [Full docs](./docs/)
- **Issues:** [GitHub Issues](https://github.com/yourusername/ai-agent-system/issues)
- **Email:** hello@yourcompany.com
- **Twitter:** [@yourhandle](https://twitter.com/yourhandle)

---

**Built with ❤️  by SherpaTech.AI**
