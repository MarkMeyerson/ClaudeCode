-- =====================================================
-- SHERPATECH.AI 6A METHOD PLATFORM - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Version: 1.0.0
-- Description: Complete database schema for all 6 phases of the 6A Method
-- Phases: Assess, Align, Activate, Accelerate, Apply, Amplify
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- CORE TABLES - Users, Organizations, Roles
-- =====================================================

CREATE TABLE organizations (
    organization_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(50), -- client, consultant, partner
    industry VARCHAR(100),
    company_size VARCHAR(20), -- startup, small, medium, large, enterprise
    employee_count INTEGER,
    annual_revenue DECIMAL(15,2),
    headquarters_location VARCHAR(255),
    geographic_scope VARCHAR(50), -- local, regional, national, international, global
    website VARCHAR(255),
    description TEXT,

    -- Subscription info
    subscription_tier VARCHAR(50), -- starter, professional, enterprise, custom
    subscription_status VARCHAR(20) DEFAULT 'active',
    subscription_start_date DATE,
    subscription_end_date DATE,

    -- Metadata
    logo_url VARCHAR(500),
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(organization_id),

    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    auth_provider VARCHAR(50), -- local, azure_ad, google, okta
    auth_provider_id VARCHAR(255),

    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    department VARCHAR(100),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),

    -- User type and roles
    user_type VARCHAR(20) NOT NULL, -- client, consultant, admin, super_admin
    roles JSONB DEFAULT '[]',
    permissions JSONB DEFAULT '[]',

    -- Settings
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',

    -- Security
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended, deleted
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    device_info JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PHASE 1: ASSESS - Assessment Engine Tables
-- =====================================================

