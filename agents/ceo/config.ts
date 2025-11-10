/**
 * CEO Agent Configuration
 * @module CEOConfig
 */

import { CEOConfig, AgentConfig } from './types';

/**
 * Default agent configurations
 */
const defaultAgents: AgentConfig[] = [
  {
    name: 'finance',
    enabled: true,
    timeout: 30000, // 30 seconds
    retries: 2,
    config: {
      stripeEnabled: true,
      bankIntegrationEnabled: false,
    },
  },
  {
    name: 'sales',
    enabled: false, // Not yet implemented
    timeout: 30000,
    retries: 2,
    config: {
      hubspotEnabled: true,
      pipelineStageThreshold: 14, // Days before deal considered stalled
    },
  },
  {
    name: 'operations',
    enabled: false, // Not yet implemented
    timeout: 30000,
    retries: 2,
    config: {
      linearEnabled: true,
      githubEnabled: true,
    },
  },
  {
    name: 'marketing',
    enabled: false, // Not yet implemented
    timeout: 30000,
    retries: 2,
    config: {
      googleAnalyticsEnabled: true,
      socialMediaEnabled: true,
    },
  },
  {
    name: 'hr',
    enabled: false, // Not yet implemented
    timeout: 30000,
    retries: 2,
    config: {
      meetingLoadThreshold: 20, // Hours per week
    },
  },
  {
    name: 'customerSuccess',
    enabled: false, // Not yet implemented
    timeout: 30000,
    retries: 2,
    config: {
      inactivityThreshold: 30, // Days
      npsThreshold: 50,
    },
  },
];

/**
 * Load CEO Agent configuration from environment variables
 * Falls back to defaults if not specified
 */
export function loadConfig(): CEOConfig {
  return {
    // Operating hours (24-hour format)
    operatingHoursStart: parseInt(process.env.CEO_OPERATING_HOURS_START || '6', 10),
    operatingHoursEnd: parseInt(process.env.CEO_OPERATING_HOURS_END || '22', 10),

    // Timezone
    timezone: process.env.CEO_TIMEZONE || 'America/Los_Angeles',

    // Notion integration
    notionBusinessTrackerDbId: process.env.NOTION_BUSINESS_TRACKER_DB_ID || '',
    notionApiKey: process.env.NOTION_API_KEY || '',

    // Agent configurations
    agents: defaultAgents,

    // Priority calculation weights (must sum to 1.0)
    priorityWeights: {
      revenueImpact: parseFloat(process.env.CEO_WEIGHT_REVENUE || '0.40'),
      urgency: parseFloat(process.env.CEO_WEIGHT_URGENCY || '0.25'),
      energyAlignment: parseFloat(process.env.CEO_WEIGHT_ENERGY || '0.15'),
      strategicAlignment: parseFloat(process.env.CEO_WEIGHT_STRATEGY || '0.20'),
    },

    // Risk detection thresholds
    riskThresholds: {
      lowRunwayMonths: parseFloat(process.env.CEO_LOW_RUNWAY_THRESHOLD || '6'),
      highChurnRate: parseFloat(process.env.CEO_HIGH_CHURN_THRESHOLD || '5'),
      lowNPS: parseFloat(process.env.CEO_LOW_NPS_THRESHOLD || '50'),
      highCAC: parseFloat(process.env.CEO_HIGH_CAC_THRESHOLD || '500'),
    },

    // Caching configuration
    cache: {
      enabled: process.env.CEO_CACHE_ENABLED === 'true',
      ttl: parseInt(process.env.CEO_CACHE_TTL || '3600', 10), // 1 hour default
    },
  };
}

/**
 * Validate configuration
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateConfig(config: CEOConfig): void {
  // Validate operating hours
  if (config.operatingHoursStart < 0 || config.operatingHoursStart > 23) {
    throw new Error('Operating hours start must be between 0 and 23');
  }
  if (config.operatingHoursEnd < 0 || config.operatingHoursEnd > 23) {
    throw new Error('Operating hours end must be between 0 and 23');
  }

  // Validate priority weights sum to 1.0
  const totalWeight =
    config.priorityWeights.revenueImpact +
    config.priorityWeights.urgency +
    config.priorityWeights.energyAlignment +
    config.priorityWeights.strategicAlignment;

  if (Math.abs(totalWeight - 1.0) > 0.01) {
    throw new Error(`Priority weights must sum to 1.0 (current: ${totalWeight})`);
  }

  // Validate at least one agent is enabled
  const enabledAgents = config.agents.filter(a => a.enabled);
  if (enabledAgents.length === 0) {
    throw new Error('At least one agent must be enabled');
  }

  // Warn if Notion credentials missing
  if (!config.notionApiKey || !config.notionBusinessTrackerDbId) {
    console.warn('WARNING: Notion credentials not configured. Founder status tracking will be limited.');
  }
}

/**
 * Get configuration with validation
 */
export function getConfig(): CEOConfig {
  const config = loadConfig();
  validateConfig(config);
  return config;
}

/**
 * Default strategic goals (can be overridden from Notion)
 */
export const defaultStrategicGoals = [
  {
    id: 'growth',
    description: 'Achieve 20% MoM revenue growth',
    priority: 1,
    keywords: ['revenue', 'growth', 'sales', 'mrr', 'arr'],
    progress: 0,
  },
  {
    id: 'retention',
    description: 'Reduce churn to <3%',
    priority: 2,
    keywords: ['churn', 'retention', 'customer', 'success', 'satisfaction'],
    progress: 0,
  },
  {
    id: 'efficiency',
    description: 'Improve operational efficiency by 30%',
    priority: 3,
    keywords: ['efficiency', 'automation', 'process', 'operations', 'productivity'],
    progress: 0,
  },
];

export default {
  loadConfig,
  validateConfig,
  getConfig,
  defaultStrategicGoals,
};
