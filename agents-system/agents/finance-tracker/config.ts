/**
 * Finance Tracker Agent Configuration
 */

export interface FinanceTrackerConfig {
  // Tax settings
  tax: {
    federal_rate: number; // Federal tax rate as decimal (e.g., 0.21 for 21%)
    state_rate: number; // State tax rate as decimal
    quarterly_payment_dates: string[]; // Dates when quarterly taxes are due
  };

  // Expense categories for tracking
  expense_categories: string[];

  // Revenue targets and goals
  targets: {
    monthly_revenue_goal: number;
    annual_revenue_goal: number;
    monthly_expense_budget: number;
    target_gross_margin: number; // As percentage
    target_net_margin: number; // As percentage
  };

  // Alert thresholds
  alerts: {
    low_cash_flow_days: number; // Alert if runway drops below this many days
    revenue_drop_threshold: number; // Alert if revenue drops by this percentage
    expense_spike_threshold: number; // Alert if expenses increase by this percentage
    high_churn_rate: number; // Alert if churn rate exceeds this percentage
  };

  // Customer segmentation thresholds
  customer_segments: {
    high_value_ltv: number; // LTV threshold for high-value customers
    medium_value_ltv: number; // LTV threshold for medium-value customers
  };

  // Forecasting settings
  forecasting: {
    use_ai_forecasting: boolean; // Whether to use Claude for forecasting
    historical_data_months: number; // How many months of history to use
    conservative_factor: number; // Multiplier for conservative estimates (e.g., 0.9 for 10% reduction)
  };
}

// Default configuration
export const defaultConfig: FinanceTrackerConfig = {
  tax: {
    federal_rate: 0.21, // 21% federal corporate tax
    state_rate: 0.05, // 5% state tax (varies by state)
    quarterly_payment_dates: [
      '04-15', // Q1 (January-March)
      '06-15', // Q2 (April-May)
      '09-15', // Q3 (June-August)
      '01-15', // Q4 (September-December, due following year)
    ],
  },

  expense_categories: [
    'Software & Tools',
    'Marketing & Advertising',
    'Payroll & Contractors',
    'Office & Operations',
    'Professional Services',
    'Infrastructure & Hosting',
    'Travel & Entertainment',
    'Other',
  ],

  targets: {
    monthly_revenue_goal: 50000, // $50k/month
    annual_revenue_goal: 600000, // $600k/year
    monthly_expense_budget: 30000, // $30k/month
    target_gross_margin: 70, // 70%
    target_net_margin: 30, // 30%
  },

  alerts: {
    low_cash_flow_days: 90, // Alert if runway < 90 days
    revenue_drop_threshold: 15, // Alert if revenue drops > 15%
    expense_spike_threshold: 20, // Alert if expenses increase > 20%
    high_churn_rate: 5, // Alert if churn > 5%
  },

  customer_segments: {
    high_value_ltv: 10000, // Customers with LTV > $10k
    medium_value_ltv: 5000, // Customers with LTV > $5k
  },

  forecasting: {
    use_ai_forecasting: true,
    historical_data_months: 6,
    conservative_factor: 0.9, // Use 90% of projections for conservative estimates
  },
};

/**
 * Load configuration with overrides from environment
 */
export function loadFinanceConfig(): FinanceTrackerConfig {
  const config = { ...defaultConfig };

  // Override from environment variables if provided
  if (process.env.FINANCE_MONTHLY_REVENUE_GOAL) {
    config.targets.monthly_revenue_goal = parseFloat(process.env.FINANCE_MONTHLY_REVENUE_GOAL);
  }

  if (process.env.FINANCE_FEDERAL_TAX_RATE) {
    config.tax.federal_rate = parseFloat(process.env.FINANCE_FEDERAL_TAX_RATE);
  }

  if (process.env.FINANCE_STATE_TAX_RATE) {
    config.tax.state_rate = parseFloat(process.env.FINANCE_STATE_TAX_RATE);
  }

  return config;
}
