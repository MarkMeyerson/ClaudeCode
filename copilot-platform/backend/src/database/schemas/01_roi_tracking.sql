-- ============================================================================
-- PHASE 4: ROI MEASUREMENT & ANALYTICS DATABASE SCHEMA
-- Microsoft Copilot Onboarding & ROI Platform
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================
CREATE TABLE organizations (
    organization_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    company_size VARCHAR(50), -- small, medium, large, enterprise
    employee_count INTEGER,
    annual_revenue DECIMAL(15,2),

    -- Contact Information
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),

    -- Address
    country VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),

    -- Subscription
    subscription_tier VARCHAR(50), -- free, starter, professional, enterprise
    subscription_start_date DATE,
    subscription_end_date DATE,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, trial, suspended

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- ============================================================================
-- ROI TRACKING TABLE
-- ============================================================================
CREATE TABLE roi_tracking (
    tracking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    measurement_period VARCHAR(20), -- monthly, quarterly, annual
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Cost Metrics
    total_license_cost DECIMAL(12,2) DEFAULT 0.00,
    implementation_cost DECIMAL(12,2) DEFAULT 0.00,
    training_cost DECIMAL(12,2) DEFAULT 0.00,
    support_cost DECIMAL(12,2) DEFAULT 0.00,
    infrastructure_cost DECIMAL(12,2) DEFAULT 0.00,
    total_cost DECIMAL(12,2) GENERATED ALWAYS AS (
        total_license_cost + implementation_cost + training_cost +
        support_cost + infrastructure_cost
    ) STORED,

    -- Productivity Metrics
    hours_saved INTEGER DEFAULT 0,
    tasks_automated INTEGER DEFAULT 0,
    documents_created INTEGER DEFAULT 0,
    meetings_summarized INTEGER DEFAULT 0,
    emails_drafted INTEGER DEFAULT 0,
    code_generated_lines INTEGER DEFAULT 0,
    presentations_created INTEGER DEFAULT 0,
    data_analyses_performed INTEGER DEFAULT 0,

    -- Value Metrics
    productivity_value DECIMAL(12,2) DEFAULT 0.00,
    time_savings_value DECIMAL(12,2) DEFAULT 0.00,
    quality_improvement_value DECIMAL(12,2) DEFAULT 0.00,
    innovation_value DECIMAL(12,2) DEFAULT 0.00,
    total_value_generated DECIMAL(12,2) GENERATED ALWAYS AS (
        productivity_value + time_savings_value +
        quality_improvement_value + innovation_value
    ) STORED,

    -- ROI Calculations
    gross_roi DECIMAL(8,2),
    net_roi DECIMAL(8,2),
    roi_percentage DECIMAL(8,2),
    payback_achieved BOOLEAN DEFAULT false,
    payback_date DATE,

    -- Adoption Metrics
    active_users INTEGER DEFAULT 0,
    total_licensed_users INTEGER DEFAULT 0,
    adoption_rate DECIMAL(5,2),
    utilization_rate DECIMAL(5,2),
    feature_adoption JSONB DEFAULT '{}',

    -- Comparative Metrics
    vs_baseline_improvement DECIMAL(8,2),
    vs_industry_benchmark DECIMAL(8,2),
    vs_projected_variance DECIMAL(8,2),

    -- Notes
    notes TEXT,
    data_quality_score DECIMAL(3,2), -- 0-1 confidence score

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_period CHECK (period_end > period_start),
    CONSTRAINT valid_adoption_rate CHECK (adoption_rate >= 0 AND adoption_rate <= 100),
    CONSTRAINT valid_utilization_rate CHECK (utilization_rate >= 0 AND utilization_rate <= 100)
);

