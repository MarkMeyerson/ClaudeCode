-- ============================================================================
-- NAIOS Platform - Assessment Engine Database Schema
-- Version: 1.0.0
-- Description: Complete database schema for the Assessment Engine service
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- ORGANIZATIONS TABLE
-- Stores comprehensive information about non-profit organizations
-- ============================================================================
CREATE TABLE organizations (
    -- Primary identification
    org_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ein VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    dba_name VARCHAR(255),

    -- Organizational details
    legal_structure VARCHAR(100) CHECK (legal_structure IN ('501c3', '501c4', '501c6', 'LLC', 'B-Corp', 'Cooperative', 'Other')),
    tax_status VARCHAR(50) CHECK (tax_status IN ('Tax-Exempt', 'Taxable', 'Pending', 'Revoked')),
    founding_date DATE,
    incorporation_date DATE,
    incorporation_state VARCHAR(2),

    -- Mission and vision
    mission_statement TEXT,
    vision_statement TEXT,
    values TEXT[],
    strategic_priorities TEXT[],

    -- Size and scope
    budget_size DECIMAL(15, 2),
    budget_year INTEGER,
    employee_count INTEGER DEFAULT 0,
    full_time_count INTEGER DEFAULT 0,
    part_time_count INTEGER DEFAULT 0,
    contractor_count INTEGER DEFAULT 0,
    volunteer_count INTEGER DEFAULT 0,
    board_size INTEGER DEFAULT 0,
    annual_revenue DECIMAL(15, 2),
    annual_expenses DECIMAL(15, 2),

    -- Location information
    location_address VARCHAR(255),
    location_address2 VARCHAR(255),
    location_city VARCHAR(100),
    location_state VARCHAR(2),
    location_zip VARCHAR(10),
    location_county VARCHAR(100),
    location_country VARCHAR(3) DEFAULT 'USA',
    service_area_scope VARCHAR(50) CHECK (service_area_scope IN ('Local', 'Regional', 'State', 'National', 'International')),
    service_area_description TEXT,

    -- Contact information
    website VARCHAR(500),
    primary_contact_name VARCHAR(255),
    primary_contact_title VARCHAR(100),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(20),
    general_email VARCHAR(255),
    general_phone VARCHAR(20),

    -- Sector and focus
    sector_primary VARCHAR(100),
    sector_secondary VARCHAR(100),
    focus_areas TEXT[],
    ntee_code VARCHAR(10),
    beneficiary_demographics JSONB,
    populations_served TEXT[],

    -- Funding and resources
    funding_sources JSONB,
    revenue_streams TEXT[],
    major_funders TEXT[],

    -- Accreditations and affiliations
    accreditations TEXT[],
    certifications TEXT[],
    affiliations TEXT[],
    memberships TEXT[],

    -- Technology and systems
    current_systems JSONB,
    technology_budget DECIMAL(15, 2),
    it_staff_count INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    is_active BOOLEAN DEFAULT TRUE,
    archived_at TIMESTAMP WITH TIME ZONE,

    -- Additional data storage
    custom_fields JSONB,
    notes TEXT,
    tags TEXT[]
);

