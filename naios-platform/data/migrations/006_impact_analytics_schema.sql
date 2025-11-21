-- ============================================================================
-- NAIOS Platform - Impact Analytics Database Schema
-- Version: 1.0.0
-- Description: Complete schema for impact measurement and SROI calculation
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- PROGRAMS TABLE
-- Non-profit programs and services
-- ============================================================================
CREATE TABLE programs (
    program_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_code VARCHAR(50) UNIQUE NOT NULL,
    program_name VARCHAR(255) NOT NULL,
    program_type VARCHAR(100) CHECK (program_type IN (
        'Direct Service', 'Advocacy', 'Research', 'Education',
        'Community Development', 'Emergency Response', 'Prevention', 'Other'
    )),
    description TEXT NOT NULL,
    mission_alignment TEXT,
    target_population TEXT,
    geographic_area TEXT[],
    service_area_scope VARCHAR(50),

    -- Capacity and enrollment
    capacity INTEGER,
    current_enrollment INTEGER DEFAULT 0,
    waitlist_count INTEGER DEFAULT 0,
    slots_available INTEGER GENERATED ALWAYS AS (capacity - current_enrollment) STORED,

    -- Eligibility
    eligibility_criteria TEXT[],
    age_minimum INTEGER,
    age_maximum INTEGER,
    income_requirements TEXT,
    geographic_requirements TEXT,

    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN (
        'Planning', 'Active', 'Suspended', 'Completed', 'Archived'
    )),

    -- Budget and resources
    budget_allocated DECIMAL(15, 2),
    budget_spent DECIMAL(15, 2) DEFAULT 0,
    funding_sources JSONB,

    -- Staffing
    staffing_model TEXT,
    staff_count INTEGER DEFAULT 0,
    volunteer_count INTEGER DEFAULT 0,

    -- Partners and collaborations
    partner_organizations TEXT[],
    collaboration_model TEXT,

    -- Theory of Change linkage
    logic_model_id UUID,
    theory_of_change_id UUID,

    -- Evidence and research
    evidence_base TEXT,
    research_backing TEXT[],
    best_practices_used TEXT[],

    -- Evaluation framework
    evaluation_framework VARCHAR(100),
    evaluation_frequency VARCHAR(50),

    -- Goals and metrics
    impact_goals JSONB,
    success_metrics JSONB,
    kpis JSONB,

    -- Reporting
    reporting_requirements TEXT[],
    compliance_requirements TEXT[],

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    custom_fields JSONB,
    notes TEXT,
    tags TEXT[]
);

CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_type ON programs(program_type);
CREATE INDEX idx_programs_dates ON programs(start_date, end_date);

-- ============================================================================
-- BENEFICIARIES TABLE
-- Individuals and entities receiving services
-- ============================================================================
CREATE TABLE beneficiaries (
    beneficiary_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_number VARCHAR(50) UNIQUE NOT NULL,

    -- Personal information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    ethnicity VARCHAR(100),
    primary_language VARCHAR(50),

    -- Contact information
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),

    -- Household information
    household_size INTEGER,
    household_income DECIMAL(15, 2),
    household_income_category VARCHAR(50),
    dependents INTEGER,

    -- Demographics
    education_level VARCHAR(100),
    employment_status VARCHAR(100),
    housing_status VARCHAR(100),
    health_insurance BOOLEAN,
    disabilities TEXT[],
    veteran_status BOOLEAN,

    -- Referral and intake
    referral_source VARCHAR(255),
    referral_date DATE,
    intake_date DATE,
    intake_worker UUID,

    -- Eligibility
    eligibility_verified BOOLEAN DEFAULT FALSE,
    eligibility_criteria_met TEXT[],
    eligibility_expiry_date DATE,

    -- Consent and privacy
    consent_forms JSONB,
    privacy_notice_signed BOOLEAN DEFAULT FALSE,
    data_sharing_consent BOOLEAN DEFAULT FALSE,

    -- Service planning
    service_plan JSONB,
    service_goals JSONB,
    assigned_case_worker UUID,

    -- Emergency contact
    emergency_contact JSONB,

    -- Special considerations
    special_needs TEXT[],
    accommodations_required TEXT[],
    risk_factors TEXT[],
    protective_factors TEXT[],

    -- Goals and progress
    individual_goals JSONB,
    progress_notes TEXT[],
    barriers_identified TEXT[],
    successes_noted TEXT[],

    -- Exit information
    exit_date DATE,
    exit_reason VARCHAR(255),
    exit_status VARCHAR(100),
    exit_interview_completed BOOLEAN DEFAULT FALSE,
    follow_up_planned BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    custom_fields JSONB,
    notes TEXT,
    tags TEXT[],

    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_beneficiaries_name ON beneficiaries(last_name, first_name);
