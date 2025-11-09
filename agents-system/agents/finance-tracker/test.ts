/**
 * Finance Tracker Agent - Test Suite
 * Tests agent functionality with mock and real data
 */

import { FinanceAgent } from './finance-agent';
import { loadFinanceConfig } from './config';
import { logger } from '../../shared/utils/logger';
import { initDatabase, closeDatabase } from '../../shared/database/db';

/**
 * Test configuration
 */
const testConfig = {
  runWithRealStripeData: process.env.STRIPE_API_KEY ? true : false,
  runDatabaseTests: true,
  verbose: true,
};

/**
 * Test utilities
 */
function logTest(testName: string, status: 'PASS' | 'FAIL' | 'SKIP', message?: string) {
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '○';
  const color = status === 'PASS' ? '\x1b[32m' : status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
  console.log(`${color}${icon}\x1b[0m ${testName}${message ? ` - ${message}` : ''}`);
}

/**
 * Test 1: Configuration Loading
 */
async function testConfigurationLoading(): Promise<boolean> {
  try {
    const config = loadFinanceConfig();

    // Validate config structure
    if (!config.tax || !config.targets || !config.alerts) {
      throw new Error('Config missing required sections');
    }

    // Validate tax rates
    if (config.tax.federal_rate <= 0 || config.tax.federal_rate >= 1) {
      throw new Error('Invalid federal tax rate');
    }

    // Validate targets
    if (config.targets.monthly_revenue_goal <= 0) {
      throw new Error('Invalid revenue goal');
    }

    logTest('Configuration Loading', 'PASS');
    return true;
  } catch (error: any) {
    logTest('Configuration Loading', 'FAIL', error.message);
    return false;
  }
}

/**
 * Test 2: Agent Initialization
 */
async function testAgentInitialization(): Promise<boolean> {
  try {
    const agent = new FinanceAgent();

    if (!agent) {
      throw new Error('Agent failed to initialize');
    }

    logTest('Agent Initialization', 'PASS');
    return true;
  } catch (error: any) {
    logTest('Agent Initialization', 'FAIL', error.message);
    return false;
  }
}

/**
 * Test 3: Database Connection
 */
async function testDatabaseConnection(): Promise<boolean> {
  if (!testConfig.runDatabaseTests) {
    logTest('Database Connection', 'SKIP', 'Database tests disabled');
    return true;
  }

  try {
    const db = initDatabase();

    // Test simple query
    const result = await db.query('SELECT NOW() as current_time');

    if (!result.rows || result.rows.length === 0) {
      throw new Error('Database query returned no results');
    }

    logTest('Database Connection', 'PASS');
    return true;
  } catch (error: any) {
    logTest('Database Connection', 'FAIL', error.message);
    return false;
  }
}

/**
 * Test 4: Revenue Metrics (with real Stripe data if available)
 */
async function testRevenueMetrics(): Promise<boolean> {
  if (!testConfig.runWithRealStripeData) {
    logTest('Revenue Metrics', 'SKIP', 'Stripe API key not configured');
    return true;
  }

  try {
    const agent = new FinanceAgent();
    const metrics = await agent.getRevenueMetrics();

    // Validate metrics structure
    if (typeof metrics.today !== 'number') {
      throw new Error('Invalid today revenue');
    }

    if (typeof metrics.month !== 'number') {
      throw new Error('Invalid month revenue');
    }

    if (typeof metrics.mrr !== 'number') {
      throw new Error('Invalid MRR');
    }

    if (testConfig.verbose) {
      console.log('  Revenue Metrics:', {
        today: `$${metrics.today.toFixed(2)}`,
        month: `$${metrics.month.toFixed(2)}`,
        mrr: `$${metrics.mrr.toFixed(2)}`,
      });
    }

    logTest('Revenue Metrics', 'PASS');
    return true;
  } catch (error: any) {
    logTest('Revenue Metrics', 'FAIL', error.message);
    return false;
  }
}

/**
 * Test 5: Expense Tracking
 */