-- ============================================================================
-- PRODUCTIVITY METRICS TABLE
-- ============================================================================
CREATE TABLE productivity_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    user_id UUID,
    department VARCHAR(100),
    team_name VARCHAR(100),

    -- Time Metrics
    date DATE NOT NULL,
    hours_saved DECIMAL(8,2) DEFAULT 0.00,
    tasks_completed INTEGER DEFAULT 0,
    average_task_time_reduction DECIMAL(5,2), -- percentage
    focus_time_gained_minutes INTEGER DEFAULT 0,

    -- Copilot Usage
    copilot_interactions INTEGER DEFAULT 0,
    suggestions_accepted INTEGER DEFAULT 0,
    suggestions_rejected INTEGER DEFAULT 0,
    suggestions_modified INTEGER DEFAULT 0,
    acceptance_rate DECIMAL(5,2),

    -- Application-Specific Metrics
    word_documents_enhanced INTEGER DEFAULT 0,
    word_words_generated INTEGER DEFAULT 0,
    excel_analyses_accelerated INTEGER DEFAULT 0,
    excel_formulas_created INTEGER DEFAULT 0,
    powerpoint_presentations_created INTEGER DEFAULT 0,
    powerpoint_slides_generated INTEGER DEFAULT 0,
    outlook_emails_drafted INTEGER DEFAULT 0,
    outlook_email_responses INTEGER DEFAULT 0,
    teams_meetings_summarized INTEGER DEFAULT 0,
    teams_action_items_extracted INTEGER DEFAULT 0,
    github_code_completions INTEGER DEFAULT 0,
    github_code_lines_generated INTEGER DEFAULT 0,

    -- Quality Metrics
    error_reduction_rate DECIMAL(5,2), -- percentage
    rework_reduction_rate DECIMAL(5,2), -- percentage
    first_time_right_rate DECIMAL(5,2), -- percentage
    quality_score DECIMAL(3,2), -- 0-1 score

    -- Innovation Metrics
    new_insights_generated INTEGER DEFAULT 0,
    process_improvements_identified INTEGER DEFAULT 0,
    innovative_solutions_created INTEGER DEFAULT 0,
    knowledge_discoveries INTEGER DEFAULT 0,

    -- Collaboration Metrics
    collaboration_instances INTEGER DEFAULT 0,
    knowledge_shared_count INTEGER DEFAULT 0,
    peer_assists INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_date CHECK (date <= CURRENT_DATE)
);

