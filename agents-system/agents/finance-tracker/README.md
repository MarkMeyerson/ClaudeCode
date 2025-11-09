# Finance Tracker Agent

The Finance Tracker Agent is part of SherpaTech.AI's Multi-Agent Business Automation System. This agent monitors financial health, tracks revenue from Stripe, analyzes profitability, forecasts cash flow, and provides actionable financial insights.

## What It Does

The Finance Tracker Agent provides comprehensive financial monitoring and analysis:

### Revenue Tracking
- **Real-time revenue metrics**: Today, week, month, year
- **Growth analysis**: Month-over-month and year-over-year trends
- **Revenue breakdown**: Subscription vs. one-time revenue
- **MRR/ARR calculation**: Monthly and annual recurring revenue

### Expense Tracking
- **Categorized expenses**: Track spending by category
- **Trend analysis**: Monitor expense growth rates
- **Budget compliance**: Compare against targets

### Profitability Analysis
- **P&L reports**: Complete profit and loss statements
- **Margin analysis**: Gross and net profit margins
- **Trend tracking**: Historical profitability trends

### Cash Flow Forecasting
- **Multi-period forecasts**: 30/60/90-day projections
- **AI-powered predictions**: Uses Claude for intelligent forecasting
- **Runway calculations**: Days of cash remaining
- **Scenario analysis**: Conservative, expected, and optimistic scenarios

### Customer Insights
- **Profitability scoring**: Identify high-value customers
- **Segmentation**: Classify customers by lifetime value
- **Churn analysis**: Monitor customer retention

### Pricing Optimization
- **Data-driven recommendations**: Pricing suggestions based on metrics
- **Revenue impact analysis**: Projected impact of price changes
- **Market positioning**: Competitive pricing insights

### Tax Tracking
- **Quarterly obligations**: Estimated tax payments
- **Due date tracking**: Never miss a payment deadline
- **Tax planning**: Proactive tax obligation management

### Alerts & Notifications
- **Low cash flow warnings**: Alert when runway is short
- **Revenue drops**: Flag significant revenue declines
- **Expense spikes**: Identify unusual spending
- **Target misses**: Track against revenue goals

## How to Run

### Prerequisites

1. **Database**: PostgreSQL with the multi-agent schema
2. **Stripe API Key**: Required for revenue data
3. **Claude API Key**: Optional, for AI-powered forecasting

### Setup

1. **Install dependencies**:
   ```bash
   cd agents-system
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   # Required
   STRIPE_API_KEY=sk_live_...
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ai_assessment
   DB_USER=postgres
   DB_PASSWORD=your_password

   # Optional (for AI features)
   CLAUDE_API_KEY=sk-ant-...
   # or
   ANTHROPIC_API_KEY=sk-ant-...

   # Optional configuration overrides
   FINANCE_MONTHLY_REVENUE_GOAL=50000
   FINANCE_FEDERAL_TAX_RATE=0.21
   FINANCE_STATE_TAX_RATE=0.05
   LOG_LEVEL=info
   ```

3. **Initialize database**:
   ```bash
   psql -U postgres -d ai_assessment -f agents-system/shared/database/schema.sql
   ```

### Run the Agent

#### From Command Line
```bash
# Build TypeScript
npm run build

# Run the agent
npm run finance-tracker

# Or run directly with ts-node
npx ts-node agents/finance-tracker/index.ts
```

#### Programmatically
```typescript
import { run } from './agents/finance-tracker';

// Run the agent and get the report
const report = await run();

console.log(report.summary);
console.log('Alerts:', report.metrics.alerts);
console.log('Recommendations:', report.metrics.recommendations);
```

#### As a Module
```typescript
import { FinanceAgent } from './agents/finance-tracker';

// Create agent instance
const agent = new FinanceAgent();

// Get specific metrics
const revenue = await agent.getRevenueMetrics();
const cashFlow = await agent.getCashFlowForecast();
const profitability = await agent.generateProfitLoss();

// Or get full report
const fullReport = await agent.generateFinancialReport();
```

## Configuration Options

Edit `agents/finance-tracker/config.ts` to customize:

### Tax Settings
```typescript
tax: {
  federal_rate: 0.21,      // 21% federal tax
  state_rate: 0.05,        // 5% state tax
  quarterly_payment_dates: ['04-15', '06-15', '09-15', '01-15']
}
```

### Revenue Targets
```typescript
targets: {
  monthly_revenue_goal: 50000,
  annual_revenue_goal: 600000,
  monthly_expense_budget: 30000,
  target_gross_margin: 70,  // 70%
  target_net_margin: 30     // 30%
}
```

### Alert Thresholds
```typescript
alerts: {
  low_cash_flow_days: 90,        // Alert if runway < 90 days
  revenue_drop_threshold: 15,    // Alert if revenue drops > 15%
  expense_spike_threshold: 20,   // Alert if expenses increase > 20%
  high_churn_rate: 5             // Alert if churn > 5%
}
```

### Customer Segmentation
```typescript
customer_segments: {
  high_value_ltv: 10000,   // High-value: LTV > $10k
  medium_value_ltv: 5000   // Medium-value: LTV > $5k
}
```

### Forecasting
```typescript
forecasting: {
  use_ai_forecasting: true,       // Use Claude for forecasting
  historical_data_months: 6,      // Months of history to analyze
  conservative_factor: 0.9        // 90% of projections for conservative estimates
}
```

## Example Output