-- Indexes for organizations
CREATE INDEX idx_organizations_ein ON organizations(ein);
CREATE INDEX idx_organizations_name ON organizations USING gin(name gin_trgm_ops);
CREATE INDEX idx_organizations_state ON organizations(location_state);
CREATE INDEX idx_organizations_sector ON organizations(sector_primary);
CREATE INDEX idx_organizations_budget ON organizations(budget_size);
CREATE INDEX idx_organizations_created_at ON organizations(created_at);
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- ASSESSMENTS TABLE
-- Stores assessment records and overall results
-- ============================================================================
CREATE TABLE assessments (
    -- Primary identification
    assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,

    -- Assessment details
    assessment_type VARCHAR(100) NOT NULL CHECK (assessment_type IN (
        'Initial Assessment', 'Follow-up Assessment', 'Annual Review',
        'Program Assessment', 'Technology Assessment', 'Capacity Assessment',
        'Readiness Assessment', 'Maturity Assessment', 'Custom Assessment'
    )),
    assessment_name VARCHAR(255),
    assessment_date DATE NOT NULL,
    assessment_period_start DATE,
    assessment_period_end DATE,

    -- Assessor information
    assessor_id UUID,
    assessor_name VARCHAR(255),
    assessor_organization VARCHAR(255),
    assessment_team TEXT[],

    -- Status and progress
    status VARCHAR(50) NOT NULL DEFAULT 'Planned' CHECK (status IN (
        'Planned', 'In Progress', 'Data Collection', 'Analysis',
        'Review', 'Completed', 'Approved', 'Archived'
    )),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

    -- Scoring
    overall_score DECIMAL(5, 2) CHECK (overall_score >= 0 AND overall_score <= 100),
    weighted_score DECIMAL(5, 2),
    normalized_score DECIMAL(5, 2),
    dimension_scores JSONB,
    subscale_scores JSONB,

    -- Analysis results
    strengths_identified TEXT[],
    weaknesses_identified TEXT[],
    opportunities_identified TEXT[],
    threats_identified TEXT[],
    critical_issues TEXT[],
    quick_wins TEXT[],

    -- Recommendations
    priority_areas TEXT[],
    recommended_actions JSONB,
    timeline_proposed JSONB,
    resources_required JSONB,
    estimated_cost DECIMAL(15, 2),
    roi_projection DECIMAL(15, 2),

    -- Metrics
    baseline_metrics JSONB,
    target_metrics JSONB,
    kpis JSONB,

    -- Methodology
    assessment_methodology TEXT,
    assessment_framework VARCHAR(100),
    data_sources_used TEXT[],
    stakeholders_interviewed TEXT[],
    documentation_reviewed TEXT[],
    site_visits_conducted INTEGER DEFAULT 0,

    -- Expected outcomes
    expected_outcomes TEXT[],
    success_criteria JSONB,
    impact_projections JSONB,

    -- Follow-up
    follow_up_date DATE,
    follow_up_required BOOLEAN DEFAULT FALSE,
    reassessment_date DATE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,

    -- Additional data
    attachments JSONB,
    custom_fields JSONB,
    notes TEXT,
    tags TEXT[]
);

-- Indexes for assessments
CREATE INDEX idx_assessments_org_id ON assessments(org_id);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);
CREATE INDEX idx_assessments_date ON assessments(assessment_date DESC);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_assessor ON assessments(assessor_id);
CREATE INDEX idx_assessments_score ON assessments(overall_score);

-- ============================================================================
-- ASSESSMENT_DIMENSIONS TABLE
-- Stores detailed dimension-level assessment data
-- ============================================================================
CREATE TABLE assessment_dimensions (
    -- Primary identification
    dimension_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(assessment_id) ON DELETE CASCADE,

    -- Dimension details
    dimension_name VARCHAR(255) NOT NULL,
    dimension_code VARCHAR(50),
    dimension_category VARCHAR(100) CHECK (dimension_category IN (
        'Leadership & Governance', 'Strategic Planning', 'Program Management',
        'Financial Management', 'Human Resources', 'Technology & Infrastructure',
        'Marketing & Communications', 'Fundraising & Development',
        'Community Engagement', 'Impact Measurement', 'Operations',
        'Compliance & Risk Management', 'Innovation & Adaptation'
    )),
    dimension_description TEXT,
    dimension_weight DECIMAL(5, 2) DEFAULT 1.0,

    -- Maturity assessment
    current_maturity_level INTEGER CHECK (current_maturity_level BETWEEN 1 AND 5),
    target_maturity_level INTEGER CHECK (target_maturity_level BETWEEN 1 AND 5),
    maturity_level_description TEXT,
    maturity_gap INTEGER GENERATED ALWAYS AS (target_maturity_level - current_maturity_level) STORED,

    -- Scoring
    dimension_score DECIMAL(5, 2) CHECK (dimension_score >= 0 AND dimension_score <= 100),
    max_possible_score DECIMAL(5, 2) DEFAULT 100,
    weighted_score DECIMAL(5, 2),
    percentile_rank DECIMAL(5, 2),

    -- Gap analysis
    gap_analysis TEXT,
    gap_severity VARCHAR(20) CHECK (gap_severity IN ('Critical', 'High', 'Medium', 'Low', 'None')),
    gap_impact TEXT,

    -- Improvement planning
    improvement_priorities TEXT[],
    recommended_actions JSONB,
    resource_requirements JSONB,
    timeline_estimate VARCHAR(100),
    effort_estimate VARCHAR(50) CHECK (effort_estimate IN ('Low', 'Medium', 'High', 'Very High')),
    cost_estimate DECIMAL(15, 2),

    -- Dependencies and relationships
    dependencies TEXT[],
    prerequisite_dimensions UUID[],
    related_dimensions UUID[],

    -- Risk assessment
    risks_identified TEXT[],
    risk_level VARCHAR(20) CHECK (risk_level IN ('Critical', 'High', 'Medium', 'Low', 'Minimal')),
    mitigation_strategies TEXT[],

    -- Success metrics
    success_criteria JSONB,
    kpis JSONB,
    progress_indicators TEXT[],

    -- Benchmarking
    benchmark_comparison JSONB,
    peer_comparison JSONB,
    best_practices_applicable TEXT[],

    -- Evidence and data
    evidence_sources TEXT[],
    data_points JSONB,
    assessment_notes TEXT,

    -- Readiness and enablers
    readiness_score DECIMAL(5, 2),
    readiness_indicators TEXT[],
    blockers_identified TEXT[],
    enablers_identified TEXT[],

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assessed_by UUID,
    reviewed_by UUID,

    -- Additional data
    custom_fields JSONB,
    notes TEXT
);