CREATE INDEX idx_beneficiaries_intake_date ON beneficiaries(intake_date DESC);
CREATE INDEX idx_beneficiaries_case_worker ON beneficiaries(assigned_case_worker);
CREATE INDEX idx_beneficiaries_active ON beneficiaries(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- SERVICES_DELIVERED TABLE
-- Individual service transactions
-- ============================================================================
CREATE TABLE services_delivered (
    service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(beneficiary_id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(program_id) ON DELETE RESTRICT,

    -- Service details
    service_type VARCHAR(255) NOT NULL,
    service_category VARCHAR(100),
    service_description TEXT,

    -- Timing
    service_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,

    -- Location
    location VARCHAR(255),
    delivery_method VARCHAR(50) CHECK (delivery_method IN (
        'In-Person', 'Virtual', 'Phone', 'Hybrid', 'Home Visit', 'Group Session'
    )),

    -- Provider information
    provider_id UUID,
    provider_name VARCHAR(255),
    provider_type VARCHAR(100),

    -- Quantification
    units_delivered DECIMAL(10, 2),
    unit_type VARCHAR(50),
    cost_per_unit DECIMAL(15, 2),
    total_cost DECIMAL(15, 2),
    funding_source UUID,

    -- Outcomes
    immediate_outcome VARCHAR(255),
    outcome_achieved BOOLEAN,
    outcome_notes TEXT,

    -- Quality and satisfaction
    quality_rating DECIMAL(3, 2) CHECK (quality_rating BETWEEN 0 AND 5),
    beneficiary_satisfaction DECIMAL(3, 2) CHECK (beneficiary_satisfaction BETWEEN 0 AND 5),
    satisfaction_comments TEXT,

    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_scheduled DATE,
    follow_up_completed BOOLEAN DEFAULT FALSE,

    -- Referrals
    referrals_made TEXT[],
    referral_outcomes JSONB,

    -- Barriers and accommodations
    barriers_encountered TEXT[],
    accommodations_provided TEXT[],
    interpretation_provided BOOLEAN DEFAULT FALSE,
    transportation_provided BOOLEAN DEFAULT FALSE,
    materials_provided TEXT[],

    -- Impact tracking
    impact_category VARCHAR(100),
    impact_level VARCHAR(50),
    long_term_tracking_id UUID,

    -- Documentation
    documentation JSONB,
    photos_taken BOOLEAN DEFAULT FALSE,
    forms_completed TEXT[],

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    documented_by UUID,

    custom_fields JSONB,
    notes TEXT
);

CREATE INDEX idx_services_beneficiary ON services_delivered(beneficiary_id);
CREATE INDEX idx_services_program ON services_delivered(program_id);
CREATE INDEX idx_services_date ON services_delivered(service_date DESC);
CREATE INDEX idx_services_provider ON services_delivered(provider_id);
CREATE INDEX idx_services_type ON services_delivered(service_type);

-- ============================================================================
-- OUTCOMES TABLE
-- Measured outcomes and impact data
-- ============================================================================
CREATE TABLE outcomes (
    outcome_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(program_id) ON DELETE RESTRICT,
    beneficiary_id UUID REFERENCES beneficiaries(beneficiary_id) ON DELETE SET NULL,

    -- Outcome classification
    outcome_type VARCHAR(100) NOT NULL CHECK (outcome_type IN (
        'Output', 'Short-term Outcome', 'Medium-term Outcome',
        'Long-term Outcome', 'Impact', 'Process Measure'
    )),
    outcome_category VARCHAR(100),
    outcome_domain VARCHAR(100) CHECK (outcome_domain IN (
        'Health', 'Education', 'Employment', 'Housing',
        'Financial Stability', 'Social Connection', 'Safety',
        'Well-being', 'Skills Development', 'Other'
    )),

    -- Indicator
    indicator VARCHAR(500) NOT NULL,
    indicator_definition TEXT,
    measurement_method TEXT,

    -- Values
    baseline_value DECIMAL(15, 2),
    baseline_date DATE,
    target_value DECIMAL(15, 2),
    target_date DATE,
    actual_value DECIMAL(15, 2),
    measurement_date DATE NOT NULL,

    -- Performance
    percent_change DECIMAL(10, 2),
    goal_achieved BOOLEAN,
    performance_rating VARCHAR(50),

    -- Data quality
    data_source VARCHAR(255),
    data_collection_method VARCHAR(100),
    verified_by UUID,
    verification_date DATE,
    data_quality_score DECIMAL(5, 2),

    -- Analysis
    statistical_significance BOOLEAN,
    confidence_interval JSONB,
    sample_size INTEGER,
    response_rate DECIMAL(5, 2),

    -- Comparison
    comparison_group VARCHAR(100),
    comparison_value DECIMAL(15, 2),
    attribution_confidence VARCHAR(50),

    -- Timeframe
    timeframe VARCHAR(100),
    measurement_period_start DATE,
    measurement_period_end DATE,

    -- Attribution
    contribution_factors TEXT[],
    external_factors TEXT[],
    attribution_model TEXT,

    -- Impact level
    impact_level VARCHAR(50) CHECK (impact_level IN (
        'Transformational', 'Significant', 'Moderate', 'Minimal', 'None'
    )),
    impact_description TEXT,

    -- Sustainability
    sustainability_likelihood VARCHAR(50),
    sustainability_factors TEXT[],

    -- Stakeholder perspectives
    beneficiary_perspective TEXT,
    staff_perspective TEXT,
    funder_perspective TEXT,

    -- Reporting
    report_included BOOLEAN DEFAULT FALSE,
    public_reporting BOOLEAN DEFAULT FALSE,

    -- Evidence
    evidence_quality VARCHAR(50),
    documentation_url VARCHAR(500),
    supporting_data JSONB,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    custom_fields JSONB,
    notes TEXT
);

CREATE INDEX idx_outcomes_program ON outcomes(program_id);
CREATE INDEX idx_outcomes_beneficiary ON outcomes(beneficiary_id);
CREATE INDEX idx_outcomes_type ON outcomes(outcome_type);
CREATE INDEX idx_outcomes_date ON outcomes(measurement_date DESC);
CREATE INDEX idx_outcomes_domain ON outcomes(outcome_domain);

-- ============================================================================
-- IMPACT_METRICS TABLE
-- Key performance indicators and metrics
-- ============================================================================
CREATE TABLE impact_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(program_id) ON DELETE CASCADE,

    -- Metric definition
    metric_name VARCHAR(255) NOT NULL,
    metric_type VARCHAR(100) CHECK (metric_type IN (
        'Output', 'Outcome', 'Impact', 'Efficiency', 'Quality', 'Reach'
    )),
    metric_category VARCHAR(100),
    definition TEXT NOT NULL,

    -- Calculation
    calculation_method TEXT,
    formula TEXT,
    numerator VARCHAR(255),
    denominator VARCHAR(255),
    unit_of_measurement VARCHAR(50),

    -- Data collection
    data_sources TEXT[],
    collection_frequency VARCHAR(50) CHECK (collection_frequency IN (
        'Real-time', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'Ad-hoc'
    )),
    responsible_party UUID,

    -- Targets
    baseline_year INTEGER,
    baseline_value DECIMAL(15, 2),
    current_value DECIMAL(15, 2),
    target_value DECIMAL(15, 2),
    target_year INTEGER,

    -- Performance tracking
    trend_direction VARCHAR(20) CHECK (trend_direction IN (
        'Increasing', 'Decreasing', 'Stable', 'Volatile', 'Unknown'
    )),
    on_track BOOLEAN DEFAULT TRUE,
    variance_from_target DECIMAL(10, 2),

    -- Statistical measures
    statistical_significance BOOLEAN,
    confidence_level DECIMAL(5, 2),
    margin_of_error DECIMAL(5, 2),

    -- Benchmarking
    peer_average DECIMAL(15, 2),
    national_average DECIMAL(15, 2),
    best_in_class DECIMAL(15, 2),

    -- Reporting
    dashboard_display BOOLEAN DEFAULT TRUE,
    public_reporting BOOLEAN DEFAULT FALSE,
    funder_reporting BOOLEAN DEFAULT FALSE,
    reporting_frequency VARCHAR(50),

    -- Validation
    validation_method TEXT,
    last_validated_date DATE,
    validation_status VARCHAR(50),

    -- Alert thresholds
    alert_threshold_low DECIMAL(15, 2),
    alert_threshold_high DECIMAL(15, 2),
    alert_enabled BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    custom_fields JSONB,
    notes TEXT
);

CREATE INDEX idx_impact_metrics_program ON impact_metrics(program_id);
CREATE INDEX idx_impact_metrics_type ON impact_metrics(metric_type);
CREATE INDEX idx_impact_metrics_category ON impact_metrics(metric_category);

-- ============================================================================
-- THEORY_OF_CHANGE TABLE
-- Theory of change models
-- ============================================================================
CREATE TABLE theory_of_change (
    theory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(program_id) ON DELETE CASCADE,

    version_number INTEGER DEFAULT 1,
    version_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN (
        'Draft', 'Under Review', 'Approved', 'Active', 'Archived'
    )),

    -- Problem definition
    problem_statement TEXT NOT NULL,
    root_causes TEXT[],
    contributing_factors TEXT[],

    -- Target population
    target_population TEXT NOT NULL,
    population_size INTEGER,
    geographic_scope TEXT,

    -- Intervention
    interventions TEXT[] NOT NULL,
    activities TEXT[] NOT NULL,

    -- Resources
    inputs_required JSONB NOT NULL,
    human_resources JSONB,
    financial_resources JSONB,
    material_resources JSONB,
    partnerships_required TEXT[],

    -- Outputs
    outputs JSONB NOT NULL,
    output_indicators TEXT[],

    -- Outcomes
    short_term_outcomes TEXT[] NOT NULL,
    medium_term_outcomes TEXT[] NOT NULL,
    long_term_outcomes TEXT[] NOT NULL,
    ultimate_impact TEXT NOT NULL,

    -- Pathways
    causal_pathways JSONB,
    mechanisms_of_change TEXT[],

    -- Assumptions
    assumptions TEXT[] NOT NULL,
    assumption_validation JSONB,

    -- Risks
    risks TEXT[],
    risk_mitigation_strategies JSONB,

    -- External factors
    external_factors TEXT[],
    contextual_factors TEXT[],

    -- Evidence
    evidence_base TEXT,
    supporting_research TEXT[],
    best_practices_referenced TEXT[],

    -- Stakeholders
    stakeholder_input JSONB,
    beneficiary_involvement TEXT,

    -- Evaluation
    evaluation_questions TEXT[],
    evaluation_design TEXT,
    evaluation_timeline JSONB,

    -- Documentation
    diagram_url VARCHAR(500),
    narrative_document_url VARCHAR(500),

    -- Review and approval
    reviewed_by UUID,
    review_date DATE,
    approved_by UUID,
    approval_date DATE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,

    custom_fields JSONB,
    notes TEXT
);