CREATE TABLE assessment_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- comprehensive, quick, focused, custom
    description TEXT,
    version INTEGER DEFAULT 1,

    -- Configuration
    dimensions JSONB NOT NULL, -- Array of assessment dimensions
    scoring_model JSONB NOT NULL,
    report_template JSONB,

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(user_id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assessment_questions (
    question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES assessment_templates(template_id),

    -- Question details
    dimension VARCHAR(50) NOT NULL, -- digital_maturity, ai_readiness, data_capabilities, etc.
    category VARCHAR(100),
    subcategory VARCHAR(100),
    question_number INTEGER,
    question_text TEXT NOT NULL,
    help_text TEXT,

    -- Question type and options
    question_type VARCHAR(20) NOT NULL, -- multiple_choice, scale, text, matrix, boolean, file_upload
    options JSONB, -- For multiple choice questions
    scale_min INTEGER, -- For scale questions
    scale_max INTEGER,
    scale_labels JSONB,

    -- Scoring
    weight DECIMAL(3,2) DEFAULT 1.0,
    scoring_rubric JSONB, -- Mapping of answers to scores

    -- Validation
    is_required BOOLEAN DEFAULT true,
    validation_rules JSONB,
    evidence_required BOOLEAN DEFAULT false,

    -- Conditional logic
    dependencies JSONB, -- Show question based on previous answers
    show_conditions JSONB,

    -- Metadata
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assessments (
    assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES organizations(organization_id),
    template_id UUID REFERENCES assessment_templates(template_id),
    consultant_id UUID REFERENCES users(user_id),

    -- Assessment metadata
    assessment_name VARCHAR(255) NOT NULL,
    assessment_type VARCHAR(50) NOT NULL,
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft', -- draft, in_progress, under_review, completed, archived

    -- Timeline
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    completed_at TIMESTAMP,
    due_date DATE,

    -- Overall scores (0-100 scale)
    overall_score DECIMAL(5,2),
    digital_maturity_score DECIMAL(5,2),
    ai_readiness_score DECIMAL(5,2),
    data_capabilities_score DECIMAL(5,2),
    organizational_culture_score DECIMAL(5,2),
    technical_infrastructure_score DECIMAL(5,2),
    process_automation_score DECIMAL(5,2),
    skills_gaps_score DECIMAL(5,2),
    competitive_landscape_score DECIMAL(5,2),
    regulatory_compliance_score DECIMAL(5,2),
    financial_readiness_score DECIMAL(5,2),
    change_management_score DECIMAL(5,2),
    vendor_ecosystem_score DECIMAL(5,2),

    -- Industry context
    industry VARCHAR(100),
    company_size VARCHAR(20),
    annual_revenue DECIMAL(15,2),
    employee_count INTEGER,
    geographic_scope VARCHAR(50),
    current_tech_stack JSONB,

    -- Analysis results
    strengths JSONB,
    weaknesses JSONB,
    opportunities JSONB,
    threats JSONB,
    recommendations JSONB,
    priority_areas JSONB,
    quick_wins JSONB,
    risk_assessment JSONB,

    -- Financial projections
    estimated_investment DECIMAL(12,2),
    projected_roi DECIMAL(8,2),
    payback_period_months INTEGER,

    -- Benchmarking
    industry_percentile DECIMAL(5,2),
    peer_comparison JSONB,

    -- Attachments and notes
    attachments JSONB,
    notes TEXT,
    consultant_notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assessment_responses (
    response_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    question_id UUID REFERENCES assessment_questions(question_id),

    -- Response data
    dimension VARCHAR(50) NOT NULL,
    response_value TEXT,
    response_numeric DECIMAL(10,2),
    response_boolean BOOLEAN,
    response_json JSONB,
    response_score DECIMAL(5,2),

    -- Evidence and justification
    evidence_provided JSONB, -- Files, links, documents
    justification TEXT,
    confidence_level DECIMAL(3,2), -- 0.0 to 1.0

    -- Response metadata
    responded_by UUID REFERENCES users(user_id),
    responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by UUID REFERENCES users(user_id),
    reviewed_at TIMESTAMP,
    review_status VARCHAR(20), -- pending, approved, rejected, needs_clarification
    reviewer_notes TEXT,

    -- Audit
    response_history JSONB, -- Track changes

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assessment_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(assessment_id),

    -- Report details
    report_type VARCHAR(50) NOT NULL, -- executive_summary, detailed, gap_analysis, roadmap
    report_name VARCHAR(255) NOT NULL,
    generated_by UUID REFERENCES users(user_id),

    -- Report content
    executive_summary TEXT,
    detailed_findings JSONB,
    gap_analysis JSONB,
    recommendations JSONB,
    action_items JSONB,
    roadmap JSONB,

    -- Report data
    charts JSONB,
    tables JSONB,
    metrics JSONB,

    -- File storage
    pdf_url VARCHAR(500),
    pptx_url VARCHAR(500),
    excel_url VARCHAR(500),

    -- Access control
    shared_with JSONB,
    is_public BOOLEAN DEFAULT false,

    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assessment_benchmarks (
    benchmark_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Benchmark details
    industry VARCHAR(100) NOT NULL,
    company_size VARCHAR(20) NOT NULL,
    geographic_region VARCHAR(50),
    year INTEGER NOT NULL,

    -- Benchmark scores
    dimension VARCHAR(50) NOT NULL,
    percentile_10 DECIMAL(5,2),
    percentile_25 DECIMAL(5,2),
    percentile_50 DECIMAL(5,2),
    percentile_75 DECIMAL(5,2),
    percentile_90 DECIMAL(5,2),
    mean_score DECIMAL(5,2),

    -- Sample info
    sample_size INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PHASE 2: ALIGN - Strategic Alignment Tables
-- =====================================================

CREATE TABLE alignment_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(assessment_id),
    client_id UUID NOT NULL REFERENCES organizations(organization_id),
    facilitator_id UUID NOT NULL REFERENCES users(user_id),

    -- Session details
    session_name VARCHAR(255) NOT NULL,
    session_type VARCHAR(50) NOT NULL, -- executive, department, technical, cross_functional
    session_date DATE NOT NULL,
    session_duration_minutes INTEGER,
    location VARCHAR(255),
    meeting_link VARCHAR(500),

    -- Participants
    participants JSONB NOT NULL, -- Array of user_ids and their roles
    attendees JSONB, -- Actual attendance

    -- Agenda and outcomes
    agenda JSONB,
    objectives TEXT,
    outcomes TEXT,

    -- Alignment scores (0-100)
    strategic_alignment_score DECIMAL(5,2),
    stakeholder_buy_in_score DECIMAL(5,2),
    resource_commitment_score DECIMAL(5,2),
    risk_tolerance_score DECIMAL(5,2),
    overall_consensus_score DECIMAL(5,2),

    -- Session outputs
    agreed_priorities JSONB,
    identified_champions JSONB,
    resource_commitments JSONB,
    success_criteria JSONB,
    risk_mitigation_plan JSONB,
    communication_plan JSONB,

    -- Documentation
    meeting_notes TEXT,
    action_items JSONB,
    decisions_made JSONB,
    blockers_identified JSONB,
    follow_up_required JSONB,

    -- Recordings and attachments
    recording_url VARCHAR(500),
    presentation_url VARCHAR(500),
    attachments JSONB,

    -- Status
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE strategic_initiatives (
    initiative_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES organizations(organization_id),
    alignment_session_id UUID REFERENCES alignment_sessions(session_id),
    parent_initiative_id UUID REFERENCES strategic_initiatives(initiative_id),

    -- Initiative details
    initiative_name VARCHAR(255) NOT NULL,
    description TEXT,
    business_goal TEXT,
    ai_opportunity TEXT,
    value_proposition TEXT,

    -- Prioritization (0-100 scores)
    priority_score DECIMAL(5,2),
    impact_score DECIMAL(5,2),
    effort_score DECIMAL(5,2),
    risk_score DECIMAL(5,2),
    strategic_fit_score DECIMAL(5,2),

    -- RICE scoring
    reach INTEGER, -- How many people/processes affected
    impact DECIMAL(3,1), -- 0.25, 0.5, 1, 2, 3
    confidence DECIMAL(3,2), -- 0.0 to 1.0
    effort INTEGER, -- Person-months
    rice_score DECIMAL(8,2),

    -- Timeline
    planned_start DATE,
    planned_end DATE,
    actual_start DATE,
    actual_end DATE,
    duration_weeks INTEGER,

    -- Resources
    budget_allocated DECIMAL(12,2),
    budget_spent DECIMAL(12,2),
    budget_forecast DECIMAL(12,2),
    team_members JSONB,
    external_resources JSONB,
    technology_requirements JSONB,

    -- Metrics and KPIs
    success_metrics JSONB,
    baseline_metrics JSONB,
    current_metrics JSONB,
    target_metrics JSONB,
    kpis JSONB,

    -- Stakeholders
    executive_sponsor_id UUID REFERENCES users(user_id),
    business_owner_id UUID REFERENCES users(user_id),
    project_manager_id UUID REFERENCES users(user_id),
    stakeholders JSONB,

    -- Dependencies
    dependencies JSONB, -- Other initiatives this depends on
    blocks JSONB, -- Initiatives this blocks

    -- Risk management
    risks JSONB,
    assumptions JSONB,
    constraints JSONB,

    -- Status
    status VARCHAR(20) DEFAULT 'planned', -- planned, approved, active, on_hold, completed, cancelled
    health_status VARCHAR(20), -- green, yellow, red
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- Notes
    notes TEXT,
    lessons_learned TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stakeholder_mapping (
    mapping_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_id UUID REFERENCES strategic_initiatives(initiative_id),
    user_id UUID REFERENCES users(user_id),

    -- Stakeholder info
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    department VARCHAR(100),

    -- Influence and interest (0-100)
    influence_score DECIMAL(5,2),
    interest_score DECIMAL(5,2),
    support_level VARCHAR(20), -- champion, supporter, neutral, resister, blocker

    -- Engagement
    engagement_strategy TEXT,
    communication_frequency VARCHAR(50), -- daily, weekly, biweekly, monthly, quarterly
    preferred_communication_channel VARCHAR(50),

    -- Concerns and requirements
    concerns JSONB,
    requirements JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roadmaps (
    roadmap_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES organizations(organization_id),

    -- Roadmap details
    roadmap_name VARCHAR(255) NOT NULL,
    description TEXT,
    roadmap_type VARCHAR(50), -- transformation, product, technology, capability
    time_horizon VARCHAR(50), -- short_term, medium_term, long_term

    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Phases
    phases JSONB, -- Array of phases with milestones

    -- Status
    status VARCHAR(20) DEFAULT 'draft',
    version INTEGER DEFAULT 1,

    -- Visualization
    gantt_data JSONB,
    timeline_data JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PHASE 3: ACTIVATE - Project Activation Tables
-- =====================================================

CREATE TABLE activation_projects (
    project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES organizations(organization_id),
    initiative_id UUID REFERENCES strategic_initiatives(initiative_id),

    -- Project details
    project_name VARCHAR(255) NOT NULL,
    project_code VARCHAR(50) UNIQUE,
    description TEXT,
    project_type VARCHAR(50) NOT NULL, -- pilot, poc, mvp, full_implementation
    methodology VARCHAR(50), -- agile, waterfall, hybrid

    -- Team
    project_manager_id UUID REFERENCES users(user_id),
    technical_lead_id UUID REFERENCES users(user_id),
    business_sponsor_id UUID REFERENCES users(user_id),
    team_members JSONB,

    -- Timeline
    kickoff_date DATE,
    planned_start DATE NOT NULL,
    planned_end DATE NOT NULL,
    actual_start DATE,
    actual_end DATE,
    current_phase VARCHAR(50),

    -- Status tracking
    status VARCHAR(20) DEFAULT 'planning', -- planning, active, on_hold, completed, cancelled
    health_status VARCHAR(20), -- green, yellow, red
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- Budget and resources
    allocated_budget DECIMAL(12,2),
    spent_budget DECIMAL(12,2),
    forecast_budget DECIMAL(12,2),
    allocated_hours INTEGER,
    logged_hours INTEGER,

    -- Scope
    scope_statement TEXT,
    deliverables JSONB,
    milestones JSONB,
    acceptance_criteria JSONB,

    -- Quality metrics
    quality_score DECIMAL(5,2),
    client_satisfaction_score DECIMAL(5,2),

    -- Risk and issues
    risks JSONB,
    issues JSONB,

    -- Training
    training_plan JSONB,
    training_completed JSONB,
    certifications_earned JSONB,
    skill_improvements JSONB,

    -- Documentation
    project_charter_url VARCHAR(500),
    documentation_url VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activation_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES activation_projects(project_id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES activation_tasks(task_id),

    -- Task details
    task_name VARCHAR(255) NOT NULL,
    task_code VARCHAR(50),
    description TEXT,
    task_type VARCHAR(50), -- development, testing, deployment, training, documentation

    -- Assignment
    assigned_to UUID REFERENCES users(user_id),
    assigned_team JSONB,

    -- Timeline
    planned_start DATE,
    planned_end DATE,
    actual_start DATE,
    actual_end DATE,

    -- Status
    status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, blocked, completed, cancelled
    priority VARCHAR(10), -- critical, high, medium, low
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- Dependencies
    predecessor_tasks JSONB, -- Tasks that must complete before this one
    successor_tasks JSONB, -- Tasks that depend on this one
    blocked_by JSONB,
    blocking JSONB,

    -- Effort tracking
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2),
    remaining_hours DECIMAL(8,2),

    -- Deliverables and acceptance
    deliverables JSONB,
    acceptance_criteria JSONB,
    quality_metrics JSONB,

    -- Comments and attachments
    comments JSONB,
    attachments JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_milestones (
    milestone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES activation_projects(project_id) ON DELETE CASCADE,

    -- Milestone details
    milestone_name VARCHAR(255) NOT NULL,
    description TEXT,
    milestone_type VARCHAR(50), -- phase_completion, deliverable, gate, review

    -- Timeline
    planned_date DATE NOT NULL,
    actual_date DATE,

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, missed

    -- Acceptance criteria
    acceptance_criteria JSONB,
    deliverables JSONB,

    -- Sign-off
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE training_programs (
    program_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES activation_projects(project_id),
    client_id UUID REFERENCES organizations(organization_id),

    -- Program details
    program_name VARCHAR(255) NOT NULL,
    description TEXT,
    program_type VARCHAR(50), -- onboarding, technical, business, leadership

    -- Content
    modules JSONB,
    learning_objectives JSONB,

    -- Delivery
    delivery_method VARCHAR(50), -- in_person, virtual, hybrid, self_paced
    duration_hours DECIMAL(6,2),

    -- Enrollment
    target_audience JSONB,
    enrolled_users JSONB,
    completed_users JSONB,

    -- Metrics
    completion_rate DECIMAL(5,2),
    average_score DECIMAL(5,2),
    satisfaction_score DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE training_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES training_programs(program_id),

    -- Session details
    session_name VARCHAR(255) NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    meeting_link VARCHAR(500),

    -- Instructor
    instructor_id UUID REFERENCES users(user_id),

    -- Participants
    registered_participants JSONB,
    attended_participants JSONB,

    -- Materials
    materials JSONB,
    recording_url VARCHAR(500),

    -- Feedback
    feedback JSONB,
    rating DECIMAL(3,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PHASE 4: ACCELERATE - Performance Tracking Tables
-- =====================================================

CREATE TABLE acceleration_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES organizations(organization_id),
    project_id UUID REFERENCES activation_projects(project_id),
    initiative_id UUID REFERENCES strategic_initiatives(initiative_id),

    -- Metric details
    metric_date DATE NOT NULL,
    metric_period VARCHAR(20), -- daily, weekly, monthly, quarterly

    -- Performance metrics
    throughput_improvement DECIMAL(8,2), -- Percentage improvement
    processing_time_reduction DECIMAL(8,2), -- Percentage reduction
    error_rate_reduction DECIMAL(8,2), -- Percentage reduction
    automation_percentage DECIMAL(5,2), -- Percentage of process automated
    accuracy_improvement DECIMAL(8,2),

    -- Financial metrics
    cost_savings DECIMAL(12,2), -- Actual savings in USD
    revenue_increase DECIMAL(12,2), -- Revenue attributed to AI
    roi_percentage DECIMAL(8,2),
    payback_period_months INTEGER,
    npv DECIMAL(12,2), -- Net present value
    irr DECIMAL(8,2), -- Internal rate of return

    -- Adoption metrics
    user_adoption_rate DECIMAL(5,2),
    active_users INTEGER,
    total_users INTEGER,
    feature_utilization JSONB, -- Usage stats per feature
    user_satisfaction_score DECIMAL(5,2),
    nps_score DECIMAL(5,2), -- Net Promoter Score

    -- Efficiency metrics
    process_efficiency_gain DECIMAL(8,2),
    resource_utilization DECIMAL(5,2),
    cycle_time_reduction DECIMAL(8,2),
    quality_improvement DECIMAL(8,2),
    productivity_increase DECIMAL(8,2),

    -- Scale metrics
    transaction_volume INTEGER,
    concurrent_users INTEGER,
    data_processed_gb DECIMAL(12,2),
    api_calls_per_day INTEGER,

    -- Business impact
    customer_satisfaction_delta DECIMAL(5,2),
    employee_satisfaction_delta DECIMAL(5,2),
    time_to_market_reduction DECIMAL(8,2),

    -- Detailed breakdowns
    metrics_by_department JSONB,
    metrics_by_process JSONB,
    metrics_by_use_case JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE optimization_opportunities (
    opportunity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES organizations(organization_id),
    project_id UUID REFERENCES activation_projects(project_id),

    -- Opportunity details
    identified_date DATE NOT NULL,
    category VARCHAR(50), -- performance, cost, quality, automation, scaling
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Current vs desired state
    current_state TEXT,
    desired_state TEXT,
    gap_analysis TEXT,

    -- Impact analysis
    estimated_impact_score DECIMAL(5,2),
    estimated_effort_score DECIMAL(5,2),
    priority_score DECIMAL(5,2), -- Calculated from impact/effort

    -- Financial impact
    estimated_cost_savings DECIMAL(12,2),
    estimated_revenue_impact DECIMAL(12,2),
    implementation_cost DECIMAL(12,2),
    roi_estimate DECIMAL(8,2),

    -- Timeline
    estimated_duration_weeks INTEGER,

    -- Implementation
    status VARCHAR(20) DEFAULT 'identified', -- identified, evaluated, approved, in_progress, completed, rejected
    assigned_to UUID REFERENCES users(user_id),
    implementation_plan JSONB,
    success_criteria JSONB,

    -- Results
    actual_impact JSONB,
    lessons_learned TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE performance_benchmarks (
    benchmark_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES organizations(organization_id),

    -- Benchmark details
    benchmark_date DATE NOT NULL,
    benchmark_type VARCHAR(50), -- baseline, current, target

    -- Process benchmarks
    process_name VARCHAR(255),
    baseline_cycle_time INTEGER, -- minutes
    current_cycle_time INTEGER,
    target_cycle_time INTEGER,
    baseline_error_rate DECIMAL(5,2),
    current_error_rate DECIMAL(5,2),
    target_error_rate DECIMAL(5,2),

    -- Cost benchmarks
    baseline_cost_per_transaction DECIMAL(10,2),
    current_cost_per_transaction DECIMAL(10,2),
    target_cost_per_transaction DECIMAL(10,2),

    -- Quality benchmarks
    baseline_quality_score DECIMAL(5,2),
    current_quality_score DECIMAL(5,2),
    target_quality_score DECIMAL(5,2),

    -- Industry comparison
    industry_average DECIMAL(5,2),
    industry_best_in_class DECIMAL(5,2),
    percentile_ranking DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PHASE 5: APPLY - Production Application Tables
-- =====================================================

CREATE TABLE applied_solutions (
    solution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES organizations(organization_id),
    project_id UUID REFERENCES activation_projects(project_id),

    -- Solution details
    solution_name VARCHAR(255) NOT NULL,
    solution_code VARCHAR(50) UNIQUE,
    description TEXT,
    solution_type VARCHAR(50), -- automation, analytics, prediction, recommendation, generation
    technology_stack JSONB,

    -- Deployment info
    production_date DATE,
    version VARCHAR(20),
    environments JSONB, -- dev, staging, production
    configuration JSONB,

    -- Integration points
    integrated_systems JSONB,
    api_endpoints JSONB,
    data_sources JSONB,
    data_flows JSONB,

    -- Usage metrics (current/latest)
    daily_active_users INTEGER,
    monthly_active_users INTEGER,
    transactions_per_day INTEGER,
    data_processed_daily_gb DECIMAL(12,2),

    -- Performance metrics (current)
    average_response_time_ms INTEGER,
    p95_response_time_ms INTEGER,
    p99_response_time_ms INTEGER,
    error_rate DECIMAL(5,4),
    uptime_percentage DECIMAL(5,2),
    availability_percentage DECIMAL(5,2),

    -- Business impact (cumulative)
    processes_automated INTEGER,
    time_saved_hours_monthly DECIMAL(10,2),
    cost_reduction_monthly DECIMAL(12,2),
    revenue_impact_monthly DECIMAL(12,2),
    users_impacted INTEGER,

    -- Maintenance and support
    maintenance_window VARCHAR(50),
    support_tier VARCHAR(20), -- basic, standard, premium, enterprise
    sla_targets JSONB,
    last_update DATE,
    next_review DATE,

    -- Health and status
    health_status VARCHAR(20), -- healthy, degraded, critical, offline
    status VARCHAR(20) DEFAULT 'active', -- active, deprecated, retired

    -- Documentation
    documentation_url VARCHAR(500),
    runbook_url VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE solution_incidents (
    incident_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solution_id UUID REFERENCES applied_solutions(solution_id),

    -- Incident details
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    incident_date TIMESTAMP NOT NULL,
    severity VARCHAR(20) NOT NULL, -- critical, high, medium, low
    priority VARCHAR(20), -- p1, p2, p3, p4
    category VARCHAR(50), -- outage, degradation, bug, security, performance

    -- Description
    title VARCHAR(255) NOT NULL,
    description TEXT,
    impact_description TEXT,
    affected_components JSONB,

    -- Root cause
    root_cause TEXT,
    root_cause_category VARCHAR(50),

    -- Timeline
    detected_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    investigating_at TIMESTAMP,
    mitigated_at TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,

    -- Resolution metrics
    detection_time_minutes INTEGER,
    acknowledgment_time_minutes INTEGER,
    mitigation_time_minutes INTEGER,
    resolution_time_minutes INTEGER,
    total_duration_minutes INTEGER,

    -- Impact metrics
    users_affected INTEGER,
    transactions_affected INTEGER,
    data_loss BOOLEAN DEFAULT false,
    revenue_impact DECIMAL(12,2),

    -- Response
    assigned_to UUID REFERENCES users(user_id),
    incident_commander UUID REFERENCES users(user_id),
    response_team JSONB,

    -- Actions taken
    immediate_actions JSONB,
    resolution_steps JSONB,
    preventive_measures JSONB,

    -- Post-mortem
    lessons_learned TEXT,
    action_items JSONB,
    follow_up_tasks JSONB,

    -- Status
    status VARCHAR(20) DEFAULT 'open', -- open, investigating, mitigated, resolved, closed

    -- Communication
    customer_communication JSONB,
    status_updates JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE solution_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solution_id UUID REFERENCES applied_solutions(solution_id),

    -- Metric timestamp
    measured_at TIMESTAMP NOT NULL,
    metric_date DATE NOT NULL,

    -- Performance metrics
    requests_per_second DECIMAL(10,2),
    avg_response_time_ms INTEGER,
    p50_response_time_ms INTEGER,
    p95_response_time_ms INTEGER,
    p99_response_time_ms INTEGER,
    error_count INTEGER,
    error_rate DECIMAL(5,4),

    -- Resource utilization
    cpu_usage_percent DECIMAL(5,2),
    memory_usage_percent DECIMAL(5,2),
    disk_usage_percent DECIMAL(5,2),
    network_bandwidth_mbps DECIMAL(10,2),

    -- Application metrics
    active_users INTEGER,
    active_sessions INTEGER,
    transactions_processed INTEGER,
    data_processed_gb DECIMAL(12,2),

    -- Business metrics
    business_value_generated DECIMAL(12,2),
    cost_per_transaction DECIMAL(10,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE solution_deployments (
    deployment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solution_id UUID REFERENCES applied_solutions(solution_id),

    -- Deployment details
    version VARCHAR(20) NOT NULL,
    environment VARCHAR(20) NOT NULL, -- development, staging, production
    deployed_by UUID REFERENCES users(user_id),
    deployed_at TIMESTAMP NOT NULL,

    -- Change details
    change_type VARCHAR(20), -- major, minor, patch, hotfix
    changes JSONB,
    rollback_plan TEXT,

    -- Approval
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMP,

    -- Status
    status VARCHAR(20), -- pending, in_progress, successful, failed, rolled_back
    deployment_duration_minutes INTEGER,

    -- Verification
    smoke_tests_passed BOOLEAN,
    validation_results JSONB,

    -- Issues
    issues_encountered JSONB,
    rollback_performed BOOLEAN DEFAULT false,
    rollback_reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maintenance_windows (
    window_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solution_id UUID REFERENCES applied_solutions(solution_id),

    -- Window details
    window_type VARCHAR(20), -- scheduled, emergency
    planned_start TIMESTAMP NOT NULL,
    planned_end TIMESTAMP NOT NULL,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,

    -- Maintenance details
    maintenance_type VARCHAR(50), -- update, patch, infrastructure, migration
    description TEXT,
    impact_description TEXT,

    -- Approval and notification
    approved_by UUID REFERENCES users(user_id),
    notified_users JSONB,
    notification_sent_at TIMESTAMP,

    -- Status
    status VARCHAR(20), -- scheduled, in_progress, completed, cancelled

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PHASE 6: AMPLIFY - Scaling and Innovation Tables
-- =====================================================

CREATE TABLE amplification_initiatives (
    initiative_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES organizations(organization_id),
    solution_id UUID REFERENCES applied_solutions(solution_id),

    -- Initiative details
    initiative_type VARCHAR(50), -- horizontal_scaling, vertical_scaling, geographic_expansion, market_expansion, innovation
    title VARCHAR(255) NOT NULL,
    description TEXT,
    vision TEXT,

    -- Current vs target scale
    current_scale JSONB,
    target_scale JSONB,
    scaling_factor DECIMAL(8,2),

    -- Expansion details
    new_departments JSONB,
    new_locations JSONB,
    new_markets JSONB,
    new_use_cases JSONB,
    new_technologies JSONB,

    -- Innovation tracking
    innovations_planned INTEGER,
    innovations_implemented INTEGER,
    experiments_planned INTEGER,
    experiments_conducted INTEGER,
    success_rate DECIMAL(5,2),

    -- Knowledge metrics
    best_practices_documented INTEGER,
    case_studies_created INTEGER,
    employees_trained INTEGER,
    certifications_earned INTEGER,

    -- Impact metrics
    enterprise_value_created DECIMAL(15,2),
    market_share_gain DECIMAL(5,2),
    competitive_advantage_score DECIMAL(5,2),
    brand_value_increase DECIMAL(12,2),

    -- Timeline
    start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE,

    -- Resources
    investment DECIMAL(12,2),
    expected_return DECIMAL(12,2),

    -- Status
    status VARCHAR(20) DEFAULT 'planning', -- planning, active, completed, on_hold
    progress_percentage DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE innovation_experiments (
    experiment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amplification_initiative_id UUID REFERENCES amplification_initiatives(initiative_id),
    client_id UUID NOT NULL REFERENCES organizations(organization_id),

    -- Experiment details
    experiment_name VARCHAR(255) NOT NULL,
    hypothesis TEXT NOT NULL,
    experiment_type VARCHAR(50), -- technology, process, business_model, market

    -- Design
    methodology VARCHAR(50), -- a_b_test, pilot, prototype, simulation
    sample_size INTEGER,
    duration_days INTEGER,

    -- Metrics
    success_criteria JSONB,
    measured_metrics JSONB,

    -- Timeline
    start_date DATE,
    end_date DATE,

    -- Results
    outcome VARCHAR(20), -- success, failure, inconclusive
    results JSONB,
    insights TEXT,
    recommendations TEXT,

    -- Next steps
    scale_decision VARCHAR(20), -- scale, iterate, pivot, stop
    next_actions JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE knowledge_artifacts (
    artifact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES organizations(organization_id),
    created_by UUID REFERENCES users(user_id),

    -- Artifact details
    artifact_type VARCHAR(50), -- best_practice, case_study, playbook, template, guide, lesson_learned
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,

    -- Categorization
    phase VARCHAR(20), -- assess, align, activate, accelerate, apply, amplify
    category VARCHAR(50),
    subcategory VARCHAR(50),
    tags JSONB,

    -- Applicability
    industry JSONB,
    company_size JSONB,
    use_cases JSONB,

    -- Content metadata
    author_id UUID REFERENCES users(user_id),
    reviewer_id UUID REFERENCES users(user_id),
    approval_status VARCHAR(20), -- draft, under_review, approved, published, archived
    version INTEGER DEFAULT 1,

    -- Usage tracking
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    feedback_score DECIMAL(5,2),

    -- Effectiveness
    implementation_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    average_impact_score DECIMAL(5,2),

    -- Files and links
    attachments JSONB,
    related_artifacts JSONB,
    external_links JSONB,

    -- Publication
    published_at TIMESTAMP,
    last_updated_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scaling_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amplification_initiative_id UUID REFERENCES amplification_initiatives(initiative_id),
    client_id UUID NOT NULL REFERENCES organizations(organization_id),

    -- Metric timestamp
    metric_date DATE NOT NULL,

    -- Scale metrics
    departments_using INTEGER,
    locations_deployed INTEGER,
    total_users INTEGER,
    active_users INTEGER,
    adoption_rate DECIMAL(5,2),

    -- Volume metrics
    transactions_per_day INTEGER,
    data_processed_per_day_gb DECIMAL(12,2),
    api_calls_per_day INTEGER,

    -- Performance at scale
    average_response_time_ms INTEGER,
    error_rate DECIMAL(5,4),
    uptime_percentage DECIMAL(5,2),

    -- Business impact at scale
    cumulative_cost_savings DECIMAL(15,2),
    cumulative_revenue_impact DECIMAL(15,2),
    cumulative_time_saved_hours DECIMAL(12,2),

    -- Network effects
    collaboration_index DECIMAL(5,2),
    knowledge_sharing_score DECIMAL(5,2),
    innovation_rate DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE partner_ecosystem (
    partner_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Partner details
    partner_name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(50), -- technology, implementation, training, consulting
    description TEXT,

    -- Contact info
    website VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),

    -- Relationship
    partnership_status VARCHAR(20), -- prospect, active, inactive
    partnership_start_date DATE,

    -- Capabilities
    capabilities JSONB,
    certifications JSONB,
    technologies JSONB,

    -- Performance
    projects_delivered INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    client_satisfaction DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- REPORTING AND ANALYTICS TABLES
-- =====================================================

CREATE TABLE reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES organizations(organization_id),
    generated_by UUID REFERENCES users(user_id),

    -- Report details
    report_type VARCHAR(50) NOT NULL, -- executive, operational, analytical, compliance
    report_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Time period
    period_start DATE,
    period_end DATE,

    -- Report data
    data JSONB,
    charts JSONB,
    tables JSONB,
    insights JSONB,
    recommendations JSONB,

    -- Files
    pdf_url VARCHAR(500),
    excel_url VARCHAR(500),
    pptx_url VARCHAR(500),

    -- Access control
    visibility VARCHAR(20), -- private, organization, public
    shared_with JSONB,

    -- Schedule
    is_scheduled BOOLEAN DEFAULT false,
    schedule_frequency VARCHAR(20), -- daily, weekly, monthly, quarterly

    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dashboards (
    dashboard_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES users(user_id),

    -- Dashboard details
    dashboard_name VARCHAR(255) NOT NULL,
    description TEXT,
    dashboard_type VARCHAR(50), -- executive, operational, analytical

    -- Configuration
    layout JSONB,
    widgets JSONB,
    filters JSONB,

    -- Access
    is_public BOOLEAN DEFAULT false,
    shared_with JSONB,

    -- Usage
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kpis (
    kpi_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES organizations(organization_id),

    -- KPI details
    kpi_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- financial, operational, customer, innovation

    -- Measurement
    unit_of_measure VARCHAR(50),
    calculation_method TEXT,
    data_source VARCHAR(100),

    -- Targets
    baseline_value DECIMAL(12,2),
    target_value DECIMAL(12,2),
    current_value DECIMAL(12,2),

    -- Thresholds
    red_threshold DECIMAL(12,2),
    yellow_threshold DECIMAL(12,2),
    green_threshold DECIMAL(12,2),

    -- Frequency
    measurement_frequency VARCHAR(20), -- daily, weekly, monthly, quarterly

    -- Ownership
    owner_id UUID REFERENCES users(user_id),

    -- Status
    status VARCHAR(20), -- on_track, at_risk, off_track

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kpi_measurements (
    measurement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_id UUID REFERENCES kpis(kpi_id),

    -- Measurement
    measurement_date DATE NOT NULL,
    measured_value DECIMAL(12,2) NOT NULL,

    -- Context
    notes TEXT,
    measured_by UUID REFERENCES users(user_id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- COMMUNICATION AND COLLABORATION TABLES
-- =====================================================

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),

    -- Notification details
    notification_type VARCHAR(50), -- info, warning, error, success
    category VARCHAR(50), -- assessment, project, task, report, system
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Action
    action_url VARCHAR(500),
    action_label VARCHAR(100),

    -- Related entities
    related_entity_type VARCHAR(50),
    related_entity_id UUID,

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT false,

    -- Delivery
    delivery_channels JSONB, -- email, in_app, sms, slack
    sent_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
    comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),

    -- Comment target
    entity_type VARCHAR(50) NOT NULL, -- assessment, project, task, initiative, etc.
    entity_id UUID NOT NULL,
    parent_comment_id UUID REFERENCES comments(comment_id),

    -- Comment content
    comment_text TEXT NOT NULL,
    attachments JSONB,

    -- Interactions
    likes INTEGER DEFAULT 0,
    liked_by JSONB,

    -- Status
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),

    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- created, updated, deleted, viewed, shared
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,

    -- Changes
    changes JSONB,
    old_values JSONB,
    new_values JSONB,

    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INTEGRATION AND EXTERNAL SYSTEMS TABLES
-- =====================================================

CREATE TABLE integrations (
    integration_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(organization_id),

    -- Integration details
    integration_type VARCHAR(50) NOT NULL, -- azure, microsoft365, salesforce, slack, etc.
    integration_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Configuration
    configuration JSONB,
    credentials JSONB, -- Encrypted
    endpoints JSONB,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, error
    last_sync_at TIMESTAMP,
    sync_frequency VARCHAR(20), -- real_time, hourly, daily, weekly

    -- Health
    health_status VARCHAR(20), -- healthy, degraded, down
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhooks (
    webhook_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(organization_id),

    -- Webhook details
    webhook_url VARCHAR(500) NOT NULL,
    event_types JSONB NOT NULL, -- Array of event types to subscribe to

    -- Security
    secret_key VARCHAR(255), -- For signature verification

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Delivery tracking
    last_triggered_at TIMESTAMP,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhook_deliveries (
    delivery_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID REFERENCES webhooks(webhook_id),

    -- Delivery details
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,

    -- Response
    http_status_code INTEGER,
    response_body TEXT,
    response_time_ms INTEGER,

    -- Retry
    attempt_number INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP,

    -- Status
    status VARCHAR(20), -- pending, delivered, failed

    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FINANCIAL AND BILLING TABLES
-- =====================================================

CREATE TABLE billing_accounts (
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(organization_id),

    -- Billing details
    billing_email VARCHAR(255) NOT NULL,
    billing_contact_name VARCHAR(255),
    billing_contact_phone VARCHAR(50),

    -- Payment method
    payment_method VARCHAR(20), -- credit_card, ach, wire, invoice
    payment_details JSONB, -- Encrypted

    -- Billing address
    billing_address JSONB,

    -- Tax info
    tax_id VARCHAR(50),
    tax_exempt BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES billing_accounts(account_id),

    -- Invoice details
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,

    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,

    -- Line items
    line_items JSONB NOT NULL,

    -- Payment
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    paid_at TIMESTAMP,
    payment_method VARCHAR(50),

    -- Files
    pdf_url VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usage_tracking (
    tracking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(organization_id),

    -- Usage period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Usage metrics
    api_calls INTEGER DEFAULT 0,
    storage_gb DECIMAL(10,2) DEFAULT 0,
    compute_hours DECIMAL(10,2) DEFAULT 0,
    users_active INTEGER DEFAULT 0,
    assessments_conducted INTEGER DEFAULT 0,
    projects_active INTEGER DEFAULT 0,

    -- Costs
    total_cost DECIMAL(12,2),
    cost_breakdown JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECURITY AND AUDIT TABLES
-- =====================================================

CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who
    user_id UUID REFERENCES users(user_id),
    organization_id UUID REFERENCES organizations(organization_id),

    -- What
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,

    -- When and where
    ip_address VARCHAR(45),
    user_agent TEXT,
    location JSONB,

    -- Details
    details JSONB,
    changes JSONB,

    -- Result
    success BOOLEAN DEFAULT true,
    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE security_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Event details
    event_type VARCHAR(50) NOT NULL, -- failed_login, suspicious_activity, data_breach, etc.
    severity VARCHAR(20) NOT NULL, -- low, medium, high, critical

    -- Who
    user_id UUID REFERENCES users(user_id),
    ip_address VARCHAR(45),

    -- What
    description TEXT NOT NULL,
    details JSONB,

    -- Response
    status VARCHAR(20) DEFAULT 'open', -- open, investigating, resolved, closed
    assigned_to UUID REFERENCES users(user_id),
    resolution TEXT,
    resolved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE data_access_logs (
    access_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who
    user_id UUID REFERENCES users(user_id),

    -- What
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- read, write, delete

    -- When and where
    ip_address VARCHAR(45),

    -- Result
    granted BOOLEAN DEFAULT true,
    denial_reason TEXT,

    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users and Organizations
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Assessments
CREATE INDEX idx_assessments_client ON assessments(client_id);
CREATE INDEX idx_assessments_consultant ON assessments(consultant_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessment_responses_assessment ON assessment_responses(assessment_id);
CREATE INDEX idx_assessment_responses_question ON assessment_responses(question_id);
CREATE INDEX idx_assessment_questions_template ON assessment_questions(template_id);
CREATE INDEX idx_assessment_questions_dimension ON assessment_questions(dimension);

-- Alignment
CREATE INDEX idx_alignment_sessions_client ON alignment_sessions(client_id);
CREATE INDEX idx_alignment_sessions_date ON alignment_sessions(session_date);
CREATE INDEX idx_strategic_initiatives_client ON strategic_initiatives(client_id);
CREATE INDEX idx_strategic_initiatives_status ON strategic_initiatives(status);
CREATE INDEX idx_stakeholder_mapping_initiative ON stakeholder_mapping(initiative_id);

-- Activation
CREATE INDEX idx_activation_projects_client ON activation_projects(client_id);
CREATE INDEX idx_activation_projects_status ON activation_projects(status);
CREATE INDEX idx_activation_tasks_project ON activation_tasks(project_id);
CREATE INDEX idx_activation_tasks_assigned ON activation_tasks(assigned_to);
CREATE INDEX idx_activation_tasks_status ON activation_tasks(status);

-- Acceleration
CREATE INDEX idx_acceleration_metrics_client ON acceleration_metrics(client_id);
CREATE INDEX idx_acceleration_metrics_project ON acceleration_metrics(project_id);
CREATE INDEX idx_acceleration_metrics_date ON acceleration_metrics(metric_date);
CREATE INDEX idx_optimization_opportunities_client ON optimization_opportunities(client_id);
CREATE INDEX idx_optimization_opportunities_status ON optimization_opportunities(status);

-- Application
CREATE INDEX idx_applied_solutions_client ON applied_solutions(client_id);
CREATE INDEX idx_applied_solutions_status ON applied_solutions(status);
CREATE INDEX idx_solution_incidents_solution ON solution_incidents(solution_id);
CREATE INDEX idx_solution_incidents_severity ON solution_incidents(severity);
CREATE INDEX idx_solution_metrics_solution ON solution_metrics(solution_id);
CREATE INDEX idx_solution_metrics_date ON solution_metrics(metric_date);

-- Amplification
CREATE INDEX idx_amplification_initiatives_client ON amplification_initiatives(client_id);
CREATE INDEX idx_knowledge_artifacts_client ON knowledge_artifacts(client_id);
CREATE INDEX idx_knowledge_artifacts_type ON knowledge_artifacts(artifact_type);
CREATE INDEX idx_knowledge_artifacts_phase ON knowledge_artifacts(phase);
CREATE INDEX idx_scaling_metrics_initiative ON scaling_metrics(amplification_initiative_id);

-- Reporting
CREATE INDEX idx_reports_client ON reports(client_id);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_kpis_client ON kpis(client_id);
CREATE INDEX idx_kpi_measurements_kpi ON kpi_measurements(kpi_id);
CREATE INDEX idx_kpi_measurements_date ON kpi_measurements(measurement_date);

-- Communication
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- Audit
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);

-- Full-text search indexes
CREATE INDEX idx_assessments_search ON assessments USING gin(to_tsvector('english', assessment_name || ' ' || COALESCE(notes, '')));
CREATE INDEX idx_projects_search ON activation_projects USING gin(to_tsvector('english', project_name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_initiatives_search ON strategic_initiatives USING gin(to_tsvector('english', initiative_name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_knowledge_artifacts_search ON knowledge_artifacts USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(content, '')));

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessment_responses_updated_at BEFORE UPDATE ON assessment_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alignment_sessions_updated_at BEFORE UPDATE ON alignment_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategic_initiatives_updated_at BEFORE UPDATE ON strategic_initiatives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activation_projects_updated_at BEFORE UPDATE ON activation_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activation_tasks_updated_at BEFORE UPDATE ON activation_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applied_solutions_updated_at BEFORE UPDATE ON applied_solutions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_amplification_initiatives_updated_at BEFORE UPDATE ON amplification_initiatives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_artifacts_updated_at BEFORE UPDATE ON knowledge_artifacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- END OF SCHEMA
-- =====================================================