-- Indexes for assessment_dimensions
CREATE INDEX idx_assessment_dimensions_assessment ON assessment_dimensions(assessment_id);
CREATE INDEX idx_assessment_dimensions_category ON assessment_dimensions(dimension_category);
CREATE INDEX idx_assessment_dimensions_maturity ON assessment_dimensions(current_maturity_level, target_maturity_level);
CREATE INDEX idx_assessment_dimensions_score ON assessment_dimensions(dimension_score);

-- ============================================================================
-- MATURITY_SCORES TABLE
-- Stores detailed criterion-level scoring
-- ============================================================================
CREATE TABLE maturity_scores (
    -- Primary identification
    score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    dimension_id UUID NOT NULL REFERENCES assessment_dimensions(dimension_id) ON DELETE CASCADE,

    -- Criterion details
    criterion_id UUID,
    criterion_name VARCHAR(255) NOT NULL,
    criterion_description TEXT,
    criterion_category VARCHAR(100),
    criterion_weight DECIMAL(5, 2) DEFAULT 1.0,

    -- Scoring
    current_score DECIMAL(5, 2) CHECK (current_score >= 0 AND current_score <= 100),
    target_score DECIMAL(5, 2) CHECK (target_score >= 0 AND target_score <= 100),
    max_score DECIMAL(5, 2) DEFAULT 100,
    weighted_score DECIMAL(5, 2),
    score_gap DECIMAL(5, 2) GENERATED ALWAYS AS (target_score - current_score) STORED,

    -- Maturity levels
    current_maturity INTEGER CHECK (current_maturity BETWEEN 1 AND 5),
    target_maturity INTEGER CHECK (target_maturity BETWEEN 1 AND 5),

    -- Evidence and justification
    evidence_provided TEXT[],
    evidence_quality VARCHAR(20) CHECK (evidence_quality IN ('Strong', 'Moderate', 'Weak', 'None')),
    documentation_links TEXT[],

    -- Evaluator assessment
    evaluator_notes TEXT,
    evaluator_confidence VARCHAR(20) CHECK (evaluator_confidence IN ('Very High', 'High', 'Medium', 'Low', 'Very Low')),
    evaluated_by UUID,
    evaluated_at TIMESTAMP WITH TIME ZONE,

    -- Improvement actions
    improvement_actions JSONB,
    priority_level VARCHAR(20) CHECK (priority_level IN ('Critical', 'High', 'Medium', 'Low')),
    effort_estimate VARCHAR(50) CHECK (effort_estimate IN ('Low', 'Medium', 'High', 'Very High')),
    impact_estimate VARCHAR(50) CHECK (impact_estimate IN ('Low', 'Medium', 'High', 'Very High')),

    -- Implementation planning
    feasibility_score DECIMAL(5, 2),
    complexity_score DECIMAL(5, 2),
    resource_intensity VARCHAR(20),

    -- Status indicators
    readiness_indicators TEXT[],
    blockers_identified TEXT[],
    enablers_identified TEXT[],

    -- Benchmarking
    best_practices_applicable TEXT[],
    benchmark_comparison JSONB,
    peer_comparison JSONB,
    industry_average DECIMAL(5, 2),
    top_quartile_score DECIMAL(5, 2),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Additional data
    custom_fields JSONB,
    notes TEXT,
    tags TEXT[]
);

