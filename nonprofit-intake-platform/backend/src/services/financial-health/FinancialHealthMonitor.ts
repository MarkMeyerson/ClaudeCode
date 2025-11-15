/**
 * Financial Health Monitor
 * Real-time financial health monitoring, cash flow forecasting, and sustainability analysis
 * Provides predictive insights and early warning system for financial risks
 */

import { Organization } from '../../types';

export interface FinancialHealthMetrics {
  orgId: string;
  asOfDate: Date;

  // Overall Health Score (0-100)
  overallHealthScore: number;
  healthTrend: 'improving' | 'stable' | 'declining';
  healthLevel: 'excellent' | 'good' | 'fair' | 'at_risk' | 'critical';

  // Liquidity Metrics
  monthsOfReserves: number;
  currentRatio: number;
  quickRatio: number;
  cashToExpensesRatio: number;

  // Sustainability Metrics
  revenueGrowthRate: number; // %
  expenseGrowthRate: number; // %
  netMargin: number; // %
  sustainabilityIndex: number; // 0-100

  // Efficiency Metrics
  programExpenseRatio: number; // %
  fundraisingEfficiency: number; // $ raised per $ spent
  administrativeEfficiency: number; // %

  // Revenue Metrics
  revenueDiversification: number; // 0-100 (higher = more diversified)
  topDonorConcentration: number; // % from top 10 donors
  recurringRevenueRatio: number; // %

  // Forecast Metrics
  projectedCashPosition3Month: number;
  projectedCashPosition6Month: number;
  projectedCashPosition12Month: number;
  burnRate: number; // monthly cash consumption
  runwayMonths: number; // months until cash depleted at current burn rate

  // Risk Indicators
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  opportunityFactors: OpportunityFactor[];
}

export interface RiskFactor {
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: number; // 0-100
  impact: number; // 0-100
  mitigationActions: string[];
}

export interface OpportunityFactor {
  category: string;
  description: string;
  potentialValue: number;
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  actionSteps: string[];
}

export interface CashFlowForecast {
  forecastPeriods: ForecastPeriod[];
  assumptions: ForecastAssumption[];
  scenarios: ForecastScenario[];
  recommendations: string[];
}

export interface ForecastPeriod {
  period: string; // e.g., "2025-Q1", "2025-02"
  startDate: Date;
  endDate: Date;

  // Projected Values
  beginningCash: number;
  projectedRevenue: number;
  projectedExpenses: number;
  netCashFlow: number;
  endingCash: number;

  // Confidence Levels
  confidenceLevel: 'high' | 'medium' | 'low';
  confidenceScore: number; // 0-100

  // Variance Analysis
  actualRevenue?: number;
  actualExpenses?: number;
  revenueVariance?: number; // % difference from projection
  expenseVariance?: number;
}

export interface ForecastAssumption {
  category: string;
  description: string;
  value: any;
  confidence: 'high' | 'medium' | 'low';
}

export interface ForecastScenario {
  name: string; // 'best_case', 'base_case', 'worst_case'
  probability: number; // 0-100
  description: string;
  projectedEndingCash12Month: number;
  keyAssumptions: string[];
}

export interface FinancialAlert {
  alertId: string;
  alertType: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  impact: string;
  recommendedActions: string[];
  dueDate?: Date;
  dismissed: boolean;
  createdAt: Date;
}

