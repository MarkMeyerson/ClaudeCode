/**
 * Finance Tracker Agent Type Definitions
 */

// Revenue metrics by time period
export interface RevenueMetrics {
  today: number;
  week: number;
  month: number;
  year: number;
  growth_rate_mom: number; // Month-over-month growth percentage
  growth_rate_yoy: number; // Year-over-year growth percentage
}

// Revenue breakdown by source
export interface RevenueBreakdown {
  subscription_revenue: number;
  one_time_revenue: number;
  total_revenue: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
}

// Expense category
export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage_of_total: number;
}

// Expense tracking
export interface ExpenseTracking {
  total_month: number;
  total_year: number;
  by_category: ExpenseCategory[];
  growth_rate_mom: number;
}

// Profit & Loss report
export interface ProfitLossReport {
  period_start: Date;
  period_end: Date;
  total_revenue: number;
  total_expenses: number;
  gross_profit: number;
  gross_margin: number; // Percentage
  net_profit: number;
  net_margin: number; // Percentage
  ebitda?: number;
}

// Cash flow forecast
export interface CashFlowForecast {
  current_balance: number;
  forecast_30d: number;
  forecast_60d: number;
  forecast_90d: number;
  projected_runway_days?: number;
  confidence_level: 'high' | 'medium' | 'low';
  assumptions: string[];
}

// Customer profitability analysis
export interface CustomerProfitability {
  customer_id: string;
  customer_name: string;
  lifetime_value: number;
  total_revenue: number;
  average_order_value: number;
  purchase_frequency: number;
  profitability_score: number; // 0-100
  segment: 'high-value' | 'medium-value' | 'low-value';
}

// Pricing recommendation
export interface PricingRecommendation {
  current_price: number;
  recommended_price: number;
  potential_revenue_impact: number;
  rationale: string;
  confidence: 'high' | 'medium' | 'low';
}

// Tax obligation
export interface TaxObligation {
  quarter: string;
  year: number;
  estimated_tax_due: number;
  revenue_subject_to_tax: number;
  tax_rate: number;
  payment_due_date: Date;
  status: 'upcoming' | 'due' | 'paid' | 'overdue';
}

// Financial alert
export interface FinancialAlert {
  type: 'warning' | 'critical' | 'info';
  category: 'cash-flow' | 'revenue' | 'expense' | 'tax' | 'other';
  message: string;
  impact: 'high' | 'medium' | 'low';
  recommended_action?: string;
}

// Complete financial metrics
export interface FinanceMetrics {
  timestamp: Date;
  revenue: RevenueMetrics & RevenueBreakdown;
  expenses: ExpenseTracking;
  profitability: ProfitLossReport;
  cash_flow: CashFlowForecast;
  customer_insights?: {
    total_customers: number;
    active_customers: number;
    churn_rate: number;
    top_customers: CustomerProfitability[];
  };
  alerts: FinancialAlert[];
  recommendations: PricingRecommendation[];
}

// Financial report output
export interface FinancialReport {
  execution_id: string;
  generated_at: Date;
  metrics: FinanceMetrics;
  summary: string;
  next_actions: string[];
}