CREATE INDEX idx_theory_of_change_program ON theory_of_change(program_id);
CREATE INDEX idx_theory_of_change_status ON theory_of_change(status);

-- ============================================================================
-- SROI_CALCULATIONS TABLE
-- Social Return on Investment calculations
-- ============================================================================
CREATE TABLE sroi_calculations (
    sroi_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(program_id) ON DELETE CASCADE,

    -- Calculation details
    calculation_name VARCHAR(255) NOT NULL,
    calculation_date DATE NOT NULL,
    calculation_period_start DATE NOT NULL,
    calculation_period_end DATE NOT NULL,
    calculation_type VARCHAR(50) CHECK (calculation_type IN (
        'Evaluative', 'Forecast', 'Hybrid'
    )),

    -- Scope
    scope_description TEXT,
    stakeholders_included TEXT[],
    boundaries TEXT,

    -- Inputs (Investment)
    total_investment DECIMAL(15, 2) NOT NULL,
    investment_breakdown JSONB,
    in_kind_contributions DECIMAL(15, 2) DEFAULT 0,
    volunteer_time_value DECIMAL(15, 2) DEFAULT 0,

    -- Outcomes valued
    outcomes_monetized JSONB NOT NULL,

    -- Financial proxies
    financial_proxies JSONB NOT NULL,
    proxy_sources TEXT[],
    proxy_justifications JSONB,

    -- Quantities
    outcome_quantities JSONB,
    attribution_percentages JSONB,
    deadweight_percentages JSONB,
    displacement_percentages JSONB,
    drop_off_rates JSONB,

    -- Duration
    outcome_duration_years JSONB,
    discount_rate DECIMAL(5, 2) DEFAULT 3.5,

    -- Calculations
    total_outcomes_value DECIMAL(15, 2) NOT NULL,
    present_value_outcomes DECIMAL(15, 2) NOT NULL,
    net_present_value DECIMAL(15, 2) NOT NULL,
    sroi_ratio DECIMAL(10, 2) NOT NULL,

    -- Sensitivity analysis
    sensitivity_analysis JSONB,
    best_case_scenario DECIMAL(10, 2),
    worst_case_scenario DECIMAL(10, 2),
    most_likely_scenario DECIMAL(10, 2),

    -- Materiality
    materiality_threshold DECIMAL(15, 2),
    material_outcomes JSONB,
    immaterial_outcomes JSONB,

    -- Stakeholder engagement
    stakeholder_consultation TEXT,
    beneficiary_input TEXT,
    validation_process TEXT,

    -- Assurance
    assurance_level VARCHAR(50),
    external_verification BOOLEAN DEFAULT FALSE,
    verifier_name VARCHAR(255),
    verification_date DATE,

    -- Reporting
    report_url VARCHAR(500),
    public_reporting BOOLEAN DEFAULT FALSE,

    -- Quality
    data_quality_assessment TEXT,
    limitations TEXT[],
    recommendations TEXT[],

    -- Metadata
    calculated_by UUID,
    reviewed_by UUID,
    approved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    custom_fields JSONB,
    notes TEXT
);

