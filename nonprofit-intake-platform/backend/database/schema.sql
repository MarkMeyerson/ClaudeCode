-- ============================================================================
-- NON-PROFIT INTAKE PLATFORM - COMPREHENSIVE DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0.0
-- Description: Complete database schema for multi-track non-profit assessment
-- and intake platform supporting Mission-Driven Organizations, Associations,
-- and Political Action Committees (PACs)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geographic data

-- ============================================================================
-- CORE ORGANIZATION TABLES
-- ============================================================================

-- Main organizations table
CREATE TABLE organizations (
    org_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    dba_names JSONB DEFAULT '[]',
    organization_type VARCHAR(50) NOT NULL, -- mission_driven, association, pac, hybrid
    sub_type VARCHAR(100), -- charity, foundation, trade_assoc, professional_assoc, super_pac, etc.

    -- IRS Classification
    tax_status VARCHAR(20), -- 501c3, 501c4, 501c6, 527, etc.
    ein VARCHAR(20) UNIQUE,
    irs_determination_letter_date DATE,
    group_exemption_number VARCHAR(20),
    irs_subsection_code VARCHAR(10),

    -- Basic Information
    founding_date DATE,
    fiscal_year_end VARCHAR(5), -- MM-DD format
    incorporation_state VARCHAR(2),
    incorporation_date DATE,
    headquarters_address JSONB,
    mailing_address JSONB,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    social_media JSONB,

    -- Leadership
    ceo_executive_director JSONB,
    board_chair JSONB,
    board_size INTEGER,
    board_members JSONB DEFAULT '[]',
    key_staff JSONB DEFAULT '[]',

    -- Financial Overview (Most recent fiscal year)
    annual_budget DECIMAL(15,2),
    total_revenue DECIMAL(15,2),
    total_expenses DECIMAL(15,2),
    total_assets DECIMAL(15,2),
    total_liabilities DECIMAL(15,2),
    net_assets DECIMAL(15,2),
    program_expense_ratio DECIMAL(5,2),
    fundraising_expense_ratio DECIMAL(5,2),
    admin_expense_ratio DECIMAL(5,2),

    -- Mission & Programs
    mission_statement TEXT,
    vision_statement TEXT,
    values_statement TEXT,
    primary_programs JSONB DEFAULT '[]',
    geographic_scope VARCHAR(50), -- local, regional, state, national, international
    service_states JSONB DEFAULT '[]',
    target_demographics JSONB DEFAULT '[]',

    -- Staffing
    full_time_staff INTEGER DEFAULT 0,
    part_time_staff INTEGER DEFAULT 0,
    contractors INTEGER DEFAULT 0,
    volunteers INTEGER DEFAULT 0,

    -- Compliance Status
    irs_status VARCHAR(20), -- active, revoked, suspended
    state_registration_status JSONB DEFAULT '{}',
    charity_navigator_rating INTEGER,
    guidestar_seal VARCHAR(20),
    bbb_accreditation BOOLEAN DEFAULT false,
    last_audit_date DATE,
    audit_opinion VARCHAR(50),

    -- Intake Metadata
    intake_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    intake_method VARCHAR(20), -- online, phone, email, partner_referral
    intake_source VARCHAR(100),
    intake_completed BOOLEAN DEFAULT false,
    intake_completion_date TIMESTAMP,
    intake_score DECIMAL(5,2),
    intake_stage VARCHAR(50) DEFAULT 'initial', -- initial, in_progress, review, approved, onboarding

    -- System Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    is_active BOOLEAN DEFAULT true,

    CONSTRAINT valid_org_type CHECK (organization_type IN ('mission_driven', 'association', 'pac', 'hybrid')),
    CONSTRAINT valid_fiscal_year CHECK (fiscal_year_end ~ '^\d{2}-\d{2}$')
);

-- Indexes for organizations
CREATE INDEX idx_org_type ON organizations(organization_type);
CREATE INDEX idx_org_ein ON organizations(ein);
CREATE INDEX idx_org_name ON organizations USING gin(organization_name gin_trgm_ops);
CREATE INDEX idx_org_intake_stage ON organizations(intake_stage);
CREATE INDEX idx_org_created_at ON organizations(created_at DESC);

-- ============================================================================
-- MISSION-DRIVEN ORGANIZATION SPECIFIC TABLES
-- ============================================================================

