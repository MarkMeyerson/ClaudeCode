/**
 * Type definitions for CEO Agent system
 * @module CEOAgentTypes
 */

/**
 * Severity levels for alerts and risks
 */
export type Severity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Task complexity levels
 */
export type TaskComplexity = 'low' | 'medium' | 'high';

/**
 * Agent health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'offline';

/**
 * Business health indicator colors
 */
export type HealthIndicator = 'green' | 'yellow' | 'red';

/**
 * Founder mood states
 */
export type FounderMood = 'great' | 'good' | 'okay' | 'struggling';

/**
 * Alert interface for system notifications
 */
export interface Alert {
  /** Unique alert identifier */
  id: string;
  /** Severity level */
  severity: Severity;
  /** Human-readable alert message */
  message: string;
  /** Source agent that generated the alert */
  source: string;
  /** Timestamp when alert was created */
  timestamp: Date;
  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * Recommendation for action items
 */
export interface Recommendation {
  /** Unique recommendation identifier */
  id: string;
  /** Priority level (1-10, 10 being highest) */
  priority: number;
  /** Action to be taken */
  action: string;
  /** Reason for recommendation */
  reason: string;
  /** Estimated time to complete (in hours) */
  estimatedTime?: number;
  /** Any blockers preventing action */
  blockers?: string[];
  /** Source agent that generated recommendation */
  source: string;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Response from an individual agent
 */
export interface AgentResponse {
  /** Agent name */
  agent: string;
  /** Execution timestamp */
  timestamp: string;
  /** Success status */
  success: boolean;
  /** Agent-specific metrics */
  metrics: Record<string, any>;
  /** Generated alerts */
  alerts: Alert[];
  /** Generated recommendations */
  recommendations: Recommendation[];
  /** Execution duration in milliseconds */
  executionTime?: number;
  /** Error message if failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Aggregated results from all agents
 */
export interface AgentResults {
  finance?: AgentResponse | null;
  sales?: AgentResponse | null;
  operations?: AgentResponse | null;
  marketing?: AgentResponse | null;
  hr?: AgentResponse | null;
  customerSuccess?: AgentResponse | null;
  /** Timestamp of aggregation */
  aggregatedAt: Date;
  /** Total execution time */
  totalExecutionTime: number;
  /** Number of successful agent calls */
  successfulAgents: number;
  /** Number of failed agent calls */
  failedAgents: number;
}

/**
 * Financial metrics from Finance Agent
 */
export interface FinancialMetrics {
  mrr: number;
  arr: number;
  burnRate: number;
  runway: number;
  cashBalance: number;
  revenueGrowth?: number;
  churnMRR?: number;
  newMRR?: number;
}

/**
 * Sales metrics from Sales Agent
 */
export interface SalesMetrics {
  pipelineValue: number;
  activeDeals: number;
  closedThisMonth: number;
  conversionRate: number;
  avgDealSize: number;
  stalledDeals?: number;
  winRate?: number;
}

/**
 * Operations metrics from Operations Agent
 */
export interface OperationsMetrics {
  activeProjects: number;
  onTrackProjects: number;
  atRiskProjects: number;
  teamUtilization: number;
  sprintVelocity?: number;
  blockers?: number;
}

/**
 * Marketing metrics from Marketing Agent
 */
export interface MarketingMetrics {
  websiteVisitors: number;
  leads: number;
  cac: number;
  socialFollowers: number;
  contentEngagement: number;
  topChannel?: string;
}

/**
 * HR metrics from HR Agent
 */
export interface HRMetrics {
  teamSize: number;
  openRoles: number;
  candidatesInPipeline: number;
  avgTenure: number;
  satisfactionScore: number;
  attritionRisk?: number;
}

/**
 * Customer Success metrics
 */
export interface CustomerSuccessMetrics {
  activeCustomers: number;
  nps: number;
  churnRate: number;
  atRiskCustomers: number;
  avgResponseTime: number;
  csat?: number;
}

/**
 * Aggregated metrics from all agents
 */
export interface AggregatedMetrics {
  finance: FinancialMetrics;
  sales: SalesMetrics;
  operations: OperationsMetrics;
  marketing: MarketingMetrics;
  hr: HRMetrics;
  customerSuccess: CustomerSuccessMetrics;
  /** Overall business health score (0-100) */
  overallHealthScore: number;
  /** Timestamp of aggregation */
  timestamp: Date;
}

/**
 * Notion Business Tracker check-in entry
 */
export interface BusinessCheckin {
  /** Notion page ID */
  id: string;
  /** Check-in date */
  date: Date;
  /** Founder energy level (1-10) */
  energy: number;
  /** Founder mood */
  mood: FounderMood;
  /** Top priorities for the day */
  topPriorities: string[];
  /** Current blockers */
  blockers: string[];
  /** Recent wins */
  wins: string[];
  /** Current challenges */
  challenges: string[];
  /** Additional notes */
  notes?: string;
}

/**
 * Energy trend over time
 */
export interface EnergyTrend {
  /** Average energy over period */
  average: number;
  /** Minimum energy */
  min: number;
  /** Maximum energy */
  max: number;
  /** Trend direction */
  trend: 'improving' | 'stable' | 'declining';
  /** Data points */
  dataPoints: Array<{ date: Date; energy: number }>;
}

/**
 * Strategic goal definition
 */
export interface StrategyGoal {
  /** Unique goal ID */
  id: string;
  /** Goal description */
  description: string;
  /** Goal priority (1 being highest) */
  priority: number;
  /** Keywords for matching tasks */
  keywords: string[];
  /** Target completion date */
  targetDate?: Date;
  /** Current progress (0-100) */
  progress?: number;
}

/**
 * Task/priority item
 */
export interface Task {
  /** Unique task ID */
  id: string;
  /** Source agent */
  source: string;
  /** Action description */
  action: string;
  /** Revenue impact in dollars */
  revenue: number;
  /** Deadline */
  deadline: Date;
  /** Task complexity */
  complexity: TaskComplexity;
  /** Tags for categorization */
  tags?: string[];
  /** Current blockers */
  blockers?: string[];
  /** Estimated time in hours */
  estimatedTime?: number;
  /** Priority score (calculated) */
  priorityScore?: number;
}

/**
 * Priority context for scoring
 */
export interface PriorityContext {
  /** Current founder energy level */
  founderEnergy: number;
  /** Strategic goals for the period */
  goals: StrategyGoal[];
  /** Current business metrics */
  metrics: AggregatedMetrics;
  /** Available focus time today (hours) */
  availableFocusTime?: number;
}

/**
 * Risk detection rule
 */
export interface RiskRule {
  /** Unique rule ID */
  id: string;
  /** Rule name */
  name: string;
  /** Severity if triggered */
  severity: Severity;
  /** Condition function */
  condition: (metrics: AggregatedMetrics) => boolean;
  /** Message generator */
  message: (metrics: AggregatedMetrics) => string;
  /** Recommended action */
  recommendation: string;
  /** Rule category */
  category: 'financial' | 'sales' | 'operations' | 'customer' | 'team' | 'cross-agent';
}

/**
 * Detected risk
 */
export interface DetectedRisk {
  /** Rule that triggered */
  ruleId: string;
  /** Risk name */
  name: string;
  /** Severity level */
  severity: Severity;
  /** Risk message */
  message: string;
  /** Recommendation */
  recommendation: string;
  /** Risk category */
  category: string;
  /** Detection timestamp */
  detectedAt: Date;
}

/**
 * Executive briefing output
 */
export interface Briefing {
  /** Briefing ID */
  id: string;
  /** Generation date */
  date: Date;
  /** Top 3 priorities */
  topPriorities: Task[];
  /** Business health overview */
  healthOverview: {
    overall: number;
    finance: number;
    sales: number;
    operations: number;
    marketing: number;
    hr: number;
    customerSuccess: number;
  };
  /** All detected risks */
  risks: DetectedRisk[];
  /** Key metrics */
  metrics: AggregatedMetrics;
  /** All recommendations */
  recommendations: Recommendation[];
  /** Founder status */
  founderStatus: {
    energy: number;
    mood: FounderMood;
    blockers: string[];
    focusTimeAvailable: number;
  };
  /** Markdown formatted briefing */
  markdown: string;
  /** JSON formatted briefing */
  json: string;
  /** Generation metadata */
  metadata: {
    executionTime: number;
    agentSuccessRate: number;
    version: string;
  };
}

/**
 * Orchestration options
 */
export interface OrchestrationOptions {
  /** Force refresh (ignore cache) */
  forceRefresh?: boolean;
  /** Timeout per agent in milliseconds */
  agentTimeout?: number;
  /** Enable parallel execution */
  parallel?: boolean;
  /** Agents to include (if not all) */
  includeAgents?: string[];
  /** Agents to exclude */
  excludeAgents?: string[];
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Agent name */
  name: string;
  /** Is agent enabled */
  enabled: boolean;
  /** Timeout in milliseconds */
  timeout: number;
  /** Retry attempts */
  retries?: number;
  /** Agent-specific config */
  config?: Record<string, any>;
}

/**
 * CEO Agent configuration
 */
export interface CEOConfig {
  /** Operating hours (start) */
  operatingHoursStart: number;
  /** Operating hours (end) */
  operatingHoursEnd: number;
  /** Timezone */
  timezone: string;
  /** Notion Business Tracker database ID */
  notionBusinessTrackerDbId: string;
  /** Notion API key */
  notionApiKey: string;
  /** Enabled agents */
  agents: AgentConfig[];
  /** Priority calculation weights */
  priorityWeights: {
    revenueImpact: number;
    urgency: number;
    energyAlignment: number;
    strategicAlignment: number;
  };
  /** Risk thresholds */
  riskThresholds: {
    lowRunwayMonths: number;
    highChurnRate: number;
    lowNPS: number;
    highCAC: number;
  };
  /** Caching settings */
  cache: {
    enabled: boolean;
    ttl: number;
  };
}

/**
 * Agent health check result
 */
export interface AgentHealthCheck {
  /** Agent name */
  agent: string;
  /** Health status */
  status: HealthStatus;
  /** Response time in ms */
  responseTime?: number;
  /** Last successful execution */
  lastSuccess?: Date;
  /** Error message if unhealthy */
  error?: string;
}

/**
 * System health status
 */
export interface SystemHealth {
  /** Overall system health */
  status: HealthStatus;
  /** Individual agent health */
  agents: AgentHealthCheck[];
  /** Database health */
  database: HealthStatus;
  /** External integrations health */
  integrations: {
    notion: HealthStatus;
    stripe: HealthStatus;
    hubspot?: HealthStatus;
  };
  /** Timestamp */
  timestamp: Date;
}
