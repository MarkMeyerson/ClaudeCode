/**
 * Executive Briefing Generator
 * Generates comprehensive daily briefings in multiple formats
 * @module BriefingGenerator
 */

import {
  Briefing,
  Task,
  AggregatedMetrics,
  DetectedRisk,
  Recommendation,
  FounderMood,
} from '../types';

/**
 * Generate complete executive briefing
 *
 * @param options - Briefing generation options
 * @returns Complete briefing object with markdown and JSON formats
 */
export async function generateBriefing(options: {
  topPriorities: Task[];
  metrics: AggregatedMetrics;
  risks: DetectedRisk[];
  allRecommendations: Recommendation[];
  founderEnergy: number;
  founderMood: FounderMood;
  founderBlockers: string[];
  availableFocusTime: number;
  executionTime: number;
  agentSuccessRate: number;
}): Promise<Briefing> {
  const {
    topPriorities,
    metrics,
    risks,
    allRecommendations,
    founderEnergy,
    founderMood,
    founderBlockers,
    availableFocusTime,
    executionTime,
    agentSuccessRate,
  } = options;

  const briefing: Briefing = {
    id: generateBriefingId(),
    date: new Date(),
    topPriorities,
    healthOverview: calculateHealthScores(metrics, risks),
    risks,
    metrics,
    recommendations: allRecommendations,
    founderStatus: {
      energy: founderEnergy,
      mood: founderMood,
      blockers: founderBlockers,
      focusTimeAvailable: availableFocusTime,
    },
    markdown: '', // Generated below
    json: '', // Generated below
    metadata: {
      executionTime,
      agentSuccessRate,
      version: '1.0.0',
    },
  };

  // Generate formatted outputs
  briefing.markdown = generateMarkdownBriefing(briefing);
  briefing.json = JSON.stringify(briefing, null, 2);

  return briefing;
}

/**
 * Generate unique briefing ID
 */
function generateBriefingId(): string {
  const date = new Date().toISOString().split('T')[0];
  const random = Math.random().toString(36).substring(2, 8);
  return `briefing-${date}-${random}`;
}

/**
 * Calculate health scores for all business areas
 */
function calculateHealthScores(
  metrics: AggregatedMetrics,
  risks: DetectedRisk[]
): {
  overall: number;
  finance: number;
  sales: number;
  operations: number;
  marketing: number;
  hr: number;
  customerSuccess: number;
} {
  // Count risks per category
  const risksByCategory: Record<string, number> = {};
  risks.forEach(risk => {
    risksByCategory[risk.category] = (risksByCategory[risk.category] || 0) + 1;
  });

  // Calculate score for each area (start at 100, deduct for risks)
  const scores = {
    finance: calculateAreaScore(metrics.finance, risksByCategory['financial'] || 0),
    sales: calculateAreaScore(metrics.sales, risksByCategory['sales'] || 0),
    operations: calculateAreaScore(metrics.operations, risksByCategory['operations'] || 0),
    marketing: calculateAreaScore(metrics.marketing, risksByCategory['marketing'] || 0),
    hr: calculateAreaScore(metrics.hr, risksByCategory['team'] || 0),
    customerSuccess: calculateAreaScore(metrics.customerSuccess, risksByCategory['customer'] || 0),
  };

  // Overall score is weighted average
  const overall = Math.round(
    (scores.finance * 0.25) +
    (scores.sales * 0.20) +
    (scores.operations * 0.15) +
    (scores.marketing * 0.10) +
    (scores.hr * 0.15) +
    (scores.customerSuccess * 0.15)
  );

  return { overall, ...scores };
}

/**
 * Calculate health score for a specific area
 */