export class FinancialHealthMonitor {
  /**
   * Calculate comprehensive financial health metrics
   */
  async calculateHealthMetrics(
    organization: Organization,
    historicalData?: FinancialData[]
  ): Promise<FinancialHealthMetrics> {
    const metrics: FinancialHealthMetrics = {
      orgId: organization.orgId,
      asOfDate: new Date(),
      overallHealthScore: 0,
      healthTrend: 'stable',
      healthLevel: 'good',

      // Liquidity
      monthsOfReserves: this.calculateMonthsOfReserves(organization),
      currentRatio: this.calculateCurrentRatio(organization),
      quickRatio: this.calculateQuickRatio(organization),
      cashToExpensesRatio: this.calculateCashToExpensesRatio(organization),

      // Sustainability
      revenueGrowthRate: this.calculateRevenueGrowth(organization, historicalData),
      expenseGrowthRate: this.calculateExpenseGrowth(organization, historicalData),
      netMargin: this.calculateNetMargin(organization),
      sustainabilityIndex: 0,

      // Efficiency
      programExpenseRatio: organization.programExpenseRatio || 0,
      fundraisingEfficiency: this.calculateFundraisingEfficiency(organization),
      administrativeEfficiency: organization.adminExpenseRatio || 0,

      // Revenue
      revenueDiversification: this.calculateRevenueDiversification(organization),
      topDonorConcentration: 0,
      recurringRevenueRatio: 0,

      // Forecast
      projectedCashPosition3Month: 0,
      projectedCashPosition6Month: 0,
      projectedCashPosition12Month: 0,
      burnRate: this.calculateBurnRate(organization),
      runwayMonths: this.calculateRunwayMonths(organization),

      // Risks
      riskLevel: 'low',
      riskFactors: [],
      opportunityFactors: [],
    };

    // Calculate overall health score
    metrics.overallHealthScore = this.calculateOverallHealthScore(metrics);
    metrics.healthLevel = this.determineHealthLevel(metrics.overallHealthScore);
    metrics.healthTrend = this.determineHealthTrend(organization, historicalData);
    metrics.sustainabilityIndex = this.calculateSustainabilityIndex(metrics);

    // Identify risks and opportunities
    metrics.riskFactors = this.identifyRiskFactors(metrics, organization);
    metrics.opportunityFactors = this.identifyOpportunities(metrics, organization);
    metrics.riskLevel = this.determineOverallRiskLevel(metrics.riskFactors);

    return metrics;
  }

  /**
   * Generate cash flow forecast
   */
  async generateCashFlowForecast(
    organization: Organization,
    forecastMonths: number = 12
  ): Promise<CashFlowForecast> {
    const assumptions = this.buildForecastAssumptions(organization);
    const scenarios = this.buildScenarios(organization, forecastMonths);

    // Generate monthly forecasts for base case
    const forecastPeriods = this.generateForecastPeriods(
      organization,
      forecastMonths,
      'base_case'
    );

    const recommendations = this.generateForecastRecommendations(
      forecastPeriods,
      scenarios
    );

    return {
      forecastPeriods,
      assumptions,
      scenarios,
      recommendations,
    };
  }

  /**
   * Get active financial alerts
   */
  async getFinancialAlerts(organization: Organization): Promise<FinancialAlert[]> {
    const alerts: FinancialAlert[] = [];

    const metrics = await this.calculateHealthMetrics(organization);

    // Low reserves alert
    if (metrics.monthsOfReserves < 3) {
      alerts.push({
        alertId: `alert-${Date.now()}-reserves`,
        alertType: metrics.monthsOfReserves < 1 ? 'critical' : 'warning',
        category: 'Liquidity',
        title: 'Low Operating Reserves',
        description: `Operating reserves of ${metrics.monthsOfReserves.toFixed(1)} months is below recommended minimum of 3-6 months`,
        impact: 'Organization may face cash flow challenges if unexpected expenses arise',
        recommendedActions: [
          'Develop reserve building strategy',
          'Review and reduce discretionary expenses',
          'Accelerate fundraising efforts',
          'Consider line of credit as safety net',
        ],
        dismissed: false,
        createdAt: new Date(),
      });
    }

    // Negative cash flow trend
    if (metrics.burnRate > 0 && metrics.runwayMonths < 12) {
      alerts.push({
        alertId: `alert-${Date.now()}-cashflow`,
        alertType: metrics.runwayMonths < 6 ? 'critical' : 'warning',
        category: 'Cash Flow',
        title: 'Declining Cash Position',
        description: `At current burn rate, organization has ${metrics.runwayMonths.toFixed(0)} months of runway`,
        impact: 'Cash reserves may be depleted without intervention',
        recommendedActions: [
          'Implement immediate expense reduction plan',
          'Launch emergency fundraising campaign',
          'Explore bridge financing options',
          'Review revenue projections and adjust strategy',
        ],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        dismissed: false,
        createdAt: new Date(),
      });
    }

    // High donor concentration
    if (metrics.topDonorConcentration > 50) {
      alerts.push({
        alertId: `alert-${Date.now()}-concentration`,
        alertType: 'warning',
        category: 'Revenue Risk',
        title: 'High Donor Concentration',
        description: `${metrics.topDonorConcentration}% of revenue comes from top 10 donors`,
        impact: 'Loss of major donor could significantly impact operations',
        recommendedActions: [
          'Develop individual donor acquisition plan',
          'Diversify revenue streams',
          'Strengthen relationships with major donors',
          'Build planned giving program',
        ],
        dismissed: false,
        createdAt: new Date(),
      });
    }

    return alerts;
  }