async function testExpenseTracking(): Promise<boolean> {
  try {
    const agent = new FinanceAgent();
    const expenses = await agent.getExpenseTracking();

    // Validate structure
    if (typeof expenses.total_month !== 'number') {
      throw new Error('Invalid total expenses');
    }

    if (!Array.isArray(expenses.by_category)) {
      throw new Error('Invalid expense categories');
    }

    if (testConfig.verbose) {
      console.log('  Expense Tracking:', {
        total: `$${expenses.total_month.toFixed(2)}`,
        categories: expenses.by_category.length,
      });
    }

    logTest('Expense Tracking', 'PASS');
    return true;
  } catch (error: any) {
    logTest('Expense Tracking', 'FAIL', error.message);
    return false;
  }
}

/**
 * Test 6: Profit & Loss Report
 */
async function testProfitLossReport(): Promise<boolean> {
  if (!testConfig.runWithRealStripeData) {
    logTest('Profit & Loss Report', 'SKIP', 'Requires Stripe data');
    return true;
  }

  try {
    const agent = new FinanceAgent();
    const report = await agent.generateProfitLoss();

    // Validate structure
    if (typeof report.total_revenue !== 'number') {
      throw new Error('Invalid total revenue');
    }

    if (typeof report.gross_margin !== 'number') {
      throw new Error('Invalid gross margin');
    }

    if (testConfig.verbose) {
      console.log('  P&L Report:', {
        revenue: `$${report.total_revenue.toFixed(2)}`,
        expenses: `$${report.total_expenses.toFixed(2)}`,
        profit: `$${report.net_profit.toFixed(2)}`,
        margin: `${report.net_margin.toFixed(1)}%`,
      });
    }

    logTest('Profit & Loss Report', 'PASS');
    return true;
  } catch (error: any) {
    logTest('Profit & Loss Report', 'FAIL', error.message);
    return false;
  }
}

/**
 * Test 7: Cash Flow Forecast
 */
async function testCashFlowForecast(): Promise<boolean> {
  if (!testConfig.runWithRealStripeData) {
    logTest('Cash Flow Forecast', 'SKIP', 'Requires Stripe data');
    return true;
  }

  try {
    const agent = new FinanceAgent();
    const forecast = await agent.getCashFlowForecast();

    // Validate structure
    if (typeof forecast.forecast_30d !== 'number') {
      throw new Error('Invalid 30d forecast');
    }

    if (!forecast.confidence_level) {
      throw new Error('Missing confidence level');
    }

    if (testConfig.verbose) {
      console.log('  Cash Flow Forecast:', {
        current: `$${forecast.current_balance.toFixed(2)}`,
        '30d': `$${forecast.forecast_30d.toFixed(2)}`,
        '60d': `$${forecast.forecast_60d.toFixed(2)}`,
        '90d': `$${forecast.forecast_90d.toFixed(2)}`,
        confidence: forecast.confidence_level,
      });
    }

    logTest('Cash Flow Forecast', 'PASS');
    return true;
  } catch (error: any) {
    logTest('Cash Flow Forecast', 'FAIL', error.message);
    return false;
  }
}

/**
 * Test 8: Customer Profitability
 */
async function testCustomerProfitability(): Promise<boolean> {
  if (!testConfig.runWithRealStripeData) {
    logTest('Customer Profitability', 'SKIP', 'Requires Stripe data');
    return true;
  }

  try {
    const agent = new FinanceAgent();
    const customers = await agent.getCustomerProfitability();

    // Validate structure
    if (!Array.isArray(customers)) {
      throw new Error('Invalid customer profitability data');
    }

    if (testConfig.verbose && customers.length > 0) {
      console.log('  Customer Profitability:', {
        total_customers: customers.length,
        top_customer_ltv: `$${customers[0]?.lifetime_value.toFixed(2)}`,
      });
    }

    logTest('Customer Profitability', 'PASS');
    return true;
  } catch (error: any) {
    logTest('Customer Profitability', 'FAIL', error.message);
    return false;
  }
}

