/**
 * Risk Detection Engine
 * Proactively identifies business risks across all domains
 * @module RiskDetector
 */

import { RiskRule, DetectedRisk, AggregatedMetrics, CEOConfig } from '../types';

/**
 * Comprehensive risk detection rules
 * Each rule defines a condition and recommended action
 */
export const riskRules: RiskRule[] = [
  // ============================================
  // FINANCIAL RISKS (Critical to Business Survival)
  // ============================================
  {
    id: 'critical_low_runway',
    name: 'Critical Low Cash Runway',
    severity: 'critical',
    category: 'financial',
    condition: (m) => m.finance.runway < 3,
    message: (m) => `CRITICAL: Cash runway is ${m.finance.runway.toFixed(1)} months - below 3 month survival threshold`,
    recommendation: 'IMMEDIATE ACTION: Initiate emergency fundraising, implement cost cuts, or activate bridge financing',
  },
  {
    id: 'low_runway',
    name: 'Low Cash Runway',
    severity: 'high',
    category: 'financial',
    condition: (m) => m.finance.runway >= 3 && m.finance.runway < 6,
    message: (m) => `Cash runway is ${m.finance.runway.toFixed(1)} months - below 6 month threshold`,
    recommendation: 'Accelerate fundraising efforts or implement burn rate reduction plan',
  },
  {
    id: 'negative_cash_flow',
    name: 'Negative Cash Flow',
    severity: 'high',
    category: 'financial',
    condition: (m) => m.finance.burnRate > (m.finance.mrr || 0),
    message: (m) => `Burning $${m.finance.burnRate.toLocaleString()}/mo but only generating $${(m.finance.mrr || 0).toLocaleString()} MRR`,
    recommendation: 'Focus on revenue acceleration or cost reduction to achieve profitability',
  },
  {
    id: 'declining_mrr',
    name: 'Declining Monthly Recurring Revenue',
    severity: 'high',
    category: 'financial',
    condition: (m) => (m.finance.revenueGrowth || 0) < -5,
    message: (m) => `MRR declined ${Math.abs(m.finance.revenueGrowth || 0)}% - indicates serious retention or sales issues`,
    recommendation: 'Investigate churn causes immediately and launch win-back campaign',
  },
  {
    id: 'stagnant_revenue',
    name: 'Stagnant Revenue Growth',
    severity: 'medium',
    category: 'financial',
    condition: (m) => {
      const growth = m.finance.revenueGrowth || 0;
      return growth >= -5 && growth < 5;
    },
    message: (m) => `Revenue growth is only ${(m.finance.revenueGrowth || 0).toFixed(1)}% - below healthy 10%+ target`,
    recommendation: 'Review sales strategy, increase marketing spend, or launch new products',
  },

  // ============================================
  // SALES RISKS (Revenue Pipeline Issues)
  // ============================================
  {
    id: 'stalled_deals',
    name: 'Multiple Stalled Deals',
    severity: 'high',
    category: 'sales',
    condition: (m) => (m.sales.stalledDeals || 0) >= 3,
    message: (m) => `${m.sales.stalledDeals} deals stalled >14 days - indicates process or qualification issues`,
    recommendation: 'Review stalled deals with sales team, identify common blockers, adjust sales process',
  },
  {
    id: 'low_pipeline',
    name: 'Insufficient Sales Pipeline',
    severity: 'high',
    category: 'sales',
    condition: (m) => m.sales.pipelineValue < (m.finance.mrr * 3),
    message: (m) => `Pipeline value ($${m.sales.pipelineValue.toLocaleString()}) is less than 3x MRR - indicates future revenue risk`,
    recommendation: 'Increase lead generation activities and accelerate pipeline building',
  },
  {
    id: 'low_conversion',
    name: 'Low Conversion Rate',
    severity: 'medium',
    category: 'sales',
    condition: (m) => m.sales.conversionRate < 15,
    message: (m) => `Conversion rate at ${m.sales.conversionRate}% - below healthy 20%+ benchmark`,
    recommendation: 'Review sales process, improve qualification criteria, enhance sales training',
  },
  {
    id: 'low_win_rate',
    name: 'Low Deal Win Rate',
    severity: 'medium',
    category: 'sales',
    condition: (m) => (m.sales.winRate || 0) < 25,
    message: (m) => `Win rate at ${m.sales.winRate}% - indicates poor fit or pricing issues`,
    recommendation: 'Analyze lost deals, refine ICP, adjust pricing or positioning',
  },

  // ============================================
  // CUSTOMER SUCCESS RISKS (Churn & Satisfaction)
  // ============================================
  {
    id: 'churn_spike',
    name: 'Customer Churn Spike',
    severity: 'critical',
    category: 'customer',
    condition: (m) => m.customerSuccess.churnRate > 5,
    message: (m) => `Churn rate at ${m.customerSuccess.churnRate}% - CRITICAL level affecting business survival`,
    recommendation: 'Launch immediate customer retention campaign, conduct exit interviews, fix product issues',
  },
  {
    id: 'elevated_churn',
    name: 'Elevated Churn Rate',
    severity: 'high',
    category: 'customer',
    condition: (m) => m.customerSuccess.churnRate > 3 && m.customerSuccess.churnRate <= 5,
    message: (m) => `Churn rate at ${m.customerSuccess.churnRate}% - above healthy <3% threshold`,
    recommendation: 'Identify at-risk customers, improve onboarding, enhance customer success outreach',
  },
  {
    id: 'at_risk_customers',
    name: 'Multiple At-Risk Customers',
    severity: 'high',
    category: 'customer',
    condition: (m) => m.customerSuccess.atRiskCustomers > 0 &&
                      (m.customerSuccess.atRiskCustomers / m.customerSuccess.activeCustomers) > 0.1,
    message: (m) => `${m.customerSuccess.atRiskCustomers} customers at risk (${Math.round((m.customerSuccess.atRiskCustomers / m.customerSuccess.activeCustomers) * 100)}% of base)`,
    recommendation: 'Proactively reach out to at-risk accounts, offer additional support or incentives',
  },
  {
    id: 'low_nps',
    name: 'Low Net Promoter Score',
    severity: 'high',
    category: 'customer',
    condition: (m) => m.customerSuccess.nps < 30,
    message: (m) => `NPS at ${m.customerSuccess.nps} - indicates serious customer satisfaction issues`,
    recommendation: 'Conduct customer feedback sessions, address top pain points, improve product experience',
  },
  {
    id: 'declining_nps',
    name: 'Declining Customer Satisfaction',
    severity: 'medium',
    category: 'customer',
    condition: (m) => m.customerSuccess.nps >= 30 && m.customerSuccess.nps < 50,
    message: (m) => `NPS at ${m.customerSuccess.nps} - below industry standard of 50+`,
    recommendation: 'Survey detractors, implement feedback loop, prioritize customer-requested features',
  },
  {
    id: 'slow_support_response',
    name: 'Slow Support Response Times',
    severity: 'medium',
    category: 'customer',
    condition: (m) => m.customerSuccess.avgResponseTime > 4,
    message: (m) => `Average support response time is ${m.customerSuccess.avgResponseTime} hours - above 2-hour target`,
    recommendation: 'Add support capacity, implement chatbot, or optimize support workflows',
  },

  // ============================================
  // OPERATIONAL RISKS (Delivery & Execution)
  // ============================================
  {
    id: 'multiple_at_risk_projects',
    name: 'Multiple At-Risk Projects',
    severity: 'high',
    category: 'operations',
    condition: (m) => m.operations.atRiskProjects >= 2,
    message: (m) => `${m.operations.atRiskProjects} projects at risk - indicates resource or planning issues`,
    recommendation: 'Conduct project health review, reallocate resources, adjust timelines or scope',
  },
  {
    id: 'team_overutilization',
    name: 'Team Over-Utilization',
    severity: 'high',
    category: 'operations',
    condition: (m) => m.operations.teamUtilization > 95,
    message: (m) => `Team utilization at ${m.operations.teamUtilization}% - burnout risk`,
    recommendation: 'Reduce workload, hire additional resources, or defer non-critical projects',
  },
  {
    id: 'team_underutilization',
    name: 'Team Under-Utilization',
    severity: 'low',
    category: 'operations',
    condition: (m) => m.operations.teamUtilization < 60,
    message: (m) => `Team utilization at ${m.operations.teamUtilization}% - capacity not fully utilized`,
    recommendation: 'Assign new projects, invest in innovation time, or consider resource reallocation',
  },

  // ============================================
  // MARKETING RISKS (Growth & Efficiency)
  // ============================================
  {
    id: 'high_cac',
    name: 'High Customer Acquisition Cost',
    severity: 'high',
    category: 'cross-agent',
    condition: (m) => m.marketing.cac > 500,
    message: (m) => `CAC at $${m.marketing.cac} - above $500 sustainable threshold`,
    recommendation: 'Optimize marketing spend, focus on high-performing channels, improve conversion funnel',
  },
  {
    id: 'low_lead_generation',
    name: 'Insufficient Lead Generation',
    severity: 'medium',
    category: 'cross-agent',
    condition: (m) => m.marketing.leads < 50 && m.sales.activeDeals < 10,
    message: (m) => `Only ${m.marketing.leads} leads generated - insufficient for sales pipeline`,
    recommendation: 'Increase marketing budget, launch new campaigns, or improve lead generation tactics',
  },

  // ============================================
  // TEAM RISKS (HR & Culture)
  // ============================================
  {
    id: 'low_team_satisfaction',
    name: 'Low Team Satisfaction',
    severity: 'high',
    category: 'team',
    condition: (m) => m.hr.satisfactionScore < 6,
    message: (m) => `Team satisfaction at ${m.hr.satisfactionScore}/10 - indicates morale issues`,
    recommendation: 'Conduct team surveys, address concerns, improve culture and benefits',
  },
  {
    id: 'high_attrition_risk',
    name: 'High Attrition Risk',
    severity: 'high',
    category: 'team',
    condition: (m) => (m.hr.attritionRisk || 0) > 20,
    message: (m) => `${m.hr.attritionRisk}% of team at risk of leaving`,
    recommendation: 'Have retention conversations, improve compensation, address workload concerns',
  },

  // ============================================
  // CROSS-AGENT RISKS (System-Wide Issues)
  // ============================================
  {
    id: 'hiring_exceeds_revenue',
    name: 'Hiring Costs Exceed Revenue Growth',
    severity: 'high',
    category: 'cross-agent',
    condition: (m) => {
      const avgSalary = 100000; // Assume $100k average
      const hiringCost = m.hr.openRoles * avgSalary;
      const annualRevenueGrowth = (m.finance.mrr * 12 * ((m.finance.revenueGrowth || 0) / 100));
      return hiringCost > annualRevenueGrowth;
    },
    message: (m) => `Hiring ${m.hr.openRoles} roles but revenue growth doesn't support expansion`,
    recommendation: 'Defer hiring until revenue trajectory improves or secure additional funding',
  },
  {
    id: 'support_load_exceeds_capacity',
    name: 'Support Load Exceeds Team Capacity',
    severity: 'medium',
    category: 'cross-agent',
    condition: (m) => {
      const supportLoad = m.customerSuccess.activeCustomers / m.hr.teamSize;
      return supportLoad > 10; // More than 10 customers per team member
    },
    message: (m) => `${(m.customerSuccess.activeCustomers / m.hr.teamSize).toFixed(1)} customers per team member - above healthy ratio`,
    recommendation: 'Hire customer success staff, implement self-service tools, or improve automation',
  },
  {
    id: 'delivery_capacity_vs_pipeline',
    name: 'Delivery Capacity Below Sales Pipeline',
    severity: 'medium',
    category: 'cross-agent',
    condition: (m) => {
      const monthlyDeliveryCapacity = m.operations.teamUtilization < 80 ?
        m.hr.teamSize * 150 : m.hr.teamSize * 120; // Hours per month
      const pipelineMonthlyValue = m.sales.pipelineValue / 6; // Assume 6-month pipeline
      const hourlyRate = 150; // Assume $150/hr
      const requiredCapacity = pipelineMonthlyValue / hourlyRate;
      return requiredCapacity > monthlyDeliveryCapacity;
    },
    message: (m) => 'Sales pipeline exceeds current delivery capacity - will create bottleneck',
    recommendation: 'Hire delivery team, adjust sales targets, or improve operational efficiency',
  },
];

