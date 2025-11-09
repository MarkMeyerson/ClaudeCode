/**
 * Finance Tracker Agent - Main Entry Point
 * Monitors financial health, tracks revenue, and provides financial insights
 */

// Load environment variables FIRST before any other imports
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the agents-system root directory
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('ERROR: Failed to load .env file from:', envPath);
  console.error('Error:', result.error.message);
  console.error('\nPlease ensure .env file exists in the agents-system directory.');
  process.exit(1);
}

console.log('✓ Environment variables loaded from:', envPath);

import { initDatabase, createAgentExecution, updateAgentExecution, testConnection } from '../../shared/database/db';
import { initStripeClient } from '../../shared/clients/stripe-client';
import { initClaudeClient } from '../../shared/clients/claude-client';
import { logger } from '../../shared/utils/logger';
import { config, printConfig } from '../../shared/utils/config';
import { AgentType, AgentStatus } from '../../shared/types';
import { FinanceAgent } from './finance-agent';
import { loadFinanceConfig } from './config';
import { FinancialReport } from './types';

/**
 * Main execution function for Finance Tracker Agent
 */
export async function run(): Promise<FinancialReport> {
  const startTime = Date.now();
  let executionId: string | undefined;

  try {
    logger.info('Starting Finance Tracker Agent', {
      environment: config.environment,
    });

    // Print configuration for debugging
    printConfig();

    // 1. Initialize infrastructure
    logger.info('Initializing infrastructure...');

    // Initialize database
    const db = initDatabase();
    logger.info('Database pool created');

    // Test database connection
    logger.info('Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection test failed. Check your DATABASE_* credentials in .env file.');
    }
    logger.info('✓ Database connection verified');

    // Initialize Stripe client
    try {
      initStripeClient();
      logger.info('Stripe client initialized');
    } catch (error: any) {
      logger.warn('Stripe client initialization failed', { error: error.message });
      throw new Error('STRIPE_API_KEY is required. Please configure it in environment variables.');
    }

    // Initialize Claude client (optional for AI features)
    try {
      const financeConfig = loadFinanceConfig();
      if (financeConfig.forecasting.use_ai_forecasting) {
        initClaudeClient();
        logger.info('Claude client initialized');
      } else {
        logger.info('AI forecasting disabled, skipping Claude client initialization');
      }
    } catch (error: any) {
      logger.warn('Claude client initialization failed, AI features will be disabled', {
        error: error.message,
      });
    }

    // 2. Create agent execution record
    const execution = await createAgentExecution(AgentType.FINANCE_TRACKER, {
      started_at: new Date().toISOString(),
      config: loadFinanceConfig(),
    });
    executionId = execution.id;

    logger.info('Agent execution started', { execution_id: executionId });

    // 3. Run the Finance Agent workflow
    const agent = new FinanceAgent();

    logger.info('Generating comprehensive financial report...');
    const metrics = await agent.generateFinancialReport();

    // 4. Create report structure
    const report: FinancialReport = {
      execution_id: executionId,
      generated_at: new Date(),
      metrics,
      summary: generateSummary(metrics),
      next_actions: generateNextActions(metrics),
    };

    // 5. Update execution record with success
    await updateAgentExecution(executionId, AgentStatus.COMPLETED, {
      report,
      duration_ms: Date.now() - startTime,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info('Finance Tracker Agent completed successfully', {
      execution_id: executionId,
      duration_seconds: duration,
      revenue: metrics.revenue.month,
      alerts_count: metrics.alerts.length,
    });

    return report;
  } catch (error: any) {
    logger.error('Finance Tracker Agent failed', {
      error: error.message,
      stack: error.stack,
    });

    // Update execution record with failure
    if (executionId) {
      await updateAgentExecution(executionId, AgentStatus.FAILED, undefined, error.message);
    }

    throw error;
  }
}

/**
 * Generate executive summary from metrics
 */
function generateSummary(metrics: any): string {
  const revenue = metrics.revenue;
  const profitability = metrics.profitability;
  const alerts = metrics.alerts;

  let summary = `Financial Summary (${new Date().toLocaleDateString()}):\n\n`;

  summary += `Revenue: $${revenue.month.toLocaleString()} this month `;
  summary += `(${revenue.growth_rate_mom > 0 ? '+' : ''}${revenue.growth_rate_mom.toFixed(1)}% MoM)\n`;

  summary += `MRR: $${revenue.mrr.toLocaleString()} | `;
  summary += `ARR: $${revenue.arr.toLocaleString()}\n`;

  summary += `Gross Margin: ${profitability.gross_margin.toFixed(1)}% | `;
  summary += `Net Profit: $${profitability.net_profit.toLocaleString()}\n`;

  if (metrics.customer_insights) {
    summary += `Customers: ${metrics.customer_insights.active_customers} active | `;
    summary += `Churn: ${metrics.customer_insights.churn_rate.toFixed(1)}%\n`;
  }

  if (alerts.length > 0) {
    summary += `\nAlerts: ${alerts.length} active (${
      alerts.filter((a: any) => a.type === 'critical').length
    } critical)\n`;
  }

  return summary;
}

/**
 * Generate recommended next actions
 */
function generateNextActions(metrics: any): string[] {
  const actions: string[] = [];

  // Based on alerts
  metrics.alerts.forEach((alert: any) => {
    if (alert.recommended_action) {
      actions.push(`[${alert.category.toUpperCase()}] ${alert.recommended_action}`);
    }
  });

  // Based on recommendations
  if (metrics.recommendations && metrics.recommendations.length > 0) {
    metrics.recommendations.slice(0, 3).forEach((rec: any) => {
      actions.push(`Consider pricing adjustment: ${rec.rationale}`);
    });
  }

  // General actions if no specific ones
  if (actions.length === 0) {
    actions.push('Continue monitoring financial metrics daily');
    actions.push('Review customer retention strategies');
    actions.push('Optimize expense allocation');
  }

  return actions;
}

/**
 * Export the agent for use by other modules
 */
export { FinanceAgent } from './finance-agent';
export * from './types';
export * from './config';

// If run directly (not imported), execute the agent
if (require.main === module) {
  run()
    .then((report) => {
      console.log('\n=== FINANCE TRACKER REPORT ===\n');
      console.log(report.summary);
      console.log('\nNext Actions:');
      report.next_actions.forEach((action, i) => {
        console.log(`${i + 1}. ${action}`);
      });
      console.log('\n=== END REPORT ===\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error.message);
      process.exit(1);
    });
}