CREATE INDEX idx_sroi_program ON sroi_calculations(program_id);
CREATE INDEX idx_sroi_date ON sroi_calculations(calculation_date DESC);
CREATE INDEX idx_sroi_ratio ON sroi_calculations(sroi_ratio DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at BEFORE UPDATE ON beneficiaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outcomes_updated_at BEFORE UPDATE ON outcomes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_impact_metrics_updated_at BEFORE UPDATE ON impact_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_theory_of_change_updated_at BEFORE UPDATE ON theory_of_change
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Program impact summary
CREATE MATERIALIZED VIEW mv_program_impact_summary AS
SELECT
    p.program_id,
    p.program_name,
    p.program_type,
    COUNT(DISTINCT b.beneficiary_id) AS total_beneficiaries,
    COUNT(DISTINCT sd.service_id) AS total_services,
    SUM(sd.total_cost) AS total_program_cost,
    AVG(sd.beneficiary_satisfaction) AS avg_satisfaction,
    COUNT(DISTINCT CASE WHEN o.goal_achieved = TRUE THEN o.outcome_id END) AS goals_achieved,
    COUNT(DISTINCT o.outcome_id) AS total_outcomes_measured,
    MAX(sroi.sroi_ratio) AS latest_sroi_ratio
FROM programs p
LEFT JOIN beneficiaries b ON b.beneficiary_id IN (
    SELECT DISTINCT beneficiary_id FROM services_delivered WHERE program_id = p.program_id
)
LEFT JOIN services_delivered sd ON sd.program_id = p.program_id
LEFT JOIN outcomes o ON o.program_id = p.program_id
LEFT JOIN sroi_calculations sroi ON sroi.program_id = p.program_id
WHERE p.status = 'Active'
GROUP BY p.program_id, p.program_name, p.program_type;

CREATE UNIQUE INDEX ON mv_program_impact_summary (program_id);

-- ============================================================================
-- END OF IMPACT ANALYTICS SCHEMA
-- ============================================================================
