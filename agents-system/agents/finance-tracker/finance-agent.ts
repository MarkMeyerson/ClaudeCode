/**
 * Finance Tracker Agent - Core Logic
 * Monitors revenue, expenses, profitability, and provides financial insights
 */

import {
  getCharges,
  getSubscriptions,
  getCustomers,
  calculateRevenue,
  calculateMRR,
} from '../../shared/clients/stripe-client';
import { sendMessage } from '../../shared/clients/claude-client';
import { logger } from '../../shared/utils/logger';
import { storeBusinessMetric } from '../../shared/database/db';
import { loadFinanceConfig, FinanceTrackerConfig } from './config';
import {
  RevenueMetrics,
  RevenueBreakdown,
  ExpenseTracking,
  ProfitLossReport,
  CashFlowForecast,
  CustomerProfitability,
  PricingRecommendation,
  TaxObligation,
  FinancialAlert,
  FinanceMetrics,
} from './types';
import {
  SYSTEM_PROMPT,
  getFinancialAnalysisPrompt,
  getCashFlowForecastPrompt,
  getPricingRecommendationPrompt,
  getCustomerProfitabilityPrompt,
  getTaxObligationPrompt,
} from './prompts';

export class FinanceAgent {
  private config: FinanceTrackerConfig;

  constructor(config?: FinanceTrackerConfig) {
    this.config = config || loadFinanceConfig();
    logger.info('Finance Agent initialized', {
      monthly_goal: this.config.targets.monthly_revenue_goal,
    });
  }