/**
 * Detect all active risks across the business
 *
 * Evaluates all risk rules against current metrics and returns
 * those that are triggered, sorted by severity.
 *
 * @param metrics - Aggregated business metrics
 * @param config - CEO configuration with risk thresholds
 * @returns Array of detected risks, sorted by severity
 *
 * @example
 * ```typescript
 * const metrics = await aggregateMetrics(agentResults);
 * const risks = detectRisks(metrics, config);
 *
 * if (risks.length > 0) {
 *   console.log(`⚠️  ${risks.length} risks detected`);
 *   risks.forEach(r => console.log(`- ${r.name}: ${r.message}`));
 * }
 * ```
 */
export function detectRisks(
  metrics: AggregatedMetrics,
  config: CEOConfig
): DetectedRisk[] {
  const detected: DetectedRisk[] = [];

  for (const rule of riskRules) {
    try {
      // Evaluate condition
      if (rule.condition(metrics)) {
        detected.push({
          ruleId: rule.id,
          name: rule.name,
          severity: rule.severity,
          message: rule.message(metrics),
          recommendation: rule.recommendation,
          category: rule.category,
          detectedAt: new Date(),
        });
      }
    } catch (error) {
      console.error(`Error evaluating risk rule ${rule.id}:`, error);
      // Continue with other rules
    }
  }

  // Sort by severity (critical > high > medium > low)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  detected.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return detected;
}