  // ============================================================================
  // CALCULATION METHODS
  // ============================================================================

  private calculateMonthsOfReserves(org: Organization): number {
    const reserves = org.netAssets || 0;
    const monthlyExpenses = (org.totalExpenses || 0) / 12;

    return monthlyExpenses > 0 ? reserves / monthlyExpenses : 0;
  }

  private calculateCurrentRatio(org: Organization): number {
    const currentAssets = (org.totalAssets || 0) * 0.7; // Estimate
    const currentLiabilities = (org.totalLiabilities || 0) * 0.8; // Estimate

    return currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
  }

  private calculateQuickRatio(org: Organization): number {
    // Quick ratio = (Current Assets - Inventory) / Current Liabilities
    const quickAssets = (org.totalAssets || 0) * 0.6; // Estimate
    const currentLiabilities = (org.totalLiabilities || 0) * 0.8;

    return currentLiabilities > 0 ? quickAssets / currentLiabilities : 0;
  }

  private calculateCashToExpensesRatio(org: Organization): number {
    // Assuming 30% of assets are cash/equivalents
    const cash = (org.totalAssets || 0) * 0.3;
    const annualExpenses = org.totalExpenses || 0;

    return annualExpenses > 0 ? cash / annualExpenses : 0;
  }

  private calculateRevenueGrowth(
    org: Organization,
    historical?: FinancialData[]
  ): number {
    if (!historical || historical.length < 2) return 0;

    const currentRevenue = org.totalRevenue || 0;
    const priorRevenue = historical[historical.length - 1].totalRevenue;

    return priorRevenue > 0 ? ((currentRevenue - priorRevenue) / priorRevenue) * 100 : 0;
  }

  private calculateExpenseGrowth(
    org: Organization,
    historical?: FinancialData[]
  ): number {
    if (!historical || historical.length < 2) return 0;

    const currentExpenses = org.totalExpenses || 0;
    const priorExpenses = historical[historical.length - 1].totalExpenses;

    return priorExpenses > 0 ? ((currentExpenses - priorExpenses) / priorExpenses) * 100 : 0;
  }

  private calculateNetMargin(org: Organization): number {
    const revenue = org.totalRevenue || 0;
    const expenses = org.totalExpenses || 0;
    const netIncome = revenue - expenses;

    return revenue > 0 ? (netIncome / revenue) * 100 : 0;
  }

  private calculateFundraisingEfficiency(org: Organization): number {
    const fundraisingExpense = ((org.fundraisingExpenseRatio || 0) / 100) * (org.totalExpenses || 0);
    const totalRevenue = org.totalRevenue || 0;

    return fundraisingExpense > 0 ? totalRevenue / fundraisingExpense : 0;
  }

  private calculateRevenueDiversification(org: Organization): number {
    // Herfindahl-Hirschman Index (HHI) for revenue diversification
    // Lower HHI = more diversified (invert for our 0-100 score)

    // Simplified calculation - in production, use actual revenue breakdown
    const score = 75; // Placeholder
    return score;
  }

  private calculateBurnRate(org: Organization): number {
    const revenue = org.totalRevenue || 0;
    const expenses = org.totalExpenses || 0;
    const monthlyBurn = (expenses - revenue) / 12;

    return Math.max(0, monthlyBurn);
  }