-- Indexes for maturity_scores
CREATE INDEX idx_maturity_scores_assessment ON maturity_scores(assessment_id);
CREATE INDEX idx_maturity_scores_dimension ON maturity_scores(dimension_id);
CREATE INDEX idx_maturity_scores_criterion ON maturity_scores(criterion_id);
CREATE INDEX idx_maturity_scores_priority ON maturity_scores(priority_level);
CREATE INDEX idx_maturity_scores_impact ON maturity_scores(impact_estimate);

-- ============================================================================
-- RECOMMENDATIONS TABLE
-- Stores detailed recommendations from assessments
-- ============================================================================
CREATE TABLE recommendations (
    -- Primary identification
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    dimension_id UUID REFERENCES assessment_dimensions(dimension_id) ON DELETE SET NULL,

    -- Recommendation details
    recommendation_title VARCHAR(500) NOT NULL,
    recommendation_text TEXT NOT NULL,
    recommendation_type VARCHAR(100) CHECK (recommendation_type IN (
        'Strategic', 'Operational', 'Technical', 'Process', 'Policy',
        'Training', 'Investment', 'Partnership', 'Restructuring', 'Other'
    )),
    recommendation_category VARCHAR(100),

    -- Prioritization
    priority_level VARCHAR(20) NOT NULL CHECK (priority_level IN ('Critical', 'High', 'Medium', 'Low')),
    priority_score DECIMAL(5, 2),
    priority_rationale TEXT,

    -- Impact assessment
    impact_level VARCHAR(20) CHECK (impact_level IN ('Transformational', 'High', 'Medium', 'Low', 'Minimal')),
    impact_description TEXT,
    impact_areas TEXT[],
    expected_benefits TEXT[],
    expected_roi DECIMAL(15, 2),

    -- Effort and resources
    effort_level VARCHAR(20) CHECK (effort_level IN ('Very High', 'High', 'Medium', 'Low', 'Minimal')),
    effort_description TEXT,
    resource_requirements JSONB,
    estimated_cost DECIMAL(15, 2),
    estimated_hours INTEGER,

    -- Timeline
    time_frame VARCHAR(100) CHECK (time_frame IN (
        'Immediate (0-3 months)', 'Short-term (3-6 months)',
        'Medium-term (6-12 months)', 'Long-term (1-2 years)',
        'Strategic (2+ years)'
    )),
    start_date DATE,
    target_completion_date DATE,
    milestone_dates JSONB,

    -- Implementation details
    implementation_steps JSONB,
    dependencies TEXT[],
    prerequisites TEXT[],
    success_criteria JSONB,
    measurement_approach TEXT,
    kpis JSONB,

    -- Responsibility
    responsible_party VARCHAR(255),
    responsible_role VARCHAR(100),
    supporting_parties TEXT[],
    oversight_party VARCHAR(255),

    -- Risk management
    risks_identified TEXT[],
    risk_level VARCHAR(20) CHECK (risk_level IN ('High', 'Medium', 'Low', 'Minimal')),
    mitigation_strategies TEXT[],

    -- Status tracking
    approval_status VARCHAR(50) DEFAULT 'Pending' CHECK (approval_status IN (
        'Pending', 'Under Review', 'Approved', 'Rejected',
        'On Hold', 'Cancelled'
    )),
    approval_date DATE,
    approved_by UUID,
    approval_notes TEXT,

    implementation_status VARCHAR(50) DEFAULT 'Not Started' CHECK (implementation_status IN (
        'Not Started', 'Planning', 'In Progress', 'On Hold',
        'Completed', 'Cancelled', 'Deferred'
    )),
    implementation_progress INTEGER DEFAULT 0 CHECK (implementation_progress >= 0 AND implementation_progress <= 100),

    -- Outcome tracking
    actual_start_date DATE,
    actual_completion_date DATE,
    actual_cost DECIMAL(15, 2),
    actual_benefits TEXT[],
    lessons_learned TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    -- Additional data
    attachments JSONB,
    custom_fields JSONB,
    notes TEXT,
    tags TEXT[]
);

