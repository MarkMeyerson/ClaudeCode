// ============================================================================
// CORE TYPES & INTERFACES
// Microsoft Copilot Onboarding & ROI Platform
// ============================================================================

// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

export interface Organization {
  organization_id: string;
  organization_name: string;
  industry: string;
  company_size: 'small' | 'medium' | 'large' | 'enterprise';
  employee_count: number;
  annual_revenue: number;

  // Contact Information
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;

  // Address
  country: string;
  region: string;
  city: string;

  // Subscription
  subscription_tier: 'free' | 'starter' | 'professional' | 'enterprise';
  subscription_start_date: Date;
  subscription_end_date: Date;

  status: 'active' | 'inactive' | 'trial' | 'suspended';
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// ROI TRACKING TYPES
// ============================================================================

export interface ROITracking {
  tracking_id: string;
  organization_id: string;
  measurement_period: 'monthly' | 'quarterly' | 'annual';
  period_start: Date;
  period_end: Date;

  // Cost Metrics
  total_license_cost: number;
  implementation_cost: number;
  training_cost: number;
  support_cost: number;
  infrastructure_cost: number;
  total_cost: number;

  // Productivity Metrics
  hours_saved: number;
  tasks_automated: number;
  documents_created: number;
  meetings_summarized: number;
  emails_drafted: number;
  code_generated_lines: number;
  presentations_created: number;
  data_analyses_performed: number;

  // Value Metrics
  productivity_value: number;
  time_savings_value: number;
  quality_improvement_value: number;
  innovation_value: number;
  total_value_generated: number;

  // ROI Calculations
  gross_roi: number;
  net_roi: number;
  roi_percentage: number;
  payback_achieved: boolean;
  payback_date?: Date;

  // Adoption Metrics
  active_users: number;
  total_licensed_users: number;
  adoption_rate: number;
  utilization_rate: number;
  feature_adoption: Record<string, any>;

  // Comparative Metrics
  vs_baseline_improvement: number;
  vs_industry_benchmark: number;
  vs_projected_variance: number;

  created_at: Date;
  updated_at: Date;
}

export interface ProductivityMetrics {
  metric_id: string;
  organization_id: string;
  user_id?: string;
  department?: string;
  team_name?: string;
  date: Date;

  // Time Metrics
  hours_saved: number;
  tasks_completed: number;
  average_task_time_reduction: number;
  focus_time_gained_minutes: number;

  // Copilot Usage
  copilot_interactions: number;
  suggestions_accepted: number;
  suggestions_rejected: number;
  suggestions_modified: number;
  acceptance_rate: number;

  // Application-Specific Metrics
  word_documents_enhanced: number;
  word_words_generated: number;
  excel_analyses_accelerated: number;
  excel_formulas_created: number;
  powerpoint_presentations_created: number;
  powerpoint_slides_generated: number;
  outlook_emails_drafted: number;
  outlook_email_responses: number;
  teams_meetings_summarized: number;
  teams_action_items_extracted: number;
  github_code_completions: number;
  github_code_lines_generated: number;

  // Quality Metrics
  error_reduction_rate: number;
  rework_reduction_rate: number;
  first_time_right_rate: number;
  quality_score: number;

  // Innovation Metrics
  new_insights_generated: number;
  process_improvements_identified: number;
  innovative_solutions_created: number;
  knowledge_discoveries: number;

  created_at: Date;
}

export interface ROIScenario {
  scenario_id: string;
  organization_id: string;
  scenario_name: string;
  scenario_type: 'conservative' | 'moderate' | 'optimistic' | 'custom';
  scenario_description: string;

  // Assumptions
  adoption_rate_assumption: number;
  productivity_gain_assumption: number;
  time_to_proficiency_weeks: number;
  average_hourly_rate: number;
  discount_rate: number;

  // Year 1-3 Projections
  year1_costs: number;
  year1_benefits: number;
  year1_net_benefit: number;
  year1_roi: number;

