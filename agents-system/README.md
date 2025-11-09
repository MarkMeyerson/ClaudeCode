# SherpaTech.AI Multi-Agent System

A comprehensive business automation system powered by AI agents that work together to manage different aspects of SherpaTech.AI operations.

## Overview

This multi-agent system consists of specialized AI agents that automate various business functions:

1. **Finance Tracker Agent** ✅ - Monitors revenue, expenses, profitability, and cash flow
2. **Content Creator Agent** (Coming soon) - Generates marketing content and blog posts
3. **Lead Qualifier Agent** (Coming soon) - Qualifies and scores incoming leads
4. **Sales Analyst Agent** (Coming soon) - Analyzes sales pipeline and forecasts
5. **Customer Success Agent** (Coming soon) - Monitors customer health and engagement
6. **Operations Manager Agent** (Coming soon) - Coordinates workflows and tasks

## Architecture

```
agents-system/
├── shared/                    # Shared infrastructure
│   ├── types/                # Common TypeScript types
│   ├── utils/                # Utilities (config, logger)
│   ├── database/             # Database client and schema
│   └── clients/              # API clients (Stripe, Claude, etc.)
├── agents/                   # Individual agents
│   ├── finance-tracker/     # Finance Tracker Agent
│   ├── content-creator/     # (Coming soon)
│   ├── lead-qualifier/      # (Coming soon)
│   └── ...
├── package.json
├── tsconfig.json
└── .env.example
```

## Quick Start

### 1. Install Dependencies

```bash
cd agents-system
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys and database credentials
```

Required environment variables:
- `STRIPE_API_KEY` - For Finance Tracker Agent
- `DB_*` - Database credentials
- `CLAUDE_API_KEY` - Optional, for AI-powered features

### 3. Initialize Database

```bash
# Create database
createdb ai_assessment

# Run schema migration
npm run db:migrate
```

### 4. Run an Agent

```bash
# Run Finance Tracker Agent
npm run finance-tracker

# Or build and run
npm run build
node dist/agents/finance-tracker/index.js
```

## Available Agents

### Finance Tracker Agent

Monitors financial health, tracks revenue from Stripe, analyzes profitability, and provides financial insights.

**Features:**
- Real-time revenue tracking (daily, weekly, monthly, yearly)
- MRR/ARR calculations
- P&L reports
- Cash flow forecasting (30/60/90 days)
- Customer profitability analysis
- Pricing recommendations
- Tax tracking
- Financial alerts

**Documentation:** [agents/finance-tracker/README.md](agents/finance-tracker/README.md)

**Run:**
```bash
npm run finance-tracker
```

## Shared Infrastructure

All agents share common infrastructure for consistency and code reuse:

### Database Client (`shared/database/db.ts`)
- PostgreSQL connection pool
- Query utilities
- Agent execution tracking
- Business metrics storage

### API Clients
- **Stripe Client** (`shared/clients/stripe-client.ts`) - Revenue and subscription data
- **Claude Client** (`shared/clients/claude-client.ts`) - AI-powered analysis

### Utilities
- **Config** (`shared/utils/config.ts`) - Environment configuration
- **Logger** (`shared/utils/logger.ts`) - Structured logging

### Types (`shared/types/index.ts`)
- Common type definitions
- Agent execution tracking
- Business metrics

## Database Schema

The system uses PostgreSQL with two main tables:

### `agent_executions`
Tracks all agent runs with status, timestamps, and results.

### `business_metrics`
Stores business metrics collected by agents (revenue, expenses, etc.).

See [shared/database/schema.sql](shared/database/schema.sql) for full schema.

## Development

### Build

```bash
npm run build
```

### Run in Development Mode

```bash
npm run dev
```

### Run Tests

```bash
# All tests
npm test

# Specific agent tests
npm run test:finance-tracker
```

### Linting & Formatting

```bash
npm run lint
npm run format
```

## Adding New Agents

To add a new agent to the system:

1. Create agent directory: `agents/your-agent-name/`
2. Implement required files:
   - `types.ts` - Agent-specific types
   - `config.ts` - Agent configuration
   - `prompts.ts` - AI prompts (if applicable)
   - `your-agent.ts` - Core agent logic
   - `index.ts` - Entry point
   - `README.md` - Documentation
   - `test.ts` - Tests

3. Use shared infrastructure:
   ```typescript
   import { logger } from '../../shared/utils/logger';
   import { config } from '../../shared/utils/config';
   import { initDatabase } from '../../shared/database/db';
   ```

4. Add npm script to `package.json`:
   ```json
   "your-agent-name": "ts-node agents/your-agent-name/index.ts"
   ```

## Environment Variables

See [.env.example](.env.example) for all configuration options.

Required:
- `DB_*` - Database credentials
- `STRIPE_API_KEY` - For Finance Tracker

Optional:
- `CLAUDE_API_KEY` - For AI features
- `LOG_LEVEL` - Logging verbosity
- Agent-specific overrides

## Production Deployment

### Build

```bash
npm run build
```

### Set Environment Variables

Ensure all required environment variables are set in production.

### Run Agents

```bash
# Run individual agents
node dist/agents/finance-tracker/index.js

# Or use a process manager like PM2
pm2 start dist/agents/finance-tracker/index.js --name finance-tracker
```

### Schedule Agents

Use cron or a task scheduler:

```bash
# Daily finance report at 9 AM
0 9 * * * cd /path/to/agents-system && node dist/agents/finance-tracker/index.js
```

## Monitoring

All agents log execution details to:
1. Console (structured logs)
2. Database (`agent_executions` table)

Monitor agent health:
```sql
SELECT * FROM agent_executions
WHERE agent_type = 'finance-tracker'
ORDER BY started_at DESC
LIMIT 10;
```

## Troubleshooting

### Database Connection Failed
- Ensure PostgreSQL is running
- Check `DB_*` environment variables
- Verify database exists: `psql -l`

### Stripe API Errors
- Verify `STRIPE_API_KEY` is correct
- Check API key permissions
- Ensure you're using the right key (test vs. live)

### Claude API Errors
- Claude features are optional
- Agent will fall back to non-AI methods if Claude fails
- Check `CLAUDE_API_KEY` is valid

## Support

For questions or issues:
- Email: hello@sherpatech.ai
- Documentation: See individual agent README files

## License

Copyright © 2024 SherpaTech.AI. All rights reserved.

---

Built with ❤️ by SherpaTech.AI