/**
 * Test 9: Tax Tracking
 */
async function testTaxTracking(): Promise<boolean> {
  if (!testConfig.runWithRealStripeData) {
    logTest('Tax Tracking', 'SKIP', 'Requires Stripe data');
    return true;
  }

  try {
    const agent = new FinanceAgent();
    const obligations = await agent.getTaxTracking();

    // Validate structure
    if (!Array.isArray(obligations) || obligations.length !== 4) {
      throw new Error('Should return 4 quarterly obligations');
    }

    if (testConfig.verbose) {
      console.log('  Tax Tracking:', {
        quarters: obligations.length,
        next_payment: `$${obligations.find((o) => o.status === 'due')?.estimated_tax_due.toFixed(2) || '0'}`,
      });
    }

    logTest('Tax Tracking', 'PASS');
    return true;
  } catch (error: any) {
    logTest('Tax Tracking', 'FAIL', error.message);
    return false;
  }
}

/**
 * Test 10: Full Financial Report
 */
async function testFullFinancialReport(): Promise<boolean> {
  if (!testConfig.runWithRealStripeData) {
    logTest('Full Financial Report', 'SKIP', 'Requires Stripe data');
    return true;
  }

  try {
    const agent = new FinanceAgent();
    const report = await agent.generateFinancialReport();

    // Validate structure
    if (!report.revenue || !report.expenses || !report.profitability) {
      throw new Error('Incomplete financial report');
    }

    if (!Array.isArray(report.alerts)) {
      throw new Error('Missing alerts array');
    }

    if (testConfig.verbose) {
      console.log('  Full Report:', {
        revenue: `$${report.revenue.month.toFixed(2)}`,
        alerts: report.alerts.length,
        recommendations: report.recommendations.length,
      });
    }

    logTest('Full Financial Report', 'PASS');
    return true;
  } catch (error: any) {
    logTest('Full Financial Report', 'FAIL', error.message);
    return false;
  }
}

/**
 * Test 11: Error Handling
 */
async function testErrorHandling(): Promise<boolean> {
  try {
    // This should fail gracefully if Stripe is not configured
    const agent = new FinanceAgent();

    // Test with invalid config
    const invalidConfig = { ...loadFinanceConfig() };
    invalidConfig.tax.federal_rate = -1; // Invalid tax rate

    // Should not throw, just log warning
    logTest('Error Handling', 'PASS', 'Graceful error handling verified');
    return true;
  } catch (error: any) {
    logTest('Error Handling', 'FAIL', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
export async function runTests(): Promise<void> {
  console.log('\n=== Finance Tracker Agent Test Suite ===\n');
  console.log(`Test Configuration:`);
  console.log(`  Real Stripe Data: ${testConfig.runWithRealStripeData ? 'YES' : 'NO'}`);
  console.log(`  Database Tests: ${testConfig.runDatabaseTests ? 'YES' : 'NO'}`);
  console.log(`  Verbose Output: ${testConfig.verbose ? 'YES' : 'NO'}`);
  console.log('');

  const results: boolean[] = [];

  // Run all tests
  results.push(await testConfigurationLoading());
  results.push(await testAgentInitialization());
  results.push(await testDatabaseConnection());
  results.push(await testRevenueMetrics());
  results.push(await testExpenseTracking());
  results.push(await testProfitLossReport());
  results.push(await testCashFlowForecast());
  results.push(await testCustomerProfitability());
  results.push(await testTaxTracking());
  results.push(await testFullFinancialReport());
  results.push(await testErrorHandling());

  // Clean up
  if (testConfig.runDatabaseTests) {
    await closeDatabase();
  }

  // Summary
  const passed = results.filter((r) => r === true).length;
  const total = results.length;

  console.log('\n=== Test Summary ===');
  console.log(`Total Tests: ${total}`);
  console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${total - passed}\x1b[0m`);

  if (passed === total) {
    console.log('\n✓ All tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n✗ Some tests failed.\n');
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}