  private calculateRunwayMonths(org: Organization): number {
    const burnRate = this.calculateBurnRate(org);
    const cash = (org.totalAssets || 0) * 0.3; // Estimate cash

    return burnRate > 0 ? cash / burnRate : Infinity;
  }

  private calculateOverallHealthScore(metrics: FinancialHealthMetrics): number {
    let score = 0;
    let weights = 0;

    // Liquidity (30%)
    const liquidityScore = this.scoreLiquidity(metrics);
    score += liquidityScore * 0.3;
    weights += 0.3;

    // Sustainability (25%)
    const sustainabilityScore = this.scoreSustainability(metrics);
    score += sustainabilityScore * 0.25;
    weights += 0.25;

    // Efficiency (20%)
    const efficiencyScore = this.scoreEfficiency(metrics);
    score += efficiencyScore * 0.2;
    weights += 0.2;

    // Revenue Health (15%)
    const revenueScore = this.scoreRevenue(metrics);
    score += revenueScore * 0.15;
    weights += 0.15;

    // Growth (10%)
    const growthScore = this.scoreGrowth(metrics);
    score += growthScore * 0.1;
    weights += 0.1;

    return Math.round(weights > 0 ? score / weights : 0);
  }

  private scoreLiquidity(metrics: FinancialHealthMetrics): number {
    let score = 0;

    // Months of reserves (0-40 points)
    if (metrics.monthsOfReserves >= 12) score += 40;
    else if (metrics.monthsOfReserves >= 6) score += 30;
    else if (metrics.monthsOfReserves >= 3) score += 20;
    else score += metrics.monthsOfReserves * 6.67;

    // Current ratio (0-30 points)
    if (metrics.currentRatio >= 2) score += 30;
    else if (metrics.currentRatio >= 1.5) score += 25;
    else if (metrics.currentRatio >= 1) score += 20;
    else score += metrics.currentRatio * 20;

    // Cash to expenses (0-30 points)
    if (metrics.cashToExpensesRatio >= 0.5) score += 30;
    else score += metrics.cashToExpensesRatio * 60;

    return Math.min(100, score);
  }

  private scoreSustainability(metrics: FinancialHealthMetrics): number {
    // Implementation similar to scoreLiquidity
    return 70; // Placeholder
  }

  private scoreEfficiency(metrics: FinancialHealthMetrics): number {
    // Implementation based on expense ratios and fundraising efficiency
    return 75; // Placeholder
  }

  private scoreRevenue(metrics: FinancialHealthMetrics): number {
    // Implementation based on diversification and recurring revenue
    return 70; // Placeholder
  }

  private scoreGrowth(metrics: FinancialHealthMetrics): number {
    // Implementation based on revenue and expense growth trends
    return 65; // Placeholder
  }

  private calculateSustainabilityIndex(metrics: FinancialHealthMetrics): number {
    // Composite index of long-term viability
    return (metrics.overallHealthScore + metrics.monthsOfReserves * 5 + (100 - metrics.riskFactors.length * 10)) / 3;
  }