```json
{
  "execution_id": "550e8400-e29b-41d4-a716-446655440000",
  "generated_at": "2024-01-15T10:30:00.000Z",
  "summary": "Financial Summary (1/15/2024):\n\nRevenue: $45,230 this month (+12.3% MoM)\nMRR: $42,000 | ARR: $504,000\nGross Margin: 68.5% | Net Profit: $12,450\nCustomers: 127 active | Churn: 3.2%\n\nAlerts: 1 active (0 critical)",
  "metrics": {
    "revenue": {
      "today": 1250,
      "week": 8500,
      "month": 45230,
      "year": 487500,
      "growth_rate_mom": 12.3,
      "mrr": 42000,
      "arr": 504000
    },
    "profitability": {
      "total_revenue": 45230,
      "total_expenses": 30120,
      "gross_profit": 15110,
      "gross_margin": 68.5,
      "net_profit": 12450,
      "net_margin": 27.5
    },
    "cash_flow": {
      "current_balance": 85000,
      "forecast_30d": 98500,
      "forecast_60d": 112000,
      "forecast_90d": 125500,
      "projected_runway_days": 254,
      "confidence_level": "high"
    },
    "alerts": [
      {
        "type": "info",
        "category": "revenue",
        "message": "Monthly revenue is 9.5% below target",
        "impact": "medium",
        "recommended_action": "Review sales pipeline and marketing effectiveness"
      }
    ],
    "recommendations": [
      {
        "current_price": 330,
        "recommended_price": 365,
        "potential_revenue_impact": 4200,
        "rationale": "Based on customer retention and market analysis, a 10% price increase is justified",
        "confidence": "high"
      }
    ]
  },
  "next_actions": [
    "[REVENUE] Review sales pipeline and marketing effectiveness",
    "Consider pricing adjustment: Based on customer retention and market analysis, a 10% price increase is justified"
  ]
}
```

## API Methods

### `getRevenueMetrics()`
Returns revenue for different time periods with growth rates.

### `getExpenseTracking()`
Returns expense breakdown by category.

### `generateProfitLoss()`
Generates complete P&L report with margins.

### `getCashFlowForecast()`
Forecasts cash flow for 30/60/90 days.

### `getCustomerProfitability()`
Analyzes customer lifetime value and segments.

### `getPricingRecommendations()`
Suggests pricing optimizations with impact analysis.

### `getTaxTracking()`
Tracks quarterly tax obligations and due dates.

### `generateFinancialReport()`
Comprehensive report with all metrics, alerts, and recommendations.

## Database Schema

The agent stores data in two main tables:

### `agent_executions`
Tracks each agent run:
- Execution ID, status, timestamps
- Metadata and results
- Error tracking

### `business_metrics`
Stores financial metrics:
- Metric type (revenue, expense, profitability)
- Metric value and unit
- Time period
- Additional metadata

## Troubleshooting

### "STRIPE_API_KEY is required"
- Ensure `STRIPE_API_KEY` is set in your environment
- Use a test key for development: `sk_test_...`
- Use a live key for production: `sk_live_...`

### "Failed to connect to database"
- Check PostgreSQL is running: `pg_isready`
- Verify database credentials in `.env`
- Ensure schema is initialized: Run `schema.sql`

### "Claude client initialization failed"
- This is optional - agent will work without AI features
- To enable: Set `CLAUDE_API_KEY` or `ANTHROPIC_API_KEY`
- Get API key from: https://console.anthropic.com/

### No Revenue Data
- Ensure you have transactions in Stripe
- Check date ranges in queries
- Verify Stripe API key has correct permissions

### Inaccurate Forecasts
- Ensure sufficient historical data (6+ months recommended)
- Adjust `conservative_factor` in config
- Enable AI forecasting for better predictions

## Testing

Run the test suite:
```bash
npm run test:finance-tracker
```

Or run specific tests:
```typescript
import { testFinanceAgent } from './test';

await testFinanceAgent();
```

## Scheduling

Run the agent on a schedule using cron:

```bash
# Daily at 9 AM
0 9 * * * cd /path/to/agents-system && npm run finance-tracker

# Weekly on Monday at 8 AM
0 8 * * 1 cd /path/to/agents-system && npm run finance-tracker
```

Or use a task scheduler like node-cron:

```typescript
import cron from 'node-cron';
import { run } from './agents/finance-tracker';

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running Finance Tracker Agent...');
  const report = await run();
  // Send report via email, Slack, etc.
});
```

## Integration

### Email Reports
```typescript
import { run } from './agents/finance-tracker';
import { sendEmail } from './email-service';

const report = await run();
await sendEmail({
  to: 'cfo@sherpatech.ai',
  subject: 'Daily Financial Report',
  body: report.summary,
  attachments: [{ filename: 'metrics.json', content: JSON.stringify(report.metrics) }]
});
```

### Slack Notifications
```typescript
import { run } from './agents/finance-tracker';
import { postToSlack } from './slack-service';

const report = await run();

// Post critical alerts
if (report.metrics.alerts.some(a => a.type === 'critical')) {
  await postToSlack({
    channel: '#finance-alerts',
    message: `🚨 Critical Financial Alert!\n\n${report.summary}`
  });
}
```

### Dashboard API
```typescript
import express from 'express';
import { run } from './agents/finance-tracker';

const app = express();

app.get('/api/finance/report', async (req, res) => {
  try {
    const report = await run();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

## Best Practices

1. **Run daily**: Get consistent financial monitoring
2. **Review alerts**: Act on warnings before they become critical
3. **Track trends**: Monitor month-over-month changes
4. **Adjust targets**: Update goals as business grows
5. **Use AI forecasting**: Enable Claude for better predictions
6. **Backup data**: Export metrics regularly
7. **Monitor accuracy**: Verify against actual Stripe dashboard

## Support

For issues or questions:
- Email: hello@sherpatech.ai
- GitHub: [Open an issue](https://github.com/sherpatech/multi-agent-system)

## License

Copyright © 2024 SherpaTech.AI. All rights reserved.