  year2_costs: number;
  year2_benefits: number;
  year2_net_benefit: number;
  year2_roi: number;

  year3_costs: number;
  year3_benefits: number;
  year3_net_benefit: number;
  year3_roi: number;

  // Cumulative Metrics
  breakeven_month: number;
  total_3year_costs: number;
  total_3year_benefits: number;
  total_3year_net_benefit: number;
  total_3year_roi: number;
  npv: number;
  irr: number;

  is_active: boolean;
  is_baseline: boolean;
  created_at: Date;
}

// ============================================================================
// USER & ADOPTION TYPES
// ============================================================================

export interface User {
  user_id: string;
  organization_id: string;
  user_email: string;
  user_name: string;
  display_name: string;
  department: string;
  role: string;
  job_title: string;
  seniority_level: 'entry' | 'mid' | 'senior' | 'executive' | 'c_level';
  manager_id?: string;

  // Microsoft Identity
  azure_ad_id?: string;
  m365_user_principal_name?: string;
  microsoft_tenant_id?: string;

  // Location
  office_location: string;
  country: string;
  timezone: string;

  status: 'active' | 'inactive' | 'suspended' | 'offboarded';
  hire_date?: Date;
  termination_date?: Date;

  created_at: Date;
  updated_at: Date;
}

export interface UserAdoption {
  adoption_id: string;
  user_id: string;
  organization_id: string;

  // Adoption Timeline
  copilot_license_assigned_date?: Date;
  copilot_enabled_date?: Date;
  first_use_date?: Date;
  onboarding_started_date?: Date;
  onboarding_completed_date?: Date;
  training_completed_date?: Date;

  // Status Flags
  onboarding_completed: boolean;
  training_completed: boolean;
  assessment_completed: boolean;
  certification_completed: boolean;

  // Usage Metrics
  days_active_last_30: number;
  total_interactions: number;
  average_daily_interactions: number;
  last_activity_date?: Date;

  // Proficiency
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  skill_assessment_score?: number;
  skill_assessment_date?: Date;
  certifications_earned: string[];

  // Feature Usage
  features_used: string[];
  favorite_features: string[];
  unused_features: string[];
  feature_usage_count: number;

  // Engagement Metrics
  engagement_score?: number;
  satisfaction_score?: number;
  likelihood_to_recommend?: number;
  nps_category?: 'promoter' | 'passive' | 'detractor';

  // Champion Metrics
  champion_status: 'user' | 'advocate' | 'champion' | 'super_champion';
  champion_score?: number;
  peer_help_instances: number;
  best_practices_shared: number;
  community_contributions: number;

  // Adoption Stage
  adoption_stage: 'awareness' | 'exploration' | 'adoption' | 'proficiency' | 'mastery';
  adoption_stage_date?: Date;

  // Risk Flags
  at_risk: boolean;
  at_risk_reason?: string;
  intervention_needed: boolean;

  created_at: Date;
  updated_at: Date;
}

export interface FeatureCatalog {
  feature_id: string;
  feature_name: string;
  feature_key: string;
  application: 'word' | 'excel' | 'powerpoint' | 'outlook' | 'teams' | 'github' | 'bing_chat';

  feature_description: string;
  feature_category: string;
  feature_complexity: 'basic' | 'intermediate' | 'advanced';

  available_in_plans: string[];
  release_date?: Date;
  is_preview: boolean;

  documentation_url?: string;
  tutorial_url?: string;
  video_tutorial_url?: string;

  created_at: Date;
  updated_at: Date;
}

export interface FeatureUsage {
  usage_id: string;
  organization_id: string;
  feature_id: string;
  date: Date;

  total_users_in_org: number;
  unique_users: number;
  total_uses: number;
  average_uses_per_user: number;

  adoption_rate: number;
  new_users_this_period: number;
  returning_users: number;
  growth_rate: number;