/**
 * Get risks by severity level
 *
 * @param risks - Array of detected risks
 * @param severity - Severity level to filter by
 * @returns Filtered risks
 */
export function getRisksBySeverity(
  risks: DetectedRisk[],
  severity: 'critical' | 'high' | 'medium' | 'low'
): DetectedRisk[] {
  return risks.filter(r => r.severity === severity);
}

/**
 * Get risks by category
 *
 * @param risks - Array of detected risks
 * @param category - Category to filter by
 * @returns Filtered risks
 */
export function getRisksByCategory(
  risks: DetectedRisk[],
  category: string
): DetectedRisk[] {
  return risks.filter(r => r.category === category);
}

/**
 * Calculate overall risk score (0-100)
 *
 * Higher score = more risk
 *
 * @param risks - Array of detected risks
 * @returns Risk score from 0-100
 */
export function calculateRiskScore(risks: DetectedRisk[]): number {
  if (risks.length === 0) return 0;

  const weights = { critical: 40, high: 25, medium: 10, low: 5 };
  const totalScore = risks.reduce((sum, risk) => sum + weights[risk.severity], 0);

  // Normalize to 0-100 scale (cap at 100)
  return Math.min(totalScore, 100);
}

/**
 * Generate risk summary text
 *
 * @param risks - Array of detected risks
 * @returns Human-readable summary
 */