CREATE TABLE mission_driven_profile (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,

    -- Program Details
    program_areas JSONB DEFAULT '[]', -- education, health, environment, etc.
    service_delivery_model VARCHAR(100), -- direct_service, advocacy, research, grantmaking, hybrid
    beneficiaries_served_annually INTEGER,
    beneficiary_demographics JSONB DEFAULT '{}',
    volunteer_count INTEGER,
    volunteer_hours_annual INTEGER,

    -- Impact Metrics
    theory_of_change TEXT,
    logic_model JSONB,
    key_outcomes JSONB DEFAULT '[]',
    impact_measurement_approach TEXT,
    evidence_base VARCHAR(50), -- evidence-based, evidence-informed, promising, emerging
    evaluation_frequency VARCHAR(50),
    external_evaluation BOOLEAN DEFAULT false,
    last_external_evaluation_date DATE,

    -- Funding Sources (as percentages)
    government_funding_pct DECIMAL(5,2) DEFAULT 0,
    foundation_funding_pct DECIMAL(5,2) DEFAULT 0,
    corporate_funding_pct DECIMAL(5,2) DEFAULT 0,
    individual_giving_pct DECIMAL(5,2) DEFAULT 0,
    earned_revenue_pct DECIMAL(5,2) DEFAULT 0,
    other_revenue_pct DECIMAL(5,2) DEFAULT 0,

    -- Top Funders
    top_government_funders JSONB DEFAULT '[]',
    top_foundation_funders JSONB DEFAULT '[]',
    top_corporate_funders JSONB DEFAULT '[]',

    -- Capacity Assessment
    strategic_plan_current BOOLEAN DEFAULT false,
    strategic_plan_start_date DATE,
    strategic_plan_end_date DATE,
    evaluation_capacity VARCHAR(20), -- none, basic, intermediate, advanced
    data_systems_maturity VARCHAR(20), -- none, spreadsheets, basic_software, advanced_platform
    fundraising_capacity VARCHAR(20), -- emerging, developing, mature, sophisticated
    marketing_capacity VARCHAR(20),
    technology_capacity VARCHAR(20),

    -- Partnerships & Collaborations
    key_partners JSONB DEFAULT '[]',
    coalition_memberships JSONB DEFAULT '[]',
    funder_relationships JSONB DEFAULT '[]',
    fiscal_sponsor BOOLEAN DEFAULT false,
    fiscal_sponsor_name VARCHAR(255),
    fiscal_sponsees JSONB DEFAULT '[]',

    -- Program Specific
    direct_service_locations JSONB DEFAULT '[]',
    licensing_certifications JSONB DEFAULT '[]',
    accreditations JSONB DEFAULT '[]',

    -- Donor Management
    donor_count INTEGER,
    major_donor_count INTEGER,
    recurring_donor_count INTEGER,
    donor_retention_rate DECIMAL(5,2),
    average_gift_size DECIMAL(10,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT funding_pcts_sum CHECK (
        government_funding_pct + foundation_funding_pct + corporate_funding_pct +
        individual_giving_pct + earned_revenue_pct + other_revenue_pct <= 100
    )
);

CREATE INDEX idx_mission_org ON mission_driven_profile(org_id);
CREATE INDEX idx_mission_program_areas ON mission_driven_profile USING gin(program_areas);

-- ============================================================================
-- ASSOCIATION SPECIFIC TABLES
-- ============================================================================

CREATE TABLE association_profile (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,

    -- Membership
    member_count INTEGER,
    organizational_members INTEGER DEFAULT 0,
    individual_members INTEGER DEFAULT 0,
    member_categories JSONB DEFAULT '[]',
    membership_model VARCHAR(50), -- individual, organizational, tiered, hybrid
    membership_tiers JSONB DEFAULT '[]',
    average_member_tenure_years DECIMAL(5,2),
    member_retention_rate DECIMAL(5,2),
    new_member_growth_rate DECIMAL(5,2),

    -- Association Type & Focus
    association_type VARCHAR(50), -- trade, professional, industry, chamber, specialty
    industry_sector VARCHAR(100),
    professional_field VARCHAR(100),
    naics_codes JSONB DEFAULT '[]',

    -- Member Services
    member_services JSONB DEFAULT '[]',
    certification_programs JSONB DEFAULT '[]',
    training_programs JSONB DEFAULT '[]',
    continuing_education BOOLEAN DEFAULT false,
    job_board BOOLEAN DEFAULT false,
    networking_events BOOLEAN DEFAULT false,

    -- Advocacy & Public Policy
    advocacy_activities JSONB DEFAULT '[]',
    lobbying_expenditures DECIMAL(15,2),
    pac_affiliated BOOLEAN DEFAULT false,
    pac_id UUID,
    grassroots_advocacy BOOLEAN DEFAULT false,
    policy_positions JSONB DEFAULT '[]',

    -- Research & Publications
    research_publications JSONB DEFAULT '[]',
    journal_publication BOOLEAN DEFAULT false,
    journal_name VARCHAR(255),
    newsletter_publication BOOLEAN DEFAULT false,
    white_papers_annual INTEGER,
    industry_reports_annual INTEGER,

    -- Events & Conferences
    annual_conference BOOLEAN DEFAULT false,
    conference_attendance INTEGER,
    events_per_year INTEGER,
    virtual_events_capability BOOLEAN DEFAULT false,
    webinars_per_year INTEGER,
    regional_events BOOLEAN DEFAULT false,

    -- Governance & Structure
    member_voting_rights BOOLEAN DEFAULT true,
    delegate_assembly BOOLEAN DEFAULT false,
    chapters_count INTEGER DEFAULT 0,
    sections_count INTEGER DEFAULT 0,
    committees JSONB DEFAULT '[]',
    special_interest_groups JSONB DEFAULT '[]',

    -- Revenue Model (as percentages)
    membership_dues_pct DECIMAL(5,2) DEFAULT 0,
    conference_revenue_pct DECIMAL(5,2) DEFAULT 0,
    sponsorship_revenue_pct DECIMAL(5,2) DEFAULT 0,
    publication_revenue_pct DECIMAL(5,2) DEFAULT 0,
    certification_revenue_pct DECIMAL(5,2) DEFAULT 0,
    advertising_revenue_pct DECIMAL(5,2) DEFAULT 0,
    other_revenue_pct DECIMAL(5,2) DEFAULT 0,

    -- Member Engagement
    member_satisfaction_score DECIMAL(5,2),
    member_engagement_rate DECIMAL(5,2),
    committee_participation_rate DECIMAL(5,2),
    event_attendance_rate DECIMAL(5,2),

    -- Technology & Platforms
    member_portal BOOLEAN DEFAULT false,
    mobile_app BOOLEAN DEFAULT false,
    community_platform BOOLEAN DEFAULT false,
    learning_management_system BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT revenue_pcts_sum CHECK (
        membership_dues_pct + conference_revenue_pct + sponsorship_revenue_pct +
        publication_revenue_pct + certification_revenue_pct + advertising_revenue_pct +
        other_revenue_pct <= 100
    )
);

CREATE INDEX idx_assoc_org ON association_profile(org_id);
CREATE INDEX idx_assoc_type ON association_profile(association_type);
CREATE INDEX idx_assoc_industry ON association_profile(industry_sector);

-- ============================================================================
-- PAC SPECIFIC TABLES
-- ============================================================================

CREATE TABLE pac_profile (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,

    -- PAC Classification
    pac_type VARCHAR(50), -- connected, non_connected, super_pac, hybrid_pac, leadership_pac
    fec_id VARCHAR(20) UNIQUE,
    state_pac_ids JSONB DEFAULT '{}',
    affiliated_organization VARCHAR(255),
    affiliated_org_id UUID,
    sponsor_organization VARCHAR(255),

    -- Political Activity
    party_affiliation VARCHAR(50), -- democratic, republican, bipartisan, nonpartisan
    candidate_support_criteria TEXT,
    issue_positions JSONB DEFAULT '[]',
    lobbying_activities BOOLEAN DEFAULT false,
    independent_expenditure_only BOOLEAN DEFAULT false,

    -- Federal Activity
    federal_candidates_supported INTEGER,
    federal_contributions_made DECIMAL(15,2),
    federal_independent_expenditures DECIMAL(15,2),

    -- State/Local Activity
    state_candidates_supported INTEGER,
    state_contributions_made DECIMAL(15,2),
    local_candidates_supported INTEGER,
    local_contributions_made DECIMAL(15,2),

    -- Financial Activity (Current cycle)
    contributions_received DECIMAL(15,2),
    total_disbursements DECIMAL(15,2),
    cash_on_hand DECIMAL(15,2),
    debts_owed DECIMAL(15,2),

    -- Contribution Limits
    individual_contribution_limit DECIMAL(10,2),
    pac_contribution_limit DECIMAL(10,2),
    corporate_contributions_allowed BOOLEAN DEFAULT false,
    union_contributions_allowed BOOLEAN DEFAULT false,

    -- Compliance
    fec_filing_frequency VARCHAR(20), -- monthly, quarterly, annually
    state_filing_requirements JSONB DEFAULT '{}',
    treasurer_name VARCHAR(255),
    treasurer_email VARCHAR(255),
    treasurer_phone VARCHAR(20),
    compliance_vendor VARCHAR(255),
    compliance_software VARCHAR(100),

    -- Donor Management
    total_donors INTEGER,
    major_donor_count INTEGER,
    small_donor_count INTEGER,
    average_contribution DECIMAL(10,2),
    recurring_donor_pct DECIMAL(5,2),

    -- Fundraising
    fundraising_events_annual INTEGER,
    online_fundraising BOOLEAN DEFAULT false,
    recurring_program BOOLEAN DEFAULT false,
    bundling_program BOOLEAN DEFAULT false,

    -- Communication & Advocacy
    email_list_size INTEGER,
    social_media_followers INTEGER,
    grassroots_mobilization BOOLEAN DEFAULT false,
    voter_education BOOLEAN DEFAULT false,
    issue_advocacy BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pac_org ON pac_profile(org_id);
CREATE INDEX idx_pac_fec_id ON pac_profile(fec_id);
CREATE INDEX idx_pac_type ON pac_profile(pac_type);

-- ============================================================================
-- ASSESSMENT FRAMEWORK TABLES
-- ============================================================================

CREATE TABLE assessments (
    assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    assessment_type VARCHAR(50), -- comprehensive, financial, governance, program, compliance, etc.
    assessment_version VARCHAR(10),
    organization_type VARCHAR(50),

    -- Scoring (0-100 scale)
    overall_score DECIMAL(5,2),
    organizational_capacity_score DECIMAL(5,2),
    financial_health_score DECIMAL(5,2),
    governance_score DECIMAL(5,2),
    program_effectiveness_score DECIMAL(5,2),
    compliance_score DECIMAL(5,2),
    technology_score DECIMAL(5,2),
    fundraising_score DECIMAL(5,2),
    hr_score DECIMAL(5,2),
    risk_score DECIMAL(5,2),
    impact_score DECIMAL(5,2),

    -- Additional Track-Specific Scores
    member_engagement_score DECIMAL(5,2), -- For associations
    advocacy_effectiveness_score DECIMAL(5,2), -- For associations & PACs
    donor_engagement_score DECIMAL(5,2), -- For PACs
    political_strategy_score DECIMAL(5,2), -- For PACs

    -- SWOT Analysis
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    opportunities JSONB DEFAULT '[]',
    threats JSONB DEFAULT '[]',
    critical_gaps JSONB DEFAULT '[]',
    quick_wins JSONB DEFAULT '[]',

    -- Recommendations
    priority_recommendations JSONB DEFAULT '[]',
    capacity_building_needs JSONB DEFAULT '[]',
    resource_requirements JSONB DEFAULT '{}',
    timeline_recommendations JSONB DEFAULT '{}',

    -- Benchmarking
    peer_comparison JSONB DEFAULT '{}',
    industry_benchmarks JSONB DEFAULT '{}',
    best_practice_gaps JSONB DEFAULT '[]',
    percentile_ranking DECIMAL(5,2),

    -- Maturity Levels (1-5 scale)
    strategic_planning_maturity INTEGER,
    financial_management_maturity INTEGER,
    program_delivery_maturity INTEGER,
    technology_maturity INTEGER,
    fundraising_maturity INTEGER,
    data_analytics_maturity INTEGER,

    -- Metadata
    assessment_date DATE,
    assessor_id UUID,
    assessment_method VARCHAR(20), -- self, guided, consultant, hybrid
    completion_time_hours DECIMAL(5,2),
    confidence_level DECIMAL(5,2),
    questions_completed INTEGER,
    questions_total INTEGER,
    completion_percentage DECIMAL(5,2),

    -- Status
    status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, reviewed, approved
    reviewed_by UUID,
    review_date TIMESTAMP,
    review_notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assess_org ON assessments(org_id);
CREATE INDEX idx_assess_type ON assessments(assessment_type);
CREATE INDEX idx_assess_date ON assessments(assessment_date DESC);
CREATE INDEX idx_assess_status ON assessments(status);

-- Assessment Questions Library
CREATE TABLE assessment_questions (
    question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_type VARCHAR(50),
    organization_type VARCHAR(50), -- mission_driven, association, pac, all

    -- Question Details
    section VARCHAR(100),
    subsection VARCHAR(100),
    question_number VARCHAR(20),
    question_text TEXT NOT NULL,
    question_type VARCHAR(20), -- scale, multiple_choice, matrix, text, file_upload, yes_no

    -- Options for multiple choice/scale questions
    options JSONB DEFAULT '[]',
    scale_min INTEGER,
    scale_max INTEGER,
    scale_labels JSONB,

    -- Scoring
    weight DECIMAL(3,2) DEFAULT 1.0,
    scoring_rubric JSONB,
    benchmark_values JSONB,
    points_possible INTEGER DEFAULT 5,

    -- Logic & Dependencies
    required BOOLEAN DEFAULT true,
    conditional_logic JSONB,
    parent_question_id UUID,
    validation_rules JSONB,

    -- Help & Guidance
    help_text TEXT,
    examples JSONB DEFAULT '[]',
    best_practice_guidance TEXT,
    resources JSONB DEFAULT '[]',

    -- Version Control
    version VARCHAR(10) DEFAULT '1.0',
    active BOOLEAN DEFAULT true,
    deprecated BOOLEAN DEFAULT false,
    replacement_question_id UUID,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_aq_type ON assessment_questions(assessment_type);
CREATE INDEX idx_aq_org_type ON assessment_questions(organization_type);
CREATE INDEX idx_aq_section ON assessment_questions(section);

-- Assessment Responses
CREATE TABLE assessment_responses (
    response_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    question_id UUID REFERENCES assessment_questions(question_id),

    -- Response
    response_value TEXT,
    response_numeric DECIMAL(10,2),
    response_boolean BOOLEAN,
    response_json JSONB,
    response_score DECIMAL(5,2),
    response_files JSONB DEFAULT '[]',

    -- Evidence & Documentation
    evidence_provided JSONB DEFAULT '[]',
    documentation_links JSONB DEFAULT '[]',
    notes TEXT,

    -- Validation
    validated BOOLEAN DEFAULT false,
    validator_id UUID,
    validation_notes TEXT,
    validation_date TIMESTAMP,

    -- Metadata
    time_spent_seconds INTEGER,
    revision_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ar_assessment ON assessment_responses(assessment_id);
CREATE INDEX idx_ar_question ON assessment_responses(question_id);

-- ============================================================================
-- COMPLIANCE & RISK MANAGEMENT
-- ============================================================================

CREATE TABLE compliance_requirements (
    requirement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,

    -- Requirement Details
    requirement_type VARCHAR(50), -- tax_filing, charity_registration, pac_filing, audit, license, etc.
    jurisdiction VARCHAR(50), -- federal, state_XX, local_XX
    agency VARCHAR(100), -- IRS, FEC, State_AG, etc.
    requirement_name VARCHAR(255),
    description TEXT,
    form_number VARCHAR(50),

    -- Timing
    frequency VARCHAR(20), -- annual, semi_annual, quarterly, monthly, as_needed
    due_date DATE,
    filing_period_start DATE,
    filing_period_end DATE,
    grace_period_days INTEGER DEFAULT 0,
    penalty_for_late BOOLEAN DEFAULT false,

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- compliant, pending, overdue, not_applicable, waived
    last_filed_date DATE,
    next_filing_date DATE,
    confirmation_number VARCHAR(100),

    -- Documentation
    required_documents JSONB DEFAULT '[]',
    submitted_documents JSONB DEFAULT '[]',
    filing_url VARCHAR(500),

    -- Responsibility
    responsible_party VARCHAR(255),
    responsible_email VARCHAR(255),
    backup_responsible VARCHAR(255),
    vendor_managed BOOLEAN DEFAULT false,
    vendor_name VARCHAR(255),
    vendor_contact VARCHAR(255),

    -- Alerts & Notifications
    alert_days_before INTEGER DEFAULT 30,
    alert_sent BOOLEAN DEFAULT false,
    alert_sent_date DATE,
    escalation_days_before INTEGER DEFAULT 7,
    escalation_sent BOOLEAN DEFAULT false,

    -- Financial
    filing_fee DECIMAL(10,2),
    late_penalty DECIMAL(10,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comp_org ON compliance_requirements(org_id);
CREATE INDEX idx_comp_status ON compliance_requirements(status);
CREATE INDEX idx_comp_due_date ON compliance_requirements(due_date);
CREATE INDEX idx_comp_next_filing ON compliance_requirements(next_filing_date);

-- Risk Assessments
CREATE TABLE risk_assessments (
    risk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,

    -- Risk Identification
    risk_category VARCHAR(50), -- financial, operational, compliance, reputational, strategic, cyber
    risk_subcategory VARCHAR(100),
    risk_title VARCHAR(255),
    risk_description TEXT,
    risk_source VARCHAR(100), -- internal, external, regulatory, market

    -- Risk Analysis (1-5 scale)
    likelihood_score DECIMAL(3,2),
    impact_score DECIMAL(3,2),
    risk_score DECIMAL(5,2), -- likelihood × impact
    risk_level VARCHAR(20), -- low, medium, high, critical
    risk_velocity VARCHAR(20), -- slow, moderate, fast

    -- Risk Response
    response_strategy VARCHAR(50), -- avoid, mitigate, transfer, accept
    mitigation_actions JSONB DEFAULT '[]',
    control_measures JSONB DEFAULT '[]',
    contingency_plan TEXT,
    residual_risk_score DECIMAL(5,2),

    -- Monitoring
    key_risk_indicators JSONB DEFAULT '[]',
    monitoring_frequency VARCHAR(20),
    last_review_date DATE,
    next_review_date DATE,
    trigger_events JSONB DEFAULT '[]',

    -- Ownership & Accountability
    risk_owner VARCHAR(255),
    risk_owner_id UUID,
    review_committee VARCHAR(100),
    escalation_path JSONB DEFAULT '[]',

    -- Financial Impact
    potential_financial_impact_min DECIMAL(15,2),
    potential_financial_impact_max DECIMAL(15,2),
    mitigation_cost DECIMAL(15,2),

    -- Status
    status VARCHAR(20) DEFAULT 'identified', -- identified, analyzing, mitigating, monitoring, closed
    risk_trend VARCHAR(20), -- increasing, stable, decreasing

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risk_org ON risk_assessments(org_id);
CREATE INDEX idx_risk_category ON risk_assessments(risk_category);
CREATE INDEX idx_risk_level ON risk_assessments(risk_level);
CREATE INDEX idx_risk_status ON risk_assessments(status);

-- ============================================================================
-- CAPACITY BUILDING & RECOMMENDATIONS
-- ============================================================================

CREATE TABLE capacity_building_plans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(assessment_id),

    -- Plan Overview
    plan_name VARCHAR(255),
    plan_description TEXT,
    plan_duration_months INTEGER,
    total_investment DECIMAL(12,2),
    expected_roi DECIMAL(8,2),
    expected_roi_description TEXT,

    -- Priorities
    priority_areas JSONB DEFAULT '[]',
    quick_wins JSONB DEFAULT '[]',
    foundational_improvements JSONB DEFAULT '[]',
    transformational_initiatives JSONB DEFAULT '[]',

    -- Resources
    internal_resources_required JSONB DEFAULT '[]',
    external_resources_required JSONB DEFAULT '[]',
    funding_required DECIMAL(12,2),
    funding_sources JSONB DEFAULT '[]',
    funding_secured DECIMAL(12,2),

    -- Timeline & Phases
    phase1_name VARCHAR(100),
    phase1_duration_months INTEGER,
    phase1_initiatives JSONB DEFAULT '[]',
    phase2_name VARCHAR(100),
    phase2_duration_months INTEGER,
    phase2_initiatives JSONB DEFAULT '[]',
    phase3_name VARCHAR(100),
    phase3_duration_months INTEGER,
    phase3_initiatives JSONB DEFAULT '[]',

    -- Success Metrics
    success_indicators JSONB DEFAULT '[]',
    baseline_metrics JSONB DEFAULT '{}',
    target_metrics JSONB DEFAULT '{}',
    measurement_plan JSONB DEFAULT '{}',

    -- Status & Approval
    approval_status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, approved, rejected, in_progress, completed
    approved_by VARCHAR(255),
    approver_id UUID,
    approval_date DATE,
    implementation_start DATE,
    expected_completion DATE,
    actual_completion DATE,

    -- Progress Tracking
    overall_progress_pct DECIMAL(5,2) DEFAULT 0,
    initiatives_completed INTEGER DEFAULT 0,
    initiatives_total INTEGER,
    on_track BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cbp_org ON capacity_building_plans(org_id);
CREATE INDEX idx_cbp_assessment ON capacity_building_plans(assessment_id);
CREATE INDEX idx_cbp_status ON capacity_building_plans(approval_status);

-- Capacity Building Initiatives
CREATE TABLE capacity_initiatives (
    initiative_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES capacity_building_plans(plan_id) ON DELETE CASCADE,

    -- Initiative Details
    initiative_name VARCHAR(255),
    category VARCHAR(50), -- governance, financial, program, fundraising, technology, hr, marketing
    description TEXT,
    expected_outcome TEXT,
    success_criteria TEXT,

    -- Priority & Timeline
    priority_level VARCHAR(20), -- critical, high, medium, low
    phase INTEGER, -- 1, 2, 3
    sequence_order INTEGER,
    start_date DATE,
    end_date DATE,
    duration_weeks INTEGER,

    -- Resources
    budget_required DECIMAL(10,2),
    budget_allocated DECIMAL(10,2),
    staff_hours_required INTEGER,
    consultant_needed BOOLEAN DEFAULT false,
    external_support_needed JSONB DEFAULT '[]',
    tools_needed JSONB DEFAULT '[]',
    training_needed JSONB DEFAULT '[]',

    -- Implementation
    implementation_steps JSONB DEFAULT '[]',
    responsible_party VARCHAR(255),
    responsible_party_id UUID,
    team_members JSONB DEFAULT '[]',
    stakeholders JSONB DEFAULT '[]',
    dependencies JSONB DEFAULT '[]',

    -- Progress Tracking
    status VARCHAR(20) DEFAULT 'planned', -- planned, in_progress, blocked, completed, cancelled
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    milestones JSONB DEFAULT '[]',
    blockers JSONB DEFAULT '[]',
    risks JSONB DEFAULT '[]',

    -- Outcomes & Learnings
    actual_outcome TEXT,
    lessons_learned TEXT,
    success_metrics JSONB DEFAULT '{}',
    actual_cost DECIMAL(10,2),
    roi_achieved DECIMAL(8,2),

    -- Dates
    actual_start_date DATE,
    actual_completion_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ci_plan ON capacity_initiatives(plan_id);
CREATE INDEX idx_ci_status ON capacity_initiatives(status);
CREATE INDEX idx_ci_priority ON capacity_initiatives(priority_level);
CREATE INDEX idx_ci_phase ON capacity_initiatives(phase);

-- ============================================================================
-- ONBOARDING SYSTEM
-- ============================================================================

CREATE TABLE onboarding_workflows (
    workflow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    organization_type VARCHAR(50),

    -- Workflow Configuration
    workflow_template VARCHAR(100),
    workflow_name VARCHAR(255),
    customizations JSONB DEFAULT '{}',
    total_steps INTEGER,
    mandatory_steps INTEGER,
    optional_steps INTEGER,

    -- Progress Tracking
    current_step INTEGER DEFAULT 1,
    completed_steps INTEGER DEFAULT 0,
    skipped_steps INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0,

    -- Timeline
    started_at TIMESTAMP,
    target_completion DATE,
    estimated_completion DATE,
    actual_completion TIMESTAMP,
    days_to_complete INTEGER,

    -- Status
    status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, on_hold, completed, abandoned
    blockers JSONB DEFAULT '[]',
    notes TEXT,

    -- Assignment
    assigned_to UUID,
    onboarding_specialist UUID,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_onb_workflow_org ON onboarding_workflows(org_id);
CREATE INDEX idx_onb_workflow_status ON onboarding_workflows(status);

-- Onboarding Steps
CREATE TABLE onboarding_steps (
    step_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES onboarding_workflows(workflow_id) ON DELETE CASCADE,

    -- Step Details
    step_number INTEGER,
    step_name VARCHAR(255),
    step_type VARCHAR(50), -- document_upload, form_completion, training, verification, approval, system_setup
    description TEXT,
    instructions TEXT,

    -- Requirements
    required BOOLEAN DEFAULT true,
    prerequisites JSONB DEFAULT '[]',
    required_documents JSONB DEFAULT '[]',
    required_data JSONB DEFAULT '{}',

    -- Assignment
    assigned_to VARCHAR(255),
    assigned_to_id UUID,
    assigned_role VARCHAR(50), -- org_admin, staff, consultant, platform_admin

    -- Timing
    estimated_duration_hours DECIMAL(5,2),
    target_start_date DATE,
    due_date DATE,

    -- Completion
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, skipped, blocked
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    completed_by VARCHAR(255),
    completed_by_id UUID,

    -- Validation
    requires_validation BOOLEAN DEFAULT false,
    validated BOOLEAN DEFAULT false,
    validated_by VARCHAR(255),
    validator_id UUID,
    validation_date TIMESTAMP,
    validation_notes TEXT,

    -- Output & Results
    output_documents JSONB DEFAULT '[]',
    system_actions JSONB DEFAULT '[]',
    completion_data JSONB DEFAULT '{}',

    -- Help & Support
    help_resources JSONB DEFAULT '[]',
    support_contact VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_onb_step_workflow ON onboarding_steps(workflow_id);
CREATE INDEX idx_onb_step_status ON onboarding_steps(status);
CREATE INDEX idx_onb_step_assigned ON onboarding_steps(assigned_to_id);

-- ============================================================================
-- DOCUMENT MANAGEMENT
-- ============================================================================

CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,

    -- Document Details
    document_name VARCHAR(255),
    document_type VARCHAR(50), -- form_990, audit, bylaws, determination_letter, etc.
    document_category VARCHAR(50), -- financial, legal, compliance, program, governance
    description TEXT,

    -- File Information
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    file_type VARCHAR(50),
    storage_path VARCHAR(500),
    storage_bucket VARCHAR(100),

    -- Metadata
    fiscal_year INTEGER,
    document_date DATE,
    expiration_date DATE,
    version VARCHAR(20),

    -- Processing
    processed BOOLEAN DEFAULT false,
    processing_status VARCHAR(20), -- pending, processing, completed, failed
    extracted_data JSONB,
    ocr_confidence DECIMAL(5,2),

    -- Verification
    verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verification_date TIMESTAMP,
    verification_notes TEXT,

    -- Access & Security
    access_level VARCHAR(20) DEFAULT 'private', -- public, internal, restricted, private
    encryption_status VARCHAR(20),

    -- Upload Information
    uploaded_by UUID,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- References
    related_assessment_id UUID,
    related_compliance_id UUID,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doc_org ON documents(org_id);
CREATE INDEX idx_doc_type ON documents(document_type);
CREATE INDEX idx_doc_category ON documents(document_category);
CREATE INDEX idx_doc_uploaded ON documents(uploaded_at DESC);

-- ============================================================================
-- USER MANAGEMENT & PERMISSIONS
-- ============================================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),

    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    title VARCHAR(100),

    -- Organization Association
    primary_org_id UUID REFERENCES organizations(org_id),

    -- Role & Permissions
    user_role VARCHAR(50), -- super_admin, platform_admin, org_admin, staff, consultant, viewer
    permissions JSONB DEFAULT '[]',

    -- Authentication
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),

    -- Password Reset
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,

    -- Login Tracking
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked BOOLEAN DEFAULT false,

    -- Status
    is_active BOOLEAN DEFAULT true,
    deactivated_at TIMESTAMP,
    deactivated_by UUID,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_org ON users(primary_org_id);
CREATE INDEX idx_user_role ON users(user_role);

-- User Organization Relationships (for multi-org access)
CREATE TABLE user_organizations (
    user_org_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
    role VARCHAR(50),
    permissions JSONB DEFAULT '[]',
    is_primary BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, org_id)
);

CREATE INDEX idx_uo_user ON user_organizations(user_id);
CREATE INDEX idx_uo_org ON user_organizations(org_id);

-- ============================================================================
-- ACTIVITY & AUDIT LOG
-- ============================================================================

CREATE TABLE activity_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    org_id UUID REFERENCES organizations(org_id),

    -- Activity Details
    activity_type VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id UUID,
    action VARCHAR(50), -- create, read, update, delete, approve, submit, etc.

    -- Details
    description TEXT,
    changes JSONB,
    metadata JSONB,

    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_log_user ON activity_log(user_id);
CREATE INDEX idx_log_org ON activity_log(org_id);
CREATE INDEX idx_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_log_entity ON activity_log(entity_type, entity_id);

-- ============================================================================
-- REPORTING & ANALYTICS
-- ============================================================================

CREATE TABLE report_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255),
    organization_type VARCHAR(50), -- mission_driven, association, pac, all
    report_type VARCHAR(50), -- assessment, compliance, capacity, financial, impact

    -- Template Configuration
    sections JSONB DEFAULT '[]',
    data_sources JSONB DEFAULT '[]',
    calculations JSONB DEFAULT '[]',
    visualizations JSONB DEFAULT '[]',

    -- Filtering & Parameters
    filters JSONB DEFAULT '[]',
    parameters JSONB DEFAULT '[]',

    -- Formatting
    format_options JSONB DEFAULT '{}',
    branding_options JSONB DEFAULT '{}',
    export_formats JSONB DEFAULT '["pdf", "excel", "word"]',

    -- Access
    is_public BOOLEAN DEFAULT false,
    access_level VARCHAR(20) DEFAULT 'internal',

    -- Version
    version VARCHAR(10) DEFAULT '1.0',
    active BOOLEAN DEFAULT true,

    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rt_org_type ON report_templates(organization_type);
CREATE INDEX idx_rt_report_type ON report_templates(report_type);

-- Generated Reports
CREATE TABLE generated_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES report_templates(template_id),
    org_id UUID REFERENCES organizations(org_id),

    -- Report Details
    report_name VARCHAR(255),
    report_type VARCHAR(50),
    report_period_start DATE,
    report_period_end DATE,

    -- Generation
    generated_by UUID,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generation_time_seconds INTEGER,

    -- File
    file_path VARCHAR(500),
    file_format VARCHAR(20),
    file_size_bytes BIGINT,

    -- Parameters Used
    filters_applied JSONB,
    parameters_used JSONB,

    -- Access
    access_level VARCHAR(20) DEFAULT 'private',
    shared_with JSONB DEFAULT '[]',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gr_org ON generated_reports(org_id);
CREATE INDEX idx_gr_template ON generated_reports(template_id);
CREATE INDEX idx_gr_generated ON generated_reports(generated_at DESC);

-- ============================================================================
-- INTEGRATIONS & API USAGE
-- ============================================================================

CREATE TABLE integrations (
    integration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,

    -- Integration Details
    integration_name VARCHAR(100), -- guidestar, charity_navigator, quickbooks, etc.
    integration_type VARCHAR(50), -- data_enrichment, financial, crm, marketing, etc.
    provider VARCHAR(100),

    -- Configuration
    credentials_encrypted TEXT,
    configuration JSONB DEFAULT '{}',

    -- Status
    status VARCHAR(20) DEFAULT 'inactive', -- active, inactive, error, pending
    enabled BOOLEAN DEFAULT false,
    last_sync TIMESTAMP,
    next_sync TIMESTAMP,
    sync_frequency VARCHAR(20),

    -- Monitoring
    total_syncs INTEGER DEFAULT 0,
    successful_syncs INTEGER DEFAULT 0,
    failed_syncs INTEGER DEFAULT 0,
    last_error TEXT,
    last_error_date TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_int_org ON integrations(org_id);
CREATE INDEX idx_int_name ON integrations(integration_name);
CREATE INDEX idx_int_status ON integrations(status);

-- API Usage Tracking
CREATE TABLE api_usage (
    usage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(org_id),
    user_id UUID REFERENCES users(user_id),

    -- Request Details
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,

    -- Rate Limiting
    rate_limit_tier VARCHAR(20),
    requests_remaining INTEGER,

    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_org ON api_usage(org_id);
CREATE INDEX idx_api_user ON api_usage(user_id);
CREATE INDEX idx_api_created ON api_usage(created_at DESC);

-- ============================================================================
-- NOTIFICATIONS & COMMUNICATION
-- ============================================================================

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,

    -- Notification Details
    notification_type VARCHAR(50), -- deadline, alert, reminder, approval, message
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    title VARCHAR(255),
    message TEXT,

    -- Action
    action_required BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    action_button_text VARCHAR(100),

    -- Related Entity
    related_entity_type VARCHAR(50),
    related_entity_id UUID,

    -- Status
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMP,

    -- Delivery
    delivery_method JSONB DEFAULT '["in_app"]', -- in_app, email, sms
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP,

    -- Expiration
    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_org ON notifications(org_id);
CREATE INDEX idx_notif_created ON notifications(created_at DESC);
CREATE INDEX idx_notif_unread ON notifications(user_id, read) WHERE read = false;

-- Email Queue
CREATE TABLE email_queue (
    email_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Recipient
    to_email VARCHAR(255),
    to_name VARCHAR(255),
    user_id UUID,
    org_id UUID,

    -- Email Details
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    subject VARCHAR(500),
    body_html TEXT,
    body_text TEXT,

    -- Attachments
    attachments JSONB DEFAULT '[]',

    -- Template
    template_name VARCHAR(100),
    template_data JSONB,

    -- Status
    status VARCHAR(20) DEFAULT 'queued', -- queued, sending, sent, failed
    send_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Tracking
    opened BOOLEAN DEFAULT false,
    opened_at TIMESTAMP,
    clicked BOOLEAN DEFAULT false,
    clicked_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_status ON email_queue(status);
CREATE INDEX idx_email_send_at ON email_queue(send_at);

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

CREATE TABLE system_config (
    config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB,
    config_type VARCHAR(50),
    description TEXT,

    -- Version Control
    version INTEGER DEFAULT 1,

    -- Access
    editable BOOLEAN DEFAULT true,
    visible BOOLEAN DEFAULT true,

    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_config_key ON system_config(config_key);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mission_driven_profile_updated_at BEFORE UPDATE ON mission_driven_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_association_profile_updated_at BEFORE UPDATE ON association_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pac_profile_updated_at BEFORE UPDATE ON pac_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_requirements_updated_at BEFORE UPDATE ON compliance_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_assessments_updated_at BEFORE UPDATE ON risk_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capacity_building_plans_updated_at BEFORE UPDATE ON capacity_building_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capacity_initiatives_updated_at BEFORE UPDATE ON capacity_initiatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_workflows_updated_at BEFORE UPDATE ON onboarding_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate assessment overall score
CREATE OR REPLACE FUNCTION calculate_overall_assessment_score(
    p_assessment_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_overall_score DECIMAL(5,2);
BEGIN
    SELECT
        ROUND((
            COALESCE(organizational_capacity_score, 0) * 0.15 +
            COALESCE(financial_health_score, 0) * 0.15 +
            COALESCE(governance_score, 0) * 0.15 +
            COALESCE(program_effectiveness_score, 0) * 0.15 +
            COALESCE(compliance_score, 0) * 0.10 +
            COALESCE(technology_score, 0) * 0.10 +
            COALESCE(fundraising_score, 0) * 0.10 +
            COALESCE(hr_score, 0) * 0.05 +
            COALESCE(impact_score, 0) * 0.05
        ), 2)
    INTO v_overall_score
    FROM assessments
    WHERE assessment_id = p_assessment_id;

    RETURN v_overall_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get organization compliance status
CREATE OR REPLACE FUNCTION get_organization_compliance_status(
    p_org_id UUID
) RETURNS TABLE (
    total_requirements INTEGER,
    compliant INTEGER,
    pending INTEGER,
    overdue INTEGER,
    compliance_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_requirements,
        COUNT(*) FILTER (WHERE status = 'compliant')::INTEGER as compliant,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending,
        COUNT(*) FILTER (WHERE status = 'overdue')::INTEGER as overdue,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'compliant')::DECIMAL /
             NULLIF(COUNT(*), 0) * 100),
            2
        ) as compliance_rate
    FROM compliance_requirements
    WHERE org_id = p_org_id
    AND status != 'not_applicable';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA & SEED
-- ============================================================================

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('platform_name', '"Non-Profit Intake Platform"', 'string', 'Platform display name'),
('max_file_upload_mb', '50', 'number', 'Maximum file upload size in MB'),
('session_timeout_minutes', '60', 'number', 'User session timeout'),
('assessment_auto_save_seconds', '30', 'number', 'Auto-save interval for assessments'),
('compliance_alert_days', '30', 'number', 'Days before deadline to send compliance alerts'),
('enable_ai_classification', 'true', 'boolean', 'Enable AI organization classification'),
('enable_document_ocr', 'true', 'boolean', 'Enable OCR for uploaded documents'),
('maintenance_mode', 'false', 'boolean', 'Platform maintenance mode'),
('api_rate_limit_per_hour', '1000', 'number', 'API rate limit per hour per user');

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Organization Summary View
CREATE OR REPLACE VIEW v_organization_summary AS
SELECT
    o.org_id,
    o.organization_name,
    o.organization_type,
    o.sub_type,
    o.ein,
    o.tax_status,
    o.annual_budget,
    o.intake_stage,
    o.intake_completed,
    o.created_at,
    -- Latest assessment
    (SELECT assessment_date
     FROM assessments
     WHERE org_id = o.org_id
     ORDER BY assessment_date DESC
     LIMIT 1) as last_assessment_date,
    (SELECT overall_score
     FROM assessments
     WHERE org_id = o.org_id
     ORDER BY assessment_date DESC
     LIMIT 1) as latest_assessment_score,
    -- Compliance status
    (SELECT COUNT(*)
     FROM compliance_requirements
     WHERE org_id = o.org_id
     AND status = 'overdue') as overdue_compliance_items,
    -- Onboarding status
    (SELECT status
     FROM onboarding_workflows
     WHERE org_id = o.org_id
     ORDER BY created_at DESC
     LIMIT 1) as onboarding_status
FROM organizations o;

-- Assessment Benchmarking View
CREATE OR REPLACE VIEW v_assessment_benchmarks AS
SELECT
    organization_type,
    ROUND(AVG(overall_score), 2) as avg_overall_score,
    ROUND(AVG(financial_health_score), 2) as avg_financial_score,
    ROUND(AVG(governance_score), 2) as avg_governance_score,
    ROUND(AVG(program_effectiveness_score), 2) as avg_program_score,
    COUNT(*) as assessment_count
FROM assessments
WHERE status = 'completed'
AND assessment_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY organization_type;

-- ============================================================================
-- GRANTS & PERMISSIONS
-- ============================================================================

-- Create application user role (to be used by the application)
-- CREATE ROLE nonprofit_app WITH LOGIN PASSWORD 'your_secure_password_here';

-- Grant appropriate permissions
-- GRANT CONNECT ON DATABASE nonprofit_platform TO nonprofit_app;
-- GRANT USAGE ON SCHEMA public TO nonprofit_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nonprofit_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nonprofit_app;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