-- Indexes for recommendations
CREATE INDEX idx_recommendations_assessment ON recommendations(assessment_id);
CREATE INDEX idx_recommendations_dimension ON recommendations(dimension_id);
CREATE INDEX idx_recommendations_priority ON recommendations(priority_level);
CREATE INDEX idx_recommendations_status ON recommendations(implementation_status);
CREATE INDEX idx_recommendations_approval ON recommendations(approval_status);
CREATE INDEX idx_recommendations_timeframe ON recommendations(time_frame);

-- ============================================================================
-- ACTION_PLANS TABLE
-- Stores comprehensive action plans based on assessments
-- ============================================================================
CREATE TABLE action_plans (
    -- Primary identification
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(assessment_id) ON DELETE CASCADE,

    -- Plan details
    plan_name VARCHAR(255) NOT NULL,
    plan_description TEXT,
    plan_type VARCHAR(100) CHECK (plan_type IN (
        'Strategic Implementation', 'Improvement Plan', 'Capacity Building',
        'Digital Transformation', 'Organizational Change', 'Custom Plan'
    )),
    plan_version INTEGER DEFAULT 1,

    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_months INTEGER GENERATED ALWAYS AS (
        EXTRACT(MONTH FROM AGE(end_date, start_date))
    ) STORED,
    current_phase VARCHAR(100),

    -- Budget
    total_budget DECIMAL(15, 2),
    allocated_budget DECIMAL(15, 2) DEFAULT 0,
    spent_budget DECIMAL(15, 2) DEFAULT 0,
    committed_budget DECIMAL(15, 2) DEFAULT 0,
    remaining_budget DECIMAL(15, 2) GENERATED ALWAYS AS (
        total_budget - spent_budget - committed_budget
    ) STORED,
    budget_by_category JSONB,
    funding_sources JSONB,

    -- Plan components
    goals JSONB NOT NULL,
    objectives JSONB NOT NULL,
    initiatives JSONB,
    milestones JSONB,
    deliverables JSONB,

    -- Success metrics
    success_metrics JSONB,
    kpis JSONB,
    target_outcomes JSONB,
    baseline_measurements JSONB,

    -- Risk management
    risk_assessment JSONB,
    risk_mitigation JSONB,
    contingency_plans JSONB,

    -- Stakeholder management
    stakeholder_map JSONB,
    communication_plan JSONB,
    engagement_strategy JSONB,

    -- Resource planning
    resource_plan JSONB,
    team_structure JSONB,
    roles_responsibilities JSONB,
    capacity_requirements JSONB,

    -- Change management
    change_management_approach TEXT,
    change_readiness_score DECIMAL(5, 2),
    change_resistance_factors TEXT[],
    change_enablers TEXT[],

    -- Training and support
    training_requirements JSONB,
    training_schedule JSONB,
    support_requirements JSONB,
    coaching_mentoring JSONB,

    -- Governance
    governance_structure JSONB,
    decision_making_process TEXT,
    escalation_path TEXT[],
    approval_chain TEXT[],
    steering_committee TEXT[],

    -- Monitoring and evaluation
    monitoring_frequency VARCHAR(50),
    evaluation_schedule JSONB,
    reporting_requirements JSONB,
    review_meetings JSONB,

    -- Status
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN (
        'Draft', 'Under Review', 'Approved', 'Active',
        'On Hold', 'Completed', 'Cancelled'
    )),
    overall_progress INTEGER DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
    health_status VARCHAR(20) CHECK (health_status IN ('On Track', 'At Risk', 'Off Track', 'Critical')),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,

    -- Additional data
    attachments JSONB,
    custom_fields JSONB,
    notes TEXT,
    tags TEXT[]
);