export function generateRiskSummary(risks: DetectedRisk[]): string {
  if (risks.length === 0) {
    return '✅ No significant risks detected. Business health is good.';
  }

  const critical = getRisksBySeverity(risks, 'critical');
  const high = getRisksBySeverity(risks, 'high');
  const medium = getRisksBySeverity(risks, 'medium');
  const low = getRisksBySeverity(risks, 'low');

  let summary = `⚠️  ${risks.length} risk${risks.length > 1 ? 's' : ''} detected:\n\n`;

  if (critical.length > 0) {
    summary += `🔴 CRITICAL (${critical.length}): ${critical.map(r => r.name).join(', ')}\n`;
  }
  if (high.length > 0) {
    summary += `🟠 HIGH (${high.length}): ${high.map(r => r.name).join(', ')}\n`;
  }
  if (medium.length > 0) {
    summary += `🟡 MEDIUM (${medium.length}): ${medium.map(r => r.name).join(', ')}\n`;
  }
  if (low.length > 0) {
    summary += `🟢 LOW (${low.length}): ${low.map(r => r.name).join(', ')}\n`;
  }

  return summary;
}

export default {
  riskRules,
  detectRisks,
  getRisksBySeverity,
  getRisksByCategory,
  calculateRiskScore,
  generateRiskSummary,
};