-- ============================================================================
-- ROI SCENARIOS TABLE
-- ============================================================================
CREATE TABLE roi_scenarios (
    scenario_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    scenario_name VARCHAR(255) NOT NULL,
    scenario_type VARCHAR(50) NOT NULL, -- conservative, moderate, optimistic, custom
    scenario_description TEXT,

    -- Assumptions
    adoption_rate_assumption DECIMAL(5,2),
    productivity_gain_assumption DECIMAL(5,2),
    time_to_proficiency_weeks INTEGER,
    average_hourly_rate DECIMAL(8,2),
    discount_rate DECIMAL(5,2), -- for NPV calculation

    -- Year 1 Projections
    year1_costs DECIMAL(12,2),
    year1_benefits DECIMAL(12,2),
    year1_net_benefit DECIMAL(12,2),
    year1_roi DECIMAL(8,2),

    -- Year 2 Projections
    year2_costs DECIMAL(12,2),
    year2_benefits DECIMAL(12,2),
    year2_net_benefit DECIMAL(12,2),
    year2_roi DECIMAL(8,2),

    -- Year 3 Projections
    year3_costs DECIMAL(12,2),
    year3_benefits DECIMAL(12,2),
    year3_net_benefit DECIMAL(12,2),
    year3_roi DECIMAL(8,2),

    -- Cumulative Metrics
    breakeven_month INTEGER,
    total_3year_costs DECIMAL(12,2),
    total_3year_benefits DECIMAL(12,2),
    total_3year_net_benefit DECIMAL(12,2),
    total_3year_roi DECIMAL(8,2),
    npv DECIMAL(12,2), -- Net Present Value
    irr DECIMAL(8,2), -- Internal Rate of Return

    -- Sensitivity Analysis
    sensitivity_data JSONB DEFAULT '{}',
    risk_factors JSONB DEFAULT '[]',
    assumptions_notes TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_baseline BOOLEAN DEFAULT false,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- ============================================================================
-- ROI BENCHMARKS TABLE
-- ============================================================================
CREATE TABLE roi_benchmarks (
    benchmark_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    industry VARCHAR(100) NOT NULL,
    company_size VARCHAR(50) NOT NULL,
    region VARCHAR(100),

    -- Benchmark Metrics
    average_roi DECIMAL(8,2),
    median_roi DECIMAL(8,2),
    top_quartile_roi DECIMAL(8,2),
    bottom_quartile_roi DECIMAL(8,2),

    -- Productivity Benchmarks
    average_hours_saved_per_user_monthly DECIMAL(8,2),
    average_productivity_gain_pct DECIMAL(5,2),
    average_adoption_rate DECIMAL(5,2),
    average_time_to_proficiency_weeks INTEGER,

    -- Cost Benchmarks
    average_cost_per_user_annual DECIMAL(10,2),
    average_implementation_cost DECIMAL(12,2),
    average_training_cost_per_user DECIMAL(8,2),

    -- Sample Data
    sample_size INTEGER,
    data_collection_date DATE,
    data_source VARCHAR(255),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VALUE REALIZATION MILESTONES TABLE
-- ============================================================================
CREATE TABLE value_realization_milestones (
    milestone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Milestone Details
    milestone_name VARCHAR(255) NOT NULL,
    milestone_description TEXT,
    milestone_category VARCHAR(50), -- adoption, productivity, roi, quality
    target_date DATE,
    completion_date DATE,

    -- Target Metrics
    target_metric_name VARCHAR(100),
    target_metric_value DECIMAL(12,2),
    actual_metric_value DECIMAL(12,2),

    -- Status
    status VARCHAR(20) DEFAULT 'planned', -- planned, in_progress, achieved, missed, cancelled
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,

    -- Impact
    business_impact TEXT,
    lessons_learned TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_completion CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- ============================================================================
-- COST TRACKING TABLE
-- ============================================================================
CREATE TABLE cost_tracking (
    cost_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Cost Details
    cost_category VARCHAR(50) NOT NULL, -- license, implementation, training, support, infrastructure
    cost_subcategory VARCHAR(100),
    cost_description TEXT,

    -- Financial Details
    cost_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    cost_date DATE NOT NULL,

    -- Allocation
    department VARCHAR(100),
    project VARCHAR(255),
    cost_center VARCHAR(100),

    -- Payment Details
    vendor VARCHAR(255),
    invoice_number VARCHAR(100),
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled

    -- Recurrence
    is_recurring BOOLEAN DEFAULT false,
    recurrence_frequency VARCHAR(20), -- monthly, quarterly, annual
    recurrence_end_date DATE,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BENEFIT TRACKING TABLE
-- ============================================================================
CREATE TABLE benefit_tracking (
    benefit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,

    -- Benefit Details
    benefit_category VARCHAR(50) NOT NULL, -- productivity, time_savings, quality, innovation, cost_avoidance
    benefit_subcategory VARCHAR(100),
    benefit_description TEXT,

    -- Value Details
    benefit_value DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    benefit_date DATE NOT NULL,

    -- Measurement
    measurement_method VARCHAR(100), -- survey, analytics, calculation, estimation
    confidence_level DECIMAL(3,2), -- 0-1 confidence score
    data_source VARCHAR(255),

    -- Allocation
    department VARCHAR(100),
    team_name VARCHAR(100),

    -- Attribution
    attributed_to_copilot BOOLEAN DEFAULT true,
    copilot_contribution_pct DECIMAL(5,2) DEFAULT 100.00,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organizations indexes
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_industry ON organizations(industry);
CREATE INDEX idx_organizations_company_size ON organizations(company_size);

-- ROI Tracking indexes
CREATE INDEX idx_roi_tracking_org_id ON roi_tracking(organization_id);
CREATE INDEX idx_roi_tracking_period ON roi_tracking(period_start, period_end);
CREATE INDEX idx_roi_tracking_measurement_period ON roi_tracking(measurement_period);

-- Productivity Metrics indexes
CREATE INDEX idx_productivity_metrics_org_id ON productivity_metrics(organization_id);
CREATE INDEX idx_productivity_metrics_user_id ON productivity_metrics(user_id);
CREATE INDEX idx_productivity_metrics_date ON productivity_metrics(date);
CREATE INDEX idx_productivity_metrics_department ON productivity_metrics(department);

-- ROI Scenarios indexes
CREATE INDEX idx_roi_scenarios_org_id ON roi_scenarios(organization_id);
CREATE INDEX idx_roi_scenarios_type ON roi_scenarios(scenario_type);
CREATE INDEX idx_roi_scenarios_active ON roi_scenarios(is_active);

-- Benchmarks indexes
CREATE INDEX idx_roi_benchmarks_industry ON roi_benchmarks(industry);
CREATE INDEX idx_roi_benchmarks_size ON roi_benchmarks(company_size);

-- Cost/Benefit tracking indexes
CREATE INDEX idx_cost_tracking_org_id ON cost_tracking(organization_id);
CREATE INDEX idx_cost_tracking_date ON cost_tracking(cost_date);
CREATE INDEX idx_cost_tracking_category ON cost_tracking(cost_category);
CREATE INDEX idx_benefit_tracking_org_id ON benefit_tracking(organization_id);
CREATE INDEX idx_benefit_tracking_date ON benefit_tracking(benefit_date);
CREATE INDEX idx_benefit_tracking_category ON benefit_tracking(benefit_category);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- ROI Summary View
CREATE VIEW roi_summary AS
SELECT
    r.organization_id,
    o.organization_name,
    o.industry,
    o.company_size,
    r.measurement_period,
    r.period_start,
    r.period_end,
    r.total_cost,
    r.total_value_generated,
    r.total_value_generated - r.total_cost AS net_benefit,
    CASE
        WHEN r.total_cost > 0
        THEN ROUND(((r.total_value_generated - r.total_cost) / r.total_cost * 100)::numeric, 2)
        ELSE 0
    END AS roi_percentage,
    r.adoption_rate,
    r.utilization_rate,
    r.payback_achieved,
    r.updated_at
FROM roi_tracking r
JOIN organizations o ON r.organization_id = o.organization_id;

-- Productivity Summary View
CREATE VIEW productivity_summary AS
SELECT
    organization_id,
    date,
    department,
    SUM(hours_saved) AS total_hours_saved,
    SUM(tasks_completed) AS total_tasks_completed,
    SUM(copilot_interactions) AS total_interactions,
    CASE
        WHEN SUM(copilot_interactions) > 0
        THEN ROUND((SUM(suggestions_accepted)::numeric / SUM(copilot_interactions) * 100)::numeric, 2)
        ELSE 0
    END AS overall_acceptance_rate,
    SUM(word_documents_enhanced + excel_analyses_accelerated +
        powerpoint_presentations_created + outlook_emails_drafted +
        teams_meetings_summarized + github_code_completions) AS total_outputs
FROM productivity_metrics
GROUP BY organization_id, date, department;

-- Cost vs Benefit View
CREATE VIEW cost_benefit_analysis AS
SELECT
    o.organization_id,
    o.organization_name,
    DATE_TRUNC('month', COALESCE(c.cost_date, b.benefit_date)) AS month,
    COALESCE(SUM(c.cost_amount), 0) AS total_costs,
    COALESCE(SUM(b.benefit_value), 0) AS total_benefits,
    COALESCE(SUM(b.benefit_value), 0) - COALESCE(SUM(c.cost_amount), 0) AS net_value
FROM organizations o
LEFT JOIN cost_tracking c ON o.organization_id = c.organization_id
LEFT JOIN benefit_tracking b ON o.organization_id = b.organization_id
GROUP BY o.organization_id, o.organization_name, DATE_TRUNC('month', COALESCE(c.cost_date, b.benefit_date));

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roi_tracking_updated_at BEFORE UPDATE ON roi_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productivity_metrics_updated_at BEFORE UPDATE ON productivity_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roi_scenarios_updated_at BEFORE UPDATE ON roi_scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_tracking_updated_at BEFORE UPDATE ON cost_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_benefit_tracking_updated_at BEFORE UPDATE ON benefit_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE organizations IS 'Core organization/tenant information for multi-tenant platform';
COMMENT ON TABLE roi_tracking IS 'Tracks ROI metrics for each organization over different time periods';
COMMENT ON TABLE productivity_metrics IS 'Detailed productivity metrics at user/department/team level';
COMMENT ON TABLE roi_scenarios IS 'ROI projection scenarios for planning and forecasting';
COMMENT ON TABLE roi_benchmarks IS 'Industry benchmarks for ROI comparison';
COMMENT ON TABLE value_realization_milestones IS 'Tracks progress toward value realization goals';
COMMENT ON TABLE cost_tracking IS 'Detailed cost tracking for all Copilot-related expenses';
COMMENT ON TABLE benefit_tracking IS 'Detailed benefit tracking with measurement methodology';