-- Indexes for action_plans
CREATE INDEX idx_action_plans_assessment ON action_plans(assessment_id);
CREATE INDEX idx_action_plans_status ON action_plans(status);
CREATE INDEX idx_action_plans_dates ON action_plans(start_date, end_date);
CREATE INDEX idx_action_plans_health ON action_plans(health_status);

-- ============================================================================
-- PROGRESS_TRACKING TABLE
-- Tracks progress on action plan milestones and deliverables
-- ============================================================================
CREATE TABLE progress_tracking (
    -- Primary identification
    tracking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES action_plans(plan_id) ON DELETE CASCADE,

    -- Milestone/deliverable reference
    milestone_id UUID,
    milestone_name VARCHAR(255) NOT NULL,
    milestone_type VARCHAR(50) CHECK (milestone_type IN ('Milestone', 'Deliverable', 'Checkpoint', 'Gate')),

    -- Status
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'Not Started', 'Planning', 'In Progress', 'Under Review',
        'Completed', 'Approved', 'Rejected', 'On Hold', 'Cancelled'
    )),
    percent_complete INTEGER DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
    health_status VARCHAR(20) CHECK (health_status IN ('On Track', 'At Risk', 'Off Track', 'Critical')),

    -- Timeline
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    variance_days INTEGER,

    -- Progress details
    activities_completed TEXT[],
    activities_in_progress TEXT[],
    activities_pending TEXT[],

    -- Issues and blockers
    blockers_encountered TEXT[],
    blocker_severity VARCHAR(20) CHECK (blocker_severity IN ('Critical', 'High', 'Medium', 'Low')),
    solutions_implemented TEXT[],
    escalations JSONB,

    -- Metrics and outcomes
    metrics_achieved JSONB,
    target_metrics JSONB,
    variance_analysis JSONB,
    quality_score DECIMAL(5, 2),

    -- Lessons learned
    lessons_learned TEXT[],
    best_practices_identified TEXT[],
    challenges_faced TEXT[],
    recommendations TEXT[],

    -- Resources
    budget_allocated DECIMAL(15, 2),
    budget_spent DECIMAL(15, 2),
    hours_estimated INTEGER,
    hours_actual INTEGER,
    resources_utilized JSONB,

    -- Corrective actions
    corrective_actions TEXT[],
    corrective_action_status VARCHAR(50),
    corrective_action_effectiveness TEXT,

    -- Updates and notes
    last_update_date DATE,
    next_update_date DATE,
    update_frequency VARCHAR(50),

    -- Metadata
    updated_by UUID NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,

    -- Additional data
    attachments JSONB,
    custom_fields JSONB,
    notes TEXT
);

-- Indexes for progress_tracking
CREATE INDEX idx_progress_tracking_plan ON progress_tracking(plan_id);
CREATE INDEX idx_progress_tracking_milestone ON progress_tracking(milestone_id);
CREATE INDEX idx_progress_tracking_status ON progress_tracking(status);
CREATE INDEX idx_progress_tracking_health ON progress_tracking(health_status);
CREATE INDEX idx_progress_tracking_dates ON progress_tracking(actual_start_date, actual_end_date);