  success_rate: number;
  time_saved_minutes: number;
  value_generated: number;

  average_session_duration_seconds: number;
  completion_rate: number;

  average_rating?: number;
  user_satisfaction?: number;
  reported_issues: number;
  enhancement_requests: number;

  created_at: Date;
}

// ============================================================================
// CONTENT LIBRARY TYPES
// ============================================================================

export interface ContentLibrary {
  content_id: string;
  content_title: string;
  content_type: 'whitepaper' | 'case_study' | 'video' | 'template' | 'guide' | 'documentation' | 'webinar' | 'tutorial';

  description: string;
  abstract?: string;
  full_content?: string;
  author: string;
  co_authors: string[];
  publication_date?: Date;
  last_updated_date?: Date;

  // File Information
  file_url?: string;
  file_format?: string;
  file_size_mb?: number;
  duration_minutes?: number;
  page_count?: number;
  word_count?: number;

  // Categorization
  category: string;
  subcategory?: string;
  tags: string[];
  industry?: string;
  company_size?: string;
  department?: string;
  copilot_features: string[];
  applications: string[];

  // Target Audience
  target_audience: 'executive' | 'manager' | 'end_user' | 'admin' | 'developer';
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'all';
  job_roles: string[];

  // SEO & Discovery
  keywords: string[];
  meta_description?: string;
  search_terms: string[];
  thumbnail_url?: string;
  preview_image_url?: string;

  // Versioning
  version: string;
  version_notes?: string;
  changelog: any[];
  supersedes?: string;
  is_latest_version: boolean;

  // Access Control
  access_level: 'public' | 'registered' | 'premium' | 'partner' | 'internal';
  requires_authentication: boolean;
  requires_nda: boolean;

  // Engagement Metrics
  view_count: number;
  unique_viewers: number;
  download_count: number;
  share_count: number;
  average_rating?: number;
  rating_count: number;
  bookmark_count: number;
  completion_rate?: number;

  // Quality Metrics
  quality_score?: number;
  relevance_score?: number;
  freshness_score?: number;

  // Localization
  language: string;
  translations_available: string[];
  is_machine_translated: boolean;

  status: 'draft' | 'review' | 'published' | 'archived' | 'deprecated';
  published_date?: Date;
  archived_date?: Date;

  active: boolean;
  featured: boolean;
  trending: boolean;

  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// MICROSOFT INTEGRATION TYPES
// ============================================================================

export interface MicrosoftTenant {
  tenant_id: string;
  organization_id: string;
  m365_tenant_id: string;
  tenant_name: string;
  tenant_display_name: string;

  // Configuration
  primary_domain: string;
  verified_domains: string[];
  tenant_region: string;
  tenant_type: 'commercial' | 'government' | 'education';
  license_agreement: string;
  total_licenses: number;

  // Integration Status
  graph_api_connected: boolean;
  graph_api_version: string;
  admin_consent_granted: boolean;
  admin_consent_date?: Date;
  admin_consent_by?: string;
  copilot_enabled: boolean;
  copilot_enabled_date?: Date;

  // Connection Details
  connection_method: 'oauth' | 'certificate' | 'managed_identity';
  app_registration_id?: string;
  service_principal_id?: string;
  service_principal_name?: string;

  // Sync Settings
  sync_enabled: boolean;
  sync_frequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'manual';
  last_sync_timestamp?: Date;
  last_successful_sync?: Date;
  next_scheduled_sync?: Date;
  sync_status: 'pending' | 'in_progress' | 'success' | 'failed' | 'paused';

  status: 'active' | 'inactive' | 'suspended' | 'error';
  health_status: 'healthy' | 'degraded' | 'unhealthy';

  created_at: Date;
  updated_at: Date;
}

export interface IntegrationLog {
  log_id: string;
  tenant_id?: string;
  organization_id?: string;