function calculateAreaScore(areaMetrics: any, riskCount: number): number {
  let score = 100;

  // Deduct for risks
  score -= riskCount * 15; // 15 points per risk

  // Add area-specific bonuses/penalties
  // This is simplified - could be more sophisticated
  if (areaMetrics.runway !== undefined && areaMetrics.runway > 12) score += 5;
  if (areaMetrics.churnRate !== undefined && areaMetrics.churnRate < 2) score += 5;
  if (areaMetrics.nps !== undefined && areaMetrics.nps > 70) score += 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate markdown formatted briefing
 */
export function generateMarkdownBriefing(briefing: Briefing): string {
  const date = briefing.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const time = briefing.date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  let md = '';

  // Header
  md += `# Daily Executive Briefing\n`;
  md += `**Date:** ${date}\n`;
  md += `**Generated:** ${time}\n`;
  md += `**Briefing ID:** ${briefing.id}\n\n`;

  md += `---\n\n`;

  // Top 3 Priorities
  md += `## 🎯 Top 3 Priorities Today\n\n`;

  if (briefing.topPriorities.length === 0) {
    md += `✅ No urgent priorities detected. Good time to work on strategic initiatives.\n\n`;
  } else {
    briefing.topPriorities.forEach((task, index) => {
      md += `### ${index + 1}. ${task.action} [Score: ${task.priorityScore?.toFixed(1)}]\n\n`;
      md += `**Why:** ${getTaskRationale(task, briefing.metrics)}\n\n`;
      md += `**Action Steps:**\n`;
      md += getActionSteps(task);
      md += `\n`;
      md += `**Estimated Time:** ${task.estimatedTime || 2} hours\n\n`;

      if (task.blockers && task.blockers.length > 0) {
        md += `**Blockers:** ${task.blockers.join(', ')}\n\n`;
      } else {
        md += `**Blockers:** None\n\n`;
      }

      if (task.revenue > 0) {
        md += `**Revenue Impact:** $${task.revenue.toLocaleString()}\n\n`;
      }

      md += `**Source:** ${capitalizeFirst(task.source)} Agent\n\n`;

      md += `---\n\n`;
    });
  }

  // Business Health Overview
  md += `## 📊 Business Health Overview\n\n`;
  md += `**Overall Health:** ${getHealthEmoji(briefing.healthOverview.overall)} ${getHealthLabel(briefing.healthOverview.overall)} (${briefing.healthOverview.overall}/100)\n\n`;

  md += `### Area Breakdown\n\n`;
  md += `| Area | Score | Status |\n`;
  md += `|------|-------|--------|\n`;
  md += `| 💰 Finance | ${briefing.healthOverview.finance}/100 | ${getHealthEmoji(briefing.healthOverview.finance)} ${getHealthLabel(briefing.healthOverview.finance)} |\n`;
  md += `| 💼 Sales | ${briefing.healthOverview.sales}/100 | ${getHealthEmoji(briefing.healthOverview.sales)} ${getHealthLabel(briefing.healthOverview.sales)} |\n`;
  md += `| ⚙️  Operations | ${briefing.healthOverview.operations}/100 | ${getHealthEmoji(briefing.healthOverview.operations)} ${getHealthLabel(briefing.healthOverview.operations)} |\n`;
  md += `| 📢 Marketing | ${briefing.healthOverview.marketing}/100 | ${getHealthEmoji(briefing.healthOverview.marketing)} ${getHealthLabel(briefing.healthOverview.marketing)} |\n`;
  md += `| 👥 Team (HR) | ${briefing.healthOverview.hr}/100 | ${getHealthEmoji(briefing.healthOverview.hr)} ${getHealthLabel(briefing.healthOverview.hr)} |\n`;
  md += `| 😊 Customer Success | ${briefing.healthOverview.customerSuccess}/100 | ${getHealthEmoji(briefing.healthOverview.customerSuccess)} ${getHealthLabel(briefing.healthOverview.customerSuccess)} |\n\n`;

  // Alerts & Risks
  md += `## 🚨 Alerts & Risks\n\n`;

  if (briefing.risks.length === 0) {
    md += `✅ No significant risks detected. All systems healthy.\n\n`;
  } else {
    const critical = briefing.risks.filter(r => r.severity === 'critical');
    const high = briefing.risks.filter(r => r.severity === 'high');
    const medium = briefing.risks.filter(r => r.severity === 'medium');
    const low = briefing.risks.filter(r => r.severity === 'low');

    if (critical.length > 0) {
      md += `### 🔴 Critical Priority\n\n`;
      critical.forEach(risk => {
        md += `- **${risk.name}**: ${risk.message}\n`;
        md += `  - *Action:* ${risk.recommendation}\n\n`;
      });
    }

    if (high.length > 0) {
      md += `### 🟠 High Priority\n\n`;
      high.forEach(risk => {
        md += `- **${risk.name}**: ${risk.message}\n`;
        md += `  - *Action:* ${risk.recommendation}\n\n`;
      });
    }

    if (medium.length > 0) {
      md += `### 🟡 Medium Priority\n\n`;
      medium.forEach(risk => {
        md += `- **${risk.name}**: ${risk.message}\n\n`;
      });
    }

    if (low.length > 0) {
      md += `### 🟢 Low Priority\n\n`;
      low.forEach(risk => {
        md += `- **${risk.name}**: ${risk.message}\n\n`;
      });
    }
  }

  // Key Metrics
  md += `## 📈 Key Metrics\n\n`;

  md += `### Financial\n\n`;
  md += `| Metric | Value | Trend |\n`;
  md += `|--------|-------|-------|\n`;
  md += `| MRR | $${briefing.metrics.finance.mrr.toLocaleString()} | ${getTrendEmoji(briefing.metrics.finance.revenueGrowth)} |\n`;
  md += `| ARR | $${briefing.metrics.finance.arr.toLocaleString()} | - |\n`;
  md += `| Burn Rate | $${briefing.metrics.finance.burnRate.toLocaleString()}/mo | - |\n`;
  md += `| Runway | ${briefing.metrics.finance.runway.toFixed(1)} months | - |\n`;
  md += `| Cash Balance | $${briefing.metrics.finance.cashBalance.toLocaleString()} | - |\n\n`;

  md += `### Sales\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Pipeline Value | $${briefing.metrics.sales.pipelineValue.toLocaleString()} |\n`;
  md += `| Active Deals | ${briefing.metrics.sales.activeDeals} |\n`;
  md += `| Closed This Month | ${briefing.metrics.sales.closedThisMonth} |\n`;
  md += `| Conversion Rate | ${briefing.metrics.sales.conversionRate}% |\n`;
  md += `| Avg Deal Size | $${briefing.metrics.sales.avgDealSize.toLocaleString()} |\n\n`;

  md += `### Operations\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Active Projects | ${briefing.metrics.operations.activeProjects} |\n`;
  md += `| On Track | ${briefing.metrics.operations.onTrackProjects} |\n`;
  md += `| At Risk | ${briefing.metrics.operations.atRiskProjects} |\n`;
  md += `| Team Utilization | ${briefing.metrics.operations.teamUtilization}% |\n\n`;

  md += `### Customer Success\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Active Customers | ${briefing.metrics.customerSuccess.activeCustomers} |\n`;
  md += `| NPS | ${briefing.metrics.customerSuccess.nps} |\n`;
  md += `| Churn Rate | ${briefing.metrics.customerSuccess.churnRate}% |\n`;
  md += `| At-Risk Customers | ${briefing.metrics.customerSuccess.atRiskCustomers} |\n`;
  md += `| Avg Response Time | ${briefing.metrics.customerSuccess.avgResponseTime} hours |\n\n`;

  // Recommendations
  md += `## 💡 Recommendations\n\n`;

  if (briefing.recommendations.length === 0) {
    md += `No additional recommendations at this time.\n\n`;
  } else {
    const topRecs = briefing.recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);

    md += `### Top 5 Action Items\n\n`;
    topRecs.forEach((rec, index) => {
      md += `${index + 1}. **${rec.action}**\n`;
      md += `   - *Why:* ${rec.reason}\n`;
      if (rec.estimatedTime) {
        md += `   - *Time:* ${rec.estimatedTime} hours\n`;
      }
      md += `   - *Source:* ${capitalizeFirst(rec.source)}\n\n`;
    });
  }

  // Founder Status
  md += `## 🧠 Founder Status\n\n`;
  md += `**Energy Level:** ${briefing.founderStatus.energy}/10 ${getEnergyEmoji(briefing.founderStatus.energy)}\n\n`;
  md += `**Mood:** ${getMoodEmoji(briefing.founderStatus.mood)} ${capitalizeFirst(briefing.founderStatus.mood)}\n\n`;

  if (briefing.founderStatus.blockers.length > 0) {
    md += `**Current Blockers:**\n`;
    briefing.founderStatus.blockers.forEach(blocker => {
      md += `- ${blocker}\n`;
    });
    md += `\n`;
  } else {
    md += `**Current Blockers:** None ✅\n\n`;
  }

  md += `**Focus Time Available:** ${briefing.founderStatus.focusTimeAvailable} hours\n\n`;

  md += `**Recommended Approach:** `;
  if (briefing.founderStatus.energy >= 7) {
    md += `High energy day - tackle complex, high-value tasks in the morning. Save admin for afternoon.\n\n`;
  } else if (briefing.founderStatus.energy >= 4) {
    md += `Moderate energy - focus on one major task, delegate where possible, take breaks.\n\n`;
  } else {
    md += `Low energy day - focus on low-complexity tasks, admin work, and recovery. Delegate or defer high-complexity work.\n\n`;
  }

  // Footer
  md += `---\n\n`;
  md += `**Next Briefing:** Tomorrow at 6:00 AM\n\n`;
  md += `**Generation Time:** ${briefing.metadata.executionTime.toFixed(0)}ms\n\n`;
  md += `**Agent Success Rate:** ${(briefing.metadata.agentSuccessRate * 100).toFixed(0)}%\n\n`;
  md += `*Generated by CEO Agent v${briefing.metadata.version}*\n`;

  return md;
}