-- ============================================================================
-- BENCHMARKS TABLE
-- Stores benchmark data for comparison
-- ============================================================================
CREATE TABLE benchmarks (
    -- Primary identification
    benchmark_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dimension_id UUID REFERENCES assessment_dimensions(dimension_id) ON DELETE SET NULL,

    -- Benchmark details
    benchmark_name VARCHAR(255) NOT NULL,
    benchmark_category VARCHAR(100),
    metric_name VARCHAR(255) NOT NULL,
    metric_description TEXT,
    metric_unit VARCHAR(50),

    -- Statistical measures
    industry_average DECIMAL(10, 2),
    median_value DECIMAL(10, 2),
    top_quartile DECIMAL(10, 2),
    top_decile DECIMAL(10, 2),
    bottom_quartile DECIMAL(10, 2),
    standard_deviation DECIMAL(10, 2),

    -- Peer group comparisons
    peer_group_average DECIMAL(10, 2),
    peer_group_definition TEXT,
    peer_group_size INTEGER,

    -- Segmentation
    regional_average DECIMAL(10, 2),
    region VARCHAR(100),
    size_category_average DECIMAL(10, 2),
    size_category VARCHAR(50),
    maturity_stage_average DECIMAL(10, 2),
    maturity_stage VARCHAR(50),

    -- Data source and quality
    data_source VARCHAR(255) NOT NULL,
    data_source_url VARCHAR(500),
    sample_size INTEGER,
    data_quality VARCHAR(20) CHECK (data_quality IN ('High', 'Medium', 'Low')),
    data_collection_method TEXT,

    -- Temporal information
    measurement_year INTEGER,
    measurement_period VARCHAR(100),
    last_updated DATE NOT NULL,
    next_update_date DATE,
    update_frequency VARCHAR(50),

    -- Context
    context_description TEXT,
    limitations TEXT,
    interpretive_guidelines TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    -- Additional data
    custom_fields JSONB,
    notes TEXT,
    tags TEXT[]
);

-- Indexes for benchmarks
CREATE INDEX idx_benchmarks_dimension ON benchmarks(dimension_id);
CREATE INDEX idx_benchmarks_category ON benchmarks(benchmark_category);
CREATE INDEX idx_benchmarks_metric ON benchmarks(metric_name);
CREATE INDEX idx_benchmarks_year ON benchmarks(measurement_year);

-- ============================================================================
-- AUDIT LOG TABLE
-- Comprehensive audit trail for all changes
-- ============================================================================
CREATE TABLE audit_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_data JSONB,
    previous_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    session_id UUID
);

-- Index for audit_log
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user ON audit_log(changed_by);
CREATE INDEX idx_audit_log_timestamp ON audit_log(changed_at DESC);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_dimensions_updated_at BEFORE UPDATE ON assessment_dimensions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maturity_scores_updated_at BEFORE UPDATE ON maturity_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_plans_updated_at BEFORE UPDATE ON action_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_tracking_updated_at BEFORE UPDATE ON progress_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_benchmarks_updated_at BEFORE UPDATE ON benchmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active assessments with organization info
CREATE VIEW v_active_assessments AS
SELECT
    a.assessment_id,
    a.assessment_name,
    a.assessment_type,
    a.assessment_date,
    a.status,
    a.overall_score,
    a.progress_percentage,
    o.org_id,
    o.name AS organization_name,
    o.ein,
    o.sector_primary,
    o.budget_size
FROM assessments a
JOIN organizations o ON a.org_id = o.org_id
WHERE a.status IN ('In Progress', 'Data Collection', 'Analysis', 'Review')
    AND o.is_active = TRUE;

-- Assessment summary with dimension scores
CREATE VIEW v_assessment_summary AS
SELECT
    a.assessment_id,
    a.org_id,
    o.name AS organization_name,
    a.assessment_date,
    a.overall_score,
    COUNT(DISTINCT ad.dimension_id) AS total_dimensions,
    AVG(ad.dimension_score) AS avg_dimension_score,
    COUNT(DISTINCT r.recommendation_id) AS total_recommendations,
    COUNT(DISTINCT CASE WHEN r.priority_level = 'Critical' THEN r.recommendation_id END) AS critical_recommendations
FROM assessments a
JOIN organizations o ON a.org_id = o.org_id
LEFT JOIN assessment_dimensions ad ON a.assessment_id = ad.assessment_id
LEFT JOIN recommendations r ON a.assessment_id = r.assessment_id
GROUP BY a.assessment_id, a.org_id, o.name, a.assessment_date, a.overall_score;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Note: Adjust these based on your actual user roles
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO naios_app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO naios_readonly_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO naios_app_user;

-- ============================================================================
-- END OF ASSESSMENT ENGINE SCHEMA
-- ============================================================================