  /**
   * Get revenue metrics for different time periods
   */
  async getRevenueMetrics(): Promise<RevenueMetrics & RevenueBreakdown> {
    logger.info('Calculating revenue metrics');

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
      const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
      const twoYearsAgo = new Date(today.getTime() - 730 * 24 * 60 * 60 * 1000);

      // Get charges for different periods
      const [todayCharges, weekCharges, monthCharges, yearCharges, prevMonthCharges, prevYearCharges] =
        await Promise.all([
          getCharges(today, now),
          getCharges(weekAgo, now),
          getCharges(monthAgo, now),
          getCharges(yearAgo, now),
          getCharges(twoMonthsAgo, monthAgo),
          getCharges(twoYearsAgo, yearAgo),
        ]);

      // Calculate revenue
      const todayRevenue = calculateRevenue(todayCharges);
      const weekRevenue = calculateRevenue(weekCharges);
      const monthRevenue = calculateRevenue(monthCharges);
      const yearRevenue = calculateRevenue(yearCharges);
      const prevMonthRevenue = calculateRevenue(prevMonthCharges);
      const prevYearRevenue = calculateRevenue(prevYearCharges);

      // Calculate growth rates
      const growthRateMoM =
        prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;
      const growthRateYoY =
        prevYearRevenue > 0 ? ((yearRevenue - prevYearRevenue) / prevYearRevenue) * 100 : 0;

      // Get subscriptions for MRR/ARR
      const activeSubscriptions = await getSubscriptions('active');
      const mrr = calculateMRR(activeSubscriptions);
      const arr = mrr * 12;

      // Calculate one-time vs subscription revenue (approximate)
      const subscriptionRevenue = mrr * 1; // This month's subscription revenue
      const oneTimeRevenue = monthRevenue - subscriptionRevenue;

      const metrics = {
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
        year: yearRevenue,
        growth_rate_mom: growthRateMoM,
        growth_rate_yoy: growthRateYoY,
        subscription_revenue: subscriptionRevenue,
        one_time_revenue: Math.max(0, oneTimeRevenue),
        total_revenue: monthRevenue,
        mrr,
        arr,
      };

      // Store metrics in database
      await this.storeRevenueMetrics(metrics);

      logger.info('Revenue metrics calculated', {
        month: monthRevenue,
        mrr,
        growth_mom: growthRateMoM.toFixed(2),
      });

      return metrics;
    } catch (error: any) {
      logger.error('Failed to calculate revenue metrics', { error: error.message });
      throw error;
    }
  }

  /**
   * Track business expenses (stub - would integrate with expense tracking system)
   */
  async getExpenseTracking(): Promise<ExpenseTracking> {
    logger.info('Tracking expenses');

    try {
      // In a real implementation, this would pull from an expense tracking system
      // For now, we'll use placeholder data
      const categories = this.config.expense_categories.map((category, index) => ({
        category,
        amount: Math.random() * 5000 + 1000, // Placeholder
        percentage_of_total: 0,
      }));

      const totalMonth = categories.reduce((sum, cat) => sum + cat.amount, 0);
      const totalYear = totalMonth * 12; // Simplified

      // Calculate percentages
      categories.forEach((cat) => {
        cat.percentage_of_total = (cat.amount / totalMonth) * 100;
      });

      const expenses: ExpenseTracking = {
        total_month: totalMonth,
        total_year: totalYear,
        by_category: categories,
        growth_rate_mom: 0, // Would calculate from historical data
      };

      // Store expense metrics
      await storeBusinessMetric(
        'expense',
        'total_monthly_expenses',
        totalMonth,
        new Date(),
        new Date(),
        'USD',
        { categories }
      );

      logger.info('Expense tracking completed', { total: totalMonth });

      return expenses;
    } catch (error: any) {
      logger.error('Failed to track expenses', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate Profit & Loss report
   */
  async generateProfitLoss(): Promise<ProfitLossReport> {
    logger.info('Generating P&L report');

    try {
      const revenue = await this.getRevenueMetrics();
      const expenses = await this.getExpenseTracking();

      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalRevenue = revenue.month;
      const totalExpenses = expenses.total_month;
      const grossProfit = totalRevenue - totalExpenses;
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const netProfit = grossProfit; // Simplified - would account for taxes, etc.
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      const report: ProfitLossReport = {
        period_start: monthAgo,
        period_end: now,
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        gross_profit: grossProfit,
        gross_margin: grossMargin,
        net_profit: netProfit,
        net_margin: netMargin,
      };

      // Store P&L metrics
      await storeBusinessMetric(
        'profitability',
        'monthly_profit_loss',
        netProfit,
        monthAgo,
        now,
        'USD',
        { gross_margin: grossMargin, net_margin: netMargin }
      );

      logger.info('P&L report generated', {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: netProfit,
      });

      return report;
    } catch (error: any) {
      logger.error('Failed to generate P&L report', { error: error.message });
      throw error;
    }
  }

  /**
   * Forecast cash flow for next 30/60/90 days
   */
  async getCashFlowForecast(): Promise<CashFlowForecast> {
    logger.info('Generating cash flow forecast');

    try {
      const revenue = await this.getRevenueMetrics();
      const expenses = await this.getExpenseTracking();

      // Simplified current balance calculation
      const currentBalance = revenue.month - expenses.total_month;

      // If AI forecasting is enabled, use Claude
      if (this.config.forecasting.use_ai_forecasting) {
        const historicalData = {
          revenue,
          expenses,
          mrr: revenue.mrr,
          growth_rate: revenue.growth_rate_mom,
        };

        const forecastResponse = await sendMessage(
          SYSTEM_PROMPT,
          getCashFlowForecastPrompt(historicalData, currentBalance)
        );

        try {
          const forecast = JSON.parse(forecastResponse);
          return {
            current_balance: currentBalance,
            forecast_30d: forecast.forecast_30d,
            forecast_60d: forecast.forecast_60d,
            forecast_90d: forecast.forecast_90d,
            confidence_level: forecast.confidence_level,
            assumptions: forecast.assumptions,
          };
        } catch (parseError) {
          logger.warn('Failed to parse AI forecast, using simple projection');
        }
      }

      // Simple projection if AI forecasting is disabled or fails
      const monthlyNetCashFlow = revenue.month - expenses.total_month;
      const conservativeFactor = this.config.forecasting.conservative_factor;

      const forecast: CashFlowForecast = {
        current_balance: currentBalance,
        forecast_30d: currentBalance + monthlyNetCashFlow * conservativeFactor,
        forecast_60d: currentBalance + monthlyNetCashFlow * 2 * conservativeFactor,
        forecast_90d: currentBalance + monthlyNetCashFlow * 3 * conservativeFactor,
        confidence_level: 'medium',
        assumptions: [
          'Based on current monthly trends',
          `Using ${(conservativeFactor * 100).toFixed(0)}% conservative factor`,
          'Assumes no major changes in revenue or expenses',
        ],
      };

      // Calculate runway if applicable
      if (currentBalance > 0 && expenses.total_month > 0) {
        forecast.projected_runway_days = Math.floor((currentBalance / expenses.total_month) * 30);
      }

      logger.info('Cash flow forecast generated', forecast);

      return forecast;
    } catch (error: any) {
      logger.error('Failed to generate cash flow forecast', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze customer profitability
   */
  async getCustomerProfitability(): Promise<CustomerProfitability[]> {
    logger.info('Analyzing customer profitability');

    try {
      const customers = await getCustomers(100);
      const subscriptions = await getSubscriptions('all');

      const profitability: CustomerProfitability[] = customers.map((customer) => {
        // Find customer's subscriptions
        const customerSubs = subscriptions.filter((sub) => sub.customer === customer.id);

        // Calculate LTV (simplified)
        const totalRevenue = customerSubs.reduce((sum, sub) => {
          const amount = sub.items.data[0]?.price?.unit_amount || 0;
          return sum + amount / 100;
        }, 0);

        const ltv = totalRevenue * 12; // Simplified LTV calculation
        const profitabilityScore = Math.min(100, (ltv / 1000) * 10); // Score out of 100

        let segment: 'high-value' | 'medium-value' | 'low-value' = 'low-value';
        if (ltv >= this.config.customer_segments.high_value_ltv) {
          segment = 'high-value';
        } else if (ltv >= this.config.customer_segments.medium_value_ltv) {
          segment = 'medium-value';
        }

        return {
          customer_id: customer.id,
          customer_name: customer.name || customer.email,
          lifetime_value: ltv,
          total_revenue: totalRevenue,
          average_order_value: totalRevenue,
          purchase_frequency: customerSubs.length,
          profitability_score: profitabilityScore,
          segment,
        };
      });

      // Sort by LTV descending
      profitability.sort((a, b) => b.lifetime_value - a.lifetime_value);

      logger.info('Customer profitability analyzed', {
        total_customers: profitability.length,
        high_value: profitability.filter((c) => c.segment === 'high-value').length,
      });

      return profitability.slice(0, 20); // Return top 20
    } catch (error: any) {
      logger.error('Failed to analyze customer profitability', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate pricing recommendations
   */
  async getPricingRecommendations(): Promise<PricingRecommendation[]> {
    logger.info('Generating pricing recommendations');

    try {
      const revenue = await this.getRevenueMetrics();
      const customers = await this.getCustomerProfitability();

      const revenueData = { mrr: revenue.mrr, arr: revenue.arr, growth: revenue.growth_rate_mom };
      const customerData = { total: customers.length, segments: {} };

      if (this.config.forecasting.use_ai_forecasting) {
        const recommendationResponse = await sendMessage(
          SYSTEM_PROMPT,
          getPricingRecommendationPrompt(revenueData, customerData)
        );

        try {
          const parsed = JSON.parse(recommendationResponse);
          return parsed.recommendations || [];
        } catch (parseError) {
          logger.warn('Failed to parse pricing recommendations');
        }
      }

      // Simple recommendation if AI is disabled
      const recommendations: PricingRecommendation[] = [
        {
          current_price: revenue.mrr / customers.length || 0,
          recommended_price: (revenue.mrr / customers.length || 0) * 1.1,
          potential_revenue_impact: revenue.mrr * 0.1,
          rationale: 'Based on market trends, a 10% price increase could improve margins',
          confidence: 'medium',
        },
      ];

      logger.info('Pricing recommendations generated', { count: recommendations.length });

      return recommendations;
    } catch (error: any) {
      logger.error('Failed to generate pricing recommendations', { error: error.message });
      throw error;
    }
  }

  /**
   * Track quarterly tax obligations
   */
  async getTaxTracking(): Promise<TaxObligation[]> {
    logger.info('Tracking tax obligations');

    try {
      const revenue = await this.getRevenueMetrics();
      const expenses = await this.getExpenseTracking();

      const quarterlyRevenue = revenue.month * 3; // Approximation
      const quarterlyExpenses = expenses.total_month * 3;
      const taxableIncome = Math.max(0, quarterlyRevenue - quarterlyExpenses);

      const federalTax = taxableIncome * this.config.tax.federal_rate;
      const stateTax = taxableIncome * this.config.tax.state_rate;
      const totalTax = federalTax + stateTax;

      const now = new Date();
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const currentYear = now.getFullYear();

      const obligations: TaxObligation[] = [];

      for (let i = 0; i < 4; i++) {
        const quarterDate = new Date(currentYear, i * 3, 1);
        const dueDate = this.getQuarterlyTaxDueDate(i, currentYear);

        let status: 'upcoming' | 'due' | 'paid' | 'overdue' = 'upcoming';
        if (i < currentQuarter) {
          status = 'paid'; // Assume past quarters are paid (would check records)
        } else if (i === currentQuarter) {
          status = now > dueDate ? 'overdue' : 'due';
        }

        obligations.push({
          quarter: `Q${i + 1}`,
          year: currentYear,
          estimated_tax_due: totalTax / 4,
          revenue_subject_to_tax: quarterlyRevenue / 4,
          tax_rate: this.config.tax.federal_rate + this.config.tax.state_rate,
          payment_due_date: dueDate,
          status,
        });
      }

      logger.info('Tax tracking completed', { total_annual_tax: totalTax });

      return obligations;
    } catch (error: any) {
      logger.error('Failed to track tax obligations', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate comprehensive financial report
   */
  async generateFinancialReport(): Promise<FinanceMetrics> {
    logger.info('Generating comprehensive financial report');

    try {
      const [revenue, expenses, profitability, cashFlow, customerProfitability, pricingRecs] =
        await Promise.all([
          this.getRevenueMetrics(),
          this.getExpenseTracking(),
          this.generateProfitLoss(),
          this.getCashFlowForecast(),
          this.getCustomerProfitability(),
          this.getPricingRecommendations(),
        ]);

      // Generate alerts
      const alerts = this.generateAlerts(revenue, expenses, cashFlow);

      // Count customers
      const allCustomers = await getCustomers(1000);
      const activeSubscriptions = await getSubscriptions('active');
      const churnRate = this.calculateChurnRate(allCustomers, activeSubscriptions);

      const metrics: FinanceMetrics = {
        timestamp: new Date(),
        revenue,
        expenses,
        profitability,
        cash_flow: cashFlow,
        customer_insights: {
          total_customers: allCustomers.length,
          active_customers: activeSubscriptions.length,
          churn_rate: churnRate,
          top_customers: customerProfitability.slice(0, 10),
        },
        alerts,
        recommendations: pricingRecs,
      };

      logger.info('Financial report generated successfully');

      return metrics;
    } catch (error: any) {
      logger.error('Failed to generate financial report', { error: error.message });
      throw error;
    }
  }

  /**
   * Helper: Store revenue metrics in database
   */
  private async storeRevenueMetrics(
    metrics: RevenueMetrics & RevenueBreakdown
  ): Promise<void> {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    await Promise.all([
      storeBusinessMetric('revenue', 'monthly_revenue', metrics.month, monthAgo, now, 'USD'),
      storeBusinessMetric('revenue', 'mrr', metrics.mrr, monthAgo, now, 'USD'),
      storeBusinessMetric('revenue', 'arr', metrics.arr, monthAgo, now, 'USD'),
      storeBusinessMetric(
        'revenue',
        'growth_rate_mom',
        metrics.growth_rate_mom,
        monthAgo,
        now,
        'percent'
      ),
    ]);
  }

  /**
   * Helper: Generate financial alerts
   */
  private generateAlerts(
    revenue: RevenueMetrics & RevenueBreakdown,
    expenses: ExpenseTracking,
    cashFlow: CashFlowForecast
  ): FinancialAlert[] {
    const alerts: FinancialAlert[] = [];

    // Low cash flow alert
    if (
      cashFlow.projected_runway_days &&
      cashFlow.projected_runway_days < this.config.alerts.low_cash_flow_days
    ) {
      alerts.push({
        type: 'critical',
        category: 'cash-flow',
        message: `Low runway: Only ${cashFlow.projected_runway_days} days of cash remaining`,
        impact: 'high',
        recommended_action: 'Reduce expenses, accelerate collections, or raise capital',
      });
    }

    // Revenue drop alert
    if (revenue.growth_rate_mom < -this.config.alerts.revenue_drop_threshold) {
      alerts.push({
        type: 'warning',
        category: 'revenue',
        message: `Revenue dropped ${Math.abs(revenue.growth_rate_mom).toFixed(1)}% month-over-month`,
        impact: 'high',
        recommended_action: 'Investigate cause and implement retention strategies',
      });
    }

    // Revenue below target
    if (revenue.month < this.config.targets.monthly_revenue_goal) {
      const shortfall =
        ((this.config.targets.monthly_revenue_goal - revenue.month) /
          this.config.targets.monthly_revenue_goal) *
        100;
      alerts.push({
        type: 'info',
        category: 'revenue',
        message: `Monthly revenue is ${shortfall.toFixed(1)}% below target`,
        impact: 'medium',
        recommended_action: 'Review sales pipeline and marketing effectiveness',
      });
    }

    return alerts;
  }

  /**
   * Helper: Calculate churn rate
   */
  private calculateChurnRate(customers: any[], activeSubscriptions: any[]): number {
    if (customers.length === 0) return 0;
    const churnedCount = customers.length - activeSubscriptions.length;
    return (churnedCount / customers.length) * 100;
  }

  /**
   * Helper: Get quarterly tax due date
   */
  private getQuarterlyTaxDueDate(quarter: number, year: number): Date {
    const dueDates = this.config.tax.quarterly_payment_dates;
    const [month, day] = dueDates[quarter].split('-').map(Number);

    // Q4 is due the following year
    const dueYear = quarter === 3 ? year + 1 : year;
    return new Date(dueYear, month - 1, day);
  }
}

export default FinanceAgent;