  log_timestamp: Date;
  integration_type: 'graph_api' | 'azure_ad' | 'teams' | 'm365_admin' | 'power_platform';
  integration_name: string;
  operation: string;
  operation_type: 'read' | 'write' | 'update' | 'delete';

  status: 'success' | 'failed' | 'partial' | 'warning';
  status_code?: number;
  status_message?: string;

  // Data Transfer
  records_requested?: number;
  records_processed: number;
  records_succeeded: number;
  records_failed: number;
  records_skipped: number;

  // Performance
  execution_start_time?: Date;
  execution_end_time?: Date;
  execution_time_ms: number;
  api_calls_made: number;
  data_transferred_mb?: number;

  // Errors
  error_count: number;
  warning_count: number;
  error_details: any[];
  warning_details: any[];

  correlation_id?: string;
  initiated_by?: string;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    timestamp: Date;
    request_id: string;
    execution_time_ms: number;
  };
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  metadata?: {
    timestamp: Date;
    request_id: string;
  };
}

export interface ROICalculationRequest {
  organization_id: string;
  period_start: Date;
  period_end: Date;
  cost_data: {
    license_costs: number;
    implementation_costs: number;
    training_costs: number;
    support_costs: number;
    infrastructure_costs: number;
  };
  productivity_data: {
    hours_saved: number;
    average_hourly_rate: number;
    quality_improvements?: number;
    innovation_value?: number;
  };
}

export interface ROICalculationResponse {
  roi_percentage: number;
  total_costs: number;
  total_benefits: number;
  net_benefit: number;
  payback_period_months: number;
  break_even_date: Date;
  confidence_score: number;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface AdoptionAnalytics {
  organization_id: string;
  period: string;

  total_users: number;
  active_users: number;
  adoption_rate: number;

  proficiency_distribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
    expert: number;
  };

  champion_count: number;
  at_risk_users: number;

  engagement_metrics: {
    average_engagement_score: number;
    average_satisfaction_score: number;
    nps_score: number;
  };

  top_features: Array<{
    feature_name: string;
    usage_count: number;
    adoption_rate: number;
  }>;

  department_performance: Array<{
    department: string;
    adoption_rate: number;
    engagement_score: number;
  }>;
}

export interface ROIDashboardData {
  organization_id: string;
  period: string;

  summary: {
    total_investment: number;
    total_value_generated: number;
    roi_percentage: number;
    payback_achieved: boolean;
  };

  cost_breakdown: {
    licenses: number;
    implementation: number;
    training: number;
    support: number;
    infrastructure: number;
  };

  value_breakdown: {
    productivity: number;
    time_savings: number;
    quality_improvement: number;
    innovation: number;
  };

  trends: {
    monthly_roi: Array<{
      month: string;
      roi: number;
      costs: number;
      benefits: number;
    }>;
  };

  benchmarks: {
    vs_industry_avg: number;
    vs_baseline: number;
    vs_projection: number;
  };
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface ROICalculationService {
  calculateROI(request: ROICalculationRequest): Promise<ROICalculationResponse>;
  generateScenario(organizationId: string, scenarioType: string): Promise<ROIScenario>;
  compareScenarios(scenarioIds: string[]): Promise<any>;
  trackROI(organizationId: string, period: string): Promise<ROITracking>;
}

export interface AdoptionService {
  trackUserAdoption(userId: string): Promise<UserAdoption>;
  identifyChampions(organizationId: string): Promise<User[]>;
  identifyAtRiskUsers(organizationId: string): Promise<User[]>;
  recommendInterventions(organizationId: string): Promise<any[]>;
}

export interface AnalyticsService {
  getAdoptionAnalytics(organizationId: string, period: string): Promise<AdoptionAnalytics>;
  getROIDashboard(organizationId: string, period: string): Promise<ROIDashboardData>;
  predictAdoption(organizationId: string): Promise<any>;
  predictROI(organizationId: string): Promise<any>;
}