  private determineHealthLevel(score: number): 'excellent' | 'good' | 'fair' | 'at_risk' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'at_risk';
    return 'critical';
  }

  private determineHealthTrend(
    org: Organization,
    historical?: FinancialData[]
  ): 'improving' | 'stable' | 'declining' {
    // Simplified - in production, analyze historical health scores
    return 'stable';
  }

  private determineOverallRiskLevel(risks: RiskFactor[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalRisks = risks.filter(r => r.severity === 'critical').length;
    const highRisks = risks.filter(r => r.severity === 'high').length;

    if (criticalRisks > 0) return 'critical';
    if (highRisks > 2) return 'high';
    if (highRisks > 0 || risks.length > 3) return 'medium';
    return 'low';
  }

  private identifyRiskFactors(
    metrics: FinancialHealthMetrics,
    org: Organization
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];

    if (metrics.monthsOfReserves < 3) {
      risks.push({
        category: 'Liquidity',
        description: 'Insufficient operating reserves',
        severity: metrics.monthsOfReserves < 1 ? 'critical' : 'high',
        likelihood: 90,
        impact: 90,
        mitigationActions: [
          'Build reserves through surplus budgeting',
          'Launch reserve campaign',
          'Reduce discretionary spending',
        ],
      });
    }

    if (metrics.netMargin < 0) {
      risks.push({
        category: 'Sustainability',
        description: 'Operating at a deficit',
        severity: 'high',
        likelihood: 85,
        impact: 85,
        mitigationActions: [
          'Review and adjust budget',
          'Increase fundraising targets',
          'Evaluate program efficiency',
        ],
      });
    }

    return risks;
  }

  private identifyOpportunities(
    metrics: FinancialHealthMetrics,
    org: Organization
  ): OpportunityFactor[] {
    const opportunities: OpportunityFactor[] = [];

    if (metrics.fundraisingEfficiency > 5) {
      opportunities.push({
        category: 'Fundraising',
        description: 'High fundraising efficiency indicates room for scaling',
        potentialValue: org.totalRevenue ? org.totalRevenue * 0.2 : 0,
        effort: 'medium',
        timeframe: '6-12 months',
        actionSteps: [
          'Increase fundraising investment proportionally',
          'Expand donor acquisition efforts',
          'Launch major gifts initiative',
        ],
      });
    }

    return opportunities;
  }

  private buildForecastAssumptions(org: Organization): ForecastAssumption[] {
    return [
      {
        category: 'Revenue',
        description: 'Revenue growth rate',
        value: '5% annually',
        confidence: 'medium',
      },
      {
        category: 'Expenses',
        description: 'Expense growth rate',
        value: '3% annually',
        confidence: 'high',
      },
    ];
  }

  private buildScenarios(org: Organization, months: number): ForecastScenario[] {
    return [
      {
        name: 'best_case',
        probability: 20,
        description: '10% revenue growth, 2% expense growth',
        projectedEndingCash12Month: 0, // Would be calculated
        keyAssumptions: ['Major grant awarded', 'Strong donor retention'],
      },
      {
        name: 'base_case',
        probability: 60,
        description: '5% revenue growth, 3% expense growth',
        projectedEndingCash12Month: 0,
        keyAssumptions: ['Normal operations', 'Typical fundraising success'],
      },
      {
        name: 'worst_case',
        probability: 20,
        description: '0% revenue growth, 5% expense growth',
        projectedEndingCash12Month: 0,
        keyAssumptions: ['Economic downturn', 'Major donor loss'],
      },
    ];
  }

  private generateForecastPeriods(
    org: Organization,
    months: number,
    scenario: string
  ): ForecastPeriod[] {
    const periods: ForecastPeriod[] = [];
    let cash = (org.totalAssets || 0) * 0.3; // Starting cash

    for (let i = 0; i < months; i++) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() + i);

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      const monthlyRevenue = (org.totalRevenue || 0) / 12;
      const monthlyExpenses = (org.totalExpenses || 0) / 12;

      periods.push({
        period: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
        startDate,
        endDate,
        beginningCash: cash,
        projectedRevenue: monthlyRevenue,
        projectedExpenses: monthlyExpenses,
        netCashFlow: monthlyRevenue - monthlyExpenses,
        endingCash: cash + (monthlyRevenue - monthlyExpenses),
        confidenceLevel: i < 3 ? 'high' : i < 6 ? 'medium' : 'low',
        confidenceScore: Math.max(50, 90 - i * 5),
      });

      cash = periods[periods.length - 1].endingCash;
    }

    return periods;
  }

  private generateForecastRecommendations(
    periods: ForecastPeriod[],
    scenarios: ForecastScenario[]
  ): string[] {
    const recommendations: string[] = [];

    const lastPeriod = periods[periods.length - 1];
    if (lastPeriod.endingCash < 0) {
      recommendations.push('Projected negative cash position requires immediate action');
      recommendations.push('Consider expense reduction or revenue acceleration strategies');
    }

    return recommendations;
  }
}

interface FinancialData {
  fiscalYear: number;
  totalRevenue: number;
  totalExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
}

export default FinancialHealthMonitor;