/**
 * Helper: Get rationale for why a task is prioritized
 */
function getTaskRationale(task: Task, metrics: AggregatedMetrics): string {
  const reasons: string[] = [];

  if (task.revenue > 0) {
    reasons.push(`High revenue impact ($${task.revenue.toLocaleString()})`);
  }

  const now = new Date();
  const deadline = new Date(task.deadline);
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil <= 1) {
    reasons.push('Deadline today');
  } else if (daysUntil <= 3) {
    reasons.push(`Deadline in ${daysUntil} days`);
  }

  if (task.tags?.includes('critical') || task.tags?.includes('production')) {
    reasons.push('Critical business impact');
  }

  if (task.tags?.includes('retention') || task.source === 'customerSuccess') {
    reasons.push('Customer retention risk');
  }

  if (reasons.length === 0) {
    return 'Strategic priority aligned with business goals';
  }

  return reasons.join('. ') + '.';
}

/**
 * Helper: Generate action steps for a task
 */
function getActionSteps(task: Task): string {
  // This could be more sophisticated with AI-generated steps
  // For now, provide generic guidance based on task source

  const steps: Record<string, string[]> = {
    sales: [
      'Review deal status and stakeholder map',
      'Prepare proposal or presentation materials',
      'Schedule follow-up call or meeting',
      'Address any outstanding objections',
    ],
    customerSuccess: [
      'Reach out to customer to understand concerns',
      'Review product usage and engagement data',
      'Prepare retention offer or improvement plan',
      'Schedule check-in call with decision maker',
    ],
    finance: [
      'Review financial data and trends',
      'Update cash flow projections',
      'Identify cost reduction opportunities',
      'Prepare board or investor update',
    ],
    operations: [
      'Assess project status and blockers',
      'Reallocate resources if needed',
      'Communicate timeline updates to stakeholders',
      'Implement process improvements',
    ],
    marketing: [
      'Analyze campaign performance data',
      'Adjust budget allocation',
      'Test new channels or messaging',
      'Review and optimize conversion funnel',
    ],
    hr: [
      'Have 1:1 conversations with affected team members',
      'Review compensation and benefits',
      'Implement retention initiatives',
      'Adjust workload or project assignments',
    ],
  };

  const defaultSteps = [
    'Break down task into smaller sub-tasks',
    'Gather necessary information and context',
    'Take action on highest-leverage item',
    'Follow up and monitor progress',
  ];

  const taskSteps = steps[task.source] || defaultSteps;

  return taskSteps.map(step => `- ${step}\n`).join('');
}

/**
 * Helper: Get health emoji based on score
 */
function getHealthEmoji(score: number): string {
  if (score >= 80) return '🟢';
  if (score >= 60) return '🟡';
  if (score >= 40) return '🟠';
  return '🔴';
}

/**
 * Helper: Get health label based on score
 */
function getHealthLabel(score: number): string {
  if (score >= 80) return 'Healthy';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs Attention';
  return 'Critical';
}

/**
 * Helper: Get trend emoji
 */
function getTrendEmoji(value?: number): string {
  if (value === undefined) return '➡️';
  if (value > 5) return '📈';
  if (value < -5) return '📉';
  return '➡️';
}

/**
 * Helper: Get energy emoji
 */
function getEnergyEmoji(energy: number): string {
  if (energy >= 8) return '⚡';
  if (energy >= 6) return '💪';
  if (energy >= 4) return '😐';
  return '😴';
}

/**
 * Helper: Get mood emoji
 */
function getMoodEmoji(mood: FounderMood): string {
  const emojis: Record<FounderMood, string> = {
    great: '🤩',
    good: '😊',
    okay: '😐',
    struggling: '😟',
  };
  return emojis[mood];
}

/**
 * Helper: Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default {
  generateBriefing,
  generateMarkdownBriefing,
};
